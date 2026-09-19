const Validator = require("validator");

const isEmpty = require("./is-empty");

const validateStudentLoginInput = (data) => {
  let errors = {};

  data.registrationNumber = !isEmpty(data.registrationNumber)
    ? data.registrationNumber.trim().toUpperCase()
    : "";

  data.password = !isEmpty(data.password)
    ? data.password
    : "";

  // Student USN format:
  // Example: 2KA26CS003
  // Length: 10 characters
  if (
    !Validator.isLength(data.registrationNumber, {
      min: 10,
      max: 10,
    })
  ) {
    errors.registrationNumber =
      "USN must be 10 characters long";
  }

  if (Validator.isEmpty(data.registrationNumber)) {
    errors.registrationNumber =
      "USN is a required field";
  }

  if (Validator.isEmpty(data.password)) {
    errors.password =
      "Password field is required";
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};

module.exports = validateStudentLoginInput;