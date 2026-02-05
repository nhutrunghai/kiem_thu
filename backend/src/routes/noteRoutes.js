const express = require('express');
const auth = require('../middleware/auth');
const { listNotes, getNoteByEvent, upsertNote, disableReminder, deleteNote } = require('../controllers/noteController');

const router = express.Router();

router.get('/api/notes', auth, listNotes);
router.get('/api/notes/:eventId', auth, getNoteByEvent);
router.post('/api/notes', auth, upsertNote);
router.put('/api/notes/:id/reminder', auth, disableReminder);
router.delete('/api/notes/:id', auth, deleteNote);

module.exports = router;
