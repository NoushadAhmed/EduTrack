const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Validator = require("validator");

const {
  DEPARTMENT_CODES,
  DEPARTMENTS,
  YEARS,
  SECTIONS,
} = require("../config/adminOptions");

// Utils
const sendEmail = require("../utils/nodemailer");
const bufferConversion = require("../utils/bufferConversion");
const cloudinary = require("../utils/cloudinary");
const validateAvatarDataUri = require("../utils/validateAvatarDataUri");
const { getSubjectFacultyMap } = require("../services/subjectFaculty");

const keys = require("../config/key");

// Validation
const validateFacultyLoginInput = require("../validation/facultyLogin");
const validateFacultyRegisterInput = require("../validation/facultyRegister");
const validateFetchStudentsInput = require("../validation/facultyFetchStudent");
const validateFacultyUpdatePassword = require("../validation/facultyUpdatePassword");
const validateForgotPassword = require("../validation/forgotPassword");
const validateOTP = require("../validation/otpValidation");
const validateFacultyUploadMarks = require("../validation/facultyUploadMarks");

// Models
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Faculty = require("../models/Faculty");
const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");
const Mark = require("../models/Marks");
const Timetable = require("../models/Timetable");
const { ASSESSMENTS } = require("../config/vtu2022Assessment");
const { buildCourseResult, getAttendancePercentages } = require("../services/marksResults");

const isNumericValue = (value) =>
  (typeof value === "number" ||
    (typeof value === "string" && value.trim() !== "")) &&
  Number.isFinite(Number(value));

const isCompleteAttendance = (records, expectedStudentIds) => {
  if (!Array.isArray(records) || !expectedStudentIds?.length || records.length !== expectedStudentIds.length) return false;
  const expected = new Set(expectedStudentIds.map(String));
  const seen = new Set();
  return records.every((record) => {
    const studentId = String(record.student?._id || record.student || "");
    if (!expected.has(studentId) || seen.has(studentId) || !["Present", "Absent"].includes(record.status)) return false;
    seen.add(studentId);
    return true;
  }) && seen.size === expected.size;
};

const localDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const isCanonicalDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

const getFacultyMarksContext = async (facultyId, assignmentId) => {
  const faculty = await Faculty.findById(facultyId)
    .select("_id department assignedSubjects")
    .exec();
  if (!faculty) return { error: "Faculty access required", status: 403 };
  if (!mongoose.isValidObjectId(assignmentId)) {
    return { error: "Assigned subject not found", status: 404 };
  }

  const assignment = faculty.assignedSubjects.id(assignmentId);
  if (!assignment ||
      assignment.isActive === false ||
      (assignment.faculty && String(assignment.faculty) !== String(faculty._id)) ||
      (assignment.department && assignment.department !== faculty.department)) {
    return { error: "You are not assigned to this subject", status: 403 };
  }

  const semester = Number(assignment.semester);
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
    return { error: "Assigned subject has an invalid semester", status: 400 };
  }
  // Student records store academic year as a number; derive it from the
  // assigned subject's semester so stale/missing assignment year metadata
  // cannot select the wrong class.
  const year = Math.ceil(semester / 2);
  const section = assignment.section || "A";
  if (!YEARS.includes(String(year)) || !SECTIONS.includes(section)) {
    return { error: "Assigned subject has an invalid year or section", status: 400 };
  }

  const subject = await Subject.findOne({
    _id: assignment.subject,
    department: faculty.department,
    semester,
    subjectCode: assignment.subjectCode,
  }).select("_id subjectCode subjectName department semester").lean();
  if (!subject) return { error: "Assigned subject is not available", status: 404 };

  const students = await Student.find({ department: faculty.department, year, section })
    .select("_id registrationNumber name")
    .sort({ registrationNumber: 1 })
    .lean();
  return {
    faculty,
    assignment,
    subject,
    semester,
    year,
    section,
    academicYear: assignment.academicYear || "2026-27",
    students,
  };
};

/* =========================================================
   FACULTY REGISTRATION NUMBER GENERATOR
   Format:
   FAC + YYYY + Department Code + 3 digit sequence

   Example:
   FAC202601001
========================================================= */
const getFacultyRegistrationNumber = async (
  department,
  joiningYear
) => {
  const departmentCode = DEPARTMENT_CODES[department];

  if (!departmentCode) {
    throw new Error("Invalid department");
  }

  const yearCode = String(joiningYear);

  const lastFaculty = await Faculty.findOne({
    department,
    registrationNumber: {
      $regex: `^FAC${yearCode}${departmentCode}`,
    },
  }).sort({
    registrationNumber: -1,
  });

  let sequence = 0;

  if (lastFaculty && lastFaculty.registrationNumber) {
    const match =
      lastFaculty.registrationNumber.match(/(\d{3})$/);

    if (match) {
      sequence = Number(match[1]) + 1;
    }
  }

  return `FAC${yearCode}${departmentCode}${String(
    sequence
  ).padStart(3, "0")}`;
};

