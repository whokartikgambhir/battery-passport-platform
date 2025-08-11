// external dependencies
import lodashMerge from "lodash.merge";

// internal dependencies
import { Passport } from "../models/passportModel.js";
import { emitEvent } from "../kafka/producer.js";
import { component } from "../logger.js";

const log = component("passport");

// GET /api/passports  (admin/user)
export const listPassports = async (_req, res) => {
  try {
    const docs = await Passport.find({}).lean();
    return res.status(200).json(docs);
  } catch (err) {
    log.error(err, { route: "list" });
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /api/passports  (admin)
export const createPassport = async (req, res) => {
  try {
    const passport = await Passport.create(req.body);
    await emitEvent("passport.created", { id: passport._id, data: passport.data });
    return res.status(201).json(passport);
  } catch (err) {
    log.error(err, { route: "create" });
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/passports/:id  (admin/user)
export const getPassportById = async (req, res) => {
  try {
    const { id } = req.params;
    const passport = await Passport.findById(id);
    if (!passport) return res.status(404).json({ message: "Passport not found" });
    return res.status(200).json(passport);
  } catch (err) {
    log.error(err, { route: "get", id: req.params?.id });
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/passports/:id  (admin)
export const updatePassport = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Passport.findById(id);
    if (!doc) return res.status(404).json({ message: "Passport not found" });

    // Deep merge (preserves siblings)
    lodashMerge(doc, req.body);
    await doc.save();

    await emitEvent("passport.updated", { id: doc._id, data: doc.data });
    return res.status(200).json(doc);
  } catch (err) {
    log.error(err, { route: "update", id: req.params?.id });
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/passports/:id  (admin)
export const deletePassport = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Passport.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Passport not found" });

    await emitEvent("passport.deleted", { id });
    return res.status(200).json({ message: "Deleted", id });
  } catch (err) {
    log.error(err, { route: "delete", id: req.params?.id });
    return res.status(500).json({ message: "Server error" });
  }
};
