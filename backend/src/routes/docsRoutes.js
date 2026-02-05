const express = require('express');
const { getRawDocs } = require('../controllers/docsController');

const router = express.Router();

router.get('/api/docs', getRawDocs);

module.exports = router;
