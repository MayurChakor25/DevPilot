const express = require('express');
const { body } = require('express-validator');
const {
  importFromGithub,
  uploadRepository,
  listRepositories,
  getRepository,
  deleteRepository,
} = require('../controllers/repositoryController');
const { generateReadme } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const { aiLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.use(protect);

router.post(
  '/import-github',
  [
    body('url')
      .trim()
      .notEmpty()
      .withMessage('A GitHub repository URL is required')
      .matches(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\.git)?\/?$/i)
      .withMessage('Must be a valid public GitHub repository URL'),
  ],
  validate,
  importFromGithub
);

router.post('/upload', upload.single('file'), uploadRepository);

router.get('/', listRepositories);
router.get('/:id', getRepository);
router.delete('/:id', deleteRepository);

// Alias of POST /api/ai/generate-readme, kept for a more RESTful nested route
// as described in the README Generator spec.
router.post('/:id/generate-readme', aiLimiter, generateReadme);

module.exports = router;
