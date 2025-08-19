/**
 * Middleware to authorize user based on role
 * 
 * @param roles array of allowed roles
 * @returns middleware function that checks user role from req.user
 */
export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
};
