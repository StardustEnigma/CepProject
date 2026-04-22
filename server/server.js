require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const bcrypt = require("bcryptjs");
const connectDB = require("./db");
const {
  initializeWhatsAppClient,
  sendWhatsAppText,
  normalizeWhatsAppNumber,
  isValidWhatsAppNumber,
  getWhatsAppStatus,
  resetWhatsAppClient
} = require("./whatsappClient");

// Mongoose Models
const Student = require("./models/Student");
const Notice = require("./models/Notice");
const Timetable = require("./models/Timetable");
const Test = require("./models/Test");
const Admin = require("./models/Admin");
const Counter = require("./models/Counter");

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_jwt_key";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token is missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:3000", "http://localhost:5000"].filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes("localhost") || origin.includes("127.0.0.1") || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("Blocked by CORS origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  }
}));
app.use(express.json());
initializeWhatsAppClient();

const batchSubjects = {
  "8th class": ["Maths", "Science", "English", "SST"],
  "9th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "10th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "11th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "12th class": ["Physics", "Chemistry", "Biology", "Maths"]
};

const defaultWhatsAppTemplates = {
  welcome: "Welcome to Gurukul Academy, {{name}}! We are happy to have you with us.",
  feeReminder: "Dear {{name}}, this is a gentle reminder that Rs. {{feesPending}} in tuition fees are currently pending at Gurukul Academy. Kindly complete your payment soon.",
  testResult: "Test Result at Gurukul Academy\nSubject: {{subject}}\nDate: {{date}}\nStudent: {{name}}\nScore: {{marks}}/{{maxMarks}}\nStatus: {{status}}",
  notice: "Notice from Gurukul Academy:\n\n*{{title}}*\n{{content}}"
};

let whatsappTemplates = {
  ...defaultWhatsAppTemplates
};

const dayOrder = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

const sanitizeStudent = (student, studentTests) => {
  const testResults = (studentTests || []).map(t => {
    const res = t.results.find(r => r.studentId === student.id) || null;
    return {
      id: t.id,
      subject: t.subject,
      date: t.date,
      maxMarks: t.maxMarks,
      marks: res ? res.marks : null,
      isAbsent: res ? res.isAbsent : null,
      hasResult: !!res
    };
  });

  return {
    id: student.id,
    name: student.name,
    phoneNumber: student.phoneNumber || "",
    batch: student.batch || "N/A",
    subjects: student.subjects || [],
    feesTotal: student.feesTotal || 0,
    feesPaid: student.feesPaid || 0,
    payments: (student.payments || []).map(p => ({
      id: p.paymentId,
      amount: p.amount,
      mode: p.mode,
      date: p.date
    })),
    attendance: student.attendance,
    feesPending: (student.feesTotal || 0) - (student.feesPaid || 0),
    lastWhatsAppStatus: student.lastWhatsAppStatus || null,
    lastWhatsAppType: student.lastWhatsAppType || null,
    lastWhatsAppAt: student.lastWhatsAppAt || null,
    lastWhatsAppInfo: student.lastWhatsAppInfo || null,
    testResults
  };
};

const getStudentFeesPending = (student) =>
  Math.max(0, Number(student.feesTotal || 0) - Number(student.feesPaid || 0));

const renderTemplate = (template, context) =>
  String(template || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    if (context[key] == null) {
      return "";
    }
    return String(context[key]);
  });

const getStudentTemplateContext = (student) => ({
  name: student.name,
  batch: student.batch,
  phoneNumber: student.phoneNumber,
  feesTotal: Number(student.feesTotal || 0),
  feesPaid: Number(student.feesPaid || 0),
  feesPending: getStudentFeesPending(student)
});

const getTestTemplateContext = (student, test, result) => ({
  name: student.name,
  batch: student.batch,
  subject: test.subject,
  date: test.date,
  maxMarks: test.maxMarks,
  marks: result.isAbsent ? 0 : result.marks,
  status: result.isAbsent ? "Absent" : "Present"
});

const getNoticeTemplateContext = (student, notice) => ({
  name: student.name,
  batch: student.batch,
  title: notice.title,
  content: notice.content
});

