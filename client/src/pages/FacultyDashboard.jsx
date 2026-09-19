import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import FacultyNavbar from '../components/FacultyNavbar';
import { Avatar, InfoRow, InfoLabel, InfoValue, Btn, PageShell } from '../components/UI';
import { colors, font, radius, shadow, transition } from '../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;

  @media (max-width: 600px) { padding: 24px 16px; }
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 24px;
  font-family: ${font.family};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 24px;

  @media (max-width: 700px) { grid-template-columns: 1fr; }
`;

const ProfileCard = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  transition: ${transition.base};
  transform-style: preserve-3d;

  &:hover {
    box-shadow: ${shadow.cardHover};
    transform: perspective(800px) rotateY(-2deg) translateY(-2px);
  }
`;

const Name = styled.h2`
  font-size: 17px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin: 0;
`;

const RegNum = styled.span`
  font-size: 12px;
  color: ${colors.textMuted};
  font-family: 'Courier New', monospace;
  background: ${colors.bgPage};
  padding: 3px 10px;
  border-radius: ${radius.full};
  border: 1px solid ${colors.border};
`;

const RoleBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${colors.primary};
  background: ${colors.primaryLight};
  padding: 3px 10px;
  border-radius: ${radius.full};
`;

const InfoCard = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  padding: 28px;
`;

const CardTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.textPrimary};
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${colors.border};
  font-family: ${font.family};
`;

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const faculty = useSelector((s) => s.faculty);

  if (!faculty.isAuthenticated) { navigate('/'); return null; }

  const f = faculty?.faculty?.faculty;
  const avatarUrl = f?.avatar?.url;
  const firstLetter = f?.name ? f.name.charAt(0) : 'F';

  return (
    <PageShell>
      <FacultyNavbar />
      <Content>
        <PageTitle>My Profile</PageTitle>
        <Grid>
          <ProfileCard>
            <Avatar $size="80px">
              {avatarUrl ? <img src={avatarUrl} alt={firstLetter} /> : firstLetter}
            </Avatar>
            <RoleBadge>Faculty</RoleBadge>
            <Name>{f?.name}</Name>
            <RegNum>{f?.registrationNumber}</RegNum>
            <Btn $variant="outline" $full as={Link} to="/faculty/update" style={{ marginTop: 8 }}>
              Edit Profile
            </Btn>
          </ProfileCard>

          <InfoCard>
            <CardTitle>Faculty Details</CardTitle>
            <InfoRow>
              <InfoLabel>Email</InfoLabel>
              <InfoValue>{f?.email}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Department</InfoLabel>
              <InfoValue>{f?.department}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Designation</InfoLabel>
              <InfoValue>{f?.designation}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Mobile Number</InfoLabel>
              <InfoValue>{f?.facultyMobileNumber || '—'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Joining Year</InfoLabel>
              <InfoValue>{f?.joiningYear}</InfoValue>
            </InfoRow>
          </InfoCard>
        </Grid>
      </Content>
    </PageShell>
  );
};

export default FacultyDashboard;
