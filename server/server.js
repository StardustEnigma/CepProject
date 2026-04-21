require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const bcrypt = require("bcryptjs");
const {
  initializeWhatsAppClient,
  sendWhatsAppText,
  normalizeWhatsAppNumber,
  isValidWhatsAppNumber,
  getWhatsAppStatus,
  resetWhatsAppClient
} = require("./whatsappClient");

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

const ADMIN_CREDENTIALS = {
  username: "admin",
  passwordHash: bcrypt.hashSync("admin123", 10)
};

const batchesList = ["8th class", "9th class", "10th class", "11th class", "12th class"];
const batchSubjects = {
  "8th class": ["Maths", "Science", "English", "SST"],
  "9th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "10th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "11th class": ["Physics", "Chemistry", "Biology", "Maths"],
  "12th class": ["Physics", "Chemistry", "Biology", "Maths"]
};
const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Shaurya", "Priya", "Rohan", "Ananya", "Sneha", "Kavya", "Diya", "Isha", "Neha", "Pooja", "Rahul", "Aman", "Ravi", "Vikram", "Sunil", "Ankit", "Rohit", "Sachin", "Sushant", "Kiran", "Nisha"];
const lastNames = ["Sharma", "Gupta", "Verma", "Singh", "Kumar", "Krishna", "Joshi", "Yadav", "Patel", "Desai", "Deshmukh", "Patil", "Iyer", "Rao", "Nair", "Pillai", "Chauhan", "Rajput", "Malhotra", "Kapoor"];
const getSeedPhoneNumber = (seedId) => `91${(7000000000 + seedId).toString()}`;
const defaultWhatsAppTemplates = {
  welcome: "Welcome to Gurukul Academy, {{name}}! We are happy to have you with us.",
  feeReminder: "Dear {{name}}, this is a gentle reminder that Rs. {{feesPending}} in tuition fees are currently pending at Gurukul Academy. Kindly complete your payment soon.",
  testResult: "Test Result at Gurukul Academy\nSubject: {{subject}}\nDate: {{date}}\nStudent: {{name}}\nScore: {{marks}}/{{maxMarks}}\nStatus: {{status}}",
  notice: "Notice from Gurukul Academy:\n\n*{{title}}*\n{{content}}"
};

let whatsappTemplates = {
  ...defaultWhatsAppTemplates
};

let students = [];
let studentIdCounter = 1;

let tests = [];

for (const batch of batchesList) {
  for (let i = 1; i <= 10; i++) {
    const feesTotal = batch === "8th class" ? 10000 : batch === "9th class" ? 12000 : batch === "10th class" ? 15000 : batch === "11th class" ? 20000 : 25000;
    const feesPaid = i % 2 === 0 ? feesTotal : (i % 3 === 0 ? feesTotal / 2 : 0); // some paid full, some half, some none
    const payments = [];
    if (feesPaid > 0) {
      payments.push({ id: Date.now() + i, amount: feesPaid, mode: "Cash", date: "2026-04-01" });
    }
    
    // Pick realistic names
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    students.push({
      id: studentIdCounter,
      name: `${randomFirstName} ${randomLastName}`,
      password: bcrypt.hashSync("password123", 10),
      phoneNumber: getSeedPhoneNumber(studentIdCounter),
      batch: batch,
      subjects: batchSubjects[batch] || [],
      feesTotal: feesTotal,
      feesPaid: feesPaid,
      payments: payments,
      attendance: [
        { date: "2026-04-01", present: i % 4 !== 0 },
        { date: "2026-04-02", present: true }
      ]
    });
    studentIdCounter++;
  }
}


let notices = [
  {
    id: 1,
    title: "Welcome",
    content: "New batch starts from 10 April. Bring notebooks and ID card.",
    batch: "All",
    createdAt: "2026-04-03"
  }
];

const dayOrder = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

let timetable = [];
let ttIdCounter = 1;
const classDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const times11_12 = [
  { start: "15:00", end: "16:00" },
  { start: "16:00", end: "17:00" }
];
const times8_10 = [
  { start: "17:00", end: "18:00" },
  { start: "18:00", end: "19:00" }
];

// 8th class teachers
const t8 = { Maths: "Bhaki maam", Science: "Shubham sir", SST: "Mowade sir", English: "Mowade sir" };
// 9-12 teachers
const tHigh = { Maths: "Akash sir", Physics: "Akash sir", Chemistry: "Shubham sir", Biology: "Shubham sir" };

