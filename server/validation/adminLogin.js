const Validator = require("validator");
const isEmpty = require("./is-empty");

const validateAdminLoginInput = (data) => {
  let errors = {};
  data.registrationNumber = !isEmpty(data.registrationNumber)
    ? data.registrationNumber.trim().toUpperCase()
    : "";
  data.password = !isEmpty(data.password) ? data.password : "";

  if (
    !Validator.isLength(data.registrationNumber, { min: 10, max: 10 }) ||
    !/^ADM\d{7}$/.test(data.registrationNumber)
  ) {
    errors.registrationNumber = "Registration Number must be ADM followed by 7 digits";
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

module.exports = validateAdminLoginInput;
