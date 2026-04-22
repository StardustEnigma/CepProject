const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  batch: { type: String, default: "All" },
  createdAt: { type: String, required: true }
});

module.exports = mongoose.model("Notice", noticeSchema);
