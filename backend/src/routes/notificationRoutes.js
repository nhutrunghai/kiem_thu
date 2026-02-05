const express = require('express');
const auth = require('../middleware/auth');
const { listNotifications, updateNotification } = require('../controllers/notificationController');

const router = express.Router();

router.get('/api/notifications', auth, listNotifications);
router.put('/api/notifications/:id', auth, updateNotification);

module.exports = router;
