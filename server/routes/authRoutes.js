const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.get('/me', protect, getMe);

module.exports = router;
