require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require("path");
const bcrypt = require("bcryptjs");

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

let students = [];
let studentIdCounter = 1;

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
const times = [
  { start: "16:00", end: "17:00" },
  { start: "17:00", end: "18:00" },
  { start: "18:00", end: "19:00" }
];
// 8th class teachers
const t8 = { Maths: "Bhaki maam", Science: "Shubham sir", SST: "Mowade sir", English: "Mowade sir" };
// 9-12 teachers
const tHigh = { Maths: "Akash sir", Physics: "Akash sir", Chemistry: "Shubham sir", Biology: "Shubham sir" };

for (const day of classDays) {
  // 8th class
  timetable.push({ id: ttIdCounter++, day, startTime: times[0].start, endTime: times[0].end, subject: "Maths", teacher: t8.Maths, batch: "8th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times[1].start, endTime: times[1].end, subject: "Science", teacher: t8.Science, batch: "8th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times[2].start, endTime: times[2].end, subject: "SST", teacher: t8.SST, batch: "8th class", isExtraClass: false });

  // 9th class
  timetable.push({ id: ttIdCounter++, day, startTime: times[0].start, endTime: times[0].end, subject: "Physics", teacher: tHigh.Physics, batch: "9th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times[1].start, endTime: times[1].end, subject: "Chemistry", teacher: tHigh.Chemistry, batch: "9th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times[2].start, endTime: times[2].end, subject: "Maths", teacher: tHigh.Maths, batch: "9th class", isExtraClass: false });

  // 10th class
  timetable.push({ id: ttIdCounter++, day, startTime: times[0].start, endTime: times[0].end, subject: "Chemistry", teacher: tHigh.Chemistry, batch: "10th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times[1].start, endTime: times[1].end, subject: "Physics", teacher: tHigh.Physics, batch: "10th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times[2].start, endTime: times[2].end, subject: "Biology", teacher: tHigh.Biology, batch: "10th class", isExtraClass: false });

  // 11th class
  timetable.push({ id: ttIdCounter++, day, startTime: times[0].start, endTime: times[0].end, subject: "Biology", teacher: tHigh.Biology, batch: "11th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times[1].start, endTime: times[1].end, subject: "Maths", teacher: tHigh.Maths, batch: "11th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times[2].start, endTime: times[2].end, subject: "Chemistry", teacher: tHigh.Chemistry, batch: "11th class", isExtraClass: false });

  // 12th class
  timetable.push({ id: ttIdCounter++, day, startTime: times[0].start, endTime: times[0].end, subject: "Maths", teacher: tHigh.Maths, batch: "12th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times[1].start, endTime: times[1].end, subject: "Biology", teacher: tHigh.Biology, batch: "12th class", isExtraClass: false });
  timetable.push({ id: ttIdCounter++, day, startTime: times[2].start, endTime: times[2].end, subject: "Physics", teacher: tHigh.Physics, batch: "12th class", isExtraClass: false });
}

const sanitizeStudent = (student) => ({
  id: student.id,
  name: student.name,
  batch: student.batch || "N/A",
  subjects: student.subjects || [],
  feesTotal: student.feesTotal || 0,
  feesPaid: student.feesPaid || 0,
  payments: student.payments || [],
  attendance: student.attendance,
  feesPending: (student.feesTotal || 0) - (student.feesPaid || 0)
});

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

app.post("/students", (req, res) => {
  const { name, password, batch, subjects, feesTotal } = req.body;

  if (!name || !String(name).trim() || !password || !String(password).trim() || !batch || feesTotal == null) {
    return res.status(400).json({
      message: "Name, password, batch, and feesTotal are required"
    });
  }

  const alreadyExists = students.some(
    (student) =>
      student.name.toLowerCase() === String(name).trim().toLowerCase()
  );

  if (alreadyExists) {
    return res.status(409).json({
      message: "Student with this name already exists"
    });
  }

  const newStudent = {
    id: getNextId(students),
    name: String(name).trim(),
    password: bcrypt.hashSync(String(password).trim(), 10),
    batch: String(batch).trim(),
    subjects: Array.isArray(subjects) ? subjects : [],
    feesTotal: Number(feesTotal),
    feesPaid: 0,
    payments: [],
    attendance: []
  };

  students.push(newStudent);

  return res.status(201).json({
    message: "Student added successfully",
    student: sanitizeStudent(newStudent)
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
  res.json(notices);
});

app.post("/notices", (req, res) => {
  const { title, content } = req.body;

  if (!title || !String(title).trim() || !content || !String(content).trim()) {
    return res.status(400).json({
      message: "Title and content are required"
    });
  }

  const notice = {
    id: getNextId(notices),
    title: String(title).trim(),
    content: String(content).trim(),
    createdAt: new Date().toISOString().slice(0, 10)
  };

  notices = [notice, ...notices];

  return res.status(201).json({
    message: "Notice posted successfully",
    notice
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

// --- Serve Frontend ---
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on http://localhost:${PORT}`);
});