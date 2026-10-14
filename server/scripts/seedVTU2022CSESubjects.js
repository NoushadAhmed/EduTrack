const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Mark = require("../models/Marks");
const Timetable = require("../models/Timetable");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const DEPARTMENT = "CSE";
const SCHEME = "2022";
const ACADEMIC_YEAR = "2026-2027";
const dryRun = process.argv.includes("--dry-run");

const selectedBySemester = [
  {
    semester: 1,
    subjects: [
      ["BMATS101", "Mathematics-I for CSE Stream", "Core / Mandatory"],
      ["BPHYS102", "Applied Physics for CSE Stream", "Core / Mandatory"],
      ["BPOPS103", "Principles of Programming Using C", "Core / Mandatory"],
      ["BESCK104E", "Introduction to C Programming", "Engineering Science Course"],
      ["BETCK105I", "Introduction to Cyber Security", "Emerging Technology Course"],
      ["BPLCK105B", "Introduction to Python Programming", "Programming Course"],
    ],
  },
  {
    semester: 2,
    subjects: [
      ["BMATS201", "Mathematics-II for CSE Stream", "Core / Mandatory"],
      ["BCHES202", "Applied Chemistry for CSE Stream", "Core / Mandatory"],
      ["BCEDK203", "Computer-Aided Engineering Drawing", "Core / Mandatory"],
      ["BESCK204A", "Engineering Science Course-II", "Engineering Science Course"],
      ["BPLCK205B", "Introduction to Python Programming", "Programming Course"],
      ["BETCK205A", "Emerging Technology Course-II option", "Emerging Technology Course"],
    ],
  },
  {
    semester: 3,
    subjects: [
      ["BCS301", "Mathematics for Computer Science", "Core / Mandatory"],
      ["BCS302", "Digital Design & Computer Organization", "Core / Mandatory"],
      ["BCS303", "Operating Systems", "Core / Mandatory"],
      ["BCS304", "Data Structures and Applications", "Core / Mandatory"],
      ["BCSL305", "Data Structures Lab", "Laboratory"],
      ["BCS306A", "Object Oriented Programming with Java", "Professional Elective"],
    ],
  },
  {
    semester: 4,
    subjects: [
      ["BCS401", "Analysis & Design of Algorithms", "Core / Mandatory"],
      ["BCS402", "Microcontrollers", "Core / Mandatory"],
      ["BCS403", "Database Management Systems", "Core / Mandatory"],
      ["BCSL404", "Analysis & Design of Algorithms Lab", "Laboratory"],
      ["BBOC407", "Biology for Computer Engineers", "Core / Mandatory"],
      ["BUHK408", "Universal Human Value Course", "Core / Mandatory"],
    ],
  },
  {
    semester: 5,
    subjects: [
      ["BCS501", "Software Engineering & Project Management", "Core / Mandatory"],
      ["BCS502", "Computer Networks", "Core / Mandatory"],
      ["BCS503", "Theory of Computation", "Core / Mandatory"],
      ["BCSL504", "Web Technology Lab", "Laboratory"],
      ["BCS515B", "Artificial Intelligence", "Professional Elective"],
      ["BCS586", "Mini Project", "Project"],
    ],
  },
  {
    semester: 6,
    subjects: [
      ["BCS601", "Cloud Computing", "Core / Mandatory"],
      ["BCS602", "Machine Learning", "Core / Mandatory"],
      ["BCS613C", "Compiler Design", "Professional Elective"],
      ["BCS654A", "Introduction to Data Structures", "Open Elective"],
      ["BCS685", "Project Phase I", "Project"],
      ["BCSL606", "Machine Learning Lab", "Laboratory"],
    ],
  },
  {
    semester: 7,
    subjects: [
      ["BCS701", "Internet of Things", "Core / Mandatory"],
      ["BCS702", "Parallel Computing", "Core / Mandatory"],
      ["BCS703", "Cryptography & Network Security", "Core / Mandatory"],
      ["BCS714A", "Deep Learning", "Professional Elective"],
      ["BCS755A", "Introduction to DBMS", "Open Elective"],
      ["BCS786", "Major Project Phase-II", "Project"],
    ],
  },
  {
    semester: 8,
    subjects: [
      ["BCS801x", "Professional Elective Course – Online Course", "Online Professional Elective Category"],
      ["BCS802x", "Open Elective Course – Online Course", "Online Open Elective Category"],
      ["BCS803", "Internship (Industry/Research)", "Internship"],
      ["LOCAL-CSE-S8-ONLINE-01", "Circuit Complexity Theory", "VTU Online Course"],
      ["LOCAL-CSE-S8-ONLINE-02", "Computational Number Theory and Algebra", "VTU Online Course"],
      ["LOCAL-CSE-S8-ONLINE-03", "Parallel Computer Architecture", "VTU Online Course"],
    ],
  },
];

