const { validationResult } = require('express-validator');

/**
 * Runs after an array of express-validator checks. If any failed, responds
 * with a structured 400 error instead of calling next().
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array().map((e) => e.msg).join(', '),
      errors: errors.array(),
    });
  }
  next();
}

module.exports = validate;
