const express = require('express');
const auth = require('../middleware/auth');
const { register, login, forgotPassword, resetPassword, me } = require('../controllers/authController');

const router = express.Router();

router.post('/api/auth/register', register);
router.post('/api/auth/login', login);
router.post('/api/auth/forgot-password', forgotPassword);
router.post('/api/auth/reset-password', resetPassword);
router.get('/api/auth/me', auth, me);

module.exports = router;
