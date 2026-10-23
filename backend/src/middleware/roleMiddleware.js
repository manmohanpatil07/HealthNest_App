/**
 * Role-based authorization middleware
 * @param  {...string} allowedRoles - 'user', 'healthcare_provider'
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: Role information missing'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: Requires role [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = requireRole;
