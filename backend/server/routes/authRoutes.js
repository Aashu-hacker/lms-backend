const express = require('express');
const router = express.Router();

// ✅ correct import
const { login, register } = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register); // 👈 must be a function

module.exports = router;
