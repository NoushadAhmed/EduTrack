const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");

//Validation
const validateAdminRegisterInput = require("../validation/adminRegister");
const validateFacultyRegisterInput = require("../validation/facultyRegister");
const validateStudentRegisterInput = require("../validation/studentRegister");
const validateAdminLoginInput = require("../validation/adminLogin");
const validateSubjectRegisterInput = require("../validation/subjectRegister");

//Models
const Subject = require("../models/Subject");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Admin = require("../models/Admin");

//Config
const keys = require("../config/key");
const { DEPARTMENT_CODES } = require("../config/adminOptions");

const getDepartmentCode = (department) => DEPARTMENT_CODES[department];

const registrationSequence = (count) => count.toString().padStart(3, "0");

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

exports.addAdmin = async (req, res, next) => {
  try {
    const { errors, isValid } = validateAdminRegisterInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { name, email, department, contactNumber } = req.body;

    const admin = await Admin.findOne({ email });

    if (admin) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const avatarUrl = gravatar.url(email, { s: "200", r: "pg", d: "mm" });

    const departmentHelper = getDepartmentCode(department);

    const admins = await Admin.find({ department });
    const helper = registrationSequence(admins.length);

    let hashedPassword;
    hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

    var date = new Date();
    const joiningYear = date.getFullYear();
    var components = ["ADM", joiningYear, departmentHelper, helper];

    var registrationNumber = components.join("");

    const newAdmin = await new Admin({
      name,
      email,
      password: hashedPassword,
      joiningYear,
      registrationNumber,
      department,
      avatar: {
        public_id: "123",
        url: avatarUrl,
      },
      contactNumber,
    });

    await newAdmin.save();
    return res.status(200).json({
      success: true,
      message: "Admin registerd successfully",
      response: newAdmin,
    });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.adminLogin = async (req, res, next) => {
  try {
    const { errors, isValid } = validateAdminLoginInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { registrationNumber, password } = req.body;

    const admin = await Admin.findOne({ registrationNumber });
    if (!admin) {
      errors.registrationNumber = "Registration number not found";
      return res.status(404).json(errors);
    }

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) {
      errors.password = "Wrong Admin Password";
      return res.status(404).json(errors);
    }

    const payload = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      contactNumber: admin.contactNumber,
      avatar: admin.avatar,
      registrationNumber: admin.registrationNumber,
      joiningYear: admin.joiningYear,
      department: admin.department,
    };

    jwt.sign(payload, keys.secretOrKey, { expiresIn: "2d" }, (err, token) => {
      res.json({
        success: true,
        token: "Bearer " + token,
      });
    });
  } catch (err) {
    console.log("Error in admin login", err.message);
  }
};

exports.addStudent = async (req, res, next) => {
  try {
    const { errors, isValid } = validateStudentRegisterInput(req.body);

    if (!isValid) {
      return res.status(400).json(errors);
    }
    const {
      name,
      email,
      year,
      fatherName,
      department,
      section,
      studentMobileNumber,
      fatherMobileNumber,
    } = req.body;

    const student = await Student.findOne({ email });
    if (student) {
      errors.email = "Email already exist";
      return res.status(400).json(errors);
    }

    const avatarUrl = gravatar.url(email, { s: "200", r: "pg", d: "mm" });

    let hashedPassword;
    hashedPassword = await bcrypt.hash(process.env.STUDENT_PASSWORD, 10);
    var date = new Date();
    const batch = date.getFullYear();

    const registrationNumber = await getStudentRegistrationNumber(department, batch);
    const newStudent = await new Student({
      name,
      email,
      password: hashedPassword,
      year,
      fatherName,
      registrationNumber,
      department,
      section,
      batch,
      avatar: {
        public_id: "123",
        url: avatarUrl,
      },
      studentMobileNumber,
      fatherMobileNumber,
    });

    await newStudent.save();

    const subjects = await Subject.find({ year });
    if (subjects.length !== 0) {
      for (var i = 0; i < subjects.length; i++) {
        newStudent.subjects.push(subjects[i]._id);
      }
    }
    await newStudent.save();
    res.status(200).json({ result: newStudent });
  } catch (err) {
    console.log("Error in student registration", err.message);
  }
};

