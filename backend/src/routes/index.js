const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const eventRoutes = require('./eventRoutes');
const taskRoutes = require('./taskRoutes');
const noteRoutes = require('./noteRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const docsRoutes = require('./docsRoutes');

const router = express.Router();

router.use(authRoutes);
router.use(userRoutes);
router.use(eventRoutes);
router.use(taskRoutes);
router.use(noteRoutes);
router.use(notificationRoutes);
router.use(dashboardRoutes);
router.use(docsRoutes);

module.exports = router;