const updateWhatsAppDeliveryOnStudent = async (student, type, delivery, text) => {
  const event = {
    eventId: Date.now(),
    type,
    sent: Boolean(delivery.sent),
    info: delivery.message,
    at: new Date().toISOString(),
    text
  };

  // Push event and trim to 20
  await Student.updateOne(
    { id: student.id },
    {
      $push: { whatsappEvents: { $each: [event], $position: 0, $slice: 20 } },
      $set: {
        lastWhatsAppStatus: event.sent ? "sent" : "failed",
        lastWhatsAppType: type,
        lastWhatsAppAt: event.at,
        lastWhatsAppInfo: event.info
      }
    }
  );
};

const sendTemplatedStudentWhatsApp = async (student, type, template) => {
  const context = getStudentTemplateContext(student);
  const messageText = renderTemplate(template, context);
  const delivery = await sendWhatsAppText(student.phoneNumber, messageText);
  await updateWhatsAppDeliveryOnStudent(student, type, delivery, messageText);

  return {
    delivery,
    messageText
  };
};

// ===================== ROUTES =====================

app.get("/", (req, res) => {
  res.json({
    message: "Gurukul Academy API is running."
  });
});

app.post("/login/admin", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (admin && bcrypt.compareSync(password, admin.passwordHash)) {
    const token = jwt.sign({ username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({
      role: "admin",
      message: "Admin login successful",
      token
    });
  }

  return res.status(401).json({
    message: "Invalid admin credentials"
  });
});

app.post("/login/student", async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({
      message: "Name and password are required"
    });
  }

  const student = await Student.findOne({
    name: { $regex: new RegExp(`^${String(name).trim()}$`, 'i') }
  });

  if (!student || !bcrypt.compareSync(password, student.password)) {
    return res.status(401).json({
      message: "Invalid student credentials"
    });
  }

  const tests = await Test.find({ batch: student.batch }).lean();
  const token = jwt.sign({ id: student.id, name: student.name, role: 'student' }, JWT_SECRET, { expiresIn: '1d' });

  return res.json({
    role: "student",
    message: "Student login successful",
    student: sanitizeStudent(student, tests),
    token
  });
});

app.use(authenticateToken);

app.get("/whatsapp/status", (req, res) => {
  res.json(getWhatsAppStatus());
});

app.post("/whatsapp/reset", async (req, res) => {
  const status = await resetWhatsAppClient();
  res.json({ message: "WhatsApp client reset requested.", status });
});

app.get("/whatsapp/templates", (req, res) => {
  res.json(whatsappTemplates);
});

app.put("/whatsapp/templates", (req, res) => {
  const { welcome, feeReminder } = req.body;

  if (welcome != null) {
    if (!String(welcome).trim()) {
      return res.status(400).json({
        message: "Welcome template cannot be empty"
      });
    }
    whatsappTemplates.welcome = String(welcome).trim();
  }

  if (feeReminder != null) {
    if (!String(feeReminder).trim()) {
      return res.status(400).json({
        message: "Fee reminder template cannot be empty"
      });
    }
    whatsappTemplates.feeReminder = String(feeReminder).trim();
  }

  const { testResult } = req.body;
  if (testResult != null) {
    if (!String(testResult).trim()) {
      return res.status(400).json({
        message: "Test result template cannot be empty"
      });
    }
    whatsappTemplates.testResult = String(testResult).trim();
  }

  const { notice } = req.body;
  if (notice != null) {
    if (!String(notice).trim()) {
      return res.status(400).json({
        message: "Notice template cannot be empty"
      });
    }
    whatsappTemplates.notice = String(notice).trim();
  }

  return res.json({
    message: "WhatsApp templates updated successfully",
    templates: whatsappTemplates
  });
});

app.get("/students", async (req, res) => {
  const students = await Student.find({}).lean();
  const tests = await Test.find({}).lean();

  const response = students.map(s => {
    const batchTests = tests.filter(t => t.batch === s.batch);
    return sanitizeStudent(s, batchTests);
  });
  res.json(response);
});

app.get("/students/:id", async (req, res) => {
  const studentId = Number.parseInt(req.params.id, 10);
  const student = await Student.findOne({ id: studentId }).lean();

  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  const tests = await Test.find({ batch: student.batch }).lean();
  return res.json(sanitizeStudent(student, tests));
});

