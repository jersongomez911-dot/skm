const jwt = require('jsonwebtoken');

const generateAccessToken = (userId, role) => jwt.sign(
  { userId, role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
);

const generateRefreshToken = (userId) => jwt.sign(
  { userId, type: 'refresh' },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
);

const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

const getTokenExpiry = (token) => {
  const decoded = jwt.decode(token);
  return decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
};

module.exports = { generateAccessToken, generateRefreshToken, verifyRefreshToken, getTokenExpiry };
