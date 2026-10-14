import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import StudentNavbar from '../../components/StudentNavbar';
import StudentBackButton from '../../components/StudentBackButton';
import { Card, PageShell, SectionTitle } from '../../components/UI';
import { ADMIN_SEMESTERS } from '../../config/adminOptions';
import { colors, font, radius } from '../../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const Content = styled.main`
  max-width: 1100px; margin: 0 auto; padding: 40px 24px;
  animation: ${fadeUp} .3s ease both;
  @media (max-width: 600px) { padding: 24px 16px; }
`;
const Filters = styled.div`
  display: flex; flex-wrap: wrap; gap: 14px; align-items: end; margin-bottom: 18px;
  label { display: grid; gap: 6px; color: ${colors.textSecondary}; font-size: 12px; font-weight: 600; }
  select { min-width: 180px; height: 44px; padding: 0 12px; border: 1px solid ${colors.border}; border-radius: ${radius.md}; background: ${colors.white}; color: ${colors.textPrimary}; font: 14px ${font.family}; }
`;
const Stats = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 16px 0 22px;
`;
const Stat = styled(Card)`
  span { display: block; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; margin-bottom: 7px; }
  strong { color: ${colors.primary}; font-size: 21px; }
`;
const TableWrap = styled.div`
  overflow: auto; background: ${colors.white}; border: 1px solid ${colors.border}; border-radius: ${radius.lg};
`;
const Table = styled.table`
  width: 100%; min-width: 790px; border-collapse: collapse;
  th, td { padding: 14px 16px; border-bottom: 1px solid ${colors.border}; text-align: left; color: ${colors.textPrimary}; font-size: 13px; }
  th { background: ${colors.bgPage}; color: ${colors.textSecondary}; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  tr:last-child td { border-bottom: 0; }
`;
const StateCard = styled(Card)`
  margin: 16px 0; color: ${({ $error }) => $error ? colors.danger : colors.textSecondary};
`;
const Status = styled.span`
  display: inline-flex; padding: 4px 9px; border-radius: 999px;
  background: ${({ $pass }) => $pass ? '#ecfdf3' : '#fff1f0'};
  color: ${({ $pass }) => $pass ? '#067647' : '#b42318'}; font-size: 11px; font-weight: 700;
`;

const StudentPerformance = () => {
  const isAuthenticated = Boolean(useSelector((state) => state.student?.isAuthenticated));
  const [semester, setSemester] = useState('1');
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [cgpa, setCgpa] = useState(null);
  const [completedSemesters, setCompletedSemesters] = useState([]);
  const [pendingPublication, setPendingPublication] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    setLoading(true); setError('');
    axios.get('/api/student/results', { params: { semester } })
      .then(({ data }) => {
        if (!active) return;
        setResults(Array.isArray(data?.result) ? data.result : []);
        setSummary(data?.summary || null);
        setCgpa(data?.cgpa ?? null);
        setCompletedSemesters(Array.isArray(data?.completedSemesters) ? data.completedSemesters : []);
        setPendingPublication(Boolean(data?.pendingPublication));
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load published results.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, semester]);

  if (!isAuthenticated) return <Navigate to="/" replace />;
  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <StudentBackButton />
        <SectionTitle>My Results</SectionTitle>
        <Filters>
          <label htmlFor="results-semester">Semester
            <select id="results-semester" value={semester} onChange={(event) => setSemester(event.target.value)}>
              {ADMIN_SEMESTERS.map((item) => <option key={item} value={item}>Semester {item}</option>)}
            </select>
          </label>
        </Filters>
        {loading ? <StateCard>Loading published results...</StateCard> : error ? <StateCard $error>{error}</StateCard> : (
          <>
            <Stats>
              <Stat><span>Semester</span><strong>{semester}</strong></Stat>
              <Stat><span>Total Subjects</span><strong>{summary?.totalSubjects || 0}</strong></Stat>
              <Stat><span>Passed</span><strong>{summary?.passed || 0}</strong></Stat>
              <Stat><span>Failed</span><strong>{summary?.failed || 0}</strong></Stat>
              <Stat><span>Total Credits</span><strong>{summary?.totalCredits ?? 'Unavailable'}</strong></Stat>
              <Stat><span>SGPA</span><strong>{summary?.sgpa ?? 'Unavailable'}</strong></Stat>
              <Stat><span>CGPA</span><strong>{cgpa ?? 'Unavailable'}</strong></Stat>
            </Stats>
            {completedSemesters.length > 0 && <StateCard>Completed semester GPA: {completedSemesters.map((item) => `Sem ${item.semester}: ${item.sgpa ?? 'Unavailable'}`).join(' · ')}</StateCard>}
            {results.length === 0 ? <StateCard>{pendingPublication ? 'Marks submitted. Awaiting publication.' : `No published results for Semester ${semester}.`}</StateCard> : (
              <TableWrap>
                <Table>
                  <thead><tr><th>Subject</th><th>CIE</th><th>SEE</th><th>Total</th><th>Grade</th><th>Status</th></tr></thead>
                  <tbody>{results.map((result) => (
                    <tr key={`${result.subject._id}-${result.academicYear}`}>
                      <td>{result.subject.subjectCode} — {result.subject.subjectName}</td>
                      <td>{result.cie === null ? '—' : `${result.cie}/50`}</td>
                      <td>{result.see === null ? (result.resultStatus === 'AB' ? 'AB' : '—') : `${result.see}/50`}</td>
                      <td>{result.total === null ? '—' : `${result.total}/100`}</td>
                      <td>{result.grade}</td>
                      <td><Status $pass={result.resultStatus === 'PASS'}>{result.resultStatus}</Status></td>
                    </tr>
                  ))}</tbody>
                </Table>
              </TableWrap>
            )}
          </>
        )}
      </Content>
    </PageShell>
  );
};

export default StudentPerformance;
