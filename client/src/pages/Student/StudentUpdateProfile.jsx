import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAlert } from 'react-alert';
import styled, { keyframes } from 'styled-components';
import StudentNavbar from '../../components/StudentNavbar';
import { Input, Btn, Card, FormGroup, Label, PageShell, SectionTitle } from '../../components/UI';
import { studentUpdate, studentLogout } from '../../redux/actions/studentAction';
import { colors, font, radius } from '../../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;
  @media (max-width: 600px) { padding: 24px 16px; }
`;

const AvatarRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const AvatarImg = styled.img`
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid ${colors.border};
`;

const FileLabel = styled.label`
  font-size: 13px;
  color: ${colors.primary};
  cursor: pointer;
  font-family: ${font.family};
  &:hover { text-decoration: underline; }
  input { display: none; }
`;

const StudentUpdateProfile = () => {
  const student = useSelector((s) => s.student);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alert = useAlert();

  const studentData = student?.student?.student;

  const [email, setEmail] = useState(studentData?.email || '');
  const [mobile, setMobile] = useState(studentData?.studentMobileNumber || '');
  const [fatherName, setFatherName] = useState(studentData?.fatherName || '');
  const [fatherMobile, setFatherMobile] = useState(studentData?.fatherMobileNumber || '');
  const [avatar, setAvatar] = useState(studentData?.avatar?.url || '');
  const [avatarPreview, setAvatarPreview] = useState(studentData?.avatar?.url || '');

  if (!studentData) { navigate('/'); return null; }

  const imageHandler = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setAvatarPreview(reader.result); setAvatar(reader.result); };
    reader.readAsDataURL(file);
  };

  const fileHandler = (e) => {
    e.preventDefault();
    const myForm = new FormData();
    myForm.append('studentMobileNumber', mobile);
    myForm.append('email', email);
    myForm.append('fatherName', fatherName);
    myForm.append('fatherMobileNumber', fatherMobile);
    myForm.append('registrationNumber', studentData.registrationNumber);
    myForm.append('avatar', avatar);
    dispatch(studentUpdate(myForm));
    alert.success('Profile updated. Please login again.');
    dispatch(studentLogout());
    navigate('/');
  };

  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <SectionTitle>Update Profile</SectionTitle>
        <Card>
          <form encType="multipart/form-data" onSubmit={fileHandler}>
            <AvatarRow>
              {avatarPreview && <AvatarImg src={avatarPreview} alt="Avatar" />}
              <FileLabel>
                Change photo
                <input type="file" name="avatar" accept="image/*" onChange={imageHandler} />
              </FileLabel>
            </AvatarRow>

            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </FormGroup>
            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Student Mobile</Label>
              <Input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            </FormGroup>
            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Father's Name</Label>
              <Input type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)} required />
            </FormGroup>
            <FormGroup style={{ marginBottom: 20 }}>
              <Label>Father's Mobile</Label>
              <Input type="tel" value={fatherMobile} onChange={(e) => setFatherMobile(e.target.value)} required />
            </FormGroup>

            <Btn type="submit" $full>Save Changes</Btn>
          </form>
        </Card>
      </Content>
    </PageShell>
  );
};

export default StudentUpdateProfile;
