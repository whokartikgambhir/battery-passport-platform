import bcrypt from 'bcrypt';
import { User } from '../models/userModel.js';
import { generateToken } from '../utils/jwtUtil.js';

export const register = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashedPassword, role });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
