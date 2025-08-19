// external dependencies
import jwt from 'jsonwebtoken';

/**
 * Method to generate JWT token for a user
 * 
 * @param user object containing _id and role
 * @returns signed JWT token string
 */
export const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};
