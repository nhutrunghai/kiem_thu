const express = require('express');
const auth = require('../middleware/auth');
const { listTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');

const router = express.Router();

router.get('/api/tasks', auth, listTasks);
router.post('/api/tasks', auth, createTask);
router.put('/api/tasks/:id', auth, updateTask);
router.delete('/api/tasks/:id', auth, deleteTask);

module.exports = router;
