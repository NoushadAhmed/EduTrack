const express = require("express");
const router = express.Router();
const passport = require("passport");
const requireAdmin = require("../middleware/requireAdmin");
const { requireRole } = require("../middleware/requireAdmin");
const {
  getAdminTimetable,
  rejectLegacyTimetableWrite,
} = require("../controllers/timetableController");
const {
  getTimetableRoster,
  validateTimetableSchedule,
  getAdminTimetableSchedules,
  createTimetableSchedule,
  updateTimetableSchedule,
  publishTimetableSchedule,
  getTimetableSchedule,
} = require("../controllers/timetableScheduleController");
const {
  getFeeRecords,
  getStudentFeeRecords,
  getFeeStudents,
  updateFeeAssessment,
  createFeeRecord,
  recordPayment,
  getFeeStructures,
  saveFeeStructure,
  deleteFeeStructure,
  generateAssessments,
} = require("../controllers/feeController");
const { getReports } = require("../controllers/reportController");

const {
  adminLogin,
  addFaculty,
  addStudent,
  addSubject,
  addAdmin,
  updateAdminProfile,
  getAllFaculty,
  getAllStudents,
  getAllAttendance,
  getAllSubjects,
  getFaculty,
  getFacultyAvailableSubjects,
  getFacultySubjectAssignments,
  saveFacultySubjectAssignments,
  getEligibleFacultyForSubject,
  assignFacultyToSubject,
  getStudents,
  getSubjects,
  getResults,
  getStudentResults,
  getSubjectResults,
  publishMark,
  reopenMark,
} = require("../controllers/adminController");

router.post("/login", adminLogin);
router.put(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  updateAdminProfile
);
router.get(
  "/subjects/:subjectId/eligible-faculty",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getEligibleFacultyForSubject
);
router.post(
  "/subjects/:subjectId/assignments",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  assignFacultyToSubject
);
router.post(
  "/addAdmin",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  addAdmin
);
router.post(
  "/addFaculty",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  addFaculty
);
router.post(
  "/addStudent",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  addStudent
);
router.post(
  "/addSubject",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  addSubject
);
router.post(
  "/getAllFaculty",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getAllFaculty
);
router.post(
  "/getAllStudent",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getAllStudents
);
router.post(
  "/getAllAttendance",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getAllAttendance
);
router.post(
  "/getAllSubject",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getAllSubjects
);
router.post(
  "/getFaculties",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getFaculty
);
router.get(
  "/faculty/:registrationNumber/subjects",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getFacultyAvailableSubjects
);
router.get(
  "/faculty/:registrationNumber/assignments",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getFacultySubjectAssignments
);
router.put(
  "/faculty/:registrationNumber/assignments",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  saveFacultySubjectAssignments
);
router.post(
  "/getStudents",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getStudents
);
router.post(
  "/getSubjects",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getSubjects
);
router.get(
  "/results",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getResults
);
router.get(
  "/results/student/:registrationNumber",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getStudentResults
);
router.get(
  "/results/subject/:subjectCode",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getSubjectResults
);
router.post(
  "/marks/:markId/publish",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  publishMark
);
router.post(
  "/marks/:markId/reopen",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  reopenMark
);
router.get(
  "/timetable",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getAdminTimetable
);
router.post(
  "/timetable",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  rejectLegacyTimetableWrite
);
router.get(
  "/timetables/roster",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getTimetableRoster
);
router.post(
  "/timetables/validate",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  validateTimetableSchedule
);
router.get(
  "/timetables",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getAdminTimetableSchedules
);
router.post(
  "/timetables",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  createTimetableSchedule
);
router.get(
  "/timetables/:timetableId",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getTimetableSchedule
);
router.put(
  "/timetables/:timetableId",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  updateTimetableSchedule
);
router.post(
  "/timetables/:timetableId/publish",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  publishTimetableSchedule
);
router.get(
  "/fees/structures",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getFeeStructures
);
router.post(
  "/fees/structures",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  saveFeeStructure
);
router.put(
  "/fees/structures/:structureId",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  saveFeeStructure
);
router.delete(
  "/fees/structures/:structureId",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  deleteFeeStructure
);
router.post(
  "/fees/assessments/generate",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  generateAssessments
);
router.get(
  "/fees",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getFeeRecords
);
router.get(
  "/fees/students",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getFeeStudents
);
router.put(
  "/fees/:feeRecordId",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  updateFeeAssessment
);
router.get(
  "/fees/student/:registrationNumber",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getStudentFeeRecords
);
router.post(
  "/fees",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  createFeeRecord
);
router.post(
  "/fees/:feeRecordId/payments",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  recordPayment
);
router.get(
  "/reports",
  passport.authenticate("jwt", { session: false }),
  requireAdmin,
  getReports
);
module.exports = router;
