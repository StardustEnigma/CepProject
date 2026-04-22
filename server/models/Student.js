const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paymentId: { type: Number, required: true },
  amount: { type: Number, required: true },
  mode: { type: String, required: true },
  date: { type: String, required: true }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  date: { type: String, required: true },
  present: { type: Boolean, required: true },
  subject: { type: String, default: "General" },
  timetableId: { type: Number, default: null }
}, { _id: false });

const whatsappEventSchema = new mongoose.Schema({
  eventId: { type: Number },
  type: { type: String },
  sent: { type: Boolean },
  info: { type: String },
  at: { type: String },
  text: { type: String }
}, { _id: false });

const studentSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  batch: { type: String, required: true },
  subjects: { type: [String], default: [] },
  feesTotal: { type: Number, default: 0 },
  feesPaid: { type: Number, default: 0 },
  payments: { type: [paymentSchema], default: [] },
  attendance: { type: [attendanceSchema], default: [] },
  whatsappEvents: { type: [whatsappEventSchema], default: [] },
  lastWhatsAppStatus: { type: String, default: null },
  lastWhatsAppType: { type: String, default: null },
  lastWhatsAppAt: { type: String, default: null },
  lastWhatsAppInfo: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
