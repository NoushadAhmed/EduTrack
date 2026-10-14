import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  ArrowForward,
  Assessment,
  Assignment,
  EventAvailable,
  Group,
} from '@material-ui/icons';
import StudentNavbar from '../components/StudentNavbar';
import { Avatar, Btn, PageShell } from '../components/UI';
import { fetchAttendance, getAllSubjects, getMarks } from '../redux/actions/studentAction';
import { colors, font, radius, shadow, transition } from '../styles/theme';

const Content = styled.main`
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 32px 24px 52px;
  font-family: ${font.family};
  animation: studentDashboardEnter 0.28s ease both;

  @keyframes studentDashboardEnter {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const Welcome = styled.section`
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

  @media (max-width: 680px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Eyebrow = styled.div`
  margin-bottom: 8px;
  color: ${colors.primary};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  color: ${colors.textPrimary};
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 700;
  letter-spacing: -0.04em;
`;

const Subtitle = styled.p`
  margin: 7px 0 0;
  color: ${colors.textSecondary};
  font-size: 14px;
`;

const StudentGrid = styled.div`
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 18px;
  align-items: start;

  @media (max-width: 850px) { grid-template-columns: 1fr; }
`;

const ProfileCard = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 11px;
  padding: 26px 20px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.white};
  box-shadow: ${shadow.card};
  text-align: center;
`;

const RoleBadge = styled.span`
  padding: 5px 10px;
  border-radius: 999px;
  background: ${colors.primaryLight};
  color: ${colors.primary};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
`;

const StudentName = styled.h2`
  margin: 0;
  color: ${colors.textPrimary};
  font-size: 20px;
  font-weight: 700;
`;

const Registration = styled.div`
  padding: 5px 10px;
  border: 1px solid ${colors.border};
  border-radius: 999px;
  background: ${colors.bgPage};
  color: ${colors.textMuted};
  font: 12px 'Courier New', monospace;
`;

const Overview = styled.div`
  display: grid;
  gap: 18px;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
  min-width: 0;
  padding: 17px;
  border: 1px solid ${colors.border};
  border-left: 4px solid ${colors.primary};
  border-radius: ${radius.lg};
  background: ${colors.white};
  box-shadow: ${shadow.card};
  transition: ${transition.base};

  &:hover { box-shadow: ${shadow.cardHover}; transform: translateY(-2px); border-color: rgba(79,70,229,0.2); }
`;

const StatIcon = styled.div`
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-bottom: 12px;
  border-radius: 10px;
  color: ${colors.primary};
  background: ${colors.primaryLight};
`;

const StatLabel = styled.div`
  margin-bottom: 5px;
  color: ${colors.textMuted};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const StatValue = styled.div`
  overflow-wrap: anywhere;
  color: ${colors.textPrimary};
  font-size: 23px;
  font-weight: 700;
`;

const DetailsCard = styled.section`
  padding: 20px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.white};
  box-shadow: ${shadow.card};
`;

const CardHeading = styled.h2`
  margin: 0 0 14px;
  color: ${colors.textPrimary};
  font-size: 16px;
  font-weight: 700;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 540px) { grid-template-columns: 1fr; }
`;

const Detail = styled.div`
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.bgPage};

  span {
    display: block;
    margin-bottom: 4px;
    color: ${colors.textMuted};
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  strong {
    display: block;
    color: ${colors.textPrimary};
    font-size: 13px;
    overflow-wrap: anywhere;
  }
`;

const QuickSection = styled.section`
  margin-top: 20px;
`;

const QuickHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const QuickGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 420px) { grid-template-columns: 1fr; }
`;

const QuickLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
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

  &:hover {
    color: ${colors.primary};
    border-color: rgba(79, 70, 229, 0.2);
    box-shadow: ${shadow.cardHover};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

const QuickLabel = styled.span`
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 8px;

  svg { flex: 0 0 auto; font-size: 17px; color: ${colors.primary}; }
