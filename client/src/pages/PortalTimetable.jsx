import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import FacultyNavbar from '../components/FacultyNavbar';
import FacultyBackButton from '../components/FacultyBackButton';
import StudentNavbar from '../components/StudentNavbar';
import StudentBackButton from '../components/StudentBackButton';
import TimetableGrid from '../components/TimetableGrid';
import { Btn, PageShell } from '../components/UI';
import { colors, font, radius } from '../styles/theme';

const Content = styled.main`
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 36px 24px 56px;
  font-family: ${font.family};
  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const Heading = styled.div`
  margin-bottom: 22px;
  h1 { margin: 0 0 6px; color: ${colors.textPrimary}; font-size: 24px; }
  p { margin: 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.5; }
`;

const Card = styled.section`
  overflow: hidden;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
`;

const State = styled.div`
  padding: 40px 20px;
  color: ${colors.textSecondary};
  text-align: center;
  font-size: 14px;
  p { margin: 0 0 14px; }
`;
const TodayCard = styled.section`
  margin-bottom:16px;padding:16px;background:${colors.white};border:1px solid ${colors.border};border-radius:${radius.lg};
  h2{margin:0 0 10px;color:${colors.textPrimary};font-size:15px}
  .item{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-top:1px solid ${colors.border};font-size:13px;color:${colors.textSecondary}}
  strong{color:${colors.textPrimary}} a{color:${colors.primary};font-weight:600;text-decoration:none;white-space:nowrap}
  @media(max-width:560px){.item{align-items:flex-start;flex-direction:column}}
`;

const PortalTimetable = ({ role }) => {
  const student = useSelector((state) => state.student);
  const faculty = useSelector((state) => state.faculty);
  const isStudent = role === 'student';
  const authenticated = isStudent ? student?.isAuthenticated : faculty?.isAuthenticated;
  const endpoint = isStudent ? '/api/student/timetable' : '/api/faculty/timetable';
  const [entries, setEntries] = useState([]);
  const [periodSlots, setPeriodSlots] = useState([]);
  const [academicInfo, setAcademicInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get(endpoint);
      setEntries(Array.isArray(data?.result) ? data.result : []);
      setPeriodSlots(Array.isArray(data?.periodSlots) ? data.periodSlots : []);
      setAcademicInfo(data?.semester ? { semester: data.semester, academicYear: data.academicYear } : null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    if (authenticated) loadTimetable();
  }, [authenticated, loadTimetable, retryKey]);

  if (!authenticated) return <Navigate to="/" replace />;

  const Navbar = isStudent ? StudentNavbar : FacultyNavbar;
  const title = isStudent ? 'My Timetable' : 'My Teaching Schedule';
  const todayDate = new Date();
  const weekday = todayDate.toLocaleDateString('en-US', { weekday: 'long' });
  const saturdayLabel = weekday === 'Saturday' ? `Saturday (${Math.ceil(todayDate.getDate() / 7)}${Math.ceil(todayDate.getDate() / 7) === 2 ? 'nd' : Math.ceil(todayDate.getDate() / 7) === 3 ? 'rd' : Math.ceil(todayDate.getDate() / 7) === 1 ? 'st' : 'th'})` : '';
  const todayName = weekday;
  const todayClasses = entries.filter((entry) => entry.day === todayName || (saturdayLabel && entry.day === saturdayLabel));

  return (
    <PageShell>
      <Navbar />
      <Content>
        {isStudent && <StudentBackButton />}
        {!isStudent && <FacultyBackButton />}
        <Heading>
          <h1>{title}</h1>
          <p>
            {isStudent
              ? 'Your department, year, and section schedule.'
              : 'Your assigned classes across the timetable.'}
          </p>
          {isStudent && academicInfo && <p>Semester {academicInfo.semester} · Academic year {academicInfo.academicYear}</p>}
        </Heading>
        <Card>
          {loading ? (
            <State>Loading timetable...</State>
          ) : error ? (
            <State>
              <p>Unable to load timetable.</p>
              <Btn type="button" onClick={() => setRetryKey((key) => key + 1)}>Retry</Btn>
            </State>
          ) : (
            <>
              <TodayCard>
                <h2>Today's {isStudent ? 'Classes' : 'Teaching Schedule'} · {todayName}</h2>
                {todayClasses.length===0?<div className="item">No classes scheduled today.</div>:todayClasses.map((entry)=><div className="item" key={`${entry._id}-${entry.startTime}`}><span><strong>{entry.startTime}–{entry.endTime} · {entry.subject?.subjectCode||entry.activity||entry.type}</strong>{entry.subject?.subjectName?` · ${entry.subject.subjectName}`:''}<br/>Semester {entry.semester} · Section {entry.section} · {entry.room||entry.classRoom||'Room not assigned'}{isStudent&&entry.faculty?.name?` · ${entry.faculty.name}`:''}</span>{!isStudent&&entry.facultyAssignmentId&&<Link to={`/faculty/attendance?assignmentId=${encodeURIComponent(entry.facultyAssignmentId)}`}>Take Attendance</Link>}</div>)}
              </TodayCard>
              <Card><TimetableGrid entries={entries} periodSlots={periodSlots} /></Card>
            </>
          )}
        </Card>
      </Content>
    </PageShell>
  );
};

export const StudentTimetable = () => <PortalTimetable role="student" />;
export const FacultyTimetable = () => <PortalTimetable role="faculty" />;

export default PortalTimetable;
