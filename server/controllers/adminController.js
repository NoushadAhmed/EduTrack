const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const jwt = require("jsonwebtoken");
const Validator = require("validator");
const mongoose = require("mongoose");

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
const Attendance = require("../models/Attendance");
const Mark = require("../models/Marks");
const { getSubjectFacultyMap, normalizeAcademicYear } = require("../services/subjectFaculty");

//Config
const keys = require("../config/key");
const { DEPARTMENT_CODES, DEPARTMENTS } = require("../config/adminOptions");

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
      return res.status(409).json({
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
      response: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        registrationNumber: newAdmin.registrationNumber,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }
    return res.status(500).json({ success: false, message: "Unable to create admin" });
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
      role: "admin",
      name: admin.name,
      email: admin.email,
      contactNumber: admin.contactNumber,
      avatar: admin.avatar,
      registrationNumber: admin.registrationNumber,
      joiningYear: admin.joiningYear,
    };

    jwt.sign(payload, keys.secretOrKey, { expiresIn: "2d" }, (err, token) => {
      if (err) return res.status(500).json({ message: "Unable to complete login" });
      return res.json({
        success: true,
        token: "Bearer " + token,
      });
    });
  } catch (err) {
    console.log("Error in admin login", err.message);
    return res.status(500).json({ message: "Unable to complete login" });
  }
};

