const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");

const DEMO_PASSWORD = "Faculty@123";
const departments = {
  CSE: [
    ["Dr. Rahul Sharma", "rahul.sharma.cse@gmail.com"],
    ["Prof. Priya Patil", "priya.patil.cse@gmail.com"],
    ["Dr. Arjun Kumar", "arjun.kumar.cse@gmail.com"],
    ["Prof. Sneha Kulkarni", "sneha.kulkarni.cse@gmail.com"],
    ["Dr. Vivek Rao", "vivek.rao.cse@gmail.com"],
  ],
  ECE: [
    ["Dr. Ananya Joshi", "ananya.joshi.ece@gmail.com"],
    ["Prof. Kiran Desai", "kiran.desai.ece@gmail.com"],
    ["Dr. Rohan Patil", "rohan.patil.ece@gmail.com"],
    ["Prof. Neha Kulkarni", "neha.kulkarni.ece@gmail.com"],
    ["Dr. Suresh Rao", "suresh.rao.ece@gmail.com"],
  ],
  EEE: [
    ["Dr. Amit Deshmukh", "amit.deshmukh.eee@gmail.com"],
    ["Prof. Kavya Patil", "kavya.patil.eee@gmail.com"],
    ["Dr. Nikhil Joshi", "nikhil.joshi.eee@gmail.com"],
    ["Prof. Pooja Kulkarni", "pooja.kulkarni.eee@gmail.com"],
    ["Dr. Mahesh Rao", "mahesh.rao.eee@gmail.com"],
  ],
  ME: [
    ["Dr. Akshay Patil", "akshay.patil.me@gmail.com"],
    ["Prof. Snehal Joshi", "snehal.joshi.me@gmail.com"],
    ["Dr. Rohit Deshmukh", "rohit.deshmukh.me@gmail.com"],
    ["Prof. Meena Kulkarni", "meena.kulkarni.me@gmail.com"],
    ["Dr. Prakash Rao", "prakash.rao.me@gmail.com"],
  ],
  CIVIL: [
    ["Dr. Manoj Patil", "manoj.patil.civil@gmail.com"],
    ["Prof. Asha Joshi", "asha.joshi.civil@gmail.com"],
    ["Dr. Santosh Deshmukh", "santosh.deshmukh.civil@gmail.com"],
    ["Prof. Divya Kulkarni", "divya.kulkarni.civil@gmail.com"],
    ["Dr. Rajesh Rao", "rajesh.rao.civil@gmail.com"],
  ],
  AIML: [
    ["Dr. Aditya Sharma", "aditya.sharma.aiml@gmail.com"],
    ["Prof. Neha Patil", "neha.patil.aiml@gmail.com"],
    ["Dr. Varun Joshi", "varun.joshi.aiml@gmail.com"],
    ["Prof. Riya Kulkarni", "riya.kulkarni.aiml@gmail.com"],
    ["Dr. Sameer Rao", "sameer.rao.aiml@gmail.com"],
  ],
};

const designations = [
  "Assistant Professor",
  "Associate Professor",
  "Professor",
  "Assistant Professor",
  "Associate Professor",
];
const joiningYears = [2022, 2023, 2024, 2025, 2026];
const loginIds = Object.fromEntries(
  Object.keys(departments).map((department) => [
    department,
    departments[department].map(
      (_, index) => `FAC2026${department}${String(index + 1).padStart(3, "0")}`
    ),
  ])
);

async function seedDemoFaculty() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const createdByDepartment = Object.fromEntries(
    Object.keys(departments).map((department) => [department, 0])
  );
  let totalInserted = 0;

  for (const [department, people] of Object.entries(departments)) {
    const subjects = await Subject.find({ department }).select("subjectCode").lean();
    const subjectCodes = subjects.map((subject) => subject.subjectCode);

    for (let index = 0; index < people.length; index += 1) {
      const [name, email] = people[index];
      const registrationNumber = loginIds[department][index];
      const existing = await Faculty.findOne({
        $or: [{ registrationNumber }, { email }],
      }).select("_id").lean();

      if (existing) {
        console.log(`SKIPPED: ${registrationNumber} or ${email} already exists`);
        continue;
      }

      const faculty = new Faculty({
        name,
        email,
        avatar: {
          public_id: `demo-faculty-${registrationNumber}`,
          url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0077b6&color=ffffff&size=150`,
        },
        password,
        registrationNumber,
        designation: designations[index],
        department,
        facultyMobileNumber: 9100000000 + Object.keys(departments).indexOf(department) * 100 + index + 1,
        joiningYear: joiningYears[index],
        subjectsCanTeach: subjectCodes,
      });

      try {
        await faculty.save();
      } catch (error) {
        if (error.code === 11000) {
          console.log(`SKIPPED: ${registrationNumber} or ${email} already exists`);
          continue;
        }
        throw error;
      }

      createdByDepartment[department] += 1;
      totalInserted += 1;
      console.log(`CREATED:\n${name}\n${registrationNumber}\n${department}\n${email}`);
    }
  }

  console.log("====================================");
  console.log("DEMO FACULTY SEED COMPLETE");
  console.log("====================================");
  for (const department of Object.keys(departments)) {
    console.log(`${department}: ${createdByDepartment[department]}`);
  }
  console.log(`TOTAL INSERTED: ${totalInserted}`);
  console.log(`TOTAL FACULTY COLLECTION COUNT: ${await Faculty.countDocuments()}`);
  console.log("\nLOGIN LIST:");
  for (const [department, ids] of Object.entries(loginIds)) {
    console.log(`\n${department}`);
    ids.forEach((id) => console.log(id));
  }
  console.log(`\nDemo Password for all:\n${DEMO_PASSWORD}`);
}

seedDemoFaculty()
  .catch((error) => {
    console.error("Demo faculty seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
