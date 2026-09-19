import React from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { colors, font, radius, shadow, transition } from '../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: ${colors.bgPage};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: ${font.family};
`;

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  padding: 40px 32px;
  animation: ${fadeUp} 0.3s ease both;
`;

const Logo = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.primary};
  margin-bottom: 4px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 20px 0 6px;
`;

const Sub = styled.p`
  font-size: 13px;
  color: ${colors.textMuted};
  margin-bottom: 28px;
`;

const OptionBtn = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  border-radius: ${radius.md};
  font-size: 14px;
  font-weight: 600;
  font-family: ${font.family};
  text-decoration: none;
  transition: ${transition.fast};
  margin-bottom: 12px;

  background: ${({ $outline }) => $outline ? 'transparent' : colors.primary};
  color: ${({ $outline }) => $outline ? colors.primary : 'white'};
  border: 1.5px solid ${colors.primary};

  &:hover {
    background: ${({ $outline }) => $outline ? colors.primaryLight : colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(26,111,181,0.2);
  }
`;

const BackLink = styled(Link)`
  display: block;
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: ${colors.primary};
  font-family: ${font.family};
  &:hover { text-decoration: underline; }
`;

const Register = () => (
  <Page>
    <Card>
      <Logo>EduTrack</Logo>
      <Title>Create Account</Title>
      <Sub>Choose the type of account you want to register.</Sub>
      <OptionBtn to="/register/student">Student Registration</OptionBtn>
      <OptionBtn to="/register/faculty" $outline>Faculty Registration</OptionBtn>
      <BackLink to="/">← Back to Login</BackLink>
    </Card>
  </Page>
);

export default Register;
