export const ADMIN_DEPARTMENTS = ["CSE", "ECE", "EEE", "ME", "CIVIL", "AIML"];
export const ADMIN_SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];
export const ADMIN_YEARS = ["1", "2", "3", "4"];
export const ADMIN_SECTIONS = ["A", "B"];
export const ADMIN_DEPARTMENT_CODES = {
  CSE: "01",
  ECE: "02",
  EEE: "03",
  ME: "04",
  CIVIL: "05",
  AIML: "06",
};

const currentAcademicYearStart = new Date().getFullYear();
export const ACADEMIC_YEARS = Array.from({ length: 5 }, (_, index) => {
  const startYear = currentAcademicYearStart - 2 + index;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
});

export const semesterToYear = (semester) => {
  const value = Number(semester);

  if (value <= 2) return "1";
  if (value <= 4) return "2";
  if (value <= 6) return "3";
  return "4";
};

export const getSemesterLabel = (semester) => `Semester ${semester}`;
