import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowForward } from '@material-ui/icons';
import FacultyNavbar from '../components/FacultyNavbar';
import { Avatar, Btn, Card, PageShell } from '../components/UI';
import { colors, font, radius, shadow, transition } from '../styles/theme';

const Content = styled.main`
  width: 100%;
  margin: 0 auto;
  padding: 28px 24px 48px;
  font-family: ${font.family};
  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const WelcomeCard = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 26px;
  margin-bottom: 20px;
  border: 1px solid rgba(79, 70, 229, 0.14);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, ${colors.white} 100%);
  box-shadow: ${shadow.card};

  html[data-app-theme='dark'] & {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.14) 0%, ${colors.white} 100%);
    border-color: ${colors.border};
  }

  @media (max-width: 680px) { flex-direction: column; align-items: flex-start; }
`;

const Eyebrow = styled.div`
  margin-bottom: 8px;
  color: ${colors.primary};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  margin: 20px 0;
  @media (max-width: 960px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 620px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 420px) { grid-template-columns: 1fr; }
`;

const ActionLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  padding: 13px 14px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.white};
  color: ${colors.textPrimary};
  box-shadow: ${shadow.card};
  font-size: 12px;
  font-weight: 600;
  transition: ${transition.fast};
  &:hover { color: ${colors.primary}; border-color: rgba(79,70,229,0.2); box-shadow: ${shadow.cardHover}; transform: translateY(-1px); }
  &:focus-visible { outline: 2px solid ${colors.primary}; outline-offset: 2px; }
`;

const Title = styled.h1`
  margin: 0;
  color: ${colors.textPrimary};
  font-size: 28px;
`;

const Subtitle = styled.p`
  margin: 6px 0 0;
  color: ${colors.textMuted};
  font-size: 14px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  @media (max-width: 850px) { grid-template-columns: 1fr; }
`;

const ProfileCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 28px 20px;
`;

const RoleBadge = styled.span`
  background: ${colors.primaryLight};
  color: ${colors.primary};
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const Name = styled.h2`
  margin: 0;
  font-size: 22px;
  color: ${colors.textPrimary};
`;

const RegNum = styled.div`
  font-size: 12px;
  color: ${colors.textMuted};
  background: ${colors.bgPage};
  border: 1px solid ${colors.border};
  border-radius: 999px;
  padding: 6px 12px;
  font-family: 'Courier New', monospace;
`;

const StatsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
`;

const StatCard = styled(Card)`
  padding: 18px 18px 16px;
  border-left: 4px solid ${colors.primary};
  transition: ${transition.base};
  &:hover { box-shadow: ${shadow.cardHover}; transform: translateY(-2px); border-color: rgba(79,70,229,0.2); }
`;

const StatLabel = styled.div`
  color: ${colors.textMuted};
  font-size: 12px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const StatValue = styled.div`
  color: ${colors.textPrimary};
  font-size: 28px;
  font-weight: 700;
`;

const DetailCard = styled(Card)`
  padding: 20px;
`;

const DetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const SectionHeading = styled.h3`
  margin: 0;
  font-size: 16px;
  color: ${colors.textPrimary};
`;

const DetailList = styled.div`
  display: grid;
  gap: 12px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid ${colors.border};
  padding-bottom: 10px;
  color: ${colors.textSecondary};
  font-size: 14px;
  & > span:first-child { color: ${colors.textMuted}; }
`;

const TimetableList = styled.div`
  display: grid;
  gap: 10px;
`;

const ScheduleItem = styled.div`
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.bgPage};
  padding: 12px 14px;
  font-size: 14px;
  color: ${colors.textPrimary};
  a { display:inline-block;margin-top:7px;color:${colors.primary};font-size:12px;font-weight:600;text-decoration:none; }
`;

const EmptyState = styled.div`
  color: ${colors.textSecondary};
  font-size: 14px;
  padding: 18px 0 4px;
