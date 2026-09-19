import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import AdminNavbar from '../components/AdminNavbar';
import { colors, font, radius, shadow, transition } from '../styles/theme';
import { Avatar, InfoRow, InfoLabel, InfoValue, Btn } from '../components/UI';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Page = styled.div`
  min-height: 100vh;
  background: ${colors.bgPage};
  font-family: ${font.family};
`;

const Content = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;

  @media (max-width: 600px) { padding: 24px 16px; }
`;

const CollegeBar = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 16px 24px;
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CollegeName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const CollegeSub = styled.span`
  font-size: 12px;
  color: ${colors.textMuted};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
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
  gap: 12px;
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
`;

const QuickLinks = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 20px;

  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const QuickLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  border-radius: ${radius.md};
  border: 1.5px solid ${colors.border};
  font-size: 13px;
  font-weight: 500;
  color: ${colors.textSecondary};
  font-family: ${font.family};
  transition: ${transition.fast};
  text-decoration: none;

  &:hover {
    border-color: ${colors.primary};
    color: ${colors.primary};
    background: ${colors.primaryLight};
  }
`;

const AdminDashboard = () => {
  const admin = useSelector((s) => s.admin);
  const navigate = useNavigate();

  if (!admin.isAuthenticated) {
    navigate('/admin/login');
    return null;
  }

  const a = admin.admin;
  const avatarUrl = a?.avatar?.url;
  const firstLetter = a?.name ? a.name.charAt(0) : 'A';

  return (
    <Page>
      <AdminNavbar />
      <Content>
        <CollegeBar>
          <CollegeName>Smt Kamala And Sri Venkappa M. Agadi College of Engineering &amp; Technology</CollegeName>
          <CollegeSub>Visvesvaraya Technological University (VTU) · SKSVM ACET ERP</CollegeSub>
        </CollegeBar>

        <Grid>
          <ProfileCard>
            <Avatar $size="80px">
              {avatarUrl ? <img src={avatarUrl} alt={firstLetter} /> : firstLetter}
            </Avatar>
            <RoleBadge>Administrator</RoleBadge>
            <Name>{a?.name}</Name>
            <RegNum>{a?.registrationNumber}</RegNum>
            <Btn $variant="outline" $full as={Link} to="/admin/add/students" style={{ marginTop: 8 }}>
              Manage Students
            </Btn>
          </ProfileCard>

          <InfoCard>
            <CardTitle>Profile Details</CardTitle>
            <InfoRow>
              <InfoLabel>Email</InfoLabel>
              <InfoValue>{a?.email}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Department</InfoLabel>
              <InfoValue>{a?.department}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Contact Number</InfoLabel>
              <InfoValue>{a?.contactNumber || '—'}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Joining Year</InfoLabel>
              <InfoValue>{a?.joiningYear}</InfoValue>
            </InfoRow>

            <CardTitle style={{ marginTop: 24 }}>Quick Actions</CardTitle>
            <QuickLinks>
              <QuickLink to="/admin/add/students">+ Add Student</QuickLink>
              <QuickLink to="/admin/add/faculties">+ Add Faculty</QuickLink>
              <QuickLink to="/admin/add/subjects">+ Add Subject</QuickLink>
              <QuickLink to="/admin/students">Search Students</QuickLink>
              <QuickLink to="/admin/faculties">Search Faculty</QuickLink>
              <QuickLink to="/admin/subjects">Search Subjects</QuickLink>
            </QuickLinks>
          </InfoCard>
        </Grid>
      </Content>
    </Page>
  );
};

export default AdminDashboard;
