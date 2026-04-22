const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "students", "notices", "timetable", "tests"
  seq: { type: Number, default: 0 }
});

counterSchema.statics.getNextId = async function (name) {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

module.exports = mongoose.model("Counter", counterSchema);
