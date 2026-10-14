import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAlert } from 'react-alert';
import styled, { keyframes } from 'styled-components';
import FacultyNavbar from '../../components/FacultyNavbar';
import FacultyBackButton from '../../components/FacultyBackButton';
import { Input, Btn, Card, FormGroup, Label, PageShell, SectionTitle } from '../../components/UI';
import { facultyUpdatePassword, facultyLogout } from '../../redux/actions/facultyAction';

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

const FacultyUpdatePassword = () => {
  const faculty = useSelector((s) => s.faculty);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alert = useAlert();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!faculty.isAuthenticated) { navigate('/'); return null; }

  const formHandler = (e) => {
    e.preventDefault();
    dispatch(facultyUpdatePassword({
      oldPassword,
      newPassword,
      confirmNewPassword: confirmPassword,
      registrationNumber: faculty.faculty.faculty.registrationNumber,
    }));
    alert.success('Password updated. Please login again.');
    dispatch(facultyLogout());
    navigate('/');
  };

  return (
    <PageShell>
      <FacultyNavbar />
      <Content>
        <FacultyBackButton />
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
              <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </FormGroup>
            <Btn type="submit" $full>Update Password</Btn>
          </form>
        </Card>
      </Content>
    </PageShell>
  );
};

export default FacultyUpdatePassword;