exports.updateAdminProfile = async (req, res) => {
  const allowedFields = new Set([
    "name",
    "email",
    "contactNumber",
    "joiningYear",
  ]);

  try {
    const body = req.body || {};
    const suppliedFields = Object.keys(body);
    if (
      suppliedFields.length === 0 ||
      suppliedFields.some((field) => !allowedFields.has(field))
    ) {
      return res.status(400).json({
        message: "Only editable profile fields may be updated.",
      });
    }

    const updates = {};
    const errors = {};

    if (Object.prototype.hasOwnProperty.call(body, "name")) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!Validator.isLength(name, { min: 2, max: 30 })) {
        errors.name = "Name must be between 2 and 30 characters.";
      } else {
        updates.name = name;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "email")) {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!Validator.isEmail(email)) {
        errors.email = "Please enter a valid email address.";
      } else {
        updates.email = email;
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "contactNumber")) {
      const contactNumber = String(body.contactNumber ?? "").trim();
      if (!/^\d{7,15}$/.test(contactNumber) || /^0+$/.test(contactNumber)) {
        errors.contactNumber = "Please enter a valid mobile number.";
      } else {
        updates.contactNumber = Number(contactNumber);
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "joiningYear")) {
      const joiningYear = typeof body.joiningYear === "string" ? body.joiningYear.trim() : "";
      const currentYear = new Date().getFullYear();
      if (!/^\d{4}$/.test(joiningYear) || Number(joiningYear) < 1900 || Number(joiningYear) > currentYear) {
        errors.joiningYear = "Please enter a valid joining year.";
      } else {
        updates.joiningYear = joiningYear;
      }
    }

    if (Object.keys(errors).length > 0) {
      const firstError = errors.email || errors.contactNumber || Object.values(errors)[0];
      return res.status(400).json({ message: firstError, errors });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (updates.email) {
      const existingAdmin = await Admin.findOne({
        email: new RegExp(`^${updates.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
        _id: { $ne: req.user._id },
      }).select("_id");
      if (existingAdmin) {
        return res.status(409).json({ message: "Email is already in use." });
      }
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
        select: "name email contactNumber department joiningYear registrationNumber avatar",
      }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin profile not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      admin: {
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        contactNumber: updatedAdmin.contactNumber,
        joiningYear: updatedAdmin.joiningYear,
        registrationNumber: updatedAdmin.registrationNumber,
        avatar: updatedAdmin.avatar,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email is already in use." });
    }
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ message: "Please check the profile information and try again." });
    }
    console.error("Error updating admin profile", err.message);
    return res.status(500).json({ message: "Unable to update profile. Please try again." });
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
      return res.status(409).json(errors);
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

    const subjects = await Subject.find({ department, year });
    if (subjects.length !== 0) {
      for (var i = 0; i < subjects.length; i++) {
        newStudent.subjects.push(subjects[i]._id);
      }
    }
    await newStudent.save();
    res.status(200).json({
      result: {
        _id: newStudent._id,
        name: newStudent.name,
        email: newStudent.email,
        registrationNumber: newStudent.registrationNumber,
      },
    });
  } catch (err) {
    console.log("Error in student registration", err.message);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Student email is already registered" });
    }
    return res.status(500).json({ message: "Unable to add student" });
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
      return res.status(409).json(errors);
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
    res.status(200).json({
      result: {
        _id: newFaculty._id,
        name: newFaculty.name,
        email: newFaculty.email,
        registrationNumber: newFaculty.registrationNumber,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Faculty email is already registered" });
    }
    return res.status(500).json({ message: "Unable to add faculty" });
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
      return res.status(409).json(errors);
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
    for (const student of students) {
      student.subjects.push(newSubject._id);
      await student.save();
    }
    return res.status(200).json({ newSubject });
  } catch (err) {
    return res.status(500).json({ message: "Error in adding new subject" });
  }
};

exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await Student.find().select("-password -otp");
    res.status(200).json({ result: students });
  } catch (err) {
    res
      .status(400)
      .json({ message: `Error in getting all students", ${err.message}` });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({})
      .populate({
        path: "student",
        select: "name registrationNumber department year section",
      })
      .populate({
        path: "subject",
        select: "subjectCode subjectName department year totalLectures",
      })
      .lean();

    return res.status(200).json({
      result: records.map((record) => {
        const totalLectures = Number(record.totalLectures) || 0;
        const lecturesAttended = Number(record.lecturesAttended) || 0;
        return {
          _id: record._id,
          student: record.student || null,
          subject: record.subject || null,
          totalLectures,
          lecturesAttended,
          percentage: totalLectures > 0
            ? Number(((lecturesAttended / totalLectures) * 100).toFixed(2))
            : null,
        };
      }),
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load attendance records" });
  }
};

exports.getAllFaculty = async (req, res, next) => {
  try {
    const faculties = await Faculty.find({}).select("-password -otp");
    res.status(200).json({ result: faculties });
  } catch (err) {
    res
      .status(400)
      .json({ message: `Error in getting all faculties", ${err.message}` });
  }
};

exports.getAllSubjects = async (req, res, next) => {
  try {
    const allSubjects = await Subject.find({}).lean();
    if (!allSubjects) {
      return res
        .status(404)
        .json({ message: "You havent registered any subject yet." });
    }
    const facultyBySubject = await getSubjectFacultyMap(allSubjects);
    res.status(200).json(allSubjects.map((subject) => ({
      ...subject,
      assignedFaculty: facultyBySubject.get(String(subject._id)) || [],
    })));
  } catch (err) {
    res
      .status(400)
      .json({ message: `Error in getting all Subjects", ${err.message}` });
  }
};

exports.getEligibleFacultyForSubject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.subjectId)) {
      return res.status(400).json({ message: "Invalid subject" });
    }
    const subject = await Subject.findById(req.params.subjectId).lean();
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    const faculty = await Faculty.find({
      department: subject.department,
      subjectsCanTeach: subject.subjectCode,
    }).select("_id name registrationNumber designation department assignedSubjects").lean();
    return res.status(200).json({ result: faculty.map(({ assignedSubjects, ...record }) => record) });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load eligible faculty" });
  }
};

exports.assignFacultyToSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { facultyId, section, academicYear } = req.body;
    if (!mongoose.isValidObjectId(subjectId) || !mongoose.isValidObjectId(facultyId)) {
      return res.status(400).json({ message: "Select a valid subject and faculty member" });
    }
    const [subject, faculty] = await Promise.all([
      Subject.findById(subjectId).lean(),
      Faculty.findById(facultyId),
    ]);
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    if (faculty.department !== subject.department ||
      !(faculty.subjectsCanTeach || []).includes(subject.subjectCode)) {
      return res.status(400).json({ message: "Faculty must belong to the subject department and be eligible to teach its subject code" });
    }
    const normalizedSection = String(section || "A").trim();
    const normalizedYear = String(academicYear || subject.academicYear || ASSIGNMENT_ACADEMIC_YEAR).trim();
    if (!normalizedSection || normalizedSection.length > 12) {
      return res.status(400).json({ message: "Provide a valid section" });
    }
    const duplicate = (faculty.assignedSubjects || []).some((assignment) =>
      String(assignment.subject) === String(subject._id) &&
      Number(assignment.semester) === Number(subject.semester) &&
      String(assignment.section || "A").trim() === normalizedSection &&
      normalizeAcademicYear(assignment.academicYear) === normalizeAcademicYear(normalizedYear)
    );
    if (duplicate) return res.status(409).json({ message: "This faculty assignment already exists" });

    const assignment = {
      faculty: faculty._id,
      subject: subject._id,
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      subjectType: subject.subjectType || "",
      department: subject.department,
      semester: Number(subject.semester),
      year: subject.semester ? Math.ceil(Number(subject.semester) / 2) : Number(subject.year),
      section: normalizedSection,
      academicYear: normalizedYear,
    };
    const inserted = await Faculty.updateOne({
      _id: faculty._id,
      assignedSubjects: { $not: { $elemMatch: {
        subject: subject._id,
        semester: Number(subject.semester),
        section: normalizedSection,
        academicYear: normalizedYear,
      } } },
    }, { $push: { assignedSubjects: assignment } });
    if (!inserted.modifiedCount) {
      return res.status(409).json({ message: "This faculty assignment already exists" });
    }
    return res.status(201).json({ message: "Faculty assigned to subject", result: { faculty: faculty._id, subject: subject._id } });
  } catch (err) {
    return res.status(500).json({ message: "Unable to assign faculty to subject" });
  }
};

