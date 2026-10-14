const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Validator = require("validator");
const { DEPARTMENT_CODES, DEPARTMENTS, YEARS, SECTIONS } = require("../config/adminOptions");

//utils
const keys = require("../config/key");
const sendEmail = require("../utils/nodemailer");

//Models
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");
const Message = require("../models/Message");
const Mark = require("../models/Marks");
const { getSubjectFacultyMap } = require("../services/subjectFaculty");
const { ASSESSMENTS } = require("../config/vtu2022Assessment");
const { buildCourseResult, calculateGpa, getAttendancePercentages } = require("../services/marksResults");

//File Handler
const bufferConversion = require("../utils/bufferConversion");
const cloudinary = require("../utils/cloudinary");
const validateAvatarDataUri = require("../utils/validateAvatarDataUri");

//Validation
const validateStudentLoginInput = require("../validation/studentLogin");
const validateStudentRegisterInput = require("../validation/studentRegister");
const validateStudentUpdatePassword = require("../validation/studentUpdatePassword");
const validateForgotPassword = require("../validation/forgotPassword");
const validateOTP = require("../validation/otpValidation");
const { markAttendance } = require("./facultyController");

const getStudentRegistrationNumber = async (department, batchYear) => {
  const shortDepartmentCodes = {
    CSE: "CS",
    ECE: "EC",
    EEE: "EE",
    ME: "ME",
    CIVIL: "CV",
    AIML: "AI",
  };

  const departmentCode = shortDepartmentCodes[department] || "CS";
  const yearCode = String(batchYear).slice(-2);

  const lastStudent = await Student.findOne({
    department,
    registrationNumber: {
      $regex: `^2KA${yearCode}${departmentCode}`,
    },
  }).sort({ registrationNumber: -1 });

  let sequence = 0;
  if (lastStudent) {
    const lastSequence = Number(
      (lastStudent.registrationNumber.match(/(\d{3})$/) || ["0"])[0]
    );
    sequence = lastSequence + 1;
  }

  return `2KA${yearCode}${departmentCode}${String(sequence).padStart(3, "0")}`;
};

exports.studentRegister = async (req, res, next) => {
  try {
    const { errors: validationErrors, isValid } = validateStudentRegisterInput(req.body);
    if (!isValid) return res.status(400).json(validationErrors);

    const {
      name,
      email,
      studentMobileNumber,
      department,
      section,
      year,
      fatherName,
      fatherMobileNumber,
      password,
    } = req.body;

    // Basic validation
    if (
      !name ||
      !email ||
      !studentMobileNumber ||
      !department ||
      !section ||
      !year ||
      !fatherName ||
      !fatherMobileNumber ||
      !password
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (typeof password !== "string" || password.length < 6 || password.length > 128) {
      return res.status(400).json({
        message: "Password must contain between 6 and 128 characters",
      });
    }

    // Validate department
    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({
        message: "Invalid department",
      });
    }

    // Validate section
    if (!SECTIONS.includes(section)) {
      return res.status(400).json({
        message: "Invalid section",
      });
    }

    // Validate year
    if (!YEARS.includes(String(year))) {
      return res.status(400).json({
        message: "Invalid year",
      });
    }

    // Check whether email already exists
    const existingStudent = await Student.findOne({ email });

    if (existingStudent) {
      return res.status(409).json({
        message: "Student with this email already exists",
      });
    }

    // Generate registration number in the format 2KA23CS001
    const currentYear = new Date().getFullYear();
    const registrationNumber = await getStudentRegistrationNumber(
      department,
      currentYear
    );

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create student
    const student = new Student({
      name,
      email,
      password: hashedPassword,
      year: Number(year),
      department,
      section,
      registrationNumber,
      fatherName,
      studentMobileNumber,
      fatherMobileNumber,
      batch: String(currentYear),
    });

    // Assign subjects for the student's department and year
    const subjects = await Subject.find({
      department,
      year: String(year),
    });

    student.subjects = subjects.map((subject) => subject._id);

    await student.save();

    return res.status(201).json({
      success: true,
      message: "Student registered successfully",
      registrationNumber,
    });
  } catch (err) {
    console.log("Error in student registration:", err.message);

    if (err.code === 11000) {
      return res.status(409).json({ message: "Student email is already registered" });
    }

    return res.status(500).json({
      message: "Error in student registration",
    });
  }
};

