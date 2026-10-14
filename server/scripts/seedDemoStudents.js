const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Student = require("../models/Student");
const Subject = require("../models/Subject");

const ACADEMIC_YEAR = "2026-27";
const SECTION = "A";
const STUDENTS_PER_DEPARTMENT_YEAR = 10;
const departments = [
  { name: "CSE", code: "CS", emailCode: "cs" },
  { name: "ECE", code: "EC", emailCode: "ec" },
  { name: "EEE", code: "EE", emailCode: "ee" },
  { name: "ME", code: "ME", emailCode: "me" },
  { name: "CIVIL", code: "CV", emailCode: "cv" },
  { name: "AIML", code: "AI", emailCode: "ai" },
];

const cohortYears = [
  { year: 1, batch: 2026 },
  { year: 2, batch: 2025 },
  { year: 3, batch: 2024 },
  { year: 4, batch: 2023 },
];

const firstNames = [
  "Aarav", "Aditya", "Akash", "Ananya", "Arjun", "Asha",
  "Diya", "Ishaan", "Kavya", "Kiran", "Meera", "Mira",
  "Nikhil", "Nisha", "Priya", "Rahul", "Riya", "Rohan",
  "Saanvi", "Sameer", "Sneha", "Varun", "Vikram", "Zoya",
];
const lastNames = [
  "Sharma", "Patil", "Joshi", "Rao", "Kulkarni",
  "Desai", "Kumar", "Nair", "Mehta", "Pillai",
];