`;

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const studentState = useSelector((state) => state.student);
  const [academicDataLoaded, setAcademicDataLoaded] = useState(false);
  const isAuthenticated = Boolean(studentState?.isAuthenticated);
  const student = studentState?.student?.student || studentState?.student || {};
  const subjects = studentState?.allSubjects || [];
  const attendance = studentState?.attendence || [];
  const marks = studentState?.allMarks || {};

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    Promise.all([
      dispatch(getAllSubjects()),
      dispatch(fetchAttendance()),
      dispatch(getMarks()),
    ]).finally(() => {
      if (active) setAcademicDataLoaded(true);
    });
    return () => { active = false; };
  }, [dispatch, isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  const subjectCount = Array.isArray(subjects) ? subjects.length : 0;
  const markCount = Object.values(marks).reduce(
    (total, examResults) => total + (Array.isArray(examResults) ? examResults.length : 0),
    0
  );
  const attendanceValues = attendance
    .map((record) => Number(record?.attendance))
    .filter((value, index) => attendance[index]?.attendance != null && Number.isFinite(value));
  const attendanceAverage = attendanceValues.length
    ? `${Math.round(attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length)}%`
    : '—';
  const firstLetter = (student?.name || 'S').trim().charAt(0).toUpperCase();

  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <Welcome>
          <div>
            <Eyebrow>Student overview</Eyebrow>
            <Title>Welcome back, {student?.name || 'Student'}</Title>
            <Subtitle>Here is your academic overview.</Subtitle>
          </div>
          <Btn as={Link} to="/student/update" $variant="outline">Edit Profile</Btn>
        </Welcome>

        <StudentGrid>
          <ProfileCard>
            <Avatar $size="84px">
              {student?.avatar?.url
                ? <img src={student.avatar.url} alt={student?.name || 'Student'} />
                : firstLetter}
            </Avatar>
            <RoleBadge>Student</RoleBadge>
            <StudentName>{student?.name || 'Student'}</StudentName>
            <Registration>{student?.registrationNumber || '—'}</Registration>
            <Btn as={Link} to="/student/update" $full $variant="outline">My Profile</Btn>
          </ProfileCard>

          <Overview>
            <StatGrid>
              <StatCard>
                <StatIcon><Assignment fontSize="small" /></StatIcon>
                <StatLabel>Subjects</StatLabel>
                <StatValue>{academicDataLoaded ? subjectCount : '—'}</StatValue>
              </StatCard>
              <StatCard>
                <StatIcon><EventAvailable fontSize="small" /></StatIcon>
                <StatLabel>Attendance</StatLabel>
                <StatValue>{academicDataLoaded ? attendanceAverage : '—'}</StatValue>
              </StatCard>
              <StatCard>
                <StatIcon><Assessment fontSize="small" /></StatIcon>
                <StatLabel>Recorded Results</StatLabel>
                <StatValue>{academicDataLoaded ? markCount : '—'}</StatValue>
              </StatCard>
            </StatGrid>

            <DetailsCard>
              <CardHeading>Academic Details</CardHeading>
              <DetailsGrid>
                <Detail><span>Registration Number</span><strong>{student?.registrationNumber || '—'}</strong></Detail>
                <Detail><span>Email</span><strong>{student?.email || '—'}</strong></Detail>
                <Detail><span>Department</span><strong>{student?.department || '—'}</strong></Detail>
                <Detail><span>Year</span><strong>{student?.year || '—'}</strong></Detail>
                <Detail><span>Section</span><strong>{student?.section || '—'}</strong></Detail>
                <Detail><span>Mobile Number</span><strong>{student?.studentMobileNumber || '—'}</strong></Detail>
              </DetailsGrid>
            </DetailsCard>
          </Overview>
        </StudentGrid>

        <QuickSection>
          <QuickHeader><CardHeading>Quick access</CardHeading></QuickHeader>
          <QuickGrid>
            <QuickLink to="/student/subjects"><QuickLabel><Assignment />View Subjects</QuickLabel><ArrowForward fontSize="small" /></QuickLink>
            <QuickLink to="/student/attendance"><QuickLabel><Group />View Attendance</QuickLabel><ArrowForward fontSize="small" /></QuickLink>
            <QuickLink to="/student/performance"><QuickLabel><Assessment />View Results</QuickLabel><ArrowForward fontSize="small" /></QuickLink>
            <QuickLink to="/student/timetable"><QuickLabel><EventAvailable />View Timetable</QuickLabel><ArrowForward fontSize="small" /></QuickLink>
          </QuickGrid>
        </QuickSection>
      </Content>
    </PageShell>
  );
};

export default StudentDashboard;
