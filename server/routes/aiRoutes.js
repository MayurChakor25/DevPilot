const express = require('express');
const { body } = require('express-validator');
const { chat, generateReadme, generateDocs, findBugs } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { aiLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.use(protect, aiLimiter);

const repoIdValidator = body('repoId').trim().notEmpty().withMessage('repoId is required').isMongoId();

router.post(
  '/chat',
  [
    repoIdValidator,
    body('question').trim().notEmpty().withMessage('question is required').isLength({ max: 4000 }),
  ],
  validate,
  chat
);

router.post('/generate-readme', [repoIdValidator], validate, generateReadme);
router.post('/generate-docs', [repoIdValidator], validate, generateDocs);
router.post('/find-bugs', [repoIdValidator], validate, findBugs);

module.exports = router;
