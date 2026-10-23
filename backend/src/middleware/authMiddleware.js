const jwt = require('jsonwebtoken');

/**
 * Basic authentication middleware structure
 * Verifies JWT from Authorization: Bearer <token>
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token missing or invalid'
    });
  }

  const secret = process.env.JWT_SECRET || 'healthnest_jwt_secret_key_dev_2026';

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.user = decoded; // Contains id, role, etc.
    next();
  });
};

module.exports = authenticateToken;
