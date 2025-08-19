// external dependencies
import mongoose from 'mongoose';

/**
 * User schema definition
 * Fields: email, password, role
 * 
 * @returns Mongoose User model
 */
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
});

export const User = mongoose.model('User', userSchema);
