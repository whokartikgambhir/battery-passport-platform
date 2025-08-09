import { Passport } from '../models/passportModel.js';

export const createPassport = async (req, res) => {
  try {
    const passport = await Passport.create(req.body);
    res.status(201).json(passport);
  } catch (err) {
    console.error('Create Passport Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