function buildStudentRecords() {
  const records = [];
  let globalIndex = 0;

  for (const department of departments) {
    for (const cohort of cohortYears) {
      for (let index = 1; index <= STUDENTS_PER_DEPARTMENT_YEAR; index += 1) {
        const sequence = String(index).padStart(3, "0");
        const shortBatch = String(cohort.batch).slice(-2);
        const registrationNumber = `2KA${shortBatch}${department.code}${sequence}`;
        const firstName = firstNames[globalIndex % firstNames.length];
        const lastName = lastNames[Math.floor(globalIndex / firstNames.length)];
        const name = `${firstName} ${lastName}`;

        records.push({
          name,
          email: `student.${department.emailCode}${shortBatch}.${sequence}@gmail.com`,
          registrationNumber,
          department: department.name,
          year: cohort.year,
          batch: String(cohort.batch),
          section: SECTION,
          fatherName: `Mr. ${lastName}`,
          studentMobileNumber: 9200000000 + globalIndex + 1,
          fatherMobileNumber: 9300000000 + globalIndex + 1,
          avatar: {
            public_id: `demo-student-${registrationNumber}`,
            url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0077b6&color=ffffff&size=150`,
          },
        });
        globalIndex += 1;
      }
    }
  }

  return records;
}

const expectedStudents = buildStudentRecords();

async function seedDemoStudents() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const subjectIdsByDepartmentYear = new Map();
  for (const department of departments) {
    for (const cohort of cohortYears) {
      const subjects = await Subject.find({
        department: department.name,
        year: String(cohort.year),
      }).distinct("_id");
      subjectIdsByDepartmentYear.set(
        `${department.name}:${cohort.year}`,
        subjects
      );
    }
  }

  let inserted = 0;
  let skipped = 0;
  const createdUsns = new Set();

  for (const record of expectedStudents) {
    const existing = await Student.findOne({
      $or: [
        { registrationNumber: record.registrationNumber },
        { email: record.email },
      ],
    }).select("_id").lean();

    if (existing) {
      skipped += 1;
      console.log(`SKIPPED: ${record.registrationNumber} (${record.email} already exists by USN or email)`);
      continue;
    }

    const password = await bcrypt.hash(record.registrationNumber, 10);
    const student = new Student({
      name: record.name,
      email: record.email,
      registrationNumber: record.registrationNumber,
      password,
      department: record.department,
      year: record.year,
      batch: record.batch,
      section: record.section,
      fatherName: record.fatherName,
      studentMobileNumber: record.studentMobileNumber,
      fatherMobileNumber: record.fatherMobileNumber,
      avatar: record.avatar,
      subjects: subjectIdsByDepartmentYear.get(`${record.department}:${record.year}`) || [],
    });

    try {
      await student.save();
      inserted += 1;
      createdUsns.add(record.registrationNumber);
      console.log(`CREATED: ${student.registrationNumber} | ${student.name} | ${student.department} | Year ${student.year} | Batch ${student.batch} | Section ${student.section}`);
    } catch (error) {
      if (error.code === 11000) {
        skipped += 1;
        console.log(`SKIPPED: ${record.registrationNumber} (duplicate USN or email detected during insert)`);
        continue;
      }
      throw error;
    }
  }

  const expectedUsns = expectedStudents.map((student) => student.registrationNumber);
  const finalStudents = await Student.find({
    registrationNumber: { $in: expectedUsns },
  }).select("name email registrationNumber department year batch section password").lean();
  const departmentCounts = Object.fromEntries(departments.map(({ name }) => [name, 0]));
  const yearCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const batchCounts = { 2026: 0, 2025: 0, 2024: 0, 2023: 0 };
  const usnSet = new Set();
  const emailSet = new Set();
  let sectionACount = 0;
  let sectionBCount = 0;
  let validUsnCount = 0;
  let matchingPasswordHashCount = 0;

  for (const student of finalStudents) {
    departmentCounts[student.department] = (departmentCounts[student.department] || 0) + 1;
    yearCounts[student.year] = (yearCounts[student.year] || 0) + 1;
    batchCounts[student.batch] = (batchCounts[student.batch] || 0) + 1;
    if (student.section === "A") sectionACount += 1;
    if (student.section === "B") sectionBCount += 1;
    if (usnSet.has(student.registrationNumber)) {
      console.error(`VALIDATION ERROR: duplicate USN ${student.registrationNumber}`);
    }
    if (emailSet.has(student.email)) {
      console.error(`VALIDATION ERROR: duplicate email ${student.email}`);
    }
    usnSet.add(student.registrationNumber);
    emailSet.add(student.email);

    const expected = expectedStudents.find(
      (record) => record.registrationNumber === student.registrationNumber
    );
    const expectedUsn = expected?.registrationNumber;
    const expectedBatch = expected?.batch;
    const expectedDepartment = departments.find(
      (department) => department.name === expected?.department
    );
    const usnMatch = /^2KA(26|25|24|23)(CS|EC|EE|ME|CV|AI)\d{3}$/.exec(student.registrationNumber);
    if (
      usnMatch &&
      usnMatch[1] === String(expectedBatch).slice(-2) &&
      usnMatch[2] === expectedDepartment?.code &&
      student.batch === expectedBatch &&
      student.year === expected?.year
    ) {
      validUsnCount += 1;
    }
    if (createdUsns.has(student.registrationNumber) && await bcrypt.compare(expectedUsn, student.password)) {
      matchingPasswordHashCount += 1;
    }
  }

  const duplicateUsns = finalStudents.length - usnSet.size;
  const duplicateEmails = finalStudents.length - emailSet.size;
  const totalCollectionCount = await Student.countDocuments();
  const report = {
    academicYear: ACADEMIC_YEAR,
    inserted,
    skipped,
    demoStudentsFound: finalStudents.length,
    totalStudentCollectionCount: totalCollectionCount,
    departments: departmentCounts,
    years: yearCounts,
    batches: batchCounts,
    sectionA: sectionACount,
    sectionB: sectionBCount,
    validUsnBatchPatterns: validUsnCount,
    duplicateUsns,
    duplicateEmails,
    newlyInsertedPasswordHashesMatchingUsn: matchingPasswordHashCount,
    initiallyHashedPasswordIsEachUsn: "New records only; existing records were not modified",
    semesterStorage: "No semester field exists; year 1-4 maps to semester pairs 1-2, 3-4, 5-6, 7-8",
  };

  console.log("\nDEMO STUDENT SEED COMPLETE");
  console.log(JSON.stringify(report, null, 2));
  console.log("\nYear / semester mapping:");
  console.log("Year 1: Semesters 1-2");
  console.log("Year 2: Semesters 3-4");
  console.log("Year 3: Semesters 5-6");
  console.log("Year 4: Semesters 7-8");
}

seedDemoStudents()
  .catch((error) => {
    console.error("Demo student seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
