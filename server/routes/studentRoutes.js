const express = require("express");
const router = express.Router();
const passport = require("passport");
const upload = require("../utils/multer");
const { requireRole } = require("../middleware/requireAdmin");
const { getStudentPublishedTimetable: getStudentTimetable } = require("../controllers/timetableScheduleController");
const { getOwnFeeRecords } = require("../controllers/feeController");

const {
  studentLogin,
  studentRegister,
  getAllStudents,
  getAllMarks,
  getStudentResults,
  getAllSubjects,
  checkAttendance,
  getStudentByName,
  getStudentByRegNum,
  updatePassword,
  forgotPassword,
  postOTP,
  postPrivateChat,
  getPrivateChat,
  differentChats,
  previousChats,
  updateProfile,
} = require("../controllers/studentController");

//Auth and Profile Related
router.get(
  "/fees",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  getOwnFeeRecords
);
router.post("/login", studentLogin);
router.post("/register", studentRegister);
router.post("/forgotPassword", forgotPassword);
router.post("/postOTP", postOTP);
router.put(
  "/updateProfile",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  updateProfile
);
router.post(
  "/updatePassword",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  updatePassword
);

//Chat Routes
router.get(
  "/chat/:roomId",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  getPrivateChat
);
router.post(
  "/chat/:roomId",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  postPrivateChat
);
router.get(
  "/chat/newerChats/:receiverName",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  differentChats
);
router.get(
  "/chat/previousChats/:senderName",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  previousChats
);

//Peformance Routes
router.get(
  "/getMarks",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  getAllMarks
);
router.get(
  "/results",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  getStudentResults
);
router.get(
  "/getAllSubjects",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  getAllSubjects
);
router.get(
  "/checkAttendance",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  checkAttendance
);
router.get(
  "/timetable",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  getStudentTimetable
);

//Search
router.post(
  "/getAllStudents",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  getAllStudents
);
router.post(
  "/getStudentByRegNum",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  getStudentByRegNum
);
router.post(
  "/getStudentByName",
  passport.authenticate("jwt", { session: false }),
  requireRole("student"),
  getStudentByName
);

module.exports = router;
