const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  DEPARTMENT_CODES,
  DEPARTMENTS,
} = require("../config/adminOptions");

// Utils
const sendEmail = require("../utils/nodemailer");
const bufferConversion = require("../utils/bufferConversion");
const cloudinary = require("../utils/cloudinary");

const keys = require("../config/key");

// Validation
const validateFacultyLoginInput = require("../validation/facultyLogin");
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
const Mark = require("../models/Marks");

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
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // Check duplicate email
    const normalizedEmail = email.trim().toLowerCase();

    const existingFaculty = await Faculty.findOne({
      email: normalizedEmail,
    });

    if (existingFaculty) {
      return res.status(400).json({
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
    const { errors, isValid } =
      validateFacultyLoginInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const {
      registrationNumber,
      password,
    } = req.body;

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

    const payload = {
      id: faculty.id,
      faculty,
    };

    jwt.sign(
      payload,
      keys.secretOrKey,
      { expiresIn: "2d" },
      (err, token) => {
        res.json({
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
  }
};

/* =========================================================
   FETCH STUDENTS
========================================================= */
exports.fetchStudents = async (req, res, next) => {
  try {
    const { errors, isValid } =
      validateFetchStudentsInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const {
      department,
      year,
      section,
    } = req.body;

    const subjectList = await Subject.find({
      department,
      year,
    });

    if (subjectList.length === 0) {
      errors.department =
        "No subjects found in given department";

      return res.status(404).json(errors);
    }

    const students = await Student.find({
      department,
      year,
      section,
    });

    if (students.length === 0) {
      errors.department = "No Student found";

      return res.status(404).json(errors);
    }

    res.status(200).json({
      result: students.map((student) => ({
        _id: student._id,
        registrationNumber:
          student.registrationNumber,
        name: student.name,
        email: student.email,
      })),
      subjectCode: subjectList.map(
        (sub) => sub.subjectCode
      ),
    });
  } catch (err) {
    console.log(
      "Error in fetchStudents",
      err.message
    );
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
  try {
    const {
      selectedStudents,
      subjectCode,
      department,
      year,
      section,
    } = req.body;

    console.log(req.body);

    const sub = await Subject.findOne({
      subjectCode,
    });

    if (!sub) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    const allStudents = await Student.find({
      department,
      year,
      section,
    });

    // Students who did not attend
    const filteredArr = allStudents.filter(
      (item) =>
        selectedStudents.indexOf(item.id) === -1
    );

    // Mark absent students
    for (let i = 0; i < filteredArr.length; i++) {
      const prev = await Attendance.findOne({
        student: filteredArr[i]._id,
        subject: sub._id,
      });

      if (!prev) {
        const attendance = new Attendance({
          student: filteredArr[i],
          subject: sub._id,
        });

        attendance.totalLectures += 1;

        await attendance.save();
      } else {
        prev.totalLectures += 1;

        await prev.save();
      }
    }

    // Mark present students
    for (
      let j = 0;
      j < selectedStudents.length;
      j++
    ) {
      const prev = await Attendance.findOne({
        student: selectedStudents[j],
        subject: sub._id,
      });

      if (!prev) {
        const attendance = new Attendance({
          student: selectedStudents[j],
          subject: sub._id,
        });

        attendance.totalLectures += 1;
        attendance.lecturesAttended += 1;

        await attendance.save();
      } else {
        prev.totalLectures += 1;
        prev.lecturesAttended += 1;

        await prev.save();
      }
    }

    res.status(200).json({
      message: "Attendance marked",
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error in marking attendance",
    });
  }
};

/* =========================================================
   UPLOAD MARKS
========================================================= */
exports.uploadMarks = async (
  req,
  res,
  next
) => {
  try {
    const {
      errors,
      isValid,
    } = validateFacultyUploadMarks(
      req.body
    );

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const {
      subjectCode,
      exam,
      totalMarks,
      marks,
      department,
      year,
      section,
    } = req.body;

    const subject = await Subject.findOne({
      subjectCode,
    });

    if (!subject) {
      return res.status(404).json({
        message: "Subject not found",
      });
    }

    const alreadyMarked = await Mark.find({
      exam,
      department,
      section,
      subjectCode: subject._id,
    });

    if (alreadyMarked.length !== 0) {
      errors.exam =
        "Marks have already been uploaded for this record";

      return res.status(400).json(errors);
    }

    for (let i = 0; i < marks.length; i++) {
      const newMarks = new Mark({
        student: marks[i]._id,
        subject: subject._id,
        exam,
        department,
        section,
        marks: marks[i].value,
        totalMarks,
      });

      await newMarks.save();
    }

    res.status(200).json({
      message: "Marks uploaded successfully",
    });
  } catch (err) {
    console.log(
      "Error in uploading marks",
      err.message
    );
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
    const allSubjects = await Subject.find({});

    if (!allSubjects) {
      return res.status(404).json({
        message:
          "You havent registered any subject yet.",
      });
    }

    res.status(200).json({
      allSubjects,
    });
  } catch (err) {
    res.status(400).json({
      message:
        "Error in getting all Subjects",
    });
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
      registrationNumber,
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
      await Faculty.findOne({
        registrationNumber,
      });

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

    res.status(200).json({
      message: "Password Updated",
    });
  } catch (err) {
    console.log(
      "Error in updating password",
      err.message
    );
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

    const generateOTP = () => {
      let OTP = "";

      for (let i = 0; i < 6; i++) {
        OTP += Math.floor(
          Math.random() * 10
        );
      }

      return OTP;
    };

    const OTP = generateOTP();

    faculty.otp = OTP;

    await faculty.save();

    await sendEmail(
      faculty.email,
      OTP,
      "OTP"
    );

    res.status(200).json({
      message:
        "Check your registered Email for OTP",
    });

    const helper = async () => {
      faculty.otp = "";
      await faculty.save();
    };

    setTimeout(helper, 300000);
  } catch (err) {
    console.log(
      "Error in sending OTP email",
      err.message
    );
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

    if (faculty.otp !== otp) {
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
    const {
      email,
      facultyMobileNumber,
      registrationNumber,
    } = req.body;

    const faculty =
      await Faculty.findOne({
        registrationNumber,
      });

    if (!faculty) {
      return res.status(404).json({
        message: "Faculty not found",
      });
    }

    const { _id } = faculty;

    const updatedData = {
      email:
        email || faculty.email,
      facultyMobileNumber:
        facultyMobileNumber ||
        faculty.facultyMobileNumber,
    };

    if (
      req.body.avatar &&
      req.body.avatar !== ""
    ) {
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

    await Faculty.findByIdAndUpdate(
      _id,
      updatedData,
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.log(
      "Error in updating Profile",
      err.message
    );
  }
};