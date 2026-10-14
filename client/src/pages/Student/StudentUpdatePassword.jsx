import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAlert } from 'react-alert';
import styled, { keyframes } from 'styled-components';
import StudentNavbar from '../../components/StudentNavbar';
import StudentBackButton from '../../components/StudentBackButton';
import { Input, Btn, Card, FormGroup, Label, PageShell, SectionTitle } from '../../components/UI';
import { studentUpdatePassword, studentLogout } from '../../redux/actions/studentAction';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
  max-width: 420px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;
  @media (max-width: 600px) { padding: 24px 16px; }
`;

const StudentUpdatePassword = () => {
  const student = useSelector((s) => s.student);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alert = useAlert();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  if (!student?.isAuthenticated) { navigate('/'); return null; }

  const formHandler = async (e) => {
    e.preventDefault();

    try {
      await dispatch(studentUpdatePassword({
        oldPassword,
        newPassword,
        confirmNewPassword,
      }));
      alert.success('Password updated. Please login again.');
      dispatch(studentLogout());
      navigate('/');
    } catch (err) {
      // Keep the user on the page and surface backend validation errors.
    }
  };

  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <StudentBackButton />
        <SectionTitle>Change Password</SectionTitle>
        <Card>
          <form onSubmit={formHandler}>
            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Current Password</Label>
              <Input type="password" placeholder="Enter current password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
            </FormGroup>
            <FormGroup style={{ marginBottom: 14 }}>
              <Label>New Password</Label>
              <Input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </FormGroup>
            <FormGroup style={{ marginBottom: 20 }}>
              <Label>Confirm New Password</Label>
              <Input type="password" placeholder="Confirm new password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required />
            </FormGroup>
            <Btn type="submit" $full>Update Password</Btn>
          </form>
        </Card>
      </Content>
    </PageShell>
  );
};

export default StudentUpdatePassword;