exports.studentLogin = async (req, res, next) => {
  try {
    const { errors, isValid } = validateStudentLoginInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { registrationNumber, password } = req.body;

    const student = await Student.findOne({ registrationNumber });
    if (!student) {
      errors.registrationNumber = "Registration number not found";
      return res.status(404).json(errors);
    }

    const validPassword = await bcrypt.compare(password, student.password);
    if (!validPassword) {
      errors.password = "Wrong password";
      return res.status(404).json(errors);
    }

    const studentData = student.toObject();
    delete studentData.password;
    delete studentData.otp;
    delete studentData.otpExpiresAt;
    const payload = {
      id: student.id,
      role: "student",
      student: studentData,
    };
    jwt.sign(payload, keys.secretOrKey, { expiresIn: "2d" }, (err, token) => {
      if (err) return res.status(500).json({ message: "Unable to complete login" });
      return res.json({
        success: true,
        token: "Bearer " + token,
      });
    });
  } catch (err) {
    console.log("Error in student login", err.message);
    return res.status(500).json({ message: "Unable to complete login" });
  }
};

exports.checkAttendance = async (req, res, next) => {
  try {
    // console.log(req.user);
    const studentId = req.user._id;
    const attendance = await Attendance.find({ student: studentId }).populate(
      "subject"
    );
    if (!attendance) {
      return res.status(400).json({ message: "Attendance not found" });
    }

    const historySessions = await AttendanceSession.find({
      "attendanceRecords.student": studentId,
    })
      .populate("subject", "subjectCode subjectName")
      .sort({ sessionDate: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      result: attendance.map((att) => {
        let res = {};
        res.attendance = att.totalLectures
          ? ((att.lecturesAttended / att.totalLectures) * 100).toFixed(2)
          : "0.00";
        res.subjectCode = att.subject?.subjectCode || "Unknown";
        res.subjectName = att.subject?.subjectName || "Subject unavailable";
        res.maxHours = att.subject?.totalLectures || 0;
        res.absentHours = att.totalLectures - att.lecturesAttended;
        res.totalLectures = att.totalLectures;
        return res;
      }),
      history: historySessions.map((session) => {
        const ownRecord = (session.attendanceRecords || []).find(
          (record) => String(record.student) === String(studentId)
        );
        return {
          _id: session._id,
          sessionDate: session.sessionDate,
          subjectCode: session.subjectCode || session.subject?.subjectCode || "Unknown",
          subjectName: session.subjectName || session.subject?.subjectName || "Subject unavailable",
          status: ownRecord?.status,
        };
      }).filter((entry) => entry.status),
    });
  } catch (err) {
    console.log("Error in getting attending details", err.message);
    return res.status(500).json({ message: "Unable to load attendance details" });
  }
};

