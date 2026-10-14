import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { EditOutlined, Search, Visibility } from '@material-ui/icons';
import styled, { keyframes } from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Input, Select, Btn, Card, Label, PageShell, PageTitle, Subtitle } from '../../components/UI';
import { ADMIN_DEPARTMENTS, ADMIN_SEMESTERS, ADMIN_SECTIONS, semesterToYear } from '../../config/adminOptions';
import { colors, font, radius, shadow, transition } from '../../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
  box-sizing: border-box;
  max-width: 1240px;
  margin: 0 auto;
  padding: 36px 24px 52px;
  animation: ${fadeUp} 0.3s ease both;

  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 20px;
  ${PageTitle} { margin-bottom: 5px; }
  ${Subtitle} { margin: 0; }
  @media (max-width: 560px) { flex-direction: column; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const FilterCard = styled(Card)`
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(4, minmax(130px, 1fr));
  gap: 13px;
  align-items: end;
  padding: 18px;
  margin-bottom: 18px;
  @media (max-width: 900px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 560px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 380px) { grid-template-columns: 1fr; }
`;

const SearchWrap = styled.div`
  position: relative;
  svg { position: absolute; left: 12px; top: 12px; color: ${colors.textMuted}; font-size: 19px; }
  ${Input} { padding-left: 40px; }
`;

const ResultsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 1px 10px;
  color: ${colors.textMuted};
  font-size: 12px;
  strong { color: ${colors.textPrimary}; font-size: 14px; font-weight: 600; }
`;

const TableWrap = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  overflow-x: auto;
  animation: ${fadeUp} 0.25s ease both;

  table { width: 100%; min-width: 980px; border-collapse: collapse; text-align: left; }
  th, td { padding: 13px 14px; border-bottom: 1px solid ${colors.border}; font-size: 13px; white-space: nowrap; }
  th { color: ${colors.textMuted}; background: #f8fafd; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  td { color: ${colors.textSecondary}; }
  tbody tr { transition: ${transition.fast}; }
  tbody tr:hover { background: #f8fbfe; }
  tbody tr:last-child td { border-bottom: 0; }
  td strong { color: ${colors.textPrimary}; font-weight: 600; }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ActionLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
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

const Empty = styled.div`
  padding: 36px 20px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  color: ${colors.textMuted};
  background: ${colors.white};
  text-align: center;
  font-size: 13px;
`;

const DataNote = styled.p`
  margin: 12px 1px 0;
  color: ${colors.textMuted};
  font-size: 12px;
  line-height: 1.5;
`;

const AdminGetStudents = () => {
  const admin = useSelector((s) => s.admin);
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');

  useEffect(() => {
    if (!admin.isAuthenticated) return undefined;
    let isMounted = true;
    axios.post('/api/admin/getAllStudent')
      .then(({ data }) => {
        if (isMounted) setStudents(Array.isArray(data?.result) ? data.result : []);
      })
      .catch((error) => {
        if (!isMounted) return;
        if (error.response?.status === 404) setStudents([]);
        else setLoadError('Student records could not be loaded. Please try again.');
      })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [admin.isAuthenticated]);

  const hasStatus = students.some((student) => Object.prototype.hasOwnProperty.call(student, 'status'));
  const academicYearOptions = useMemo(() => (
    [...new Set(students
      .map((student) => student.academicYear ?? student.batch)
      .filter((value) => value !== null && value !== undefined && String(value).trim() !== '')
      .map(String))]
      .sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
  ), [students]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch = !normalizedSearch || [student.registrationNumber, student.name, student.email]
        .some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
      const matchesAcademicYear = !academicYear
        || String(student.academicYear ?? student.batch ?? '') === academicYear;
      const matchesDepartment = !department || student.department === department;
      const matchesSemester = !semester || String(student.year) === semesterToYear(semester);
      const matchesSection = !section || student.section === section;
      return matchesSearch && matchesAcademicYear && matchesDepartment && matchesSemester && matchesSection;
    });
  }, [students, search, academicYear, department, semester, section]);

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <Header>
          <div>
            <PageTitle>Student Management</PageTitle>
            <Subtitle>Search and review student records across all departments.</Subtitle>
          </div>
          <Btn as={Link} to="/admin/add/students">Add Student</Btn>
        </Header>

        <FilterCard $pad="18px">
          <Field>
            <Label htmlFor="student-search">Search students</Label>
            <SearchWrap><Search /><Input id="student-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="USN, name, or email" /></SearchWrap>
          </Field>
          <Field>
            <Label htmlFor="student-academic-year">Academic year</Label>
            <Select id="student-academic-year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}>
              <option value="">All academic years / batches</option>
              {academicYearOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="student-department">Department</Label>
            <Select id="student-department" value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="">All departments</option>
              {ADMIN_DEPARTMENTS.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="student-semester">Semester</Label>
            <Select id="student-semester" value={semester} onChange={(event) => setSemester(event.target.value)}>
              <option value="">All semesters</option>
              {ADMIN_SEMESTERS.map((value) => <option key={value} value={value}>Semester {value}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="student-section">Section</Label>
            <Select id="student-section" value={section} onChange={(event) => setSection(event.target.value)}>
              <option value="">All sections</option>
              {ADMIN_SECTIONS.map((value) => <option key={value} value={value}>Section {value}</option>)}
            </Select>
          </Field>
        </FilterCard>

        <ResultsBar><strong>{isLoading ? 'Loading students...' : `${filteredStudents.length} students`}</strong><span>of {students.length} records</span></ResultsBar>
        {loadError ? <Empty>{loadError}</Empty> : isLoading ? <Empty>Loading student records...</Empty> : filteredStudents.length === 0 ? <Empty>No students match these search and filter criteria.</Empty> : (
          <TableWrap>
            <table>
              <thead><tr>
                <th>USN / Registration Number</th><th>Name</th><th>Email</th><th>Department</th><th>Semester</th><th>Section</th><th>Mobile</th>
                {hasStatus && <th>Status</th>}
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const recordPath = `/admin/students/${encodeURIComponent(student.registrationNumber || '')}`;
                  return <tr key={student._id || student.registrationNumber}>
                    <td><strong>{student.registrationNumber || 'Not available'}</strong></td>
                    <td>{student.name || 'Not available'}</td>
                    <td>{student.email || 'Not available'}</td>
                    <td>{student.department || 'Not available'}</td>
                    <td>{student.year ? `Semester ${Number(student.year) * 2 - 1}-${Number(student.year) * 2}` : 'Not available'}</td>
                    <td>{student.section || 'Not available'}</td>
                    <td>{student.studentMobileNumber || 'Not available'}</td>
                    {hasStatus && <td>{student.status || 'Not available'}</td>}
                    <td><Actions>
                      <ActionLink to={recordPath}><Visibility />View</ActionLink>
                      <ActionLink to={`${recordPath}?edit=1`}><EditOutlined />Edit</ActionLink>
                    </Actions></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
        <DataNote>The current model has no separate academic-year field, so this filter uses each record’s stored academic year or batch value. Semester filters map to the legacy Year 1-4 field; each year represents two semesters.</DataNote>
      </Content>
    </PageShell>
  );
};

export default AdminGetStudents;