app.post("/students", async (req, res) => {
  const { name, password, phoneNumber, batch, subjects, feesTotal } = req.body;
  const normalizedPhoneNumber = normalizeWhatsAppNumber(phoneNumber);

  if (!name || !String(name).trim() || !password || !String(password).trim() || !batch || feesTotal == null || !normalizedPhoneNumber) {
    return res.status(400).json({
      message: "Name, password, phoneNumber, batch, and feesTotal are required"
    });
  }

  if (!isValidWhatsAppNumber(normalizedPhoneNumber)) {
    return res.status(400).json({
      message: "Invalid phone number. Use 10 to 15 digits with country code if needed."
    });
  }

  const alreadyExists = await Student.findOne({
    name: { $regex: new RegExp(`^${String(name).trim()}$`, 'i') }
  });

  if (alreadyExists) {
    return res.status(409).json({
      message: "Student with this name already exists"
    });
  }

  const phoneAlreadyExists = await Student.findOne({ phoneNumber: normalizedPhoneNumber });
  if (phoneAlreadyExists) {
    return res.status(409).json({
      message: "Student with this phone number already exists"
    });
  }

  const nextId = await Counter.getNextId("students");

  const newStudent = await Student.create({
    id: nextId,
    name: String(name).trim(),
    password: bcrypt.hashSync(String(password).trim(), 10),
    phoneNumber: normalizedPhoneNumber,
    batch: String(batch).trim(),
    subjects: Array.isArray(subjects) ? subjects : [],
    feesTotal: Number(feesTotal),
    feesPaid: 0,
    payments: [],
    attendance: [],
    whatsappEvents: [],
    lastWhatsAppStatus: null,
    lastWhatsAppType: null,
    lastWhatsAppAt: null,
    lastWhatsAppInfo: null
  });

  const { delivery } = await sendTemplatedStudentWhatsApp(
    newStudent,
    "welcome",
    whatsappTemplates.welcome
  );
  const message = delivery.sent
    ? "Student added successfully and welcome WhatsApp message sent."
    : "Student added successfully, but welcome WhatsApp message is pending.";

  // Re-fetch to get updated WhatsApp fields
  const updatedStudent = await Student.findOne({ id: nextId }).lean();
  const tests = await Test.find({ batch: updatedStudent.batch }).lean();

  return res.status(201).json({
    message,
    student: sanitizeStudent(updatedStudent, tests),
    whatsapp: delivery
  });
});

app.post("/students/:id/whatsapp/fee-reminder", async (req, res) => {
  const studentId = Number.parseInt(req.params.id, 10);
  const student = await Student.findOne({ id: studentId });

  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  const feesPending = getStudentFeesPending(student);
  if (feesPending <= 0) {
    return res.status(400).json({
      message: "No pending fees for this student"
    });
  }

  const { delivery, messageText } = await sendTemplatedStudentWhatsApp(
    student,
    "fee-reminder",
    whatsappTemplates.feeReminder
  );

  const updatedStudent = await Student.findOne({ id: studentId }).lean();
  const tests = await Test.find({ batch: updatedStudent.batch }).lean();

  return res.json({
    message: delivery.sent
      ? "Fee reminder WhatsApp message sent successfully"
      : "Fee reminder could not be delivered right now",
    whatsapp: delivery,
    preview: messageText,
    student: sanitizeStudent(updatedStudent, tests)
  });
});

app.delete("/students/:id", async (req, res) => {
  const studentId = Number.parseInt(req.params.id, 10);
  const student = await Student.findOneAndDelete({ id: studentId }).lean();

  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  return res.json({
    message: "Student deleted successfully",
    student: sanitizeStudent(student, [])
  });
});

app.post("/students/:id/pay", async (req, res) => {
  const studentId = Number.parseInt(req.params.id, 10);
  const { amount, mode } = req.body;

  if (!amount || amount <= 0 || !mode) {
    return res.status(400).json({
      message: "Valid amount and payment mode are required"
    });
  }

  const student = await Student.findOne({ id: studentId });
  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  const payment = {
    paymentId: Date.now(),
    amount: Number(amount),
    mode: String(mode).trim(),
    date: new Date().toISOString().slice(0, 10)
  };

  student.payments.push(payment);
  student.feesPaid = (student.feesPaid || 0) + Number(amount);
  await student.save();

  const tests = await Test.find({ batch: student.batch }).lean();

  return res.json({
    message: "Payment processed successfully",
    student: sanitizeStudent(student.toObject(), tests),
    payment: { id: payment.paymentId, amount: payment.amount, mode: payment.mode, date: payment.date }
  });
});