const previousSeedCodesBySemester = {
  1: [
    "BMATS101", "BPHYS102", "BPOPS103", "BESCK104A", "BESCK104B",
    "BESCK104C", "BESCK104D", "BESCK104E", "BETCK105A", "BETCK105B",
    "BETCK105C", "BETCK105D", "BETCK105E", "BETCK105F", "BETCK105G",
    "BETCK105H", "BETCK105I", "BETCK105J", "BPLCK105A", "BPLCK105B",
    "BPLCK105C", "BPLCK105D", "BENGK106", "BPWSK106", "BKSKK107",
    "BKBKK107", "BICOK107", "BIDTK158", "BSFHK158",
  ],
  2: [
    "BMATS201", "BCHES202", "BCEDK203", "BESCK204A", "BPLCK205A",
    "BPLCK205B", "BPLCK205C", "BPLCK205D", "BETCK205A", "BPWSK206",
    "BENGK206", "BICOK207", "BKSKK207", "BKBKK207", "BSFHK258",
    "BIDTK258",
  ],
  3: [
    "BCS301", "BCS302", "BCS303", "BCS304", "BCSL305", "BCS306A",
    "BCS306B", "BSCK307", "BCSL358A", "BCSL358B", "BCSL358C",
    "BCSL358D", "BNSK359", "BPEK359", "BYOK359",
  ],
  4: [
    "BCS401", "BCS402", "BCS403", "BCSL404", "BCS405A", "BCS405B",
    "BCS405C", "BCS405D", "BCS456A", "BCS456B", "BCS456C",
    "BCSL456D", "BBOC407", "BUHK408", "BNSK459", "BPEK459", "BYOK459",
  ],
  5: [
    "BCS501", "BCS502", "BCS503", "BCSL504", "BCS515A", "BCS515B",
    "BCS515C", "BCS515D", "BCS586", "BRMK557", "BCS508", "BNSK559",
    "BPEK559", "BYOK559",
  ],
  6: [
    "BCS601", "BCS602", "BCS613A", "BCS613B", "BCS613C", "BCS613D",
    "BCS654A", "BCS654B", "BIS654C", "BAI654D", "BCS685", "BCSL606",
    "BISL657A", "BCSL657B", "BAIL657C", "BCSL657D", "BNSK658",
    "BPEK658", "BYOK658", "BIKS609",
  ],
  7: [
    "BCS701", "BCS702", "BCS703", "BCS714A", "BCS714B", "BCS714D",
    "BAD714D", "BCS755A", "BCS755B", "BCS755C", "BCS786",
  ],
  8: ["BCS801x", "BCS802x", "BCS803"],
};

