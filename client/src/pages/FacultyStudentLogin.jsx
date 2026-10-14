import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useAlert } from 'react-alert';
import styled, { keyframes, css } from 'styled-components';
import { facultyLogin } from '../redux/actions/facultyAction';
import { studentLogin } from '../redux/actions/studentAction';
import { colors, font, radius, shadow, transition } from '../styles/theme';

// ── Animations ────────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const float1 = keyframes`
  0%, 100% { transform: translateY(0px) rotateX(12deg) rotateY(-8deg); }
  50%       { transform: translateY(-12px) rotateX(12deg) rotateY(-8deg); }
`;

const float2 = keyframes`
  0%, 100% { transform: translateY(0px) rotateX(-8deg) rotateY(14deg); }
  50%       { transform: translateY(-9px) rotateX(-8deg) rotateY(14deg); }
`;

const float3 = keyframes`
  0%, 100% { transform: translateY(0px) rotate(6deg); }
  50%       { transform: translateY(-7px) rotate(6deg); }
`;

// ── Layout ────────────────────────────────────────────────────────────────────

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  background: ${colors.bgPage};
  font-family: ${font.family};

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Left = styled.div`
  flex: 1;
  background: ${colors.primary};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 40px 24px 32px;
    min-height: 220px;
  }
`;

const LeftContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  animation: ${fadeUp} 0.5s ease both;
`;

const Brand = styled.h1`
  font-size: 38px;
  font-weight: 700;
  color: white;
  letter-spacing: -1px;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    font-size: 28px;
  }
`;

const Tagline = styled.p`
  font-size: 15px;
  color: rgba(255,255,255,0.75);
  max-width: 300px;
  line-height: 1.6;
`;

// 3D floating shapes
const Scene = styled.div`
  position: absolute;
  inset: 0;
  perspective: 600px;
  pointer-events: none;
`;

const Shape = styled.div`
  position: absolute;
  border-radius: ${({ $round }) => $round ? '50%' : radius.lg};
  background: rgba(255,255,255,${({ $op }) => $op || 0.08});
  border: 1px solid rgba(255,255,255,0.12);
`;

const S1 = styled(Shape)`
  width: 90px; height: 90px;
  top: 12%; left: 8%;
  animation: ${float1} 4.5s ease-in-out infinite;
`;

const S2 = styled(Shape)`
  width: 60px; height: 60px;
  top: 60%; left: 14%;
  $round: true;
  border-radius: 50%;
  animation: ${float2} 5s ease-in-out infinite 0.8s;
`;

const S3 = styled(Shape)`
  width: 44px; height: 44px;
  top: 20%; right: 10%;
  animation: ${float3} 3.8s ease-in-out infinite 0.4s;
`;

const S4 = styled(Shape)`
  width: 110px; height: 110px;
  bottom: 10%; right: 6%;
  border-radius: 50%;
  animation: ${float1} 6s ease-in-out infinite 1.2s;
  $op: 0.05;
`;

const S5 = styled(Shape)`
  width: 30px; height: 30px;
  top: 45%; right: 18%;
  animation: ${float2} 4s ease-in-out infinite 0.2s;
`;

// ── Right panel ───────────────────────────────────────────────────────────────

const Right = styled.div`
  width: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: ${colors.white};

  @media (max-width: 900px) {
    width: 360px;
    padding: 40px 28px;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 32px 24px 40px;
  }
`;

const FormWrap = styled.div`
  width: 100%;
  animation: ${fadeUp} 0.4s ease 0.1s both;
`;

const FormTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
`;

const FormSub = styled.p`
  font-size: 13px;
  color: ${colors.textMuted};
  margin-bottom: 28px;
`;

const Toggle = styled.div`
  display: flex;
  background: ${colors.bgPage};
  border-radius: ${radius.md};
  padding: 3px;
  margin-bottom: 24px;
`;

const ToggleBtn = styled.button`
  flex: 1;
  height: 36px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: ${font.family};
  cursor: pointer;
  transition: ${transition.fast};

  ${({ $active }) => $active ? css`
    background: ${colors.white};
    color: ${colors.primary};
    box-shadow: ${shadow.card};
  ` : css`
    background: transparent;
    color: ${colors.textMuted};
  `}
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
`;

const FieldLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${colors.textSecondary};
`;

