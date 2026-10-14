const Attendance = require("../models/Attendance");
const { evaluateCourse } = require("../config/vtu2022Assessment");

const calculateAttendancePercentage = (record) => {
  if (!record || !Number(record.totalLectures)) return null;
  return (Number(record.lecturesAttended || 0) / Number(record.totalLectures)) * 100;
};

const getAttendancePercentages = async (studentIds, subjectId) => {
  const records = await Attendance.find({ student: { $in: studentIds }, subject: subjectId })
    .select("student totalLectures lecturesAttended")
    .lean();
  return new Map(records.map((record) => [
    String(record.student),
    calculateAttendancePercentage(record),
  ]));
};

const buildCourseResult = (records, attendancePercentage = null) => {
  const cieRecords = records.filter((record) => /^CIE[123]$/.test(record.assessmentType));
  const cieMarks = cieRecords
    .filter((record) => record.marks !== null && record.marks !== undefined && record.marks !== "")
    .map((record) => Number(record.marks))
    .filter(Number.isFinite);
  const cie = cieMarks.length
    ? Number((cieMarks.reduce((sum, mark) => sum + mark, 0) / cieMarks.length).toFixed(2))
    : null;
  const seeRecord = records.find((record) => record.assessmentType === "SEE");
  const see = seeRecord && seeRecord.marks !== null && seeRecord.marks !== undefined && Number.isFinite(Number(seeRecord.marks))
    ? Number(seeRecord.marks)
    : null;
  const evaluation = evaluateCourse({
    cie,
    see,
    seeAbsent: seeRecord?.resultStatus === "AB",
    attendancePercentage,
  });
  const assessmentStatuses = Object.fromEntries(records.map((record) => [
    record.assessmentType,
    record.status,
  ]));
  const status = records.reduce((current, record) => {
    const order = { DRAFT: 1, SUBMITTED: 2, PUBLISHED: 3 };
    return (order[record.status] || 0) > (order[current] || 0) ? record.status : current;
  }, "");

  return {
    cie,
    see,
    total: evaluation.total,
    percentage: evaluation.percentage,
    grade: evaluation.grade,
    gradePoint: evaluation.gradePoint,
    resultStatus: evaluation.status,
    attendancePercentage: attendancePercentage === null ? null : Number(attendancePercentage.toFixed(2)),
    assessmentStatuses,
    workflowStatus: status || "DRAFT",
  };
};

const calculateGpa = (results) => {
  if (!results.length || results.some((result) => result.credits === null || result.credits === undefined || !Number.isFinite(Number(result.credits)))) {
    return { sgpa: null, totalCredits: null };
  }
  const totalCredits = results.reduce((sum, result) => sum + Number(result.credits), 0);
  if (!totalCredits) return { sgpa: null, totalCredits: 0 };
  const weightedPoints = results.reduce(
    (sum, result) => sum + (Number(result.credits) * Number(result.gradePoint || 0)),
    0
  );
  return { sgpa: Number((weightedPoints / totalCredits).toFixed(2)), totalCredits };
};

module.exports = { buildCourseResult, calculateGpa, getAttendancePercentages };