exports.addFaculty = async (req, res, next) => {
  try {
    const { errors, isValid } = validateFacultyRegisterInput(req.body);
    //Validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const { name, email, designation, department, facultyMobileNumber } =
      req.body;

    const faculty = await Faculty.findOne({ email });
    if (faculty) {
      errors.email = "Email already exist";
      return res.status(400).json(errors);
    }

    const avatarUrl = gravatar.url(req.body.email, {
      s: "200", // Size
      r: "pg", // Rating
      d: "mm", // Default
    });

    const departmentHelper = getDepartmentCode(department);

    const faculties = await Faculty.find({ department });
    const helper = registrationSequence(faculties.length);

    let hashedPassword;
    hashedPassword = await bcrypt.hash(process.env.FACULTY_PASSWORD, 10);
    var date = new Date();
    const joiningYear = date.getFullYear();
    var components = ["FAC", joiningYear, departmentHelper, helper];

    var registrationNumber = components.join("");
    const newFaculty = await new Faculty({
      name,
      email,
      designation,
      password: hashedPassword,
      department,
      facultyMobileNumber,
      avatar: {
        public_id: "123",
        url: avatarUrl,
      },
      registrationNumber,
      joiningYear,
    });
    await newFaculty.save();
    res.status(200).json({ result: newFaculty });
  } catch (err) {
    res
      .status(400)
      .json({ message: `Error in adding new Faculty", ${err.message}` });
  }
};

exports.addSubject = async (req, res, next) => {
  try {
    const { errors, isValid } = validateSubjectRegisterInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { totalLectures, department, subjectCode, subjectName, year } =
      req.body;
    const subject = await Subject.findOne({ subjectCode });

    if (subject) {
      errors.subjectCode = "Given Subject is already added";
      return res.status(400).json(errors);
    }

    const newSubject = await new Subject({
      totalLectures,
      department,
      subjectCode,
      subjectName,
      year,
    });
    await newSubject.save();

    const students = await Student.find({ department, year });
    if (students.length === 0) {
      errors.department = "No branch found for given subject";
      return res.status(400).json(errors);
    } else {
      for (var i = 0; i < students.length; i++) {
        students[i].subjects.push(newSubject._id);
        await students[i].save();
      }
      res.status(200).json({ newSubject });
    }
  } catch (err) {
    console.log(`Error in adding new subject", ${err.message}`);
  }
};

exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find();
    if (students.length === 0) {
      return res.status(404).json({ message: "No students found" });
    }

    res.status(200).json({ result: students });
  } catch (err) {
    res
      .status(400)
      .json({ message: `Error in getting all students", ${err.message}` });
  }
};

exports.getAllFaculty = async (req, res, next) => {
  try {
    const faculties = await Faculty.find({});
    if (faculties.length === 0) {
      return res.status(404).json({ message: "No Record Found" });
    }
    res.status(200).json({ result: faculties });
  } catch (err) {
    res
      .status(400)
      .json({ message: `Error in getting all faculties", ${err.message}` });
  }
};

exports.getAllSubjects = async (req, res, next) => {
  try {
    const allSubjects = await Subject.find({});
    if (!allSubjects) {
      return res
        .status(404)
        .json({ message: "You havent registered any subject yet." });
    }
    res.status(200).json(allSubjects);
  } catch (err) {
    res
      .status(400)
      .json({ message: `Error in getting all Subjects", ${err.message}` });
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const { department, year } = req.body;
    const allStudents = await Student.find({ department, year });
    res.status(200).json({ result: allStudents });
  } catch (err) {
    console.log("Error in gettting all students", err.message);
  }
};

exports.getFaculty = async (req, res, next) => {
  try {
    const { department } = req.body;
    const allFaculties = await Faculty.find({ department });
    res.status(200).json({ result: allFaculties });
  } catch (err) {
    console.log("Error in gettting all faculties", err.message);
  }
};

exports.getSubjects = async (req, res, next) => {
  try {
    const { department, year } = req.body;
    const allSubjects = await Subject.find({ department, year });
    res.status(200).json({ result: allSubjects });
  } catch (err) {
    console.log("Error in gettting all students", err.message);
  }
};