const finalSubjects = selectedBySemester.flatMap(({ semester, subjects }) =>
  subjects.map(([subjectCode, subjectName, subjectType]) => ({
    department: DEPARTMENT,
    subjectCode,
    subjectName,
    totalLectures: 30,
    year: String(Math.ceil(semester / 2)),
    scheme: SCHEME,
    semester,
    academicYear: ACADEMIC_YEAR,
    subjectType,
    ...(semester === 3 && subjectCode === "BCS306A"
      ? { electiveGroup: "Object Oriented Programming Course (BCS306)" }
      : semester === 5 && subjectCode === "BCS515B"
        ? { electiveGroup: "Professional Elective Course (BCS515)" }
        : semester === 6 && subjectCode === "BCS613C"
          ? { electiveGroup: "Professional Elective Course (BCS613)" }
          : semester === 6 && subjectCode === "BCS654A"
            ? { electiveGroup: "Open Elective Course (BCS654)" }
            : semester === 7 && subjectCode === "BCS714A"
              ? { electiveGroup: "Professional Elective Course (BCS714)" }
              : semester === 7 && subjectCode === "BCS755A"
                ? { electiveGroup: "Open Elective Course (BCS755)" }
                : undefined),
  }))
);

const keyOf = ({ semester, subjectCode }) => `${semester}:${subjectCode}`;
const expectedPreviousCounts = [29, 16, 15, 17, 14, 20, 11, 3];

async function ensureNoReferences(subjectIds, session) {
  if (subjectIds.length === 0) return;

  const [students, attendance, marks, timetables] = await Promise.all([
    Student.countDocuments({ subjects: { $in: subjectIds } }).session(session),
    Attendance.countDocuments({ subject: { $in: subjectIds } }).session(session),
    Mark.countDocuments({ subject: { $in: subjectIds } }).session(session),
    Timetable.countDocuments({ subject: { $in: subjectIds } }).session(session),
  ]);

  if (students + attendance + marks + timetables > 0) {
    throw new Error(
      `Refusing cleanup: unwanted subject records are referenced (students=${students}, attendance=${attendance}, marks=${marks}, timetables=${timetables}).`
    );
  }
}

