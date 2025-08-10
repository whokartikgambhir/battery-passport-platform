// external dependencies
import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema({
  email: { type: String, required: true },
  type: { type: String, required: true },
  status: { type: String, enum: ["sent", "failed"], required: true },
  error: { type: String },
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("EmailLog", emailLogSchema);
