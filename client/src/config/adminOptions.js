export const ADMIN_DEPARTMENTS = ["CSE", "ECE", "EEE", "ME", "CIVIL", "AIML"];
export const ADMIN_SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];
export const ADMIN_YEARS = ["1", "2", "3", "4"];
export const ADMIN_SECTIONS = ["A", "B"];

export const semesterToYear = (semester) => {
  const value = Number(semester);

  if (value <= 2) return "1";
  if (value <= 4) return "2";
  if (value <= 6) return "3";
  return "4";
};

export const getSemesterLabel = (semester) => `Semester ${semester}`;
