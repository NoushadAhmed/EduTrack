require("dotenv").config({
  path: require("path").resolve(__dirname, "..", ".env"),
});

const mongoose = require("mongoose");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");

const ACADEMIC_YEAR = "2026-27";
const SECTION = "A";

function isValidExistingAssignment(faculty, assignment, subject) {
  return (
    String(assignment.subject) === String(subject._id) &&
    faculty.department === subject.department &&
    (!assignment.department || assignment.department === subject.department) &&
    assignment.subjectCode === subject.subjectCode &&
    Number(assignment.semester) === Number(subject.semester)
  );
}

async function assignExistingSubjects() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const [subjects, facultyRecords] = await Promise.all([
    Subject.find({})
      .select("_id department semester subjectCode subjectName subjectType year")
      .sort({ department: 1, semester: 1, subjectCode: 1, _id: 1 })
      .lean(),
    Faculty.find({})
      .select("_id name registrationNumber department subjectsCanTeach assignedSubjects")
      .sort({ department: 1, name: 1, _id: 1 }),
  ]);

  const subjectById = new Map(subjects.map((subject) => [String(subject._id), subject]));
  const alreadyAssigned = new Set();
  const validLoad = new Map(facultyRecords.map((faculty) => [String(faculty._id), 0]));

  for (const faculty of facultyRecords) {
    for (const assignment of faculty.assignedSubjects || []) {
      const subject = subjectById.get(String(assignment.subject));
      if (subject && isValidExistingAssignment(faculty, assignment, subject)) {
        alreadyAssigned.add(String(subject._id));
        validLoad.set(String(faculty._id), validLoad.get(String(faculty._id)) + 1);
      }
    }
  }

  const changes = new Map();
  const unassigned = [];
  let tieBreaker = 0;
  let assignmentsAdded = 0;

  for (const subject of subjects) {
    if (alreadyAssigned.has(String(subject._id))) continue;

    const eligible = facultyRecords.filter(
      (faculty) =>
        faculty.department === subject.department &&
        (faculty.subjectsCanTeach || []).includes(subject.subjectCode)
    );

    if (eligible.length === 0) {
      unassigned.push(subject);
      continue;
    }

    const minimumLoad = Math.min(...eligible.map((faculty) => validLoad.get(String(faculty._id))));
    const leastLoaded = eligible.filter(
      (faculty) => validLoad.get(String(faculty._id)) === minimumLoad
    );
    const faculty = leastLoaded[tieBreaker % leastLoaded.length];
    tieBreaker += 1;

    faculty.assignedSubjects.push({
      faculty: faculty._id,
      subject: subject._id,
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      subjectType: subject.subjectType || "",
      department: subject.department,
      semester: subject.semester,
      year: Math.ceil(Number(subject.semester) / 2),
      section: SECTION,
      academicYear: ACADEMIC_YEAR,
    });
    changes.set(String(faculty._id), faculty);
    validLoad.set(String(faculty._id), validLoad.get(String(faculty._id)) + 1);
    alreadyAssigned.add(String(subject._id));
    assignmentsAdded += 1;
  }

  if (unassigned.length > 0) {
    console.error("No suitable existing faculty for these subjects:");
    unassigned.forEach((subject) =>
      console.error(
        `${subject.department} | Semester ${subject.semester} | ${subject.subjectCode} | ${subject.subjectName}`
      )
    );
  }

  for (const faculty of changes.values()) {
    await faculty.save();
  }

  const finalFaculty = await Faculty.find({})
    .select("_id name registrationNumber department assignedSubjects")
    .lean();
  const finalAssignments = finalFaculty.flatMap((faculty) =>
    (faculty.assignedSubjects || []).flatMap((assignment) => {
      const subject = subjectById.get(String(assignment.subject));
      if (!subject || !isValidExistingAssignment(faculty, assignment, subject)) return [];
      return [{
        subjectId: String(subject._id),
        department: subject.department,
        semester: subject.semester,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        teacher: faculty.name,
        registrationNumber: faculty.registrationNumber,
      }];
    })
  );
  const finalCovered = new Set(finalAssignments.map((assignment) => assignment.subjectId));
  const remaining = subjects.filter((subject) =>
    !finalCovered.has(String(subject._id))
  );

  console.log(JSON.stringify({
    subjects: subjects.length,
    faculty: facultyRecords.length,
    assignmentsAdded,
    subjectsWithAssignments: finalCovered.size,
    assignmentRecords: finalAssignments.length,
    remainingUnassigned: remaining.map((subject) => ({
      department: subject.department,
      semester: subject.semester,
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
    })),
    distributionByTeacher: finalFaculty
      .map((faculty) => ({
        teacher: faculty.name,
        department: faculty.department,
        assignedSubjects: (faculty.assignedSubjects || []).filter((assignment) =>
          subjectById.has(String(assignment.subject)) &&
          isValidExistingAssignment(
            faculty,
            assignment,
            subjectById.get(String(assignment.subject))
          )
        ).length,
      }))
      .filter((faculty) => faculty.assignedSubjects > 0),
  }, null, 2));

  if (remaining.length > 0) process.exitCode = 2;
}

assignExistingSubjects()
  .catch((error) => {
    console.error("Subject assignment failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
