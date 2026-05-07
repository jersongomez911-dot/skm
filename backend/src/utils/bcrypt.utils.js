const bcrypt = require('bcryptjs');

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

const hash = (password) => bcrypt.hash(password, ROUNDS);
const compare = (password, hash) => bcrypt.compare(password, hash);

// Password strength validator
const isStrongPassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return { valid: minLength && hasUpper && hasLower && hasNumber, minLength, hasUpper, hasLower, hasNumber, hasSpecial };
};

module.exports = { hash, compare, isStrongPassword };
