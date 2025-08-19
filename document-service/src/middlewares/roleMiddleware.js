/**
 * Middleware to authorize user based on role
 * 
 * @param roles array of allowed roles
 * @returns middleware function, responds with 403 if role is not allowed
 */
export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }
    next();
  };
};
