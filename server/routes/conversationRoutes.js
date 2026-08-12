const express = require('express');
const { getConversationsForRepo } = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/:repoId', getConversationsForRepo);

module.exports = router;
