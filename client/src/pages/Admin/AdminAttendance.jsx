import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { Search, Visibility } from '@material-ui/icons';
import styled, { keyframes } from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Btn, Card, Input, Label, PageShell, PageTitle, Select, Subtitle } from '../../components/UI';
import { ADMIN_DEPARTMENTS, ADMIN_SECTIONS, ADMIN_SEMESTERS, semesterToYear } from '../../config/adminOptions';
import { colors, font, radius, shadow, transition } from '../../styles/theme';

const EMPTY_RECORDS = [];

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Content = styled.main`
  box-sizing: border-box;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 36px 24px 52px;
  animation: ${fadeUp} 0.28s ease both;
  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
  h1 { margin-bottom: 5px; }
  p { margin: 0; }
  @media (max-width: 560px) { flex-direction: column; }
`;

const FilterCard = styled(Card)`
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(4, minmax(130px, 1fr));
  gap: 13px;
  align-items: end;
  padding: 18px;
  margin-bottom: 18px;
  @media (max-width: 900px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 600px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 380px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
`;

const SearchWrap = styled.div`
  position: relative;
  svg { position: absolute; top: 12px; left: 12px; color: ${colors.textMuted}; font-size: 19px; }
  ${Input} { padding-left: 40px; }
`;

const ResultsBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 1px 10px;
  color: ${colors.textMuted};
  font-size: 12px;
  strong { color: ${colors.textPrimary}; font-size: 14px; font-weight: 600; }
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.white};
  box-shadow: ${shadow.card};
  table { width: 100%; min-width: 860px; border-collapse: collapse; text-align: left; }
  th, td { padding: 13px 14px; border-bottom: 1px solid ${colors.border}; font-size: 13px; white-space: nowrap; }
  th { color: ${colors.textMuted}; background: #f8fafd; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  td { color: ${colors.textSecondary}; }
  tbody tr { transition: ${transition.fast}; }
  tbody tr:hover { background: #f8fbfe; }
  tbody tr:last-child td { border-bottom: 0; }
  td strong { color: ${colors.textPrimary}; font-weight: 600; }
  @media (max-width: 760px) { display: none; }
`;

const RecordCards = styled.div`
  display: none;
  gap: 12px;
  @media (max-width: 760px) { display: grid; }
`;

const RecordCard = styled(Card)`
  display: grid;
  gap: 12px;
  padding: 17px;
  transition: ${transition.base};
  animation: ${fadeUp} 0.22s ease both;
  &:hover { transform: translateY(-2px); box-shadow: ${shadow.cardHover}; }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  strong { display: block; color: ${colors.textPrimary}; font-size: 15px; }
  span { display: block; margin-top: 4px; color: ${colors.textMuted}; font: 12px ${font.family}; overflow-wrap: anywhere; }
`;

const MobileMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const Meta = styled.div`
  min-width: 0;
  span { display: block; margin-bottom: 3px; color: ${colors.textMuted}; font-size: 10px; text-transform: uppercase; }
  strong { display: block; color: ${colors.textSecondary}; font-size: 12px; font-weight: 500; overflow-wrap: anywhere; }
`;

const RecordLink = styled(Link)`
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 9px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.sm};
  color: ${colors.textSecondary};
  background: ${colors.white};
  font: 500 12px ${font.family};
  text-decoration: none;
  transition: ${transition.fast};
  svg { font-size: 16px; }
  &:hover { color: ${colors.primary}; border-color: ${colors.primary}; background: ${colors.primaryLight}; }
`;

const StateCard = styled.div`
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 36px 20px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  color: ${({ $error }) => ($error ? colors.danger : colors.textMuted)};
  background: ${colors.white};
  text-align: center;
  font-size: 13px;
`;

const semesterLabel = (year) => {
  const normalized = Number(year);
  if (normalized < 1 || normalized > 4) return 'Not available';
  const first = (normalized * 2) - 1;
  return `Semesters ${first}-${first + 1}`;
};

const recordAttendance = (record) => {
  if (record?.percentage !== null && record?.percentage !== undefined && Number.isFinite(Number(record.percentage))) {
    return `${record.percentage}%`;
  }
  return 'Not available';
};

const AdminAttendance = () => {
  const admin = useSelector((state) => state.admin);
  const [records, setRecords] = useState(EMPTY_RECORDS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');

  useEffect(() => {
    if (!admin.isAuthenticated) return undefined;
    let mounted = true;
    setIsLoading(true);
    setLoadError('');
    axios.post('/api/admin/getAllAttendance')
      .then(({ data }) => {
        if (!mounted) return;
        if (!Array.isArray(data?.result)) {
          setRecords([]);
          setLoadError('Unable to load attendance records.');
          return;
        }
        setRecords(data.result);
      })
      .catch(() => {
        if (mounted) setLoadError('Unable to load attendance records.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [admin.isAuthenticated, reloadKey]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const student = record?.student;
      const subject = record?.subject;
      const matchesSearch = !query || [
        student?.registrationNumber,
        student?.name,
        subject?.subjectCode,
        subject?.subjectName,
      ].some((value) => String(value || '').toLowerCase().includes(query));
      const recordDepartment = student?.department || subject?.department;
      const matchesDepartment = !department || recordDepartment === department;
      const matchesSemester = !semester
        || String(student?.year ?? subject?.year ?? '') === semesterToYear(semester);
      const matchesSection = !section || student?.section === section;
      return matchesSearch && matchesDepartment && matchesSemester && matchesSection;
    });
  }, [records, search, department, semester, section]);

  if (!admin.isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <Header>
          <div>
            <PageTitle>Attendance Management</PageTitle>
            <Subtitle>Review recorded attendance by student, subject, and class.</Subtitle>
          </div>
        </Header>

        <FilterCard $pad="18px">
          <Field>
            <Label htmlFor="attendance-search">Search</Label>
            <SearchWrap>
              <Search />
              <Input id="attendance-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student, registration number, or subject" />
            </SearchWrap>
          </Field>
          <Field>
            <Label htmlFor="attendance-department">Department</Label>
            <Select id="attendance-department" value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="">All departments</option>
              {ADMIN_DEPARTMENTS.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="attendance-semester">Semester</Label>
            <Select id="attendance-semester" value={semester} onChange={(event) => setSemester(event.target.value)}>
              <option value="">All semesters</option>
              {ADMIN_SEMESTERS.map((value) => <option key={value} value={value}>Semester {value}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="attendance-section">Section</Label>
            <Select id="attendance-section" value={section} onChange={(event) => setSection(event.target.value)}>
              <option value="">All sections</option>
              {ADMIN_SECTIONS.map((value) => <option key={value} value={value}>Section {value}</option>)}
            </Select>
          </Field>
        </FilterCard>

        <ResultsBar>
          <strong>Attendance Records</strong>
          <span>{isLoading ? 'Loading attendance...' : `${filteredRecords.length} records`}</span>
        </ResultsBar>

        {isLoading ? (
          <StateCard>Loading attendance...</StateCard>
        ) : loadError ? (
          <StateCard $error role="alert">
            {loadError}
            <Btn type="button" $variant="outline" onClick={() => setReloadKey((value) => value + 1)}>Retry</Btn>
          </StateCard>
        ) : filteredRecords.length === 0 ? (
          <StateCard>No attendance records found.</StateCard>
        ) : (
          <>
            <TableWrap>
              <table>
                <thead><tr>
                  <th>Student</th><th>Registration Number</th><th>Department</th><th>Semester</th><th>Section</th>
                  <th>Subject</th><th>Lectures Attended</th><th>Total Lectures</th><th>Attendance</th>
                </tr></thead>
                <tbody>{filteredRecords.map((record, index) => {
                  const student = record?.student;
                  const subject = record?.subject;
                  return (
                    <tr key={record?._id || `${student?.registrationNumber || 'student'}-${subject?.subjectCode || index}`}>
                      <td><strong>{student?.name || 'Student unavailable'}</strong></td>
                      <td>{student?.registrationNumber || 'Not available'}</td>
                      <td>{student?.department || subject?.department || 'Not available'}</td>
                      <td>{semesterLabel(student?.year ?? subject?.year)}</td>
                      <td>{student?.section || 'Not available'}</td>
                      <td>{subject?.subjectName || subject?.subjectCode || 'Subject unavailable'}</td>
                      <td>{record?.lecturesAttended ?? 'Not available'}</td>
                      <td>{record?.totalLectures ?? 'Not available'}</td>
                      <td>{recordAttendance(record)}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </TableWrap>
            <RecordCards>
              {filteredRecords.map((record, index) => {
                const student = record?.student;
                const subject = record?.subject;
                return (
                  <RecordCard key={record?._id || `${student?.registrationNumber || 'student'}-${subject?.subjectCode || index}`} $pad="17px">
                    <CardHeader>
                      <div>
                        <strong>{student?.name || 'Student unavailable'}</strong>
                        <span>{student?.registrationNumber || 'Registration number unavailable'}</span>
                      </div>
                      {student?.registrationNumber && <RecordLink to={`/admin/students/${encodeURIComponent(student.registrationNumber)}`}><Visibility />View</RecordLink>}
                    </CardHeader>
                    <MobileMeta>
                      <Meta><span>Department</span><strong>{student?.department || subject?.department || 'Not available'}</strong></Meta>
                      <Meta><span>Semester</span><strong>{semesterLabel(student?.year ?? subject?.year)}</strong></Meta>
                      <Meta><span>Section</span><strong>{student?.section || 'Not available'}</strong></Meta>
                      <Meta><span>Subject</span><strong>{subject?.subjectName || subject?.subjectCode || 'Subject unavailable'}</strong></Meta>
                      <Meta><span>Lectures</span><strong>{record?.lecturesAttended ?? 'Not available'} / {record?.totalLectures ?? 'Not available'}</strong></Meta>
                      <Meta><span>Attendance</span><strong>{recordAttendance(record)}</strong></Meta>
                    </MobileMeta>
                  </RecordCard>
                );
              })}
            </RecordCards>
          </>
        )}
      </Content>
    </PageShell>
  );
};

export default AdminAttendance;
