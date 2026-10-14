const express = require("express");

const router = express.Router();

const passport = require("passport");
const { requireRole } = require("../middleware/requireAdmin");

const upload = require("../utils/multer");
const { getFacultyPublishedTimetable: getFacultyTimetable } = require("../controllers/timetableScheduleController");

const {
  facultyRegister,
  facultyLogin,
  getAllSubjects,
  getAssignedSubjects,
  getStudentsForAssignedSubject,
  updateProfile,
  updatePassword,
  fetchStudents,
  markAttendance,
  getAttendanceHistory,
  forgotPassword,
  postOTP,
  uploadMarks,
  getFacultyMarksStudents,
  saveFacultyMarksDraft,
  submitFacultyMarks,
  getFacultyMarksHistory,
  getFacultyResultsForAssignment,
} = require("../controllers/facultyController");

// Auth and Registration

router.post("/register", facultyRegister);

router.post("/login", facultyLogin);

router.post("/forgotPassword", forgotPassword);

router.post("/postOTP", postOTP);

// Profile

router.put(
  "/updateProfile",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  updateProfile
);

router.post(
  "/updatePassword",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  updatePassword
);

// Utility

router.post(
  "/fetchStudents",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  fetchStudents
);

router.post(
  "/fetchAllSubjects",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  getAllSubjects
);
router.get(
  "/assignedSubjects",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  getAssignedSubjects
);
router.get(
  "/assignedSubjects/:assignmentId/students",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  getStudentsForAssignedSubject
);

router.post(
  "/markAttendance",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  markAttendance
);
router.get(
  "/attendanceHistory",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  getAttendanceHistory
);

router.post(
  "/uploadMarks",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  uploadMarks
);
router.get(
  "/marks/history",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  getFacultyMarksHistory
);
router.get(
  "/marks/:assignmentId/results",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  getFacultyResultsForAssignment
);
router.get(
  "/marks/:assignmentId",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  getFacultyMarksStudents
);
router.post(
  "/marks/save",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  saveFacultyMarksDraft
);
router.post(
  "/marks/submit",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  submitFacultyMarks
);
router.get(
  "/timetable",
  passport.authenticate("jwt", { session: false }),
  requireRole("faculty"),
  getFacultyTimetable
);

module.exports = router;
