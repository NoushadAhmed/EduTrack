import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import {
  Book,
  Group,
  LibraryBooks,
  People,
  PersonAdd,
  School,
  TrendingUp,
  ArrowForward,
} from '@material-ui/icons';
import AdminLayout from '../components/AdminLayout';
import { colors, font, shadow, transition } from '../styles/theme';

const Page = styled.div`
  padding: 28px 24px 40px;
  box-sizing: border-box;
  font-family: ${font.family};

  @media (max-width: 600px) {
    padding: 20px 16px 32px;
  }
`;

const WelcomeCard = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 26px;
  border-radius: 22px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(255, 255, 255, 1) 100%);
  border: 1px solid rgba(79, 70, 229, 0.14);
  box-shadow: ${shadow.card};
  margin-bottom: 22px;
  transition: ${transition.base};

  html[data-app-theme='dark'] & {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.14) 0%, #1f2937 100%);
    border-color: ${colors.border};
  }

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Kicker = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${colors.primary};
  margin-bottom: 10px;
`;

const Title = styled.h1`
  margin: 0;
  color: ${colors.textPrimary};
  font-size: clamp(28px, 3vw, 38px);
  font-weight: 700;
  letter-spacing: -0.05em;
`;

const Subtitle = styled.p`
  margin: 8px 0 0;
  color: ${colors.textSecondary};
  font-size: 15px;
`;

const SparkTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 999px;
  background: ${colors.white};
  border: 1px solid rgba(79, 70, 229, 0.12);
  padding: 10px 14px;
  color: ${colors.primary};
  font-size: 12px;
  font-weight: 600;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: 18px;
  padding: 18px 18px 16px;
  box-shadow: ${shadow.card};
  transition: ${transition.base};

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${shadow.cardHover};
    border-color: rgba(79, 70, 229, 0.2);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
`;

const IconWrap = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${colors.primaryLight};
  color: ${colors.primary};
`;

const StatLabel = styled.div`
  color: ${colors.textMuted};
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
`;

const StatValue = styled.div`
  color: ${colors.textPrimary};
  font-size: clamp(24px, 3vw, 34px);
  font-weight: 700;
  line-height: 1.1;
`;

const StatNote = styled.div`
  color: ${colors.textSecondary};
  font-size: 12px;
  margin-top: 6px;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const ActionButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: 14px;
  padding: 14px 16px;
  color: ${colors.textPrimary};
  text-decoration: none;
  box-shadow: ${shadow.card};
  transition: ${transition.base};

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(79, 70, 229, 0.18);
    box-shadow: ${shadow.cardHover};
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

const ActionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const ActionIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: ${colors.primaryLight};
  color: ${colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ActionText = styled.span`
  font-size: 13px;
  font-weight: 600;
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ListCard = styled.section`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: 18px;
  padding: 20px;
  box-shadow: ${shadow.card};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: ${colors.textPrimary};
  font-size: 17px;
  font-weight: 700;
`;

const ViewLink = styled(Link)`
  color: ${colors.primary};
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 5px;
  &:hover { text-decoration: underline; }
  &:focus-visible { outline: 2px solid ${colors.primary}; outline-offset: 2px; }
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ListItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 12px;
  background: ${colors.bgPage};
  border: 1px solid ${colors.border};
`;

const UserName = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const UserMeta = styled.div`
  font-size: 12px;
  color: ${colors.textSecondary};
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: ${colors.primaryLight};
  color: ${colors.primary};
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
`;

const ProfilePanel = styled.section`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: 18px;
  box-shadow: ${shadow.card};
  margin-top: 22px;
  padding: 20px;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
`;

const AdminAvatar = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.accent});
  color: ${colors.white};
  font-size: 22px;
  font-weight: 700;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProfileMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProfileName = styled.h3`
  margin: 0;
  color: ${colors.textPrimary};
  font-size: 18px;
  font-weight: 700;
`;

const ProfileRole = styled.div`
  font-size: 12px;
  color: ${colors.primary};
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 4px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 22px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const DetailItem = styled.div`
  padding: 12px 14px;
  border-radius: 12px;
  background: ${colors.bgPage};
  border: 1px solid ${colors.border};
`;

const DetailLabel = styled.div`
  color: ${colors.textMuted};
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  margin-bottom: 5px;
`;

const DetailValue = styled.div`
  color: ${colors.textPrimary};
  font-size: 14px;
  font-weight: 600;
`;

const EmptyInfo = styled.div`
  color: ${colors.textSecondary};
  font-size: 13px;
`;

const LoadError = styled(EmptyInfo)`
  margin: 0 0 16px;
  color: #b42318;
`;

const AdminDashboard = () => {
  const admin = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!admin.isAuthenticated) return undefined;

    let isMounted = true;

    Promise.all([
      axios.post('/api/admin/getAllStudent').catch((error) => {
        if (error.response?.status === 404) return { data: { result: [] } };
        throw error;
      }),
      axios.post('/api/admin/getAllFaculty').catch((error) => {
        if (error.response?.status === 404) return { data: { result: [] } };
        throw error;
      }),
      axios.post('/api/admin/getAllSubject'),
    ])
      .then(([studentRes, facultyRes, subjectRes]) => {
        if (!isMounted) return;
        const studentList = Array.isArray(studentRes?.data?.result) ? studentRes.data.result : [];
        const facultyList = Array.isArray(facultyRes?.data?.result) ? facultyRes.data.result : [];
        const subjectList = Array.isArray(subjectRes?.data)
          ? subjectRes.data
          : Array.isArray(subjectRes?.data?.result)
            ? subjectRes.data.result
            : [];

        setStudents(studentList);
        setFaculty(facultyList);
        setSubjects(subjectList);
        setIsLoading(false);
      }).catch(() => {
        if (isMounted) {
          setLoadError('Dashboard statistics could not be loaded. Please try again.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [admin.isAuthenticated]);

  if (!admin.isAuthenticated) {
    navigate('/admin/login');
    return null;
  }

  const currentAdmin = admin.admin || {};
  const departmentSet = new Set(subjects.map((subject) => subject?.department).filter(Boolean));
  const statsUnavailable = isLoading || Boolean(loadError);

  const recentStudents = students.slice(0, 4);
  const recentFaculty = faculty.slice(0, 4);

  return (
    <AdminLayout>
      <Page>
        <WelcomeCard>
          <div>
            <Kicker>Overview</Kicker>
            <Title>Welcome back, {currentAdmin.name || 'Admin'}</Title>
            <Subtitle>Manage your college academic system from one place.</Subtitle>
          </div>
          <SparkTag>
            <TrendingUp fontSize="small" />
            Live ERP data
          </SparkTag>
        </WelcomeCard>

        {loadError && <LoadError role="alert">{loadError}</LoadError>}

        <StatGrid>
          <StatCard>
            <StatHeader>
              <IconWrap><People fontSize="small" /></IconWrap>
              <Badge>{statsUnavailable ? '—' : students.length}</Badge>
            </StatHeader>
            <StatLabel>Total Students</StatLabel>
            <StatValue>{statsUnavailable ? '—' : students.length}</StatValue>
            <StatNote>Active student records</StatNote>
          </StatCard>

          <StatCard>
            <StatHeader>
              <IconWrap><Group fontSize="small" /></IconWrap>
              <Badge>{statsUnavailable ? '—' : faculty.length}</Badge>
            </StatHeader>
            <StatLabel>Total Faculty</StatLabel>
            <StatValue>{statsUnavailable ? '—' : faculty.length}</StatValue>
            <StatNote>Faculty members</StatNote>
          </StatCard>

          <StatCard>
            <StatHeader>
              <IconWrap><LibraryBooks fontSize="small" /></IconWrap>
              <Badge>{statsUnavailable ? '—' : subjects.length}</Badge>
            </StatHeader>
            <StatLabel>Total Subjects</StatLabel>
            <StatValue>{statsUnavailable ? '—' : subjects.length}</StatValue>
            <StatNote>Active subject entries</StatNote>
          </StatCard>

          <StatCard>
            <StatHeader>
              <IconWrap><School fontSize="small" /></IconWrap>
              <Badge>{statsUnavailable ? '—' : departmentSet.size}</Badge>
            </StatHeader>
            <StatLabel>Departments</StatLabel>
            <StatValue>{statsUnavailable ? '—' : departmentSet.size}</StatValue>
            <StatNote>Departments in use</StatNote>
          </StatCard>
        </StatGrid>

        <ActionGrid>
          <ActionButton to="/admin/add/students">
            <ActionMeta>
              <ActionIcon><PersonAdd fontSize="small" /></ActionIcon>
              <ActionText>Add Student</ActionText>
            </ActionMeta>
            <ArrowForward fontSize="small" />
          </ActionButton>

          <ActionButton to="/admin/add/faculties">
            <ActionMeta>
              <ActionIcon><Group fontSize="small" /></ActionIcon>
              <ActionText>Add Faculty</ActionText>
            </ActionMeta>
            <ArrowForward fontSize="small" />
          </ActionButton>

          <ActionButton to="/admin/add/subjects">
            <ActionMeta>
              <ActionIcon><Book fontSize="small" /></ActionIcon>
              <ActionText>Add Subject</ActionText>
            </ActionMeta>
            <ArrowForward fontSize="small" />
          </ActionButton>

          <ActionButton to="/admin/students">
            <ActionMeta>
              <ActionIcon><People fontSize="small" /></ActionIcon>
              <ActionText>View Students</ActionText>
            </ActionMeta>
            <ArrowForward fontSize="small" />
          </ActionButton>

          <ActionButton to="/admin/faculty">
            <ActionMeta>
              <ActionIcon><Group fontSize="small" /></ActionIcon>
              <ActionText>View Faculty</ActionText>
            </ActionMeta>
            <ArrowForward fontSize="small" />
          </ActionButton>
        </ActionGrid>

        <OverviewGrid>
          <ListCard>
            <SectionHeader>
              <SectionTitle>Recently added students</SectionTitle>
              <ViewLink to="/admin/students">View all</ViewLink>
            </SectionHeader>
            {recentStudents.length ? (
              <List>
                {recentStudents.map((student) => (
                  <ListItem key={student.registrationNumber || student._id || student.name}>
                    <div>
                      <UserName>{student.name || 'Student'}</UserName>
                      <UserMeta>{student.registrationNumber || 'Registration N/A'}</UserMeta>
                    </div>
                    <Badge>{student.department || 'Department'}</Badge>
                  </ListItem>
                ))}
              </List>
            ) : (
              <EmptyInfo>No student records available yet.</EmptyInfo>
            )}
          </ListCard>

          <ListCard>
            <SectionHeader>
              <SectionTitle>Recently added faculty</SectionTitle>
              <ViewLink to="/admin/faculty">View all</ViewLink>
            </SectionHeader>
            {recentFaculty.length ? (
              <List>
                {recentFaculty.map((member) => (
                  <ListItem key={member.registrationNumber || member._id || member.name}>
                    <div>
                      <UserName>{member.name || 'Faculty'}</UserName>
                      <UserMeta>{member.registrationNumber || 'Registration N/A'}</UserMeta>
                    </div>
                    <Badge>{member.department || 'Department'}</Badge>
                  </ListItem>
                ))}
              </List>
            ) : (
              <EmptyInfo>No faculty records available yet.</EmptyInfo>
            )}
          </ListCard>
        </OverviewGrid>

        <ProfilePanel>
          <ProfileHeader>
            <AdminAvatar>
              {currentAdmin.avatar?.url
                ? <img src={currentAdmin.avatar.url} alt="" />
                : (currentAdmin.name || 'A').charAt(0).toUpperCase()}
            </AdminAvatar>
            <ProfileMeta>
              <ProfileName>{currentAdmin.name || 'Administrator'}</ProfileName>
              <ProfileRole>Administrator</ProfileRole>
            </ProfileMeta>
            <ViewLink to="/admin/profile">Profile</ViewLink>
          </ProfileHeader>

          <DetailGrid>
            <DetailItem>
              <DetailLabel>Email</DetailLabel>
              <DetailValue>{currentAdmin.email || 'Not available'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Scope</DetailLabel>
              <DetailValue>ALL DEPARTMENTS</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Contact Number</DetailLabel>
              <DetailValue>{currentAdmin.contactNumber || 'Not available'}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>Joining Year</DetailLabel>
              <DetailValue>{currentAdmin.joiningYear || 'Not set'}</DetailValue>
            </DetailItem>
          </DetailGrid>
        </ProfilePanel>
      </Page>
    </AdminLayout>
  );
};

export default AdminDashboard;
