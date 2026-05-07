const { prisma } = require('../../config/database');
const { hash, compare } = require('../../utils/bcrypt.utils');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, getTokenExpiry } = require('../../utils/jwt.utils');
const { tokenBlacklist } = require('../../config/redis');
const { sendMail, emailTemplates } = require('../../config/email');
const { createAuditLog } = require('../../middleware/audit.middleware');
const { AppError } = require('../../middleware/errorHandler.middleware');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const crypto = require('crypto');

const LOCK_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const login = async ({ email, password }, req) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) throw new AppError('Credenciales inválidas.', 401);

  // Check lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw new AppError(`Cuenta bloqueada. Intenta en ${minutes} minutos.`, 429);
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedAttempts + 1;
    const update = { failedAttempts: attempts };
    if (attempts >= LOCK_ATTEMPTS) {
      update.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      // Send lock email (fire and forget)
      sendMail({ to: user.email, ...emailTemplates.accountLocked() }).catch(() => {});
    }
    await prisma.user.update({ where: { id: user.id }, data: update });
    throw new AppError('Credenciales inválidas.', 401);
  }

  // Reset attempts
  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLogin: new Date() },
  });

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await createAuditLog({ userId: user.id, userEmail: user.email, action: 'LOGIN', entity: 'User', entityId: user.id, req });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, twoFactorEnabled: user.twoFactorEnabled },
  };
};

const refreshToken = async (token) => {
  try {
    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) throw new AppError('Usuario no válido.', 401);
    const accessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);
    return { accessToken, refreshToken: newRefreshToken };
  } catch (err) {
    if (err.isOperational) throw err;
    throw new AppError('Refresh token inválido o expirado.', 401);
  }
};

const logout = async (token) => {
  if (token) {
    const ttl = getTokenExpiry(token);
    await tokenBlacklist.add(token, ttl > 0 ? ttl : 900);
  }
};

const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Don't reveal if user exists

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendMail({ to: email, ...emailTemplates.passwordReset(resetUrl) });
};

const resetPassword = async (token, newPassword) => {
  const user = await prisma.user.findFirst({
    where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } },
  });
  if (!user) throw new AppError('Token inválido o expirado.', 400);

  const passwordHash = await hash(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null, failedAttempts: 0, lockedUntil: null },
  });
};

const changePassword = async (userId, currentPassword, newPassword, currentToken) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Contraseña actual incorrecta.', 400);

  const passwordHash = await hash(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Blacklist current token
  if (currentToken) {
    const ttl = getTokenExpiry(currentToken);
    await tokenBlacklist.add(currentToken, ttl > 0 ? ttl : 900);
  }
};

const setup2FA = async (userId) => {
  const secret = authenticator.generateSecret();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const otpAuth = authenticator.keyuri(user.email, 'SKM Taller', secret);
  const qrCode = await QRCode.toDataURL(otpAuth);

  // Store secret temporarily (not enabled yet)
  await prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
  return { secret, qrCode };
};

const verify2FA = async (userId, token) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user.twoFactorSecret) throw new AppError('2FA no configurado.', 400);
  const valid = authenticator.verify({ token, secret: user.twoFactorSecret });
  if (!valid) throw new AppError('Código 2FA inválido.', 400);
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
};

const disable2FA = async (userId, token) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user.twoFactorSecret) throw new AppError('2FA no configurado.', 400);
  const valid = authenticator.verify({ token, secret: user.twoFactorSecret });
  if (!valid) throw new AppError('Código 2FA inválido.', 400);
  await prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, twoFactorEnabled: true, lastLogin: true, createdAt: true },
  });
  return user;
};

module.exports = { login, refreshToken, logout, forgotPassword, resetPassword, changePassword, setup2FA, verify2FA, disable2FA, getMe };
