const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  day: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subject: { type: String, required: true },
  teacher: { type: String, required: true },
  batch: { type: String, required: true },
  isExtraClass: { type: Boolean, default: false }
});

module.exports = mongoose.model("Timetable", timetableSchema);