async function seedSubjects() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured in server/.env");
  }

  const finalKeys = new Set(finalSubjects.map(keyOf));
  if (finalSubjects.length !== 48 || finalKeys.size !== 48) {
    throw new Error("The selected list must contain exactly 48 unique semester/course-code records.");
  }
  if (selectedBySemester.length !== 8 || selectedBySemester.some(({ subjects }) => subjects.length !== 6)) {
    throw new Error("Each semester must contain exactly six selected subjects.");
  }

  const previousKeys = new Set(
    Object.entries(previousSeedCodesBySemester).flatMap(([semester, codes]) =>
      codes.map((subjectCode) => `${semester}:${subjectCode}`)
    )
  );
  const allowedKeys = new Set([...previousKeys, ...finalKeys]);
  let session;

  let inserted = 0;
  let updated = 0;
  let alreadyCorrect = 0;
  let deleted = 0;
  let finalCounts = [];
  let duplicateCount = 0;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      inserted = 0;
      updated = 0;
      alreadyCorrect = 0;
      deleted = 0;
      finalCounts = [];
      duplicateCount = 0;

      const current = await Subject.find({
        department: DEPARTMENT,
        scheme: SCHEME,
      }).session(session);

      if (current.length !== 125 && current.length !== 48) {
        throw new Error(
          `Expected either the previous 125 seeded records or the final 48, found ${current.length}; no changes made.`
        );
      }

      const currentKeys = new Set();
      for (const subject of current) {
        const key = keyOf(subject);
        if (
          !allowedKeys.has(key) ||
          subject.academicYear !== ACADEMIC_YEAR
        ) {
          throw new Error(
            `Found a CSE 2022 record outside the known seed data (${subject.subjectCode}, semester ${subject.semester}); no changes made.`
          );
        }
        if (currentKeys.has(key)) {
          throw new Error(`Duplicate CSE 2022 subject key ${key}; no changes made.`);
        }
        currentKeys.add(key);
      }

      if (current.length === 125) {
        const counts = Array.from({ length: 8 }, (_, index) =>
          current.filter((subject) => Number(subject.semester) === index + 1).length
        );
        if (counts.some((count, index) => count !== expectedPreviousCounts[index])) {
          throw new Error("The existing CSE 2022 semester counts do not match the previous seed; no changes made.");
        }
        if (current.some((subject) => !previousKeys.has(keyOf(subject)))) {
          throw new Error("The database contains a CSE 2022 record not created by the previous seed; no changes made.");
        }
      }

      const selectedKeySet = new Set(finalSubjects.map(keyOf));
      const unwanted = current.filter((subject) => !selectedKeySet.has(keyOf(subject)));
      await ensureNoReferences(unwanted.map(({ _id }) => _id), session);

      const existingByKey = new Map(current.map((subject) => [keyOf(subject), subject]));
      const operations = [];
      for (const subject of finalSubjects) {
        const existing = existingByKey.get(keyOf(subject));
        if (!existing) {
          operations.push({
            insertOne: { document: subject },
          });
          inserted += 1;
          continue;
        }

        const hasChanges =
          Object.keys(subject).some(
            (field) => String(existing[field] ?? "") !== String(subject[field] ?? "")
          ) ||
          Boolean(existing.electiveGroup && !subject.electiveGroup);

        if (!hasChanges) {
          alreadyCorrect += 1;
          continue;
        }

        const update = { $set: subject };
        if (existing.electiveGroup && !subject.electiveGroup) {
          update.$unset = { electiveGroup: "" };
        }
        operations.push({
          updateOne: {
            filter: { _id: existing._id },
            update,
          },
        });
        updated += 1;
      }

      if (!dryRun && operations.length > 0) {
        await Subject.bulkWrite(operations, { session, ordered: true });
      }

      if (!dryRun && unwanted.length > 0) {
        const result = await Subject.deleteMany(
          { _id: { $in: unwanted.map(({ _id }) => _id) } },
          { session }
        );
        deleted = result.deletedCount;
      }

      if (dryRun) {
        finalCounts = selectedBySemester.map(({ semester, subjects }) => ({
          semester,
          count: subjects.length,
        }));
        duplicateCount = finalSubjects.length - finalKeys.size;
        deleted = unwanted.length;
      } else {
        const finalRecords = await Subject.find({
          department: DEPARTMENT,
          scheme: SCHEME,
        }).session(session).lean();
        finalCounts = Array.from({ length: 8 }, (_, index) => ({
          semester: index + 1,
          count: finalRecords.filter((subject) => Number(subject.semester) === index + 1).length,
        }));

        const duplicates = await Subject.aggregate([
          { $match: { department: DEPARTMENT, scheme: SCHEME } },
          {
            $group: {
              _id: {
                department: "$department",
                scheme: "$scheme",
                semester: "$semester",
                subjectCode: "$subjectCode",
              },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
        ]).session(session);
        duplicateCount = duplicates.length;
      }

      if (
        finalCounts.reduce((sum, item) => sum + item.count, 0) !== 48 ||
        finalCounts.some(({ count }) => count !== 6) ||
        duplicateCount !== 0
      ) {
        throw new Error("Final 48-subject count or uniqueness verification failed; transaction rolled back.");
      }
    });

    console.log("VTU 2022 CSE Selected Subject Seed");
    console.log("----------------------------------");
    console.log(`Mode: ${dryRun ? "dry run (no database changes)" : "applied"}`);
    console.log(`Deleted unwanted previous-seed subjects: ${deleted}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Existing selected subjects: ${updated + alreadyCorrect}`);
    console.log(`Updated: ${updated}`);
    console.log(`Already correct: ${alreadyCorrect}`);
    console.log(`Total final records: ${finalCounts.reduce((sum, item) => sum + item.count, 0)}`);
    finalCounts.forEach(({ semester, count }) =>
      console.log(`Semester ${semester}: ${count}`)
    );
    console.log(`Duplicate keys: ${duplicateCount}`);
    console.log("Official VTU course names without VTU codes use clearly marked LOCAL-CSE-S8-ONLINE-* identifiers.");
    console.log("All other CSE, department, attendance, marks, timetable, student, and faculty records were left untouched.");
  } finally {
    if (session) await session.endSession();
    await mongoose.disconnect();
  }
}

seedSubjects().catch((error) => {
  console.error(`Selected CSE subject seed failed: ${error.message}`);
  process.exitCode = 1;
});
