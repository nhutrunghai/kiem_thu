const express = require('express');
const auth = require('../middleware/auth');
const { getStats } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/api/dashboard/stats', auth, getStats);

module.exports = router;