`;

const FacultyDashboard = () => {
  const faculty = useSelector((state) => state.faculty);
  const isAuthenticated = Boolean(faculty?.isAuthenticated);
  const facultyData = faculty?.faculty?.faculty || faculty?.faculty || {};
  const [timetable, setTimetable] = useState([]);
  const [subjectCount, setSubjectCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;

    const loadDashboardData = async () => {
      setLoading(true);
      setError('');

      try {
        const [{ data: timetableData }, { data: assignmentData }] = await Promise.all([
          axios.get('/api/faculty/timetable'),
          axios.get('/api/faculty/assignedSubjects'),
        ]);

        if (!active) return;

        const timetableEntries = Array.isArray(timetableData?.result) ? timetableData.result : [];
        const assignments = Array.isArray(assignmentData?.result)
          ? assignmentData.result.filter((assignment) => assignment?.isActive !== false)
          : [];

        setTimetable(timetableEntries);
        setSubjectCount(assignments.length);

        const assignedStudentLists = await Promise.all(assignments.map(async (assignment) => {
          const { data } = await axios.get(
            `/api/faculty/assignedSubjects/${encodeURIComponent(assignment._id)}/students`
          );
          return Array.isArray(data?.result) ? data.result : [];
        }));
        const uniqueStudentIds = new Set();
        assignedStudentLists.flat().forEach((student) => {
          const uniqueId = student?._id || student?.registrationNumber;
          if (uniqueId) uniqueStudentIds.add(String(uniqueId));
        });
        if (active) setStudentCount(uniqueStudentIds.size);
      } catch {
        if (active) setError('Unable to load dashboard data.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboardData();
    return () => { active = false; };
  }, [facultyData?._id, facultyData?.department, isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const todayDate = new Date();
  const today = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const saturdayWeek = Math.ceil(todayDate.getDate() / 7);
  const saturdayLabel = today === 'Saturday' ? `Saturday (${saturdayWeek === 1 ? '1st' : saturdayWeek === 2 ? '2nd' : saturdayWeek === 3 ? '3rd' : '4th'})` : '';
  const todaysClasses = timetable.filter((entry) => entry?.day === today || (saturdayLabel && entry?.day === saturdayLabel));
  const avatarUrl = facultyData?.avatar?.url || '';
  const firstLetter = facultyData?.name ? facultyData.name.charAt(0).toUpperCase() : 'F';

  return (
    <PageShell>
      <FacultyNavbar />
      <Content>
        <WelcomeCard>
          <div>
            <Eyebrow>Faculty overview</Eyebrow>
            <Title>Welcome back, {facultyData?.name || 'Faculty'}</Title>
            <Subtitle>Manage your teaching activities, students and academic updates.</Subtitle>
          </div>
          <Btn as={Link} to="/faculty/update" $variant="outline">Update Profile</Btn>
        </WelcomeCard>

        <Grid>
          <ProfileCard>
            <Avatar $size="96px">
              {avatarUrl ? <img src={avatarUrl} alt={facultyData?.name || 'Faculty'} /> : firstLetter}
            </Avatar>
            <RoleBadge>Faculty</RoleBadge>
            <Name>{facultyData?.name || 'Faculty Name'}</Name>
            <RegNum>{facultyData?.registrationNumber || '—'}</RegNum>
            <Btn as={Link} to="/faculty/profile" $full $variant="outline">View Profile</Btn>
          </ProfileCard>

          <StatsColumn>
            <StatGrid>
              <StatCard>
                <StatLabel>Department</StatLabel>
                <StatValue>{facultyData?.department || '—'}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Designation</StatLabel>
                <StatValue>{facultyData?.designation || '—'}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Assigned Subjects</StatLabel>
                <StatValue>{loading || error ? '—' : subjectCount}</StatValue>
              </StatCard>
              <StatCard>
                <StatLabel>Assigned Students</StatLabel>
                <StatValue>{loading || error ? '—' : studentCount}</StatValue>
              </StatCard>
            </StatGrid>

            <DetailCard>
              <DetailHeader>
                <SectionHeading>Faculty Details</SectionHeading>
              </DetailHeader>
              <DetailList>
                <DetailRow><span>Name</span><strong>{facultyData?.name || '—'}</strong></DetailRow>
                <DetailRow><span>Registration Number</span><strong>{facultyData?.registrationNumber || '—'}</strong></DetailRow>
                <DetailRow><span>Email</span><strong>{facultyData?.email || '—'}</strong></DetailRow>
                <DetailRow><span>Department</span><strong>{facultyData?.department || '—'}</strong></DetailRow>
                <DetailRow><span>Designation</span><strong>{facultyData?.designation || '—'}</strong></DetailRow>
                <DetailRow><span>Joining Year</span><strong>{facultyData?.joiningYear || '—'}</strong></DetailRow>
              </DetailList>
            </DetailCard>
          </StatsColumn>
        </Grid>

        <ActionGrid>
          <ActionLink to="/faculty/subjects">My Subjects <ArrowForward fontSize="small" /></ActionLink>
          <ActionLink to="/faculty/students">My Students <ArrowForward fontSize="small" /></ActionLink>
          <ActionLink to="/faculty/attendance">Attendance <ArrowForward fontSize="small" /></ActionLink>
          <ActionLink to="/faculty/marks">Marks &amp; Results <ArrowForward fontSize="small" /></ActionLink>
          <ActionLink to="/faculty/timetable">Timetable <ArrowForward fontSize="small" /></ActionLink>
        </ActionGrid>

        <DetailCard style={{ marginTop: 20 }}>
            <DetailHeader>
              <SectionHeading>Today&apos;s Timetable</SectionHeading>
            </DetailHeader>
            {loading ? (
              <EmptyState>Loading timetable...</EmptyState>
            ) : error ? (
              <EmptyState>{error}</EmptyState>
            ) : todaysClasses.length === 0 ? (
              <EmptyState>No class scheduled for today.</EmptyState>
            ) : (
              <TimetableList>
                {todaysClasses.slice(0, 4).map((entry) => (
                  <ScheduleItem key={`${entry?._id || entry?.day}-${entry?.startTime}-${entry?.subject?.subjectCode}`}>
                    {entry?.subject?.subjectName || 'Class'} · {entry?.subject?.subjectCode || '—'}<br />
                    {entry?.day} · {entry?.startTime} - {entry?.endTime}<br />
                    {entry?.section || '—'} · Semester {entry?.semester || '—'} · {entry?.room || 'Room not assigned'}
                    {entry?.facultyAssignmentId && <Link to={`/faculty/attendance?assignmentId=${encodeURIComponent(entry.facultyAssignmentId)}`}>Take Attendance</Link>}
                  </ScheduleItem>
                ))}
              </TimetableList>
            )}
          </DetailCard>
      </Content>
    </PageShell>
  );
};

export default FacultyDashboard;
