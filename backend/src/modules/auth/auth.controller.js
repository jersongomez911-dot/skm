const authService = require('./auth.service');
const { success, error, created } = require('../../utils/response.utils');

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, req);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    success(res, { accessToken: result.accessToken, user: result.user }, 'Sesión iniciada.');
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) return error(res, 'Refresh token requerido.', 401);
    const result = await authService.refreshToken(token);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    success(res, { accessToken: result.accessToken }, 'Token renovado.');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.token);
    res.clearCookie('refreshToken');
    success(res, null, 'Sesión cerrada.');
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    success(res, null, 'Si el email existe, recibirás instrucciones para restablecer tu contraseña.');
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    success(res, null, 'Contraseña restablecida exitosamente.');
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword, req.token);
    res.clearCookie('refreshToken');
    success(res, null, 'Contraseña cambiada. Inicia sesión nuevamente.');
  } catch (err) { next(err); }
};

const setup2FA = async (req, res, next) => {
  try {
    const result = await authService.setup2FA(req.user.id);
    success(res, result, '2FA configurado. Escanea el QR con tu app autenticadora.');
  } catch (err) { next(err); }
};

const verify2FA = async (req, res, next) => {
  try {
    await authService.verify2FA(req.user.id, req.body.token);
    success(res, null, '2FA activado exitosamente.');
  } catch (err) { next(err); }
};

const disable2FA = async (req, res, next) => {
  try {
    await authService.disable2FA(req.user.id, req.body.token);
    success(res, null, '2FA desactivado.');
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    success(res, user, 'Perfil obtenido.');
  } catch (err) { next(err); }
};

module.exports = { login, refresh, logout, forgotPassword, resetPassword, changePassword, setup2FA, verify2FA, disable2FA, getMe };
