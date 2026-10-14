const Faculty = require("../models/Faculty");

const normalizeAcademicYear = (value) => {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})\s*[-/]\s*(\d{2,4})$/);
  return match ? `${match[1]}-${match[2].slice(-2)}` : text.toLowerCase();
};

const assignmentMatchesSubject = (facultyRecord, assignment, subject, filters = {}) => {
  const assignedFaculty = assignment.faculty && typeof assignment.faculty === "object"
    ? assignment.faculty
    : facultyRecord;
  const facultyId = assignedFaculty?._id || assignedFaculty?.id;

  if (!facultyId || String(facultyId) !== String(facultyRecord._id)) return false;
  if (facultyRecord.department !== subject.department) return false;
  if (assignedFaculty.department !== subject.department) return false;
  if (assignment.department && assignment.department !== subject.department) return false;
  if (assignment.subjectCode && assignment.subjectCode !== subject.subjectCode) return false;

  const semester = Number(assignment.semester);
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) return false;
  if (subject.semester && Number(subject.semester) !== semester) return false;
  if (!subject.semester && subject.year && Math.ceil(semester / 2) !== Number(subject.year)) return false;
  if (filters.department && subject.department !== filters.department) return false;
  if (filters.semester && semester !== Number(filters.semester)) return false;
  if (filters.year && Math.ceil(semester / 2) !== Number(filters.year)) return false;

  const section = String(assignment.section || "").trim();
  if (filters.section && section && section !== String(filters.section)) return false;

  const assignmentYear = normalizeAcademicYear(assignment.academicYear);
  const subjectYear = normalizeAcademicYear(subject.academicYear);
  const requestedYear = normalizeAcademicYear(filters.academicYear);
  if (assignment.academicYear && subject.academicYear && assignmentYear !== subjectYear) return false;
  if (filters.academicYear && assignment.academicYear && assignmentYear !== requestedYear) return false;

  return true;
};

const getSubjectFacultyMap = async (subjects, filters = {}) => {
  const subjectIds = new Set(subjects.map((subject) => String(subject._id)));
  const facultyRecords = await Faculty.find({})
    .select("_id name registrationNumber designation department assignedSubjects")
    .populate("assignedSubjects.subject", "_id subjectCode subjectName department semester year academicYear subjectType")
    .populate("assignedSubjects.faculty", "_id name registrationNumber designation department")
    .lean();
  const bySubject = new Map(subjects.map((subject) => [String(subject._id), []]));

  for (const facultyRecord of facultyRecords) {
    for (const assignment of facultyRecord.assignedSubjects || []) {
      const assignedSubjectId = assignment.subject?._id || assignment.subject;
      const key = String(assignedSubjectId || "");
      let subject = subjectIds.has(key)
        ? subjects.find((item) => String(item._id) === key)
        : null;
      // Older assignment records can retain a deleted/stale subject ObjectId.
      // Resolve those from the immutable assignment snapshot only when the
      // department, code, semester and academic year identify one subject.
      if (!subject && !assignment.subject?._id) {
        const candidates = subjects.filter((item) =>
          item.subjectCode === assignment.subjectCode &&
          item.department === (assignment.department || facultyRecord.department) &&
          Number(item.semester) === Number(assignment.semester) &&
          (!item.academicYear || !assignment.academicYear ||
            normalizeAcademicYear(item.academicYear) === normalizeAcademicYear(assignment.academicYear))
        );
        if (candidates.length === 1) subject = candidates[0];
      }
      if (!subject || !assignmentMatchesSubject(facultyRecord, assignment, subject, filters)) continue;

      const assignedFaculty = assignment.faculty && typeof assignment.faculty === "object"
        ? assignment.faculty
        : facultyRecord;
      bySubject.get(String(subject._id)).push({
        _id: assignment._id,
        faculty: {
          _id: String(assignedFaculty._id),
          name: assignedFaculty.name,
          registrationNumber: assignedFaculty.registrationNumber,
          designation: assignedFaculty.designation,
          department: assignedFaculty.department,
        },
        subject: {
          _id: String(subject._id),
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          department: subject.department,
          semester: subject.semester || Number(assignment.semester),
          year: subject.year,
          subjectType: subject.subjectType || assignment.subjectType || "",
        },
        department: assignment.department || subject.department,
        semester: Number(assignment.semester),
        year: Math.ceil(Number(assignment.semester) / 2),
        section: assignment.section || "",
        academicYear: assignment.academicYear || "",
      });
    }
  }

  for (const assignments of bySubject.values()) {
    assignments.sort((left, right) =>
      left.semester - right.semester ||
      left.section.localeCompare(right.section) ||
      left.academicYear.localeCompare(right.academicYear) ||
      left.faculty.name.localeCompare(right.faculty.name)
    );
  }
  return bySubject;
};

module.exports = { getSubjectFacultyMap, assignmentMatchesSubject, normalizeAcademicYear };
