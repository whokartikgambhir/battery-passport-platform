import User from "../models/user.model.js";

export async function getUserByIdInternal(req, res) {
  const apiKey = req.header("x-api-key");
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { id } = req.params;
  const user = await User.findById(id).lean();
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.json({
    id: user._id.toString(),
    email: user.email,
    role: user.role
  });
}