/* =========================================================
   FACULTY REGISTRATION
========================================================= */
exports.facultyRegister = async (req, res, next) => {
  try {
    const { errors: validationErrors, isValid } =
      validateFacultyRegisterInput(req.body);
    if (!isValid) return res.status(400).json(validationErrors);

    const {
      name,
      email,
      facultyMobileNumber,
      department,
      designation,
      password,
    } = req.body;

    // Required fields
    if (
      !name ||
      !email ||
      !facultyMobileNumber ||
      !department ||
      !designation ||
      !password
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Validate department
    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({
        message: "Invalid department",
      });
    }

    // Password validation
    if (
      typeof password !== "string" ||
      password.length < 6 ||
      password.length > 128
    ) {
      return res.status(400).json({
        message: "Password must contain between 6 and 128 characters",
      });
    }

    // Check duplicate email
    const normalizedEmail = email.trim().toLowerCase();

    const existingFaculty = await Faculty.findOne({
      email: normalizedEmail,
    });

    if (existingFaculty) {
      return res.status(409).json({
        message: "Faculty with this email already exists",
      });
    }

    // Current joining year
    const joiningYear = new Date().getFullYear();

    // Generate Faculty Registration Number
    const registrationNumber =
      await getFacultyRegistrationNumber(
        department,
        joiningYear
      );

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    /*
      Default avatar is created because the Faculty model
      currently requires avatar.public_id and avatar.url.
    */
    const defaultAvatar = {
      public_id: `default-faculty-${registrationNumber}`,
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        name.trim()
      )}&background=0077b6&color=ffffff&size=150`,
    };

    // Create faculty
    const faculty = new Faculty({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      registrationNumber,
      designation: designation.trim(),
      department,
      facultyMobileNumber,
      joiningYear,
      subjectsCanTeach: [],
      avatar: defaultAvatar,
    });

    await faculty.save();

    return res.status(201).json({
      success: true,
      message: "Faculty registered successfully",
      registrationNumber,
    });
  } catch (err) {
    console.log(
      "Error in faculty registration:",
      err.message
    );

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Faculty email is already registered",
      });
    }

    return res.status(500).json({
      message: "Error in faculty registration",
    });
  }
};

/* =========================================================
   FACULTY LOGIN
========================================================= */
exports.facultyLogin = async (req, res, next) => {
  try {
    const registrationNumber = String(
      req.body?.registrationNumber || ""
    ).trim().toUpperCase();
    const loginData = { ...req.body, registrationNumber };
    const { errors, isValid } =
      validateFacultyLoginInput(loginData);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { password } = req.body;

    const faculty = await Faculty.findOne({
      registrationNumber,
    });

    if (!faculty) {
      errors.registrationNumber =
        "Registration number not found";

      return res.status(404).json(errors);
    }

    const validPassword = await bcrypt.compare(
      password,
      faculty.password
    );

    if (!validPassword) {
      errors.password = "Invalid Password";

      return res.status(404).json(errors);
    }

    const facultyData = faculty.toObject();
    delete facultyData.password;
    delete facultyData.otp;
    delete facultyData.otpExpiresAt;
    const payload = {
      id: faculty.id,
      role: "faculty",
      faculty: facultyData,
    };

    jwt.sign(
      payload,
      keys.secretOrKey,
      { expiresIn: "2d" },
      (err, token) => {
        if (err) return res.status(500).json({ message: "Unable to complete login" });
        return res.json({
          success: true,
          token: "Bearer " + token,
        });
      }
    );
  } catch (err) {
    console.log(
      "Error in faculty login",
      err.message
    );
    return res.status(500).json({
      message: "Unable to complete login",
    });
  }
};

/* =========================================================
   FETCH STUDENTS
========================================================= */
exports.fetchStudents = async (req, res, next) => {
  try {
    const faculty = await Faculty.findById(req.user?._id || req.user?.id).select("_id department name registrationNumber");
    if (!faculty) {
      return res.status(403).json({ message: "Faculty access required" });
    }

    const { errors, isValid } = validateFetchStudentsInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { department, year, section } = req.body;
    const yearValue = String(year || "");

    if (department && department !== faculty.department) {
      return res.status(403).json({ message: "Access to students outside your department is forbidden" });
    }
    if (!YEARS.includes(yearValue) || !SECTIONS.includes(section)) {
      return res.status(400).json({ message: "Select a valid year and section" });
    }

    const assignments = await Timetable.find({
      faculty: faculty._id,
      department: faculty.department,
      year: yearValue,
      section,
    })
      .populate("subject", "subjectCode")
      .lean();
    const subjectList = [
      ...new Map(
        assignments
          .filter((entry) => entry.subject)
          .map((entry) => [String(entry.subject._id), entry.subject])
      ).values(),
    ];

    if (subjectList.length === 0) {
      return res.status(403).json({ message: "No subject assignment exists for this class" });
    }

    const students = await Student.find({
      department: faculty.department,
      year: yearValue,
      section,
    });

    if (students.length === 0) {
      errors.department = "No student found";
      return res.status(404).json(errors);
    }

    res.status(200).json({
      result: students.map((student) => ({
        _id: student._id,
        registrationNumber: student.registrationNumber,
        name: student.name,
        email: student.email,
      })),
      subjectCode: subjectList.map((sub) => sub.subjectCode),
    });
  } catch (err) {
    console.log("Error in fetchStudents", err.message);
    return res.status(500).json({ message: "Unable to load students" });
  }
};

/* =========================================================
   MARK ATTENDANCE
========================================================= */
exports.markAttendance = async (
  req,
  res,
  next
) => {
  const mongoSession = await mongoose.startSession();
  let duplicateCheck = null;
  let expectedAttendanceStudentIds = [];
  try {
    const faculty = await Faculty.findById(req.user?._id || req.user?.id)
      .select("_id department assignedSubjects");
    if (!faculty) {
      return res.status(403).json({ message: "Faculty access required" });
    }

    const { assignmentId, selectedStudents, sessionDate: requestedSessionDate } = req.body;
    if (!mongoose.isValidObjectId(assignmentId) ||
        !Array.isArray(selectedStudents) ||
        selectedStudents.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id)) ||
        new Set(selectedStudents).size !== selectedStudents.length) {
      return res.status(400).json({ message: "Invalid attendance request" });
    }

    const assignment = faculty.assignedSubjects.id(assignmentId);
    if (!assignment || (assignment.faculty && String(assignment.faculty) !== String(faculty._id))) {
      return res.status(403).json({ message: "You are not assigned to this subject" });
    }
    const semester = Number(assignment.semester);
    const year = assignment.year || Math.ceil(semester / 2);
    const section = assignment.section || "A";
    const subject = await Subject.findOne({
      _id: assignment.subject,
      department: faculty.department,
      semester,
      subjectCode: assignment.subjectCode,
    }).select("_id subjectCode subjectName").lean();
    if (!subject || (assignment.department && assignment.department !== faculty.department)) {
      return res.status(403).json({ message: "Assigned subject is not valid for your department" });
    }
    const students = await Student.find({ department: faculty.department, year, section })
      .select("_id").lean();
    if (!students.length) return res.status(404).json({ message: "No students found for this class" });
    const studentIds = students.map((student) => String(student._id));
    expectedAttendanceStudentIds = studentIds;
    if (selectedStudents.some((id) => !studentIds.includes(id))) {
      return res.status(403).json({ message: "You can only mark students in the assigned class" });
    }

    // A date input submits a calendar date, not an instant. Persist and compare
    // that canonical date string directly so server/browser timezones cannot
    // shift it across midnight.
    const sessionDate = requestedSessionDate || localDateString();
    if (!isCanonicalDate(sessionDate)) {
      return res.status(400).json({ message: "Select a valid attendance date" });
    }
    duplicateCheck = {
      faculty: faculty._id,
      subject: subject._id,
      department: faculty.department,
      semester,
      year,
      section,
      sessionDate,
    };
    const existingSessions = await AttendanceSession.find(duplicateCheck).select("attendanceRecords completed").lean();
    if (existingSessions.some((item) => isCompleteAttendance(item.attendanceRecords, studentIds))) {
      return res.status(409).json({ message: "Attendance has already been submitted for this class, subject, and date." });
    }
    const present = new Set(selectedStudents);
    await mongoSession.withTransaction(async () => {
      await AttendanceSession.create([{
        ...duplicateCheck,
        subjectCode: subject.subjectCode || assignment.subjectCode,
        subjectName: subject.subjectName || assignment.subjectName,
        completed: true,
        attendanceRecords: studentIds.map((studentId) => ({
          student: studentId,
          status: present.has(studentId) ? "Present" : "Absent",
        })),
      }], { session: mongoSession });

      const operations = studentIds.map((studentId) => ({
        updateOne: {
          filter: { student: studentId, subject: subject._id },
          update: {
            $inc: {
              totalLectures: 1,
              ...(present.has(studentId) ? { lecturesAttended: 1 } : {}),
            },
            $setOnInsert: { student: studentId, subject: subject._id },
          },
          upsert: true,
        },
      }));
      await Attendance.bulkWrite(operations, { session: mongoSession });
    });

    return res.status(200).json({
      message: "Attendance submitted successfully",
      session: {
        sessionDate,
        subjectCode: assignment.subjectCode,
        subjectName: assignment.subjectName,
        semester,
        section,
        presentCount: selectedStudents.length,
        absentCount: studentIds.length - selectedStudents.length,
        totalStudents: studentIds.length,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      const existingSessions = duplicateCheck
        ? await AttendanceSession.find(duplicateCheck).select("attendanceRecords").lean().catch(() => [])
        : [];
      const validDuplicate = existingSessions.some((item) =>
        isCompleteAttendance(item.attendanceRecords, expectedAttendanceStudentIds)
      );
      if (validDuplicate) {
        return res.status(409).json({ message: "Attendance has already been submitted for this class, subject, and date." });
      }
      console.error("Attendance unique index rejected a non-duplicate session; run the attendance session index migration:", err.message);
      return res.status(500).json({ message: "Attendance could not be saved because the session index needs updating. No attendance records were changed." });
    }
    console.error("Faculty attendance submission error:", err);
    return res.status(400).json({
      message: err.message || "Error in marking attendance",
    });
  } finally {
    await mongoSession.endSession();
  }
};

exports.getAttendanceHistory = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user?._id || req.user?.id)
      .select("_id name registrationNumber designation department assignedSubjects")
      .lean();
    if (!faculty) return res.status(403).json({ message: "Faculty access required" });

    const assignments = (faculty.assignedSubjects || []).filter((assignment) =>
      (!assignment.faculty || String(assignment.faculty?._id || assignment.faculty) === String(faculty._id)) &&
      (!assignment.department || assignment.department === faculty.department) &&
      assignment.subject
    );
    // ObjectIds expose an `id` Buffer internally; only use `_id` for populated
    // documents and stringify raw ObjectIds directly.
    const getSubjectId = (subject) => String(subject && typeof subject === "object" && subject._id ? subject._id : subject || "");
    let matchingAssignments = assignments;
    if (req.query.assignmentId || req.query.subjectId) {
      const requestedAssignmentId = String(req.query.assignmentId || "");
      let assignment = requestedAssignmentId
        ? assignments.find((item) => String(item._id) === requestedAssignmentId)
        : null;

      // Compatibility for clients that sent a Subject _id in the assignmentId
      // parameter. Resolve it only through this faculty member's own embedded
      // assignments and use class metadata to avoid crossing sections/terms.
      const requestedSubjectId = String(req.query.subjectId || (!assignment ? requestedAssignmentId : ""));
      if (!assignment && requestedSubjectId && mongoose.isValidObjectId(requestedSubjectId)) {
        let candidates = assignments.filter((item) => getSubjectId(item.subject) === requestedSubjectId);
        if (req.query.department) candidates = candidates.filter((item) => (item.department || faculty.department) === req.query.department);
        if (req.query.semester) candidates = candidates.filter((item) => Number(item.semester) === Number(req.query.semester));
        if (req.query.year) candidates = candidates.filter((item) => (Number(item.year) || Math.ceil(Number(item.semester) / 2)) === Number(req.query.year));
        if (req.query.section) candidates = candidates.filter((item) => (item.section || "A") === req.query.section);
        if (req.query.academicYear) candidates = candidates.filter((item) => item.academicYear === req.query.academicYear);
        if (candidates.length === 1) [assignment] = candidates;
      }
      if (!assignment) return res.status(404).json({ message: "Assigned subject not found" });
      matchingAssignments = [assignment];
    }
    const subjectIds = [...new Set(matchingAssignments.map((assignment) => getSubjectId(assignment.subject)).filter(mongoose.isValidObjectId))];
    if (!subjectIds.length) return res.status(200).json({ result: [] });

    const classFilters = matchingAssignments.map((assignment) => ({
      subject: getSubjectId(assignment.subject),
      department: assignment.department || faculty.department,
      semester: Number(assignment.semester),
      year: Number(assignment.year) || Math.ceil(Number(assignment.semester) / 2),
      section: assignment.section || "A",
    })).filter((item) => item.subject && mongoose.isValidObjectId(item.subject));
    if (!classFilters.length) return res.status(200).json({ result: [] });
    const sessions = await AttendanceSession.find({
      faculty: faculty._id,
      subject: { $in: subjectIds },
      $or: classFilters,
    })
      .populate("subject", "subjectCode subjectName")
      .populate("attendanceRecords.student", "registrationNumber name")
      .sort({ sessionDate: -1, createdAt: -1 })
      .lean();

    const validSessions = [];
    for (const session of sessions) {
      const assignment = matchingAssignments.find((item) =>
        getSubjectId(item.subject) === String(session.subject?._id || session.subject) &&
        (item.department || faculty.department) === session.department &&
        Number(item.semester) === Number(session.semester) &&
        (Number(item.year) || Math.ceil(Number(item.semester) / 2)) === Number(session.year) &&
        (item.section || "A") === session.section
      );
      if (!assignment) continue;
      const expectedStudents = await Student.find({
        department: session.department,
        year: session.year,
        section: session.section,
      }).distinct("_id");
      if (isCompleteAttendance(session.attendanceRecords, expectedStudents)) validSessions.push(session);
    }

    return res.status(200).json({
      result: validSessions.map((session) => ({
        _id: session._id,
        sessionDate: session.sessionDate,
        subject: session.subject,
        subjectCode: session.subjectCode || session.subject?.subjectCode,
        subjectName: session.subjectName || session.subject?.subjectName,
        semester: session.semester,
        section: session.section,
        presentCount: (session.attendanceRecords || []).filter((record) => record.status === "Present").length,
        absentCount: (session.attendanceRecords || []).filter((record) => record.status === "Absent").length,
        attendanceRecords: session.attendanceRecords || [],
      })),
    });
  } catch (err) {
    console.error("Faculty attendance history error:", err);
    return res.status(500).json({ message: "Unable to load attendance history" });
  }
};

exports.getFacultyMarksStudents = async (req, res) => {
  try {
    const context = await getFacultyMarksContext(req.user?._id || req.user?.id, req.params.assignmentId);
    if (context.error) return res.status(context.status).json({ message: context.error });
    const assessment = ASSESSMENTS.find((item) => item.key === req.query.assessmentType);
    if (!assessment) return res.status(400).json({ message: "Select a valid assessment" });

    const records = await Mark.find({
      student: { $in: context.students.map((student) => student._id) },
      subject: context.subject._id,
      assessmentType: assessment.key,
      academicYear: context.academicYear,
    }).select("student marks totalMarks resultStatus status draftedAt submittedAt publishedAt").lean();
    const byStudent = new Map(records.map((record) => [String(record.student), record]));

    return res.status(200).json({
      assignment: {
        _id: String(context.assignment._id),
        subjectId: String(context.subject._id),
        subjectCode: context.subject.subjectCode,
        subjectName: context.subject.subjectName,
        department: context.faculty.department,
        semester: context.semester,
        year: context.year,
        section: context.section,
        academicYear: context.academicYear,
      },
      assessment,
      result: context.students.map((student) => {
        const record = byStudent.get(String(student._id));
        return {
          ...student,
          marksObtained: record?.marks ?? null,
          resultStatus: record?.resultStatus || "",
          status: record?.status || "",
          recordId: record?._id || null,
        };
      }),
    });
  } catch (err) {
    console.error("Faculty marks students error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Unable to load students and marks",
    });
  }
};

const saveFacultyAssessment = (workflowStatus) => async (req, res) => {
  const mongoSession = await mongoose.startSession();
  try {
    const context = await getFacultyMarksContext(req.user?._id || req.user?.id, req.body?.assignmentId);
    if (context.error) return res.status(context.status).json({ message: context.error });
    const assessment = ASSESSMENTS.find((item) => item.key === req.body?.assessmentType);
    const entries = req.body?.marks;
    if (!assessment || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: "Select an assessment and enter marks" });
    }

    const rosterIds = new Set(context.students.map((student) => String(student._id)));
    const submittedIds = entries.map((entry) => String(entry?.studentId || ""));
    if (entries.some((entry) => !mongoose.isValidObjectId(entry?.studentId) || !rosterIds.has(String(entry.studentId))) ||
        new Set(submittedIds).size !== submittedIds.length) {
      return res.status(403).json({ message: "Marks contain a student outside the assigned class" });
    }

    if (workflowStatus === "SUBMITTED" && entries.length !== context.students.length) {
      return res.status(400).json({ message: "Submit marks for every student in the assigned class" });
    }
    for (const entry of entries) {
      const absent = entry.resultStatus === "AB";
      const blank = entry.marksObtained === null || entry.marksObtained === undefined || entry.marksObtained === "";
      if ((absent && (assessment.key !== "SEE" || !blank)) ||
          (!absent && !blank && (!isNumericValue(entry.marksObtained) || Number(entry.marksObtained) < 0 || Number(entry.marksObtained) > assessment.maxMarks)) ||
          (workflowStatus === "SUBMITTED" && blank && !absent)) {
        return res.status(400).json({
          message: `${assessment.label} marks must be between 0 and ${assessment.maxMarks}; SEE may also be marked absent`,
        });
      }
    }

    const studentIds = entries.map((entry) => entry.studentId);
    const published = await Mark.exists({
      student: { $in: studentIds },
      subject: context.subject._id,
      assessmentType: assessment.key,
      academicYear: context.academicYear,
      status: "PUBLISHED",
    });
    if (published) return res.status(409).json({ message: "Published marks must be reopened by Admin before editing" });

    const now = new Date();
    const operations = entries.map((entry) => {
      const markValue = entry.marksObtained === null || entry.marksObtained === undefined || entry.marksObtained === ""
        ? null
        : Number(entry.marksObtained);
      const set = {
        faculty: context.faculty._id,
        department: context.faculty.department,
        semester: context.semester,
        year: context.year,
        section: context.section,
        academicYear: context.academicYear,
        assessmentType: assessment.key,
        exam: assessment.label,
        marks: markValue,
        totalMarks: assessment.maxMarks,
        status: workflowStatus,
      };
      if (entry.resultStatus === "AB") set.resultStatus = "AB";
      if (workflowStatus === "DRAFT") set.draftedAt = now;
      if (workflowStatus === "SUBMITTED") set.submittedAt = now;
      const update = { $set: set, $setOnInsert: { student: entry.studentId, subject: context.subject._id } };
      update.$unset = {};
      if (workflowStatus === "DRAFT") update.$unset.submittedAt = 1;
      if (entry.resultStatus !== "AB") update.$unset.resultStatus = 1;
      if (Object.keys(update.$unset).length === 0) delete update.$unset;
      return {
        updateOne: {
          filter: {
            student: entry.studentId,
            subject: context.subject._id,
            assessmentType: assessment.key,
            academicYear: context.academicYear,
          },
          update,
          upsert: true,
        },
      };
    });

    await Mark.init();
    await mongoSession.withTransaction(async () => {
      await Mark.bulkWrite(operations, { session: mongoSession });
    });
    return res.status(200).json({
      message: workflowStatus === "DRAFT" ? "Draft saved" : "Marks submitted",
      status: workflowStatus,
      updatedCount: entries.length,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "Marks already exist for this assessment; refresh and retry" });
    return res.status(500).json({ message: "Unable to save marks" });
  } finally {
    await mongoSession.endSession();
  }
};

exports.saveFacultyMarksDraft = saveFacultyAssessment("DRAFT");
exports.submitFacultyMarks = saveFacultyAssessment("SUBMITTED");

exports.getFacultyMarksHistory = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user?._id || req.user?.id)
      .select("_id department assignedSubjects")
      .lean();
    if (!faculty) return res.status(403).json({ message: "Faculty access required" });
    let assignments = (faculty.assignedSubjects || []).filter((item) =>
      item.isActive !== false && (!item.faculty || String(item.faculty) === String(faculty._id)) &&
      (!item.department || item.department === faculty.department) && item.subject
    );
    if (req.query.assignmentId) {
      assignments = assignments.filter((item) => String(item._id) === String(req.query.assignmentId));
      if (!assignments.length) return res.status(404).json({ message: "Assigned subject not found" });
    }
    const records = await Mark.find({
      faculty: faculty._id,
      subject: { $in: assignments.map((item) => item.subject) },
      assessmentType: { $exists: true },
    })
      .populate("student", "name registrationNumber")
      .populate("subject", "subjectCode subjectName")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();
    const grouped = new Map();
    records.forEach((record) => {
      const key = [record.subject?._id, record.assessmentType, record.semester, record.section, record.academicYear, record.status].join("|");
      if (!grouped.has(key)) {
        grouped.set(key, {
          _id: key,
          subject: record.subject,
          subjectCode: record.subject?.subjectCode,
          exam: record.exam,
          assessmentType: record.assessmentType,
          semester: record.semester,
          section: record.section,
          academicYear: record.academicYear,
          status: record.status,
          updatedAt: record.updatedAt,
          students: new Set(),
        });
      }
      const group = grouped.get(key);
      if (record.student?._id) group.students.add(String(record.student._id));
      if (new Date(record.updatedAt || record.createdAt) > new Date(group.updatedAt || 0)) {
        group.updatedAt = record.updatedAt || record.createdAt;
      }
    });
    return res.status(200).json({
      result: [...grouped.values()].map((record) => ({ ...record, studentCount: record.students.size, students: undefined })),
    });
  } catch (err) {
    console.error("Faculty marks history error:", err);
    return res.status(500).json({ message: "Unable to load marks history" });
  }
};

exports.getFacultyResultsForAssignment = async (req, res) => {
  try {
    const context = await getFacultyMarksContext(req.user?._id || req.user?.id, req.params.assignmentId);
    if (context.error) return res.status(context.status).json({ message: context.error });
    const records = await Mark.find({
      subject: context.subject._id,
      academicYear: context.academicYear,
      student: { $in: context.students.map((student) => student._id) },
      assessmentType: { $exists: true },
    }).lean();
    const attendance = await getAttendancePercentages(context.students.map((student) => student._id), context.subject._id);
    return res.status(200).json({ result: context.students.map((student) => {
      const studentRecords = records.filter((record) => String(record.student) === String(student._id));
      const calculation = buildCourseResult(studentRecords, attendance.get(String(student._id)) ?? null);
      return { ...student, ...calculation, assessments: studentRecords };
    }) });
  } catch (err) {
    console.error("Faculty marks result preview error:", err);
    return res.status(500).json({ message: "Unable to load subject results" });
  }
};

/* =========================================================
   UPLOAD MARKS
========================================================= */
exports.uploadMarks = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user?._id || req.user?.id)
      .select("_id department assignedSubjects");
    if (!faculty) return res.status(403).json({ message: "Faculty access required" });

    const assessmentByLegacyExam = {
      "Unit Test 1": "CIE1",
      "Unit Test 2": "CIE2",
      Semester: "SEE",
    };
    const assessmentType = assessmentByLegacyExam[req.body?.exam];
    const year = Number(req.body?.year);
    const section = req.body?.section;
    const assignment = faculty.assignedSubjects.find((item) =>
      item.isActive !== false && item.subjectCode === req.body?.subjectCode &&
      (item.section || "A") === section &&
      Number(item.year || Math.ceil(Number(item.semester) / 2)) === year
    );
    if (!assignment) return res.status(403).json({ message: "You are not assigned to this subject and class" });
    if (!assessmentType || Number(req.body?.totalMarks) !== 50) {
      return res.status(400).json({ message: "VTU 2022 CIE and SEE assessments must be out of 50" });
    }

    const saveRequest = {
      ...req,
      body: {
        assignmentId: String(assignment._id),
        assessmentType,
        marks: Array.isArray(req.body?.marks)
          ? req.body.marks.map((entry) => ({ studentId: entry?._id, marksObtained: entry?.value }))
          : [],
      },
    };
    return await saveFacultyAssessment("SUBMITTED")(saveRequest, res);
  } catch (err) {
    return res.status(500).json({ message: "Unable to submit marks" });
  }
};

/* =========================================================
   GET ALL SUBJECTS
========================================================= */
exports.getAllSubjects = async (
  req,
  res,
  next
) => {
  try {
    const faculty = await Faculty.findById(req.user?._id || req.user?.id).select("_id department");
    if (!faculty) {
      return res.status(403).json({ message: "Faculty access required" });
    }

    const assignedSubjectIds = await Timetable.find({
      faculty: faculty._id,
      department: faculty.department,
    }).distinct("subject");
    const allSubjects = await Subject.find({
      _id: { $in: assignedSubjectIds },
      department: faculty.department,
    });

    if (!allSubjects || allSubjects.length === 0) {
      return res.status(404).json({
        message: "No subjects found for your department.",
      });
    }

    res.status(200).json({
      allSubjects,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error in getting all Subjects",
    });
  }
};

exports.getAssignedSubjects = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user?._id || req.user?.id)
      .select("_id department assignedSubjects")
      .lean();
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    const subjects = await Subject.find({ department: faculty.department })
      .select("_id subjectCode subjectName subjectType department semester year academicYear")
      .lean();
    const facultyBySubject = await getSubjectFacultyMap(subjects);
    const assignments = [...facultyBySubject.values()].flat()
      .filter((assignment) => assignment.faculty._id === String(faculty._id));

    return res.status(200).json({
      result: assignments.map((assignment) => ({
        ...assignment,
        assignmentId: String(assignment._id),
        faculty: assignment.faculty._id,
        subject: assignment.subject._id,
        subjectId: String(assignment.subject._id),
        facultyDetails: assignment.faculty,
        subjectDetails: assignment.subject,
        subjectCode: assignment.subject.subjectCode,
        subjectName: assignment.subject.subjectName,
        subjectType: assignment.subject.subjectType || "",
        sectionRecorded: assignment.section || "",
        year: assignment.year || assignment.subject.year || Math.ceil(Number(assignment.semester) / 2),
      })),
      department: faculty.department,
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load assigned subjects" });
  }
};

exports.getStudentsForAssignedSubject = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user?._id || req.user?.id)
      .select("_id department assignedSubjects");
    if (!faculty) {
      return res.status(403).json({ message: "Faculty access required" });
    }

    if (!mongoose.isValidObjectId(req.params.assignmentId)) {
      return res.status(404).json({ message: "Assigned subject not found" });
    }

    const assignment = faculty.assignedSubjects.id(req.params.assignmentId);
    if (!assignment || (assignment.faculty && String(assignment.faculty) !== String(faculty._id))) {
      return res.status(404).json({ message: "Assigned subject not found" });
    }

    const semester = Number(assignment.semester);
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      return res.status(400).json({ message: "Assigned subject has an invalid semester" });
    }

    const department = faculty.department;
    if (assignment.department && assignment.department !== department) {
      return res.status(403).json({ message: "Assigned subject is outside your department" });
    }
    const subject = await Subject.findOne({
      _id: assignment.subject,
      department,
      semester,
    }).select("_id subjectCode subjectName subjectType semester department").lean();
    if (!subject || subject.subjectCode !== assignment.subjectCode) {
      return res.status(404).json({ message: "Assigned subject not found" });
    }

    const year = Math.ceil(semester / 2);
    const section = assignment.section || "A";
    const students = await Student.find({ department, year, section })
      .select("_id registrationNumber name email")
      .sort({ registrationNumber: 1 })
      .lean();

    return res.status(200).json({
      assignment: {
        _id: String(assignment._id),
        faculty: String(faculty._id),
        subject: String(subject._id),
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        subjectType: subject.subjectType || "",
        department,
        semester,
        year,
        section,
        academicYear: assignment.academicYear || "2026-27",
      },
      result: students,
    });
  } catch (err) {
    console.log("Error loading students for assigned subject", err.message);
    return res.status(500).json({ message: "Unable to load students for this subject" });
  }
};

/* =========================================================
   UPDATE PASSWORD
========================================================= */
exports.updatePassword = async (
  req,
  res,
  next
) => {
  try {
    const {
      errors,
      isValid,
    } =
      validateFacultyUpdatePassword(
        req.body
      );

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const {
      oldPassword,
      newPassword,
      confirmNewPassword,
    } = req.body;

    if (
      newPassword !==
      confirmNewPassword
    ) {
      errors.confirmNewPassword =
        "Password Mismatch";

      return res.status(404).json(errors);
    }

    const faculty =
      await Faculty.findById(
        req.user?._id || req.user?.id
      );

    if (!faculty) {
      return res.status(404).json({
        message: "Faculty not found",
      });
    }

    const isCorrect =
      await bcrypt.compare(
        oldPassword,
        faculty.password
      );

    if (!isCorrect) {
      errors.oldPassword =
        "Invalid old Password";

      return res.status(404).json(errors);
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    faculty.password = hashedPassword;
    await faculty.save();

    return res.status(200).json({
      message: "Password Updated",
    });
  } catch (err) {
    console.log(
      "Error in updating password",
      err.message
    );
    return res.status(500).json({
      message: "Error in updating password",
    });
  }
};

/* =========================================================
   FORGOT PASSWORD
========================================================= */
exports.forgotPassword = async (
  req,
  res,
  next
) => {
  try {
    const {
      errors,
      isValid,
    } =
      validateForgotPassword(
        req.body
      );

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { email } = req.body;

    const faculty =
      await Faculty.findOne({ email });

    if (!faculty) {
      errors.email =
        "Email Not found, Provide registered email";

      return res.status(400).json(errors);
    }

    const OTP = crypto.randomInt(0, 1000000).toString().padStart(6, "0");

    faculty.otp = OTP;
    faculty.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await faculty.save();

    const emailResult = await sendEmail(
      faculty.email,
      OTP,
      "OTP"
    );

    if (emailResult?.skipped) {
      faculty.otp = "";
      faculty.otpExpiresAt = undefined;
      await faculty.save();
      return res.status(503).json({
        message: "Password reset email is unavailable. Try again later.",
      });
    }

    res.status(200).json({
      message:
        "Check your registered Email for OTP",
    });

  } catch (err) {
    console.log(
      "Error in sending OTP email",
      err.message
    );
    return res.status(500).json({
      message: "Unable to send password reset email",
    });
  }
};

/* =========================================================
   POST OTP
========================================================= */
exports.postOTP = async (
  req,
  res,
  next
) => {
  try {
    const {
      errors,
      isValid,
    } = validateOTP(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const {
      email,
      otp,
      newPassword,
      confirmNewPassword,
    } = req.body;

    if (
      newPassword !==
      confirmNewPassword
    ) {
      errors.confirmNewPassword =
        "Password Mismatch";

      return res.status(400).json(errors);
    }

    const faculty =
      await Faculty.findOne({ email });

    if (!faculty) {
      return res.status(404).json({
        message: "Faculty not found",
      });
    }

    if (
      faculty.otp !== otp ||
      !faculty.otpExpiresAt ||
      faculty.otpExpiresAt <= new Date()
    ) {
      errors.otp =
        "Invalid OTP..Please try again";

      return res.status(400).json(errors);
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    faculty.password = hashedPassword;
    faculty.otp = "";
    faculty.otpExpiresAt = undefined;

    await faculty.save();

    return res.status(200).json({
      message: "Password Changed",
    });
  } catch (err) {
    console.log(
      "Error in submitting OTP",
      err.message
    );

    return res.status(400).json({
      message:
        "Error in submitting OTP",
    });
  }
};

/* =========================================================
   UPDATE PROFILE
========================================================= */
exports.updateProfile = async (
  req,
  res,
  next
) => {
  try {
    const faculty = await Faculty.findById(
      req.user?._id || req.user?.id
    );

    if (!faculty) {
      return res.status(404).json({
        message: "Faculty not found",
      });
    }

    const updatedData = {};
    if (req.body.email !== undefined) {
      const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
      if (!Validator.isEmail(email)) {
        return res.status(400).json({ message: "Enter a valid email address" });
      }
      const existingEmail = await Faculty.exists({
        email,
        _id: { $ne: faculty._id },
      });
      if (existingEmail) {
        return res.status(409).json({ message: "Email is already registered" });
      }
      updatedData.email = email;
    }

    if (
      req.body.facultyMobileNumber !== undefined &&
      req.body.facultyMobileNumber !== ""
    ) {
      const mobile = String(req.body.facultyMobileNumber).trim();
      if (!/^\d{7,15}$/.test(mobile)) {
        return res.status(400).json({
          message: "Mobile number must contain 7 to 15 digits",
        });
      }
      updatedData.facultyMobileNumber = Number(mobile);
    }

    if (
      req.body.avatar &&
      req.body.avatar !== "" &&
      req.body.avatar !== faculty.avatar?.url
    ) {
      if (!validateAvatarDataUri(req.body.avatar)) {
        return res.status(400).json({ message: "Avatar must be a JPEG or PNG image under 5 MB" });
      }
      const myCloud =
        await cloudinary.v2.uploader.upload(
          req.body.avatar,
          {
            folder: "erp",
            width: 150,
            crop: "scale",
          }
        );

      updatedData.avatar = {
        public_id:
          myCloud.public_id,
        url:
          myCloud.secure_url,
      };
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: "No valid profile changes provided" });
    }

    await Faculty.findByIdAndUpdate(
      faculty._id,
      updatedData,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    console.log(
      "Error in updating Profile",
      err.message
    );
    return res.status(500).json({
      message: "Error in updating profile",
    });
  }
};
