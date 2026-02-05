const express = require('express');
const auth = require('../middleware/auth');
const { listEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');

const router = express.Router();

router.get('/api/events', auth, listEvents);
router.post('/api/events', auth, createEvent);
router.put('/api/events/:id', auth, updateEvent);
router.delete('/api/events/:id', auth, deleteEvent);

module.exports = router;
