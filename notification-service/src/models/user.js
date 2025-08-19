// external dependencies
import mongoose from "mongoose";

// internal dependencies
import { config } from "../config.js";

const authConn = mongoose.createConnection(config.authMongoUri, {
  autoIndex: false
});

/**
 * User schema for auth database
 * Fields: email, password (hashed), role
 * 
 * @returns Mongoose AuthUser model
 */
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },         // hashed; not used here
    role: { type: String, enum: ["admin", "user"], default: "user" }
  },
  { timestamps: true, collection: "users" }
);

export const AuthUser = authConn.model("User", UserSchema);