exports.getAllStudents = async (req, res, next) => {
  try {
    const currentStudent = await Student.findById(req.user?._id || req.user?.id)
      .select("department year section")
      .lean();
    if (!currentStudent) {
      return res.status(403).json({ message: "Student access required" });
    }
    const { department, year, section } = req.body;
    if (!department || !year || !section) {
      return res.status(400).json({ message: "Department, year, and section are required" });
    }
    if (
      department !== currentStudent.department ||
      String(year) !== String(currentStudent.year) ||
      section !== currentStudent.section
    ) {
      return res.status(403).json({ message: "You can only search within your own class" });
    }

    const students = await Student.find({
      department: currentStudent.department,
      year: currentStudent.year,
      section: currentStudent.section,
    }).select("_id name registrationNumber department year section");
    if (students.length === 0) {
      return res.status(404).json({ message: "No student found" });
    }

    return res.status(200).json({ result: students });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.getStudentByName = async (req, res, next) => {
  try {
    if (req.user?.role === "student") {
      const ownName = req.user?.name;
      const { name } = req.body;
      if (!name || name !== ownName) {
        return res.status(403).json({ message: "Access to other student records is forbidden" });
      }
    }

    const student = await Student.findById(req.user?._id || req.user?.id)
      .select("-password -otp")
      .lean();
    if (!student) return res.status(404).json({ message: "Student not found" });
    return res.status(200).json({ result: [student] });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.getStudentByRegNum = async (req, res, next) => {
  try {
    const { registrationNumber } = req.body;
    if (req.user?.role === "student") {
      if (!registrationNumber || registrationNumber !== req.user.registrationNumber) {
        return res.status(403).json({ message: "Access to other student records is forbidden" });
      }
    }

    const student = await Student.findOne({ registrationNumber })
      .select("-password -otp")
      .lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    return res.status(200).json({ result: student });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { errors, isValid } = validateStudentUpdatePassword(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    if (newPassword !== confirmNewPassword) {
      errors.confirmNewpassword = "Password Mismatch";
      return res.status(400).json(errors);
    }

    const student = await Student.findById(req.user?._id || req.user?.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const validPassword = await bcrypt.compare(oldPassword, student.password);
    if (!validPassword) {
      errors.oldPassword = "Wrong Password. Try again";
      return res.status(404).json(errors);
    }

    student.password = await bcrypt.hash(newPassword, 10);
    await student.save();
    return res.status(200).json({ message: "Password updated succesfully" });
  } catch (err) {
    console.log("Error updating password", err.message);
    return res.status(500).json({ message: "Error updating password" });
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { errors, isValid } = validateForgotPassword(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { email } = req.body;
    const student = await Student.findOne({ email });

    if (!student) {
      errors.email = "Email not found";
      return res.status(400).json(errors);
    }

    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
    student.otp = otp;
    student.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await student.save();

    const emailResult = await sendEmail(student.email, otp, "OTP");

    if (emailResult?.skipped) {
      student.otp = "";
      student.otpExpiresAt = undefined;
      await student.save();
      return res.status(503).json({
        message: "Password reset email is unavailable. Try again later.",
      });
    }

    res.status(200).json({ message: "Check your registered email for OTP" });

  } catch (err) {
    console.log("Error in sending email", err.message);
    return res.status(500).json({ message: "Unable to send password reset email" });
  }
};

exports.postOTP = async (req, res, next) => {
  try {
    const { errors, isValid } = validateOTP(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const { email, otp, newPassword, confirmNewPassword } = req.body;
    if (newPassword !== confirmNewPassword) {
      errors.confirmNewPassword = "Password Mismatch";
      return res.status(400).json(errors);
    }
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (
      student.otp !== otp ||
      !student.otpExpiresAt ||
      student.otpExpiresAt <= new Date()
    ) {
      errors.otp = "Invalid OTP, check your email again";
      return res.status(400).json(errors);
    }

    student.password = await bcrypt.hash(newPassword, 10);
    student.otp = "";
    student.otpExpiresAt = undefined;
    await student.save();
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.log("Error in submitting OTP", err.message);
    return res.status(400).json({ message: "Error in submitting OTP" });
  }
};

exports.postPrivateChat = async (req, res, next) => {
  try {
    const sender = await Student.findById(req.user?._id || req.user?.id)
      .select("_id name registrationNumber")
      .lean();
    if (!sender) return res.status(403).json({ message: "Student access required" });

    const participants = req.params.roomId.split(".");
    const message =
      typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (
      participants.length !== 2 ||
      !participants.includes(sender.registrationNumber) ||
      !participants[0] ||
      !participants[1] ||
      message.length === 0 ||
      message.length > 2000
    ) {
      return res.status(400).json({ message: "Invalid conversation or message" });
    }

    const receiverRegistrationNumber = participants.find(
      (registrationNumber) => registrationNumber !== sender.registrationNumber
    );
    const receiver = await Student.findOne({
      registrationNumber: receiverRegistrationNumber,
    })
      .select("_id name registrationNumber")
      .lean();
    if (!receiver) return res.status(404).json({ message: "Student not found" });

    await Message.create({
      senderId: sender._id,
      senderName: sender.name,
      senderRegistrationNumber: sender.registrationNumber,
      receiverId: receiver._id,
      receiverName: receiver.name,
      receiverRegistrationNumber: receiver.registrationNumber,
      roomId: req.params.roomId,
      message,
    });
    return res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    return res.status(500).json({ message: "Unable to send message" });
  }
};

exports.getPrivateChat = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user?._id || req.user?.id)
      .select("_id registrationNumber")
      .lean();
    if (!student) return res.status(403).json({ message: "Student access required" });

    const participants = req.params.roomId.split(".");
    if (
      participants.length !== 2 ||
      !participants.includes(student.registrationNumber) ||
      !participants[0] ||
      !participants[1]
    ) {
      return res.status(403).json({ message: "Conversation access forbidden" });
    }

    const otherRegistrationNumber = participants.find(
      (registrationNumber) => registrationNumber !== student.registrationNumber
    );
    const otherStudent = await Student.exists({
      registrationNumber: otherRegistrationNumber,
    });
    if (!otherStudent) return res.status(404).json({ message: "Student not found" });

    const result = await Message.find({
      roomId: { $in: [req.params.roomId, `${participants[1]}.${participants[0]}`] },
      $or: [
        {
          senderRegistrationNumber: student.registrationNumber,
          receiverRegistrationNumber: otherRegistrationNumber,
        },
        {
          senderRegistrationNumber: otherRegistrationNumber,
          receiverRegistrationNumber: student.registrationNumber,
        },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({ result });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load conversation" });
  }
};

exports.getAllSubjects = async (req, res, next) => {
  try {
    const { department, year, section } = req.user;
    const subjects = await Subject.find({ department, year: String(year) }).lean();

    if (subjects.length === 0) {
      return res.status(404).json({ message: "No subjects found" });
    }
    const facultyBySubject = await getSubjectFacultyMap(subjects, {
      department,
      year: Number(year),
      section,
      academicYear: "2026-27",
    });
    res.status(200).json({
      result: subjects.map((subject) => ({
        ...subject,
        assignedFaculty: facultyBySubject.get(String(subject._id)) || [],
      })),
    });
  } catch (err) {
    return res.status(400).json({ "Error in fetching subjects": err.message });
  }
};

exports.getAllMarks = async (req, res, next) => {
  try {
    const { department, year, id } = req.user;
    const getMarks = await Mark.find({ department, student: id, status: "PUBLISHED" }).populate(
      "subject"
    );

    const UnitTest1 = getMarks.filter((obj) => {
      return obj.exam === "Unit Test 1";
    });

    const UnitTest2 = getMarks.filter((obj) => {
      return obj.exam === "Unit Test 2";
    });

    const Semester = getMarks.filter((obj) => {
      return obj.exam === "Semester";
    });

    res.status(200).json({
      result: {
        UnitTest1,
        UnitTest2,
        Semester,
      },
    });
  } catch (err) {
    return res.status(400).json({ "Error in getting marks": err.message });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const studentId = req.user?._id || req.user?.id;
    const student = await Student.findById(studentId).select("_id department year section").lean();
    if (!student) return res.status(403).json({ message: "Student access required" });

    const semester = req.query.semester ? Number(req.query.semester) : null;
    if (semester !== null && (!Number.isInteger(semester) || semester < 1 || semester > 8)) {
      return res.status(400).json({ message: "Semester must be between 1 and 8" });
    }
    const allPublished = await Mark.find({
      student: student._id,
      status: "PUBLISHED",
      assessmentType: { $in: ASSESSMENTS.map((assessment) => assessment.key) },
    })
      .populate("subject", "subjectCode subjectName department semester year credits")
      .sort({ semester: 1, subject: 1, assessmentType: 1 })
      .lean();
    const pendingFilter = {
      student: student._id,
      status: { $in: ["DRAFT", "SUBMITTED"] },
      assessmentType: { $in: ASSESSMENTS.map((assessment) => assessment.key) },
    };
    if (semester) pendingFilter.semester = semester;
    const pendingPublication = Boolean(await Mark.exists(pendingFilter));

    const grouped = new Map();
    allPublished.forEach((record) => {
      const recordSemester = Number(record.semester || record.subject?.semester);
      if (!recordSemester || (semester && recordSemester !== semester) || !record.subject) return;
      const key = `${record.subject._id}|${recordSemester}|${record.academicYear || ""}`;
      if (!grouped.has(key)) grouped.set(key, { subject: record.subject, semester: recordSemester, academicYear: record.academicYear || "", records: [] });
      grouped.get(key).records.push(record);
    });

    const groups = [...grouped.values()];
    const attendanceEntries = await Promise.all(groups.map(async (group) => {
      const map = await getAttendancePercentages([student._id], group.subject._id);
      return map.get(String(student._id)) ?? null;
    }));
    const results = groups.map((group, index) => {
      const calculation = buildCourseResult(group.records, attendanceEntries[index]);
      const credits = Number.isFinite(Number(group.subject.credits)) ? Number(group.subject.credits) : null;
      return {
        subject: {
          _id: group.subject._id,
          subjectCode: group.subject.subjectCode,
          subjectName: group.subject.subjectName,
        },
        semester: group.semester,
        academicYear: group.academicYear,
        credits,
        ...calculation,
      };
    }).sort((a, b) => a.semester - b.semester || String(a.subject.subjectCode).localeCompare(String(b.subject.subjectCode)));

    const completedResults = results.filter((result) => result.resultStatus !== "IC");
    const semesterGpa = semester ? calculateGpa(completedResults) : { sgpa: null, totalCredits: null };
    const cgpaResults = allPublished.reduce((acc, record) => {
        const recordSemester = Number(record.semester || record.subject?.semester);
        if (!recordSemester || !record.subject) return acc;
        const key = `${record.subject._id}|${recordSemester}|${record.academicYear || ""}`;
        if (!acc.has(key)) acc.set(key, { subject: record.subject, semester: recordSemester, records: [] });
        acc.get(key).records.push(record);
        return acc;
      }, new Map());
    const cgpaRows = await Promise.all([...cgpaResults.values()].map(async (group) => {
      const attendance = await getAttendancePercentages([student._id], group.subject._id);
      return { credits: Number.isFinite(Number(group.subject.credits)) ? Number(group.subject.credits) : null,
        ...buildCourseResult(group.records, attendance.get(String(student._id)) ?? null) };
    }));
    const cgpa = calculateGpa(cgpaRows.filter((result) => result.resultStatus !== "IC"));
    const semesterGroups = new Map();
    cgpaRows.forEach((result, index) => {
      if (result.resultStatus === "IC") return;
      const resultSemester = Number([...cgpaResults.values()][index]?.semester);
      if (!resultSemester) return;
      if (!semesterGroups.has(resultSemester)) semesterGroups.set(resultSemester, []);
      semesterGroups.get(resultSemester).push(result);
    });
    const completedSemesters = [...semesterGroups.entries()]
      .sort(([left], [right]) => left - right)
      .map(([completedSemester, semesterRows]) => ({
        semester: completedSemester,
        ...calculateGpa(semesterRows),
      }));
    const passed = results.filter((result) => result.resultStatus === "PASS").length;
    const failed = results.filter((result) => ["FAIL", "AB", "DX"].includes(result.resultStatus)).length;

    return res.status(200).json({
      result: results,
      summary: {
        semester,
        totalSubjects: results.length,
        passed,
        failed,
        totalCredits: semesterGpa.totalCredits,
        sgpa: semesterGpa.sgpa,
      },
      cgpa: cgpa.sgpa,
      completedSemesters,
      pendingPublication,
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load published results" });
  }
};

exports.differentChats = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user?._id || req.user?.id)
      .select("registrationNumber")
      .lean();
    if (!student) return res.status(403).json({ message: "Student access required" });

    const messages = await Message.find({
      receiverRegistrationNumber: student.registrationNumber,
    })
      .select("senderName receiverName senderRegistrationNumber receiverRegistrationNumber receiverId createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const conversations = new Map();
    messages.forEach((message) => {
      if (!conversations.has(message.senderRegistrationNumber)) {
        conversations.set(message.senderRegistrationNumber, message);
      }
    });
    return res.status(200).json({ result: [...conversations.values()] });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load conversations" });
  }
};

exports.previousChats = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user?._id || req.user?.id)
      .select("registrationNumber")
      .lean();
    if (!student) return res.status(403).json({ message: "Student access required" });

    const messages = await Message.find({
      senderRegistrationNumber: student.registrationNumber,
    })
      .select("senderName receiverName senderRegistrationNumber receiverRegistrationNumber receiverId createdAt")
      .sort({ createdAt: -1 })
      .lean();
    const conversations = new Map();
    messages.forEach((message) => {
      if (!conversations.has(message.receiverRegistrationNumber)) {
        conversations.set(message.receiverRegistrationNumber, message);
      }
    });
    return res.status(200).json({ result: [...conversations.values()] });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load conversations" });
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user?._id || req.user?.id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const updatedData = {};
    if (req.body.email !== undefined) {
      const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
      if (!Validator.isEmail(email)) {
        return res.status(400).json({ message: "Enter a valid email address" });
      }
      const existingEmail = await Student.exists({
        email,
        _id: { $ne: student._id },
      });
      if (existingEmail) {
        return res.status(409).json({ message: "Email is already registered" });
      }
      updatedData.email = email;
    }

    for (const field of ["studentMobileNumber", "fatherMobileNumber"]) {
      if (req.body[field] === undefined || req.body[field] === "") continue;
      const value = String(req.body[field]).trim();
      if (!/^\d{7,15}$/.test(value)) {
        return res.status(400).json({ message: `${field} must contain 7 to 15 digits` });
      }
      updatedData[field] = Number(value);
    }

    if (req.body.fatherName !== undefined) {
      if (
        typeof req.body.fatherName !== "string" ||
        req.body.fatherName.trim().length < 2 ||
        req.body.fatherName.trim().length > 80
      ) {
        return res.status(400).json({ message: "Enter a valid father name" });
      }
      updatedData.fatherName = req.body.fatherName.trim();
    }

    if (
      req.body.avatar &&
      req.body.avatar !== "" &&
      req.body.avatar !== student.avatar?.url
    ) {
      if (!validateAvatarDataUri(req.body.avatar)) {
        return res.status(400).json({ message: "Avatar must be a JPEG or PNG image under 5 MB" });
      }
      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "erp",
        width: 150,
        crop: "scale",
      });

      updatedData.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: "No valid profile changes provided" });
    }

    await Student.findByIdAndUpdate(student._id, updatedData, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }
    console.log("Error in updating Profile", err.message);
    return res.status(500).json({ message: "Error in updating profile" });
  }
};