app.post("/attendance", async (req, res) => {
  const { studentId, date, present, timetableId } = req.body;

  if (!studentId || !date || typeof present !== "boolean") {
    return res.status(400).json({
      message: "studentId, date and present(boolean) are required"
    });
  }

  const parsedStudentId = Number.parseInt(studentId, 10);
  const student = await Student.findOne({ id: parsedStudentId });

  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  // Find slot to know the subject context
  let subjectName = "General";
  if (timetableId) {
    const slot = await Timetable.findOne({ id: Number(timetableId) }).lean();
    if (slot) subjectName = slot.subject;
  }

  const existingIndex = student.attendance.findIndex(
    (entry) => entry.date === date && entry.subject === subjectName
  );

  if (existingIndex >= 0) {
    student.attendance[existingIndex].present = present;
  } else {
    student.attendance.push({ date, present, subject: subjectName, timetableId: timetableId || null });
  }

  student.attendance.sort((a, b) => a.date.localeCompare(b.date));
  await student.save();

  const tests = await Test.find({ batch: student.batch }).lean();

  return res.json({
    message: "Attendance updated successfully",
    student: sanitizeStudent(student.toObject(), tests)
  });
});

app.get("/notices", async (req, res) => {
  const { batch } = req.query;
  let filter = {};
  if (batch && batch !== "All" && typeof batch === "string") {
    filter = { $or: [{ batch: "All" }, { batch }] };
  }
  const noticesList = await Notice.find(filter).sort({ id: -1 }).lean();
  res.json(noticesList);
});

app.post("/notices", async (req, res) => {
  const { title, content, batch } = req.body;

  if (!title || !String(title).trim() || !content || !String(content).trim()) {
    return res.status(400).json({
      message: "Title and content are required"
    });
  }

  const nextId = await Counter.getNextId("notices");

  const notice = await Notice.create({
    id: nextId,
    title: String(title).trim(),
    content: String(content).trim(),
    batch: batch ? String(batch).trim() : "All",
    createdAt: new Date().toISOString().slice(0, 10)
  });

  return res.status(201).json({
    message: "Notice posted successfully",
    notice
  });
});

app.post("/notices/:id/whatsapp", async (req, res) => {
  const noticeId = Number.parseInt(req.params.id, 10);
  const notice = await Notice.findOne({ id: noticeId }).lean();

  if (!notice) {
    return res.status(404).json({ message: "Notice not found" });
  }

  let filter = {};
  if (notice.batch !== "All") {
    filter = { batch: notice.batch };
  }
  const targetStudents = await Student.find(filter).lean();

  const deliveries = [];

  for (const student of targetStudents) {
    if (!student.phoneNumber) continue;

    const context = getNoticeTemplateContext(student, notice);
    const messageText = renderTemplate(whatsappTemplates.notice, context);
    const delivery = await sendWhatsAppText(student.phoneNumber, messageText);

    await updateWhatsAppDeliveryOnStudent(student, "notice", delivery, messageText);
    deliveries.push({ studentId: student.id, name: student.name, delivery });
  }

  return res.json({
    message: "Notice queued for WhatsApp broadcast",
    deliveries
  });
});

app.get("/timetable", async (req, res) => {
  const entries = await Timetable.find({}).lean();
  const sorted = [...entries].sort((a, b) => {
    const dayDifference = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
    if (dayDifference !== 0) return dayDifference;
    return a.startTime.localeCompare(b.startTime);
  });
  res.json(sorted);
});

