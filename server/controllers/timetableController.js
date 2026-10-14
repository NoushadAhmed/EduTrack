const Timetable = require("../models/Timetable");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");
const { DEPARTMENTS, SECTIONS } = require("../config/adminOptions");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

const semesterToYear = (semester) => String(Math.ceil(Number(semester) / 2));

const populateEntries = (query) =>
  query
    .populate("subject", "subjectCode subjectName department year")
    .populate("faculty", "name registrationNumber department")
    .lean();

const sortEntries = (entries) => {
  const dayOrder = new Map(DAYS.map((day, index) => [day, index]));
  return entries.sort(
    (left, right) =>
      (dayOrder.get(left.day) ?? DAYS.length) - (dayOrder.get(right.day) ?? DAYS.length) ||
      String(left.startTime).localeCompare(String(right.startTime))
  );
};

exports.getAdminTimetable = async (req, res) => {
  try {
    const {
      department,
      semester,
      section,
      academicYear,
      faculty,
      subject,
      search,
    } = req.query;
    const query = {};

    if (department) query.department = department;
    if (semester) {
      const semesterNumber = Number(semester);
      if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 8) {
        return res.status(400).json({ message: "Semester must be between 1 and 8" });
      }
      query.semester = semesterNumber;
      query.year = semesterToYear(semesterNumber);
    }
    if (section) query.section = section;
    if (academicYear) query.academicYear = academicYear;
    if (faculty) query.faculty = faculty;
    if (subject) query.subject = subject;

    const term = typeof search === "string" ? search.trim() : "";
    if (term) {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const expression = new RegExp(escapedTerm, "i");
      const [subjects, faculties] = await Promise.all([
        Subject.find({
          $or: [{ subjectCode: expression }, { subjectName: expression }],
        }).select("_id").lean(),
        Faculty.find({ name: expression }).select("_id").lean(),
      ]);
      const matches = [];
      if (subjects.length) matches.push({ subject: { $in: subjects.map(({ _id }) => _id) } });
      if (faculties.length) matches.push({ faculty: { $in: faculties.map(({ _id }) => _id) } });
      if (!matches.length) {
        return res.status(200).json({ result: [] });
      }
      query.$or = matches;
    }

    const entries = await populateEntries(Timetable.find(query));
    return res.status(200).json({ result: sortEntries(entries) });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load timetable" });
  }
};

exports.createTimetableEntry = async (req, res) => {
  try {
    const {
      department,
      semester,
      section,
      academicYear,
      day,
      startTime,
      endTime,
      subjectCode,
      facultyRegistrationNumber,
      room,
    } = req.body;
    const semesterNumber = Number(semester);
    const normalizedRoom = typeof room === "string" ? room.trim() : "";

    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({ message: "Select a valid department" });
    }
    if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 8) {
      return res.status(400).json({ message: "Select a semester from 1 to 8" });
    }
    if (!SECTIONS.includes(section)) {
      return res.status(400).json({ message: "Select a valid section" });
    }
    if (!/^\d{4}-\d{2}$/.test(academicYear || "")) {
      return res.status(400).json({ message: "Enter an academic year such as 2026-27" });
    }
    if (!DAYS.includes(day)) {
      return res.status(400).json({ message: "Select a valid day" });
    }
    if (!timePattern.test(startTime || "") || !timePattern.test(endTime || "") || startTime >= endTime) {
      return res.status(400).json({ message: "Enter a valid time period; end time must be later" });
    }
    if (!subjectCode || !facultyRegistrationNumber) {
      return res.status(400).json({ message: "Select a subject and faculty member" });
    }

    const year = semesterToYear(semesterNumber);
    const [subject, faculty] = await Promise.all([
      Subject.findOne({ subjectCode }),
      Faculty.findOne({ registrationNumber: facultyRegistrationNumber }),
    ]);

    if (!subject || subject.department !== department || subject.year !== year) {
      return res.status(400).json({
        message: "The selected subject does not match this department and semester year",
      });
    }
    if (!faculty || faculty.department !== department) {
      return res.status(400).json({
        message: "The selected faculty member does not belong to this department",
      });
    }

    const timeOverlap = {
      academicYear,
      day,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    };
    const facultyConflict = await Timetable.exists({
      ...timeOverlap,
      faculty: faculty._id,
    });
    if (facultyConflict) {
      return res.status(409).json({
        message: "Faculty is already assigned during this time.",
      });
    }

    const sectionConflict = await Timetable.exists({
      ...timeOverlap,
      department,
      year,
      semester: semesterNumber,
      section,
    });
    if (sectionConflict) {
      return res.status(409).json({
        message: "This section already has a class during this period.",
      });
    }

    if (normalizedRoom) {
      const roomConflict = await Timetable.exists({
        ...timeOverlap,
        room: normalizedRoom,
      });
      if (roomConflict) {
        return res.status(409).json({
          message: "This room is already assigned during this time.",
        });
      }
    }

    const entry = await Timetable.create({
      department,
      semester: semesterNumber,
      year,
      section,
      academicYear,
      day,
      startTime,
      endTime,
      subject: subject._id,
      faculty: faculty._id,
      room: normalizedRoom,
    });
    const populated = await populateEntries(Timetable.find({ _id: entry._id }));
    return res.status(201).json({ result: populated[0] });
  } catch (err) {
    return res.status(500).json({ message: "Unable to create timetable entry" });
  }
};

exports.rejectLegacyTimetableWrite = async (_req, res) => res.status(410).json({
  success: false,
  message: "Individual timetable entries are no longer supported. Create a versioned class timetable at /api/admin/timetables.",
});

exports.getStudentTimetable = async (req, res) => {
  try {
    const student = await Student.findById(req.user?._id)
      .select("department year section")
      .lean();
    if (!student) return res.status(403).json({ message: "Student access required" });

    const query = {
      department: student.department,
      year: String(student.year),
      section: student.section,
    };
    if (req.query.academicYear) query.academicYear = req.query.academicYear;
    const entries = await populateEntries(Timetable.find(query));
    return res.status(200).json({ result: sortEntries(entries) });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load timetable" });
  }
};

exports.getFacultyTimetable = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user?._id).select("_id").lean();
    if (!faculty) return res.status(403).json({ message: "Faculty access required" });

    const query = { faculty: faculty._id };
    if (req.query.academicYear) query.academicYear = req.query.academicYear;
    const entries = await populateEntries(Timetable.find(query));
    return res.status(200).json({ result: sortEntries(entries) });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load timetable" });
  }
};
