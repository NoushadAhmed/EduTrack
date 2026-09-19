import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAlert } from 'react-alert';
import styled, { keyframes } from 'styled-components';
import { getOTPStudent, submitOTPStudent } from '../redux/actions/studentAction';
import { getOTPFaculty, submitOTPFaculty } from '../redux/actions/facultyAction';
import { Input, Btn, Card, FormGroup, Label } from '../components/UI';
import { colors, font, radius } from '../styles/theme';

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

const Wrap = styled.div`
  width: 100%;
  max-width: 400px;
  animation: ${fadeUp} 0.3s ease both;
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
`;

const Sub = styled.p`
  font-size: 13px;
  color: ${colors.textMuted};
  margin-bottom: 24px;
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-top: 16px;
  font-size: 13px;
  color: ${colors.primary};
  font-family: ${font.family};
`;

const ForgotPassword = () => {
  const store = useSelector((s) => s);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();
  const alert = useAlert();

  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [helper, setHelper] = useState(false);

  useEffect(() => { setUser(params.user); }, [params.user]);
  useEffect(() => { if (store.student.flag) setHelper(true); }, [store.student.flag]);

  const sendOtpHandler = (e) => {
    e.preventDefault();
    if (user === 'student') dispatch(getOTPStudent({ email }));
    else if (user === 'faculty') dispatch(getOTPFaculty({ email }));
  };

  const submitOtpHandler = (e) => {
    e.preventDefault();
    if (user === 'student') {
      dispatch(submitOTPStudent({ email, otp, newPassword, confirmNewPassword }));
    } else if (user === 'faculty') {
      dispatch(submitOTPFaculty({ email, otp, newPassword, confirmNewPassword }));
    }
    alert.success('Please login with your new password.');
    navigate('/');
  };

  return (
    <Page>
      <Wrap>
        <Title>Reset Password</Title>
        <Sub>{helper ? 'Enter the OTP sent to your email.' : 'Enter your registered email address.'}</Sub>

        <Card>
          {!helper ? (
            <form onSubmit={sendOtpHandler}>
              <FormGroup style={{ marginBottom: 20 }}>
                <Label>Email Address</Label>
                <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </FormGroup>
              <Btn type="submit" $full>Send OTP</Btn>
            </form>
          ) : (
            <form onSubmit={submitOtpHandler}>
              <FormGroup style={{ marginBottom: 14 }}>
                <Label>OTP</Label>
                <Input type="text" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
              </FormGroup>
              <FormGroup style={{ marginBottom: 14 }}>
                <Label>New Password</Label>
                <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </FormGroup>
              <FormGroup style={{ marginBottom: 20 }}>
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="Confirm password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
              </FormGroup>
              <Btn type="submit" $full>Reset Password</Btn>
            </form>
          )}
        </Card>

        <BackLink to="/">← Back to login</BackLink>
      </Wrap>
    </Page>
  );
};

export default ForgotPassword;