app.post("/timetable", async (req, res) => {
  const { day, startTime, endTime, subject, teacher, batch, isExtraClass } = req.body;

  if (
    !day ||
    !String(day).trim() ||
    !startTime ||
    !String(startTime).trim() ||
    !endTime ||
    !String(endTime).trim() ||
    !subject ||
    !String(subject).trim() ||
    !teacher ||
    !String(teacher).trim() ||
    !batch ||
    !String(batch).trim()
  ) {
    return res.status(400).json({
      message: "day, startTime, endTime, subject, teacher and batch are required"
    });
  }

  if (!dayOrder[String(day).trim()]) {
    return res.status(400).json({
      message: "Invalid day value"
    });
  }

  const normalizedStartTime = String(startTime).trim();
  const normalizedEndTime = String(endTime).trim();

  if (normalizedStartTime >= normalizedEndTime) {
    return res.status(400).json({
      message: "startTime must be earlier than endTime"
    });
  }

  if (normalizedEndTime > "19:00") {
    return res.status(400).json({
      message: "Classes must end by 19:00"
    });
  }

  const normalizedBatch = String(batch).trim();
  const duplicateSlot = await Timetable.findOne({
    day: String(day).trim(),
    batch: normalizedBatch,
    startTime: normalizedStartTime,
    endTime: normalizedEndTime
  });

  if (duplicateSlot) {
    return res.status(409).json({
      message: "A timetable slot already exists for this batch, day and time"
    });
  }

  const nextId = await Counter.getNextId("timetable");

  const entry = await Timetable.create({
    id: nextId,
    day: String(day).trim(),
    startTime: normalizedStartTime,
    endTime: normalizedEndTime,
    subject: String(subject).trim(),
    teacher: String(teacher).trim(),
    batch: normalizedBatch,
    isExtraClass: Boolean(isExtraClass)
  });

  return res.status(201).json({
    message: "Timetable entry added successfully",
    timetable: entry
  });
});

app.delete("/timetable/:id", async (req, res) => {
  const timetableId = Number.parseInt(req.params.id, 10);
  const deletedEntry = await Timetable.findOneAndDelete({ id: timetableId }).lean();

  if (!deletedEntry) {
    return res.status(404).json({
      message: "Timetable entry not found"
    });
  }

  return res.json({
    message: "Timetable entry deleted successfully",
    timetable: deletedEntry
  });
});

app.get("/tests", async (req, res) => {
  const allTests = await Test.find({}).sort({ id: -1 }).lean();
  res.json(allTests);
});

app.post("/tests", async (req, res) => {
  const { batch, subject, date, maxMarks, results } = req.body;

  if (!batch || !subject || !date || typeof maxMarks !== 'number' || !Array.isArray(results)) {
    return res.status(400).json({ message: "Invalid test data. Required: batch, subject, date, maxMarks, results array." });
  }

  const nextId = await Counter.getNextId("tests");

  const test = await Test.create({
    id: nextId,
    batch: String(batch).trim(),
    subject: String(subject).trim(),
    date: String(date).trim(),
    maxMarks: maxMarks,
    results: results.map(r => ({
      studentId: Number.parseInt(r.studentId, 10),
      marks: Number(r.marks || 0),
      isAbsent: Boolean(r.isAbsent)
    }))
  });

  return res.status(201).json({
    message: "Test created successfully",
    test
  });
});

app.post("/tests/:id/whatsapp", async (req, res) => {
  const testId = Number.parseInt(req.params.id, 10);
  const test = await Test.findOne({ id: testId }).lean();

  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  const deliveries = [];

  for (const result of test.results) {
    const student = await Student.findOne({ id: result.studentId }).lean();
    if (!student || !student.phoneNumber) continue;

    const context = getTestTemplateContext(student, test, result);
    const messageText = renderTemplate(whatsappTemplates.testResult, context);
    const delivery = await sendWhatsAppText(student.phoneNumber, messageText);

    await updateWhatsAppDeliveryOnStudent(student, "test-result", delivery, messageText);
    deliveries.push({ studentId: student.id, name: student.name, delivery });
  }

  return res.json({
    message: "Test results queued for WhatsApp broadcast",
    deliveries
  });
});

app.delete("/tests/:id", async (req, res) => {
  const testId = Number.parseInt(req.params.id, 10);
  const deletedTest = await Test.findOneAndDelete({ id: testId }).lean();

  if (!deletedTest) {
    return res.status(404).json({ message: "Test not found" });
  }

  return res.json({ message: "Test deleted successfully", test: deletedTest });
});

// --- Serve Frontend ---
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// --- Start Server with DB Connection ---
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});