const Input = styled.input`
  height: 44px;
  width: 100%;
  padding: 0 14px;
  border: 1.5px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: 14px;
  font-family: ${font.family};
  color: ${colors.textPrimary};
  background: ${colors.white};
  outline: none;
  transition: ${transition.fast};

  &::placeholder { color: ${colors.textMuted}; }
  &:focus {
    border-color: ${colors.borderFocus};
    box-shadow: 0 0 0 3px rgba(26,111,181,0.12);
  }
`;

const SubmitBtn = styled.button`
  width: 100%;
  height: 44px;
  background: ${colors.primary};
  color: white;
  border: none;
  border-radius: ${radius.md};
  font-size: 14px;
  font-weight: 600;
  font-family: ${font.family};
  cursor: pointer;
  margin-top: 8px;
  transition: ${transition.fast};

  &:hover {
    background: ${colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(26,111,181,0.25);
  }
  &:active { transform: translateY(0); }
`;

const Links = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
`;

const FootLink = styled(Link)`
  font-size: 13px;
  color: ${colors.primary};
  font-family: ${font.family};
  transition: ${transition.fast};

  &:hover { color: ${colors.primaryHover}; }
`;

const FootText = styled.span`
  font-size: 13px;
  color: ${colors.textMuted};
  cursor: pointer;
  font-family: ${font.family};
  transition: ${transition.fast};

  &:hover { color: ${colors.primary}; }
`;

// ── Component ─────────────────────────────────────────────────────────────────

const FacultyStudentLogin = () => {
  const dispatch = useDispatch();
  const store = useSelector((s) => s);
  const alert = useAlert();
  const navigate = useNavigate();

  const { isAuthenticated } = useSelector((s) => s.student);
  const { isAuthenticated: facultyAuthenticated } = useSelector((s) => s.faculty);

  const [isStudentLogin, setIsStudentLogin] = useState(true);
  const [studentRegNum, setStudentRegNum] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [facultyRegNum, setFacultyRegNum] = useState('');
  const [facultyPassword, setFacultyPassword] = useState('');

  useEffect(() => { if (facultyAuthenticated) navigate('/faculty'); }, [facultyAuthenticated, navigate]);
  useEffect(() => { if (isAuthenticated) navigate('/home'); }, [isAuthenticated, navigate]);

  const studentLoginHandler = (e) => {
    e.preventDefault();
    dispatch(studentLogin({ registrationNumber: studentRegNum, password: studentPassword }));
  };

  const facultyLoginHandler = (e) => {
    e.preventDefault();
    dispatch(facultyLogin({ registrationNumber: facultyRegNum, password: facultyPassword }));
  };

  return (
    <Page>
      <Left>
        <Scene>
          <S1 /><S2 /><S3 /><S4 $op={0.05} /><S5 />
        </Scene>
        <LeftContent>
          <Brand>EduTrack</Brand>
          <Tagline>Your academic journey, organized and connected.</Tagline>
        </LeftContent>
      </Left>

      <Right>
        <FormWrap>
          <FormTitle>Welcome back</FormTitle>
          <FormSub>Sign in to your portal</FormSub>

          <Toggle>
            <ToggleBtn $active={isStudentLogin} onClick={() => setIsStudentLogin(true)}>
              Student
            </ToggleBtn>
            <ToggleBtn $active={!isStudentLogin} onClick={() => setIsStudentLogin(false)}>
              Faculty
            </ToggleBtn>
          </Toggle>

          {isStudentLogin ? (
            <form onSubmit={studentLoginHandler}>
              <Field>
                <FieldLabel>Student ID</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. 2KA26CS001"
                  value={studentRegNum}
                  onChange={(e) => setStudentRegNum(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  required
                />
              </Field>
              <SubmitBtn type="submit">Sign In</SubmitBtn>
            </form>
          ) : (
            <form onSubmit={facultyLoginHandler}>
              <Field>
                <FieldLabel>Faculty ID</FieldLabel>
                <Input
                  type="text"
                  placeholder="e.g. FAC2026CSE001"
                  value={facultyRegNum}
                  onChange={(e) => setFacultyRegNum(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Password</FieldLabel>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={facultyPassword}
                  onChange={(e) => setFacultyPassword(e.target.value)}
                  required
                />
              </Field>
              <SubmitBtn type="submit">Sign In</SubmitBtn>
            </form>
          )}

          <Links>
            <FootLink to={isStudentLogin ? '/forgotPassword/student' : '/forgotPassword/user'}>
              Forgot password?
            </FootLink>
            <FootLink to="/register">New user? Register here</FootLink>
            <FootLink to="/admin/login">Admin login →</FootLink>
          </Links>
        </FormWrap>
      </Right>
    </Page>
  );
};

export default FacultyStudentLogin;
