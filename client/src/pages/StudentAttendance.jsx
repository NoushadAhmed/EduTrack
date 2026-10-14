import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import StudentNavbar from '../components/StudentNavbar';
import StudentBackButton from '../components/StudentBackButton';
import { Card, PageShell, SectionTitle } from '../components/UI';
import { colors, font, radius } from '../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const Content = styled.div`
  max-width: 1050px; margin: 0 auto; padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;
  @media (max-width: 600px) { padding: 24px 16px; }
`;
const OverallCard = styled(Card)`
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  margin-bottom: 24px; background: linear-gradient(135deg, rgba(79,70,229,.08), ${colors.white});
  span { color: ${colors.textSecondary}; font-size: 14px; }
  strong { color: ${colors.primary}; font-size: 28px; }
`;
const TableWrap = styled.div`
  overflow: auto; background: ${colors.white}; border: 1px solid ${colors.border};
  border-radius: ${radius.lg}; margin-bottom: 28px;
`;
const Table = styled.table`
  width: 100%; min-width: 650px; border-collapse: collapse;
  th, td { padding: 14px 16px; border-bottom: 1px solid ${colors.border}; text-align: left; color: ${colors.textPrimary}; font-size: 14px; }
  th { background: ${colors.bgPage}; color: ${colors.textSecondary}; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  tr:last-child td { border-bottom: 0; }
`;
const FilterRow = styled.div`
  display: flex; justify-content: flex-end; margin: -8px 0 12px;
  select { min-height: 40px; min-width: 210px; padding: 0 10px; border: 1px solid ${colors.border}; border-radius: ${radius.md}; color: ${colors.textPrimary}; background: ${colors.white}; font: 13px ${font.family}; }
`;
const StateCard = styled(Card)`
  margin: 14px 0 26px; color: ${({ $error }) => $error ? colors.danger : colors.textSecondary};
`;
const Status = styled.span`
  display: inline-flex; padding: 4px 10px; border-radius: 999px;
  color: ${({ $present }) => $present ? '#067647' : '#b42318'};
  background: ${({ $present }) => $present ? '#ecfdf3' : '#fff1f0'};
  font-size: 12px; font-weight: 700;
`;

const displayDate = (value) => {
  if (!value) return 'Date unavailable';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const StudentAttendance = () => {
  const student = useSelector((state) => state.student);
  const [summary, setSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!student?.isAuthenticated) return undefined;
    let active = true;
    setLoading(true); setError('');
    axios.get('/api/student/checkAttendance')
      .then(({ data }) => {
        if (!active) return;
        setSummary(Array.isArray(data?.result) ? data.result : []);
        setHistory(Array.isArray(data?.history) ? data.history : []);
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load attendance.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [student?.isAuthenticated]);

  const overallAttendance = useMemo(() => {
    const total = summary.reduce((sum, row) => sum + (Number(row.totalLectures) || 0), 0);
    const absent = summary.reduce((sum, row) => sum + (Number(row.absentHours) || 0), 0);
    return total ? (((total - absent) / total) * 100).toFixed(2) : '0.00';
  }, [summary]);
  const filteredHistory = useMemo(
    () => subjectFilter ? history.filter((row) => row.subjectCode === subjectFilter) : history,
    [history, subjectFilter]
  );

  if (!student?.isAuthenticated) return <Navigate to="/" replace />;
  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <StudentBackButton />
        <SectionTitle>Attendance Summary</SectionTitle>
        {loading ? <StateCard>Loading attendance summary...</StateCard> : error ? <StateCard $error>{error}</StateCard> : (
          <>
            <OverallCard><span>Overall Attendance</span><strong>{overallAttendance}%</strong></OverallCard>
            {summary.length === 0 ? <StateCard>No attendance summary is available yet.</StateCard> : (
              <TableWrap>
                <Table>
                  <thead><tr><th>Subject</th><th>Attended</th><th>Total</th><th>Percentage</th></tr></thead>
                  <tbody>{summary.map((item, index) => {
                    const total = Number(item.totalLectures) || 0;
                    const absent = Number(item.absentHours) || 0;
                    return <tr key={`${item.subjectCode}-${index}`}>
                      <td>{item.subjectCode} — {item.subjectName}</td>
                      <td>{total - absent}</td><td>{total}</td><td>{item.attendance || '0.00'}%</td>
                    </tr>;
                  })}</tbody>
                </Table>
              </TableWrap>
            )}
          </>
        )}

        <SectionTitle>My Attendance History</SectionTitle>
        <FilterRow>
          <select aria-label="Filter attendance history by subject" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
            <option value="">All Subjects</option>
            {[...new Set(history.map((row) => row.subjectCode).filter(Boolean))].map((code) => <option key={code} value={code}>{code}</option>)}
          </select>
        </FilterRow>
        {loading ? <StateCard>Loading attendance history...</StateCard> : error ? <StateCard $error>{error}</StateCard> : filteredHistory.length === 0 ? <StateCard>No dated attendance history is available yet.</StateCard> : (
          <TableWrap>
            <Table>
              <thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead>
              <tbody>{filteredHistory.map((row) => (
                <tr key={row._id}>
                  <td>{displayDate(row.sessionDate)}</td>
                  <td>{row.subjectCode} — {row.subjectName}</td>
                  <td><Status $present={row.status === 'Present'}>{row.status}</Status></td>
                </tr>
              ))}</tbody>
            </Table>
          </TableWrap>
        )}
      </Content>
    </PageShell>
  );
};

export default StudentAttendance;
