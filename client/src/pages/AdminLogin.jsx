import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { useAlert } from 'react-alert';
import styled, { keyframes } from 'styled-components';
import { adminLogin } from '../redux/actions/adminAction';
import { colors, font, radius, shadow, transition } from '../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const float1 = keyframes`
  0%, 100% { transform: translateY(0px) rotateX(10deg) rotateY(-6deg); }
  50%       { transform: translateY(-10px) rotateX(10deg) rotateY(-6deg); }
`;
const float2 = keyframes`
  0%, 100% { transform: translateY(0px) rotate(4deg); }
  50%       { transform: translateY(-8px) rotate(4deg); }
`;

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
    min-height: 200px;
  }
`;

const Scene = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
`;

const Shape = styled.div`
  position: absolute;
  background: rgba(255,255,255,${({ $op }) => $op || 0.08});
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: ${({ $round }) => $round ? '50%' : radius.lg};
`;

const S1 = styled(Shape)`
  width: 80px; height: 80px;
  top: 15%; left: 10%;
  animation: ${float1} 4.5s ease-in-out infinite;
`;
const S2 = styled(Shape)`
  width: 50px; height: 50px;
  bottom: 20%; left: 12%;
  border-radius: 50%;
  animation: ${float2} 5s ease-in-out infinite 0.6s;
`;
const S3 = styled(Shape)`
  width: 100px; height: 100px;
  bottom: 8%; right: 8%;
  border-radius: 50%;
  animation: ${float1} 6s ease-in-out infinite 1s;
  $op: 0.05;
`;
const S4 = styled(Shape)`
  width: 36px; height: 36px;
  top: 30%; right: 14%;
  animation: ${float2} 3.8s ease-in-out infinite 0.3s;
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
  margin-bottom: 8px;

  @media (max-width: 768px) { font-size: 28px; }
`;

const BrandSub = styled.p`
  font-size: 13px;
  color: rgba(255,255,255,0.65);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 10px;
`;

const Tagline = styled.p`
  font-size: 15px;
  color: rgba(255,255,255,0.75);
  max-width: 280px;
  line-height: 1.6;
`;

const Right = styled.div`
  width: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  background: ${colors.white};

  @media (max-width: 900px) { width: 360px; padding: 40px 28px; }
  @media (max-width: 768px) { width: 100%; padding: 32px 24px 40px; }
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

const BackLink = styled(Link)`
  display: inline-block;
  margin-top: 20px;
  font-size: 13px;
  color: ${colors.primary};
  font-family: ${font.family};
  transition: ${transition.fast};
  &:hover { color: ${colors.primaryHover}; }
`;

const AdminLogin = () => {
  const dispatch = useDispatch();
  const store = useSelector((s) => s);
  const alert = useAlert();
  const navigate = useNavigate();

  const [regNum, setRegNum] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (store.admin.isAuthenticated) {
      navigate('/admin');
      alert.success('Admin login successful');
    }
  }, [store.admin.isAuthenticated]);

  const loginHandler = (e) => {
    e.preventDefault();
    dispatch(adminLogin({ registrationNumber: regNum, password }));
  };

  return (
    <Page>
      <Left>
        <Scene>
          <S1 /><S2 /><S3 $op={0.05} /><S4 />
        </Scene>
        <LeftContent>
          <Brand>EduTrack</Brand>
          <BrandSub>Admin Portal</BrandSub>
          <Tagline>Manage students, faculty, and subjects from one place.</Tagline>
        </LeftContent>
      </Left>

      <Right>
        <FormWrap>
          <FormTitle>Admin Sign In</FormTitle>
          <FormSub>Enter your admin credentials to continue</FormSub>

          <form onSubmit={loginHandler}>
            <Field>
              <FieldLabel>Admin Registration Number</FieldLabel>
              <Input
                type="text"
                placeholder="e.g. ADM2026010000"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Password</FieldLabel>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <SubmitBtn type="submit">Sign In</SubmitBtn>
          </form>

          <BackLink to="/">← Back to main login</BackLink>
        </FormWrap>
      </Right>
    </Page>
  );
};

export default AdminLogin;