exports.getStudents = async (req, res, next) => {
  try {
    const { department, year } = req.body;
    const allStudents = await Student.find({ department, year }).select("-password -otp");
    res.status(200).json({ result: allStudents });
  } catch (err) {
    console.log("Error in gettting all students", err.message);
  }
};

exports.getFaculty = async (req, res, next) => {
  try {
    const { department } = req.body;
    const allFaculties = await Faculty.find({ department }).select("-password -otp");
    res.status(200).json({ result: allFaculties });
  } catch (err) {
    console.log("Error in gettting all faculties", err.message);
  }
};

const ASSIGNMENT_ACADEMIC_YEAR = "2026-27";

exports.getFacultyAvailableSubjects = async (req, res) => {
  try {
    const semester = Number(req.query.semester);
    if (!Number.isInteger(semester) || semester < 1 || semester > 8) {
      return res.status(400).json({ message: "Semester must be between 1 and 8" });
    }

    const faculty = await Faculty.findOne({
      registrationNumber: req.params.registrationNumber,
    }).select("department").lean();
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });

    const subjects = await Subject.find({
      department: faculty.department,
      semester,
    })
      .select("_id subjectCode subjectName subjectType semester department")
      .sort({ subjectCode: 1 })
      .lean();

    return res.status(200).json({ result: subjects, department: faculty.department });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load available subjects" });
  }
};

exports.getFacultySubjectAssignments = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({
      registrationNumber: req.params.registrationNumber,
    })
      .select("_id name registrationNumber designation department assignedSubjects")
      .populate("assignedSubjects.subject", "_id subjectCode subjectName department semester year academicYear subjectType")
      .populate("assignedSubjects.faculty", "_id name registrationNumber designation department")
      .lean();
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });

    const subjects = await Subject.find({ department: faculty.department })
      .select("_id subjectCode subjectName department semester year academicYear subjectType")
      .lean();
    const facultyBySubject = await getSubjectFacultyMap(subjects);
    const assignments = [...facultyBySubject.values()].flat()
      .filter((assignment) => assignment.faculty._id === String(faculty._id))
      .map((assignment) => ({
        ...assignment,
        faculty: assignment.faculty._id,
        subject: assignment.subject._id,
        subjectCode: assignment.subject.subjectCode,
        subjectName: assignment.subject.subjectName,
        subjectType: assignment.subject.subjectType || "",
        subjectDetails: assignment.subject,
        facultyDetails: assignment.faculty,
      }));

    return res.status(200).json({
      result: assignments,
      department: faculty.department,
      academicYear: ASSIGNMENT_ACADEMIC_YEAR,
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load assigned subjects" });
  }
};

