require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./db");

const Counter = require("./models/Counter");
const Student = require("./models/Student");
const Notice = require("./models/Notice");
const Timetable = require("./models/Timetable");
const Test = require("./models/Test");
const Admin = require("./models/Admin");

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

async function seed() {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    Student.deleteMany({}),
    Notice.deleteMany({}),
    Timetable.deleteMany({}),
    Test.deleteMany({}),
    Admin.deleteMany({}),
    Counter.deleteMany({})
  ]);

  // --- Seed Admin ---
  console.log("Seeding admin...");
  await Admin.create({
    username: "admin",
    passwordHash: bcrypt.hashSync("admin123", 10)
  });

  // --- Seed Students ---
  console.log("Seeding students...");
  let studentIdCounter = 1;
  const studentDocs = [];

  for (const batch of batchesList) {
    for (let i = 1; i <= 10; i++) {
      const feesTotal = batch === "8th class" ? 10000 : batch === "9th class" ? 12000 : batch === "10th class" ? 15000 : batch === "11th class" ? 20000 : 25000;
      const feesPaid = i % 2 === 0 ? feesTotal : (i % 3 === 0 ? feesTotal / 2 : 0);
      const payments = [];
      if (feesPaid > 0) {
        payments.push({ paymentId: Date.now() + i, amount: feesPaid, mode: "Cash", date: "2026-04-01" });
      }

      const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

      studentDocs.push({
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
          { date: "2026-04-01", present: i % 4 !== 0, subject: "General" },
          { date: "2026-04-02", present: true, subject: "General" }
        ]
      });
      studentIdCounter++;
    }
  }

  await Student.insertMany(studentDocs);

  // Set student counter
  await Counter.findByIdAndUpdate("students", { seq: studentIdCounter - 1 }, { upsert: true });

  // --- Seed Notices ---
  console.log("Seeding notices...");
  await Notice.create({
    id: 1,
    title: "Welcome",
    content: "New batch starts from 10 April. Bring notebooks and ID card.",
    batch: "All",
    createdAt: "2026-04-03"
  });
  await Counter.findByIdAndUpdate("notices", { seq: 1 }, { upsert: true });

  // --- Seed Timetable ---
  console.log("Seeding timetable...");
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
  const t8 = { Maths: "Bhaki maam", Science: "Shubham sir", SST: "Mowade sir", English: "Mowade sir" };
  const tHigh = { Maths: "Akash sir", Physics: "Akash sir", Chemistry: "Shubham sir", Biology: "Shubham sir" };

  const timetableDocs = [];

  for (const day of classDays) {
    timetableDocs.push({ id: ttIdCounter++, day, startTime: times11_12[0].start, endTime: times11_12[0].end, subject: "Maths", teacher: tHigh.Maths, batch: "11th class", isExtraClass: false });
    timetableDocs.push({ id: ttIdCounter++, day, startTime: times11_12[0].start, endTime: times11_12[0].end, subject: "Biology", teacher: tHigh.Biology, batch: "12th class", isExtraClass: false });
    timetableDocs.push({ id: ttIdCounter++, day, startTime: times11_12[1].start, endTime: times11_12[1].end, subject: "Chemistry", teacher: tHigh.Chemistry, batch: "11th class", isExtraClass: false });
    timetableDocs.push({ id: ttIdCounter++, day, startTime: times11_12[1].start, endTime: times11_12[1].end, subject: "Physics", teacher: tHigh.Physics, batch: "12th class", isExtraClass: false });
    timetableDocs.push({ id: ttIdCounter++, day, startTime: times8_10[0].start, endTime: times8_10[0].end, subject: "Maths", teacher: t8.Maths, batch: "8th class", isExtraClass: false });
    timetableDocs.push({ id: ttIdCounter++, day, startTime: times8_10[0].start, endTime: times8_10[0].end, subject: "Physics", teacher: tHigh.Physics, batch: "9th class", isExtraClass: false });
    timetableDocs.push({ id: ttIdCounter++, day, startTime: times8_10[0].start, endTime: times8_10[0].end, subject: "Chemistry", teacher: tHigh.Chemistry, batch: "10th class", isExtraClass: false });
    timetableDocs.push({ id: ttIdCounter++, day, startTime: times8_10[1].start, endTime: times8_10[1].end, subject: "SST", teacher: t8.SST, batch: "8th class", isExtraClass: false });
    timetableDocs.push({ id: ttIdCounter++, day, startTime: times8_10[1].start, endTime: times8_10[1].end, subject: "Biology", teacher: tHigh.Biology, batch: "9th class", isExtraClass: false });
    timetableDocs.push({ id: ttIdCounter++, day, startTime: times8_10[1].start, endTime: times8_10[1].end, subject: "Maths", teacher: tHigh.Maths, batch: "10th class", isExtraClass: false });
  }

  await Timetable.insertMany(timetableDocs);
  await Counter.findByIdAndUpdate("timetable", { seq: ttIdCounter - 1 }, { upsert: true });

  console.log(`\nSeed complete!`);
  console.log(`  - Admin: username=admin, password=admin123`);
  console.log(`  - Students: ${studentDocs.length} seeded (password: password123)`);
  console.log(`  - Notices: 1 seeded`);
  console.log(`  - Timetable: ${timetableDocs.length} entries seeded`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
