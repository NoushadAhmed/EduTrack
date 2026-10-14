import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAlert } from 'react-alert';
import styled, { keyframes } from 'styled-components';
import FacultyNavbar from '../../components/FacultyNavbar';
import FacultyBackButton from '../../components/FacultyBackButton';
import { Input, Btn, Card, FormGroup, Label, PageShell, SectionTitle } from '../../components/UI';
import { facultyUpdate, facultyLogout } from '../../redux/actions/facultyAction';
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

const FacultyUpdateProfile = () => {
  const alert = useAlert();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const faculty = useSelector((s) => s.faculty);

  const f = faculty?.faculty?.faculty;
  const existingAvatar = f?.avatar?.url || '';

  const [email, setEmail] = useState(f?.email || '');
  const [mobile, setMobile] = useState(f?.facultyMobileNumber || '');
  const [avatar, setAvatar] = useState(existingAvatar);
  const [avatarPreview, setAvatarPreview] = useState(existingAvatar);

  if (!faculty.isAuthenticated) { navigate('/'); return null; }

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
    myForm.append('facultyMobileNumber', mobile);
    myForm.append('email', email);
    myForm.append('avatar', avatar);
    myForm.append('registrationNumber', f.registrationNumber);
    dispatch(facultyUpdate(myForm));
    alert.success('Profile updated. Please login again.');
    dispatch(facultyLogout());
    navigate('/');
  };

  return (
    <PageShell>
      <FacultyNavbar />
      <Content>
        <FacultyBackButton />
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
            <FormGroup style={{ marginBottom: 20 }}>
              <Label>Mobile Number</Label>
              <Input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
            </FormGroup>

            <Btn type="submit" $full>Save Changes</Btn>
          </form>
        </Card>
      </Content>
    </PageShell>
  );
};

export default FacultyUpdateProfile;
