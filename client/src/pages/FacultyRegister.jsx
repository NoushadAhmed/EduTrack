import React, { useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import { facultyRegister } from "../redux/actions/facultyAction";

const Container = styled.div`
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(
    75deg,
    #0077b6 50%,
    #ffffff 50%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 15px;
  box-sizing: border-box;
`;

const Wrapper = styled.div`
  width: 520px;
  max-width: 100%;
  background-color: white;
  border-radius: 15px;
  padding: 35px;
  box-sizing: border-box;
  box-shadow: 0 10px 30px
    rgba(0, 0, 0, 0.08);
`;

const Title = styled.h1`
  text-align: center;
  color: #0077b6;
  margin: 0 0 8px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  margin: 0 0 25px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Input = styled.input`
  width: 100%;
  height: 48px;
  border: 1px solid #0077b6;
  border-radius: 9px;
  padding: 0 15px;
  font-size: 16px;
  box-sizing: border-box;

  &:focus {
    outline: 1px solid #0077b6;
  }
`;

const Select = styled.select`
  width: 100%;
  height: 48px;
  border: 1px solid #0077b6;
  border-radius: 9px;
  padding: 0 15px;
  font-size: 16px;
  background: white;
  box-sizing: border-box;

  &:focus {
    outline: 1px solid #0077b6;
  }
`;

const Button = styled.button`
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 9px;
  background: #0077b6;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #005f8f;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BottomText = styled.p`
  text-align: center;
  margin-top: 20px;
  color: #555;

  a {
    color: tomato;
    text-decoration: none;
    font-weight: 600;
  }
`;

const ErrorMessage = styled.div`
  background: #fff1f0;
  border: 1px solid #ffcccc;
  color: #d32f2f;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
`;

const SuccessBox = styled.div`
  text-align: center;
`;

const SuccessTitle = styled.h2`
  color: #0077b6;
`;

const RegistrationNumber = styled.div`
  margin: 20px 0;
  padding: 15px;
  border: 2px dashed #0077b6;
  border-radius: 10px;
  font-size: 24px;
  font-weight: 700;
  color: #0077b6;
  background: #f5fbff;
`;

const LoginButton = styled.button`
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 9px;
  background: #0077b6;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #005f8f;
  }
`;

const CopyButton = styled.button`
  width: 100%;
  height: 44px;
  margin: 12px 0 16px;
  border: 1px solid #0077b6;
  border-radius: 9px;
  background: #eaf6ff;
  color: #0077b6;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #dfefff;
    border-color: #005f8f;
  }
`;

const CopyStatus = styled.p`
  margin: 0 0 8px;
  color: #d32f2f;
  font-size: 13px;
  text-align: center;
`;

const FacultyRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    facultyMobileNumber: "",
    department: "CSE",
    designation: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [registrationNumber, setRegistrationNumber] =
    useState("");
  const [isCopied, setIsCopied] =
    useState(false);
  const [copyError, setCopyError] =
    useState("");

  const handleCopyRegistrationNumber = async () => {
    if (!registrationNumber) return;

    setCopyError("");

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(registrationNumber);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = registrationNumber;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (!copied) {
          throw new Error("Copy failed");
        }
      }

      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      setCopyError("Unable to copy. Please copy manually.");
    }
  };

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setErrorMessage(
        "Passwords do not match"
      );
      return;
    }

    if (
      formData.password.length < 6
    ) {
      setErrorMessage(
        "Password must be at least 6 characters"
      );
      return;
    }

    setLoading(true);

    try {
      const data =
        await dispatch(
          facultyRegister({
            name: formData.name.trim(),
            email: formData.email
              .trim()
              .toLowerCase(),
            facultyMobileNumber:
              formData.facultyMobileNumber,
            department:
              formData.department,
            designation:
              formData.designation.trim(),
            password:
              formData.password,
          })
        );

      if (
        data &&
        data.success
      ) {
        setRegistrationNumber(
          data.registrationNumber
        );
      } else {
        setErrorMessage(
          data?.message ||
            "Registration failed. Please try again."
        );
      }
    } catch (error) {
      console.error(
        "Faculty registration failed:",
        error
      );

      setErrorMessage(
        error?.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (registrationNumber) {
    return (
      <Container>
        <Wrapper>
          <SuccessBox>
            <SuccessTitle>
              Registration Successful!
            </SuccessTitle>

            <p>
              Your Faculty Registration
              Number is:
            </p>

            <RegistrationNumber>
              {registrationNumber}
            </RegistrationNumber>

            <CopyButton
              type="button"
              onClick={handleCopyRegistrationNumber}
            >
              {isCopied ? "Copied!" : "Copy ID"}
            </CopyButton>

            {copyError && (
              <CopyStatus>
                {copyError}
              </CopyStatus>
            )}

            <p>
              Please save this number.
              You will need it to log in.
            </p>

            <LoginButton
              onClick={() =>
                navigate("/")
              }
            >
              Go to Login
            </LoginButton>
          </SuccessBox>
        </Wrapper>
      </Container>
    );
  }

  return (
    <Container>
      <Wrapper>
        <Title>
          Faculty Registration
        </Title>

        <Subtitle>
          Create your faculty account
        </Subtitle>

        <Form
          onSubmit={handleSubmit}
        >
          <Input
            type="text"
            name="name"
            placeholder="Faculty Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            type="tel"
            name="facultyMobileNumber"
            placeholder="Mobile Number"
            value={
              formData.facultyMobileNumber
            }
            onChange={handleChange}
            required
          />

          <Select
            name="department"
            value={
              formData.department
            }
            onChange={handleChange}
            required
          >
            <option value="CSE">
              CSE
            </option>

            <option value="ECE">
              ECE
            </option>

            <option value="EEE">
              EEE
            </option>

            <option value="ME">
              ME
            </option>

            <option value="CIVIL">
              CIVIL
            </option>

            <option value="AIML">
              AIML
            </option>
          </Select>

          <Input
            type="text"
            name="designation"
            placeholder="Designation"
            value={
              formData.designation
            }
            onChange={handleChange}
            required
          />

          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={
              formData.password
            }
            onChange={handleChange}
            required
          />

          <Input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={
              formData.confirmPassword
            }
            onChange={handleChange}
            required
          />

          {errorMessage && (
            <ErrorMessage>
              {errorMessage}
            </ErrorMessage>
          )}

          <Button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Registering..."
              : "Register"}
          </Button>
        </Form>

        <BottomText>
          Already have an account?{" "}
          <Link to="/">
            Login
          </Link>
        </BottomText>
      </Wrapper>
    </Container>
  );
};

export default FacultyRegister;