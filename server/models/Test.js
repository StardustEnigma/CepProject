const mongoose = require("mongoose");

const testResultSchema = new mongoose.Schema({
  studentId: { type: Number, required: true },
  marks: { type: Number, default: 0 },
  isAbsent: { type: Boolean, default: false }
}, { _id: false });

const testSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  batch: { type: String, required: true },
  subject: { type: String, required: true },
  date: { type: String, required: true },
  maxMarks: { type: Number, required: true },
  results: { type: [testResultSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("Test", testSchema);
