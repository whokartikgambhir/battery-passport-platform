// external dependencies
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// internal dependencies
import { User } from "../models/userModel.js";
import { generateToken } from "../utils/jwtUtil.js";
import { config } from "../config.js";
import { component } from "../logger.js";

const log = component("auth");

/**
 * Method to register a new user
 * 
 * @param user req object containing email, password and role 
 * @returns response object
 */
export const register = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashedPassword, role });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    log.error(err, { route: "register" });
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Method to authenticate and login a user
 * Validates email and password against stored credentials
 * Issues a signed JWT token on success
 * 
 * @param user req object containing email, password and role 
 * @returns response object
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    return res.status(200).json({ token });
  } catch (err) {
    log.error(err, { route: "login" });
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Method to Introspect a JWT token
 * Validates and decodes the provided JWT from `Authorization` header
 * Fetches the latest user info from the database to reflect current role/status
 * 
 * @param user req object containing authorization header, token
 * @returns response object
 */
export const introspect = async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" ");
    if (!token) {
      return res.status(401).json({ valid: false, error: "Missing token" });
    }

    const payload = jwt.verify(token, config.jwtSecret);

    // fetch fresh user to reflect latest role/status
    const user = await User.findById(payload.id).lean();
    if (!user) {
      return res.status(401).json({ valid: false, error: "User not found" });
    }

    return res.json({
      valid: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role
      },
      exp: payload.exp,
      iat: payload.iat
    });
  } catch (err) {
    return res.status(401).json({ valid: false, error: err.message });
  }
};