for (const day of classDays) {
  // --- 11th and 12th class (15:00 to 17:00) ---
  // Slot 1: 15:00 - 16:00
  timetable.push({ id: ttIdCounter++, day, startTime: times11_12[0].start, endTime: times11_12[0].end, subject: "Maths", teacher: tHigh.Maths, batch: "11th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times11_12[0].start, endTime: times11_12[0].end, subject: "Biology", teacher: tHigh.Biology, batch: "12th class", isExtraClass: false });
  
  // Slot 2: 16:00 - 17:00
  timetable.push({ id: ttIdCounter++, day, startTime: times11_12[1].start, endTime: times11_12[1].end, subject: "Chemistry", teacher: tHigh.Chemistry, batch: "11th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times11_12[1].start, endTime: times11_12[1].end, subject: "Physics", teacher: tHigh.Physics, batch: "12th class", isExtraClass: false });

  // --- 8th, 9th, and 10th class (17:00 to 19:00) ---
  // Slot 1: 17:00 - 18:00
  timetable.push({ id: ttIdCounter++, day, startTime: times8_10[0].start, endTime: times8_10[0].end, subject: "Maths", teacher: t8.Maths, batch: "8th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times8_10[0].start, endTime: times8_10[0].end, subject: "Physics", teacher: tHigh.Physics, batch: "9th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times8_10[0].start, endTime: times8_10[0].end, subject: "Chemistry", teacher: tHigh.Chemistry, batch: "10th class", isExtraClass: false });

  // Slot 2: 18:00 - 19:00
  // Note: SST (Mowade sir) is chosen to prevent overlap with Shubham sir teaching Biology for 9th.
  timetable.push({ id: ttIdCounter++, day, startTime: times8_10[1].start, endTime: times8_10[1].end, subject: "SST", teacher: t8.SST, batch: "8th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times8_10[1].start, endTime: times8_10[1].end, subject: "Biology", teacher: tHigh.Biology, batch: "9th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times8_10[1].start, endTime: times8_10[1].end, subject: "Maths", teacher: tHigh.Maths, batch: "10th class", isExtraClass: false });
}

const sanitizeStudent = (student) => {
  const studentTests = tests.filter(t => t.batch === student.batch).map(t => {
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
    payments: student.payments || [],
    attendance: student.attendance,
    feesPending: (student.feesTotal || 0) - (student.feesPaid || 0),
    lastWhatsAppStatus: student.lastWhatsAppStatus || null,
    lastWhatsAppType: student.lastWhatsAppType || null,
    lastWhatsAppAt: student.lastWhatsAppAt || null,
    lastWhatsAppInfo: student.lastWhatsAppInfo || null,
    testResults: studentTests
  };
};

const getNextId = (items) => {
  if (items.length === 0) {
    return 1;
  }

  return Math.max(...items.map((item) => item.id)) + 1;
};

const parseId = (value) => Number.parseInt(value, 10);

const sortTimetable = (entries) =>
  [...entries].sort((a, b) => {
    const dayDifference = (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);

    if (dayDifference !== 0) {
      return dayDifference;
    }

    return a.startTime.localeCompare(b.startTime);
  });

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

const updateWhatsAppDeliveryOnStudent = (student, type, delivery, text) => {
  const event = {
    id: Date.now(),
    type,
    sent: Boolean(delivery.sent),
    info: delivery.message,
    at: new Date().toISOString(),
    text
  };

  student.whatsappEvents = student.whatsappEvents || [];
  student.whatsappEvents.unshift(event);
  if (student.whatsappEvents.length > 20) {
    student.whatsappEvents = student.whatsappEvents.slice(0, 20);
  }

  student.lastWhatsAppStatus = event.sent ? "sent" : "failed";
  student.lastWhatsAppType = type;
  student.lastWhatsAppAt = event.at;
  student.lastWhatsAppInfo = event.info;
};

const sendTemplatedStudentWhatsApp = async (student, type, template) => {
  const context = getStudentTemplateContext(student);
  const messageText = renderTemplate(template, context);
  const delivery = await sendWhatsAppText(student.phoneNumber, messageText);
  updateWhatsAppDeliveryOnStudent(student, type, delivery, messageText);

  return {
    delivery,
    messageText
  };
};

app.get("/", (req, res) => {
  res.json({
    message: "Gurukul Academy API is running."
  });
});

app.post("/login/admin", (req, res) => {
  const { username, password } = req.body;

  if (
    username === ADMIN_CREDENTIALS.username &&
    bcrypt.compareSync(password, ADMIN_CREDENTIALS.passwordHash)
  ) {
    const token = jwt.sign({ username: ADMIN_CREDENTIALS.username, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
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

app.post("/login/student", (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({
      message: "Name and password are required"
    });
  }

  const student = students.find(
    (item) => item.name.toLowerCase() === String(name).trim().toLowerCase()
  );

  if (!student || !bcrypt.compareSync(password, student.password)) {
    return res.status(401).json({
      message: "Invalid student credentials"
    });
  }

  const token = jwt.sign({ id: student.id, name: student.name, role: 'student' }, JWT_SECRET, { expiresIn: '1d' });

  return res.json({
    role: "student",
    message: "Student login successful",
    student: sanitizeStudent(student),
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

app.get("/students", (req, res) => {
  const response = students.map(sanitizeStudent);
  res.json(response);
});

app.get("/students/:id", (req, res) => {
  const studentId = parseId(req.params.id);
  const student = students.find((item) => item.id === studentId);

  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  return res.json(sanitizeStudent(student));
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

  const alreadyExists = students.some(
    (student) =>
      student.name.toLowerCase() === String(name).trim().toLowerCase()
  );

  const phoneAlreadyExists = students.some(
    (student) => student.phoneNumber === normalizedPhoneNumber
  );

  if (alreadyExists) {
    return res.status(409).json({
      message: "Student with this name already exists"
    });
  }

  if (phoneAlreadyExists) {
    return res.status(409).json({
      message: "Student with this phone number already exists"
    });
  }

  const newStudent = {
    id: getNextId(students),
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
  };

  students.push(newStudent);

  const { delivery } = await sendTemplatedStudentWhatsApp(
    newStudent,
    "welcome",
    whatsappTemplates.welcome
  );
  const message = delivery.sent
    ? "Student added successfully and welcome WhatsApp message sent."
    : "Student added successfully, but welcome WhatsApp message is pending.";

  return res.status(201).json({
    message,
    student: sanitizeStudent(newStudent),
    whatsapp: delivery
  });
});

app.post("/students/:id/whatsapp/fee-reminder", async (req, res) => {
  const studentId = parseId(req.params.id);
  const student = students.find((item) => item.id === studentId);

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

  return res.json({
    message: delivery.sent
      ? "Fee reminder WhatsApp message sent successfully"
      : "Fee reminder could not be delivered right now",
    whatsapp: delivery,
    preview: messageText,
    student: sanitizeStudent(student)
  });
});

app.delete("/students/:id", (req, res) => {
  const studentId = parseId(req.params.id);
  const studentIndex = students.findIndex((item) => item.id === studentId);

  if (studentIndex < 0) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  const [deletedStudent] = students.splice(studentIndex, 1);

  return res.json({
    message: "Student deleted successfully",
    student: sanitizeStudent(deletedStudent)
  });
});

app.post("/students/:id/pay", (req, res) => {
  const studentId = parseId(req.params.id);
  const { amount, mode } = req.body;

  if (!amount || amount <= 0 || !mode) {
    return res.status(400).json({
      message: "Valid amount and payment mode are required"
    });
  }

  const student = students.find((item) => item.id === studentId);
  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  const payment = {
    id: Date.now(),
    amount: Number(amount),
    mode: String(mode).trim(),
    date: new Date().toISOString().slice(0, 10)
  };

  student.payments = student.payments || [];
  student.payments.push(payment);
  student.feesPaid = (student.feesPaid || 0) + Number(amount);

  return res.json({
    message: "Payment processed successfully",
    student: sanitizeStudent(student),
    payment
  });
});

app.post("/attendance", (req, res) => {
  const { studentId, date, present, timetableId } = req.body;

  if (!studentId || !date || typeof present !== "boolean") {
    return res.status(400).json({
      message: "studentId, date and present(boolean) are required"
    });
  }

  const parsedStudentId = parseId(studentId);
  const student = students.find((item) => item.id === parsedStudentId);

  if (!student) {
    return res.status(404).json({
      message: "Student not found"
    });
  }

  // Find slot to know the subject context, or save the timetableId
  const slot = timetable.find((t) => t.id === Number(timetableId));
  const subjectName = slot ? slot.subject : "General";

  const existingEntry = student.attendance.find((entry) => entry.date === date && entry.subject === subjectName);
  if (existingEntry) {
    existingEntry.present = present;
  } else {
    student.attendance.push({ date, present, subject: subjectName, timetableId });
  }

  student.attendance.sort((a, b) => a.date.localeCompare(b.date));

  return res.json({
    message: "Attendance updated successfully",
    student: sanitizeStudent(student)
  });
});

app.get("/notices", (req, res) => {
  const { batch } = req.query;
  if (batch && batch !== "All" && typeof batch === "string") {
    const filtered = notices.filter(n => n.batch === "All" || n.batch === batch);
    return res.json(filtered);
  }
  res.json(notices);
});

app.post("/notices", (req, res) => {
  const { title, content, batch } = req.body;

  if (!title || !String(title).trim() || !content || !String(content).trim()) {
    return res.status(400).json({
      message: "Title and content are required"
    });
  }

  const notice = {
    id: getNextId(notices),
    title: String(title).trim(),
    content: String(content).trim(),
    batch: batch ? String(batch).trim() : "All",
    createdAt: new Date().toISOString().slice(0, 10)
  };

  notices = [notice, ...notices];

  return res.status(201).json({
    message: "Notice posted successfully",
    notice
  });
});

app.post("/notices/:id/whatsapp", async (req, res) => {
  const noticeId = parseId(req.params.id);
  const notice = notices.find(n => n.id === noticeId);

  if (!notice) {
    return res.status(404).json({ message: "Notice not found" });
  }

  const targetStudents = notice.batch === "All" 
    ? students 
    : students.filter(s => s.batch === notice.batch);

  const deliveries = [];

  for (const student of targetStudents) {
    if (!student.phoneNumber) continue;

    const context = getNoticeTemplateContext(student, notice);
    const messageText = renderTemplate(whatsappTemplates.notice, context);
    const delivery = await sendWhatsAppText(student.phoneNumber, messageText);

    updateWhatsAppDeliveryOnStudent(student, "notice", delivery, messageText);
    deliveries.push({ studentId: student.id, name: student.name, delivery });
  }

  return res.json({
    message: "Notice queued for WhatsApp broadcast",
    deliveries
  });
});

app.get("/timetable", (req, res) => {
  res.json(sortTimetable(timetable));
});

app.post("/timetable", (req, res) => {
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
  const duplicateSlot = timetable.find(
    (item) =>
      item.day === String(day).trim() &&
      item.batch === normalizedBatch &&
      item.startTime === normalizedStartTime &&
      item.endTime === normalizedEndTime
  );

  if (duplicateSlot) {
    return res.status(409).json({
      message: "A timetable slot already exists for this batch, day and time"
    });
  }

  const entry = {
    id: getNextId(timetable),
    day: String(day).trim(),
    startTime: normalizedStartTime,
    endTime: normalizedEndTime,
    subject: String(subject).trim(),
    teacher: String(teacher).trim(),
    batch: normalizedBatch,
    isExtraClass: Boolean(isExtraClass)
  };

  timetable.push(entry);
  timetable = sortTimetable(timetable);

  return res.status(201).json({
    message: "Timetable entry added successfully",
    timetable: entry
  });
});

app.delete("/timetable/:id", (req, res) => {
  const timetableId = parseId(req.params.id);
  const timetableIndex = timetable.findIndex((item) => item.id === timetableId);

  if (timetableIndex < 0) {
    return res.status(404).json({
      message: "Timetable entry not found"
    });
  }

  const [deletedEntry] = timetable.splice(timetableIndex, 1);

  return res.json({
    message: "Timetable entry deleted successfully",
    timetable: deletedEntry
  });
});

app.get("/tests", (req, res) => {
  res.json(tests);
});

app.post("/tests", (req, res) => {
  const { batch, subject, date, maxMarks, results } = req.body;

  if (!batch || !subject || !date || typeof maxMarks !== 'number' || !Array.isArray(results)) {
    return res.status(400).json({ message: "Invalid test data. Required: batch, subject, date, maxMarks, results array." });
  }

  const test = {
    id: getNextId(tests),
    batch: String(batch).trim(),
    subject: String(subject).trim(),
    date: String(date).trim(),
    maxMarks: maxMarks,
    results: results.map(r => ({
      studentId: parseId(r.studentId),
      marks: Number(r.marks || 0),
      isAbsent: Boolean(r.isAbsent)
    }))
  };

  tests.unshift(test);

  return res.status(201).json({
    message: "Test created successfully",
    test
  });
});

app.post("/tests/:id/whatsapp", async (req, res) => {
  const testId = parseId(req.params.id);
  const test = tests.find(t => t.id === testId);

  if (!test) {
    return res.status(404).json({ message: "Test not found" });
  }

  const deliveries = [];
  
  for (const result of test.results) {
    const student = students.find(s => s.id === result.studentId);
    if (!student || !student.phoneNumber) continue;

    const context = getTestTemplateContext(student, test, result);
    const messageText = renderTemplate(whatsappTemplates.testResult, context);
    const delivery = await sendWhatsAppText(student.phoneNumber, messageText);
    
    updateWhatsAppDeliveryOnStudent(student, "test-result", delivery, messageText);
    deliveries.push({ studentId: student.id, name: student.name, delivery });
  }

  return res.json({
    message: "Test results queued for WhatsApp broadcast",
    deliveries
  });
});

app.delete("/tests/:id", (req, res) => {
  const testId = parseId(req.params.id);
  const testIndex = tests.findIndex(t => t.id === testId);

  if (testIndex < 0) {
    return res.status(404).json({ message: "Test not found" });
  }

  const [deletedTest] = tests.splice(testIndex, 1);
  return res.json({ message: "Test deleted successfully", test: deletedTest });
});

// --- Serve Frontend ---
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${PORT}`);
});