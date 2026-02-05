const express = require('express');
const auth = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/userController');

const router = express.Router();

router.get('/api/user/profile', auth, getProfile);
router.put('/api/user/profile', auth, updateProfile);

module.exports = router;
