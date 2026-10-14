const ASSESSMENTS = Object.freeze([
  { key: "CIE1", label: "CIE 1", group: "CIE", maxMarks: 50 },
  { key: "CIE2", label: "CIE 2", group: "CIE", maxMarks: 50 },
  { key: "CIE3", label: "CIE 3", group: "CIE", maxMarks: 50 },
  { key: "SEE", label: "SEE", group: "SEE", maxMarks: 50 },
]);

const GRADE_BANDS = Object.freeze([
  { minimum: 90, grade: "O", points: 10 },
  { minimum: 80, grade: "A+", points: 9 },
  { minimum: 70, grade: "A", points: 8 },
  { minimum: 60, grade: "B+", points: 7 },
  { minimum: 55, grade: "B", points: 6 },
  { minimum: 50, grade: "C", points: 5 },
  { minimum: 40, grade: "P", points: 4 },
  { minimum: 0, grade: "F", points: 0 },
]);

const getGrade = (percentage) =>
  GRADE_BANDS.find((band) => percentage >= band.minimum) || GRADE_BANDS[GRADE_BANDS.length - 1];

const evaluateCourse = ({ cie, see, seeAbsent = false, attendancePercentage = null }) => {
  if (attendancePercentage !== null && attendancePercentage < 75) {
    return { total: null, percentage: null, grade: "DX", gradePoint: 0, status: "DX" };
  }
  if (seeAbsent) {
    return { total: null, percentage: null, grade: "AB", gradePoint: 0, status: "AB" };
  }
  const hasCie = cie !== null && cie !== undefined && cie !== "" && Number.isFinite(Number(cie));
  const hasSee = see !== null && see !== undefined && see !== "" && Number.isFinite(Number(see));
  if (!hasCie || !hasSee) {
    return { total: null, percentage: null, grade: "IC", gradePoint: 0, status: "IC" };
  }

  const cieValue = Number(cie);
  const seeValue = Number(see);
  const total = Number((cieValue + seeValue).toFixed(2));
  const percentage = Number(total.toFixed(2));
  if (cieValue < 20) {
    return { total, percentage, grade: "DX", gradePoint: 0, status: "DX" };
  }
  if (seeValue < 18 || total < 40) {
    return { total, percentage, grade: "F", gradePoint: 0, status: "FAIL" };
  }

  const band = getGrade(percentage);
  return {
    total,
    percentage,
    grade: band.grade,
    gradePoint: band.points,
    status: band.points >= 4 ? "PASS" : "FAIL",
  };
};

module.exports = { ASSESSMENTS, GRADE_BANDS, evaluateCourse };