exports.saveFacultySubjectAssignments = async (req, res) => {
  try {
    const semester = Number(req.body.semester);
    const subjectIds = req.body.subjectIds;
    if (
      !Number.isInteger(semester) || semester < 1 || semester > 8 ||
      !Array.isArray(subjectIds) ||
      subjectIds.some((id) => typeof id !== "string" || !mongoose.isValidObjectId(id)) ||
      new Set(subjectIds).size !== subjectIds.length
    ) {
      return res.status(400).json({ message: "Provide a valid semester and unique subject selection" });
    }

    const faculty = await Faculty.findOne({
      registrationNumber: req.params.registrationNumber,
    });
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });

    const subjects = subjectIds.length
      ? await Subject.find({
          _id: { $in: subjectIds },
          department: faculty.department,
          semester,
        }).select("_id subjectCode subjectName subjectType semester")
      : [];
    if (subjects.length !== subjectIds.length) {
      return res.status(400).json({
        message: "One or more selected subjects are invalid for this faculty department and semester",
      });
    }

    const retained = (faculty.assignedSubjects || []).filter(
      (assignment) =>
        !(assignment.semester === semester && assignment.academicYear === ASSIGNMENT_ACADEMIC_YEAR)
    );
    faculty.assignedSubjects = retained.concat(
      subjects.map((subject) => ({
        faculty: faculty._id,
        subject: subject._id,
        subjectCode: subject.subjectCode,
        subjectName: subject.subjectName,
        subjectType: subject.subjectType || "",
        department: faculty.department,
        semester,
        year: Math.ceil(semester / 2),
        section: "A",
        academicYear: ASSIGNMENT_ACADEMIC_YEAR,
      }))
    );
    await faculty.save();

    return res.status(200).json({
      message: "Subject assignments saved",
      result: faculty.assignedSubjects,
      academicYear: ASSIGNMENT_ACADEMIC_YEAR,
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to save subject assignments" });
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

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const populateMarkRecords = (query) =>
  Mark.find(query)
    .populate("student", "name registrationNumber department year section")
    .populate("subject", "subjectCode subjectName department year")
    .populate("faculty", "name registrationNumber")
    .sort({ exam: 1, _id: 1 })
    .lean();

const getMarkSummary = (records) => {
  const students = new Set();
  const subjects = new Set();
  const scores = [];

  records.forEach((record) => {
    if (record.student?._id) students.add(String(record.student._id));
    if (record.subject?._id) subjects.add(String(record.subject._id));
    if (Number.isFinite(record.marks)) scores.push(record.marks);
  });

  const summary = {
    totalStudents: students.size,
    totalSubjects: subjects.size,
  };

  if (scores.length) {
    summary.averageMarks = Number(
      (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)
    );
  }

  return summary;
};

exports.getResults = async (req, res) => {
  try {
    const { department, semester, section, subjectCode, exam, assessmentType, status, search } =
      req.query;
    const studentFilter = {};
    const subjectFilter = {};
    const markFilter = {};

    if (department) {
      studentFilter.department = department;
      subjectFilter.department = department;
      markFilter.department = department;
    }

    if (section) {
      studentFilter.section = section;
      markFilter.section = section;
    }

    if (semester) {
      const semesterNumber = Number(semester);
      if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 8) {
        return res.status(400).json({ message: "Semester must be between 1 and 8" });
      }

      const year = String(Math.ceil(semesterNumber / 2));
      studentFilter.year = Number(year);
      subjectFilter.year = year;
      markFilter.semester = semesterNumber;
    }

    if (subjectCode) {
      const subject = await Subject.findOne({ subjectCode }).select("_id");
      if (!subject) {
        return res.status(200).json({
          results: [],
          summary: { totalStudents: 0, totalSubjects: 0 },
          exams: [],
        });
      }
      subjectFilter._id = subject._id;
    }

    if (exam) markFilter.exam = exam;
    if (assessmentType) markFilter.assessmentType = assessmentType;
    if (["DRAFT", "SUBMITTED", "PUBLISHED"].includes(status)) markFilter.status = status;
    if (status === "LEGACY") markFilter.status = { $exists: false };

    const hasStudentScope = Object.keys(studentFilter).length > 0;
    const hasSubjectScope = Object.keys(subjectFilter).length > 0;
    const searchTerm = typeof search === "string" ? search.trim() : "";
    const escapedSearch = searchTerm ? escapeRegex(searchTerm) : "";
    let studentIds;
    let subjectIds;

    if (hasStudentScope) {
      const students = await Student.find(studentFilter).select("_id").lean();
      studentIds = students.map((student) => student._id);
    }

    if (hasSubjectScope) {
      const subjects = await Subject.find(subjectFilter).select("_id").lean();
      subjectIds = subjects.map((subject) => subject._id);
    }

    if (hasStudentScope) markFilter.student = { $in: studentIds };
    if (hasSubjectScope) markFilter.subject = { $in: subjectIds };

    if (escapedSearch) {
      const studentSearchFilter = { ...studentFilter, $or: [
        { registrationNumber: { $regex: escapedSearch, $options: "i" } },
        { name: { $regex: escapedSearch, $options: "i" } },
      ] };
      const subjectSearchFilter = { ...subjectFilter, $or: [
        { subjectCode: { $regex: escapedSearch, $options: "i" } },
        { subjectName: { $regex: escapedSearch, $options: "i" } },
      ] };
      const [matchingStudents, matchingSubjects] = await Promise.all([
        Student.find(studentSearchFilter).select("_id").lean(),
        Subject.find(subjectSearchFilter).select("_id").lean(),
      ]);
      const matchingRecords = [];
      if (matchingStudents.length) {
        matchingRecords.push({
          student: { $in: matchingStudents.map((student) => student._id) },
        });
      }
      if (matchingSubjects.length) {
        matchingRecords.push({
          subject: { $in: matchingSubjects.map((subject) => subject._id) },
        });
      }
      if (!matchingRecords.length) {
        return res.status(200).json({
          results: [],
          summary: { totalStudents: 0, totalSubjects: 0 },
          exams: [],
        });
      }
      markFilter.$or = matchingRecords;
    }

    const results = await populateMarkRecords(markFilter);
    const exams = [...new Set(results.map((record) => record.exam).filter(Boolean))];

    return res.status(200).json({
      results,
      summary: getMarkSummary(results),
      exams,
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load results" });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const student = await Student.findOne({
      registrationNumber: req.params.registrationNumber,
    })
      .select("-password -otp")
      .lean();

    if (!student) return res.status(404).json({ message: "Student not found" });

    const results = await populateMarkRecords({ student: student._id });
    const summary = getMarkSummary(results);
    const scores = results.filter(
      (record) => Number.isFinite(record.marks) && Number.isFinite(record.totalMarks)
    );

    if (scores.length) {
      summary.totalMarks = Number(
        scores.reduce((sum, record) => sum + record.marks, 0).toFixed(2)
      );
      const possibleMarks = scores.reduce((sum, record) => sum + record.totalMarks, 0);
      if (possibleMarks > 0) {
        summary.percentage = Number(
          ((summary.totalMarks / possibleMarks) * 100).toFixed(2)
        );
      }
    }

    return res.status(200).json({ student, results, summary });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load results" });
  }
};

exports.getSubjectResults = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      subjectCode: req.params.subjectCode,
    }).lean();

    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const results = await populateMarkRecords({ subject: subject._id });
    return res.status(200).json({
      subject,
      results,
      summary: getMarkSummary(results),
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load results" });
  }
};

exports.publishMark = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.markId)) {
      return res.status(404).json({ message: "Marks record not found" });
    }
    const mark = await Mark.findById(req.params.markId);
    if (!mark) return res.status(404).json({ message: "Marks record not found" });
    if (mark.status !== "SUBMITTED") {
      return res.status(409).json({ message: "Only submitted marks can be published" });
    }
    mark.status = "PUBLISHED";
    mark.publishedAt = new Date();
    await mark.save();
    return res.status(200).json({ message: "Marks published", result: mark });
  } catch (err) {
    console.error("Admin publish marks error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unable to publish marks" });
  }
};

exports.reopenMark = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.markId)) {
      return res.status(404).json({ message: "Marks record not found" });
    }
    const mark = await Mark.findById(req.params.markId);
    if (!mark) return res.status(404).json({ message: "Marks record not found" });
    if (mark.status !== "PUBLISHED") {
      return res.status(409).json({ message: "Only published marks can be reopened" });
    }
    mark.status = "SUBMITTED";
    mark.reopenedAt = new Date();
    await mark.save();
    return res.status(200).json({ message: "Marks reopened for faculty correction", result: mark });
  } catch (err) {
    console.error("Admin reopen marks error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unable to reopen marks" });
  }
};
