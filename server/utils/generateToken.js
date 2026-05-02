const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const generateToken = (user) => {
  const JWT_SECRET = 'mySuperSecureJWTSecret123';
  return jwt.sign(
    {
      id: user._id,     // MUST be id
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
};

module.exports = generateToken;