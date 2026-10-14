const Validator = require("validator");
const isEmpty = require("./is-empty");

const validateFacultyLoginInput = (data) => {
  let errors = {};
  data.registrationNumber = !isEmpty(data.registrationNumber)
    ? data.registrationNumber.trim().toUpperCase()
    : "";
  data.password = !isEmpty(data.password) ? data.password : "";

  const isExistingFormat = /^FAC\d{9}$/.test(data.registrationNumber);
  const isDepartmentFormat = /^FAC\d{4}(?:CSE|ECE|EEE|ME|CIVIL|AIML)\d{3}$/.test(
    data.registrationNumber
  );

  if (!isExistingFormat && !isDepartmentFormat) {
    errors.registrationNumber =
      "Enter a valid faculty registration number";
  }

  if (Validator.isEmpty(data.registrationNumber)) {
    errors.registrationNumber = "Registration Number field is required";
  }

  if (Validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

module.exports = validateFacultyLoginInput;
