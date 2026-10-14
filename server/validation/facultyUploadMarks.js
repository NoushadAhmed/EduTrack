const Validator = require("validator");
const isEmpty = require("./is-empty");

const validateFacultyUploadMarks = (data) => {
  const errors = {};
  const subjectCode =
    typeof data.subjectCode === "string" ? data.subjectCode.trim() : "";
  const exam = typeof data.exam === "string" ? data.exam.trim() : "";
  const totalMarks =
    typeof data.totalMarks === "number" || typeof data.totalMarks === "string"
      ? String(data.totalMarks).trim()
      : "";

  if (Validator.isEmpty(subjectCode)) {
    errors.subjectCode = "Subject Code field is required";
  }

  if (Validator.isEmpty(exam)) {
    errors.exam = "Exam field is required";
  }
  if (Validator.isEmpty(totalMarks)) {
    errors.totalMarks = "Total marks field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

module.exports = validateFacultyUploadMarks;
