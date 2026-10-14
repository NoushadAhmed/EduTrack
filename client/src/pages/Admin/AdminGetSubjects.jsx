import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Visibility } from '@material-ui/icons';
import styled, { keyframes } from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Btn, Card, Input, Label, PageShell, PageTitle, Select, Subtitle } from '../../components/UI';
import { ADMIN_DEPARTMENTS, ADMIN_SEMESTERS, semesterToYear } from '../../config/adminOptions';
import { adminFetchSubjectDirectory } from '../../redux/actions/adminAction';
import { colors, font, radius, shadow, transition } from '../../styles/theme';

const EMPTY_SUBJECTS = [];

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

const Filters = styled(Card)`
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(3, minmax(145px, 1fr));
  align-items: end;
  gap: 13px;
  padding: 18px;
  margin-bottom: 18px;
  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 450px) { grid-template-columns: 1fr; }
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
  table { width: 100%; min-width: 820px; border-collapse: collapse; text-align: left; }
  th, td { padding: 13px 14px; border-bottom: 1px solid ${colors.border}; font-size: 13px; white-space: nowrap; }
  th { color: ${colors.textMuted}; background: #f8fafd; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  td { color: ${colors.textSecondary}; }
  tbody tr { transition: ${transition.fast}; }
  tbody tr:hover { background: #f8fbfe; }
  tbody tr:last-child td { border-bottom: 0; }
  td strong { color: ${colors.textPrimary}; font-weight: 600; }
  @media (max-width: 760px) { display: none; }
`;

const SubjectCards = styled.div`
  display: none;
  gap: 12px;
  @media (max-width: 760px) { display: grid; }
`;

const SubjectCard = styled(Card)`
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

const SubjectLink = styled(Link)`
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

const semesterRange = (year) => {
  const normalized = Number(year);
  if (normalized < 1 || normalized > 4) return 'Not available';
  const first = normalized * 2 - 1;
  return `Semesters ${first}-${first + 1}`;
};

const getSemesterLabel = (subject) => {
  if (Number.isInteger(Number(subject.semester)) && Number(subject.semester) >= 1 && Number(subject.semester) <= 8) {
    return `Semester ${subject.semester}`;
  }
  return semesterRange(subject.year);
};

const assignedFacultyLabel = (subject) => {
  const assignments = Array.isArray(subject.assignedFaculty) ? subject.assignedFaculty : [];
  if (!assignments.length) return 'No faculty assigned yet.';
  return assignments.map((assignment) => {
    const faculty = assignment.faculty || {};
    const details = [faculty.registrationNumber, faculty.designation].filter(Boolean).join(' · ');
    const section = ` · Section ${assignment.section || 'Not specified'}`;
    return `${faculty.name || 'Faculty unavailable'}${details ? ` (${details})` : ''} · Semester ${assignment.semester || 'Not specified'}${section}`;
  }).join('; ');
};

const subjectProfilePath = (subject) => `/admin/subjects/${encodeURIComponent(subject._id || subject.subjectCode || '')}`;

const AdminGetSubjects = () => {
  const admin = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [scheme, setScheme] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const subjects = Array.isArray(admin.allSubject) ? admin.allSubject : EMPTY_SUBJECTS;

  useEffect(() => {
    if (!admin.isAuthenticated) return undefined;
    let mounted = true;
    setIsLoading(true);
    setLoadError('');
    dispatch(adminFetchSubjectDirectory())
      .catch(() => {
        if (mounted) setLoadError('Subject records could not be loaded. Please try again.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [admin.isAuthenticated, dispatch, reloadKey]);

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subjects.filter((subject) => {
      const matchesSearch = !query || [subject.subjectCode, subject.subjectName]
        .some((value) => String(value || '').toLowerCase().includes(query));
      const matchesDepartment = !department || subject.department === department;
      const matchesSemester = !semester
        || (subject.semester
          ? Number(subject.semester) === Number(semester)
          : String(subject.year) === semesterToYear(semester));
      const matchesScheme = !scheme || subject.scheme === scheme;
      return matchesSearch && matchesDepartment && matchesSemester && matchesScheme;
    });
  }, [subjects, search, department, semester, scheme]);

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <Header>
          <div>
            <PageTitle>Subject Management</PageTitle>
            <Subtitle>Search and review subjects across departments.</Subtitle>
          </div>
          <Btn as={Link} to="/admin/add/subjects">+ Add Subject</Btn>
        </Header>

        <Filters $pad="18px">
          <Field>
            <Label htmlFor="subject-search">Search subjects</Label>
            <SearchWrap>
              <Search />
              <Input id="subject-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Subject code or name" />
            </SearchWrap>
          </Field>
          <Field>
            <Label htmlFor="subject-department">Department</Label>
            <Select id="subject-department" value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="">All departments</option>
              {ADMIN_DEPARTMENTS.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="subject-semester">Semester</Label>
            <Select id="subject-semester" value={semester} onChange={(event) => setSemester(event.target.value)}>
              <option value="">All semesters</option>
              {ADMIN_SEMESTERS.map((value) => <option key={value} value={value}>Semester {value}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="subject-scheme">Scheme</Label>
            <Select id="subject-scheme" value={scheme} onChange={(event) => setScheme(event.target.value)}>
              <option value="">All schemes</option>
              <option value="2022">2022</option>
            </Select>
          </Field>
        </Filters>

        <ResultsBar>
          <strong>{isLoading ? 'Loading subjects...' : `${filteredSubjects.length} subjects`}</strong>
          <span>of {subjects.length} records</span>
        </ResultsBar>
        {loadError ? (
          <Empty>
            {loadError}{' '}
            <Btn type="button" $variant="outline" onClick={() => setReloadKey((key) => key + 1)}>Retry</Btn>
          </Empty>
        ) : isLoading ? (
          <Empty>Loading subject records...</Empty>
        ) : filteredSubjects.length === 0 ? (
          <Empty>{subjects.length ? 'No subjects match these search and filter criteria.' : 'No subject records are available.'}</Empty>
        ) : (
          <>
            <TableWrap>
              <table>
                <thead><tr><th>Subject Code</th><th>Subject Name</th><th>Department</th><th>Semester</th><th>Assigned Faculty</th><th>Scheme</th><th>Subject Type</th><th>Elective Group</th><th>Total Lectures</th><th>Action</th></tr></thead>
                <tbody>{filteredSubjects.map((subject) => (
                  <tr key={subject._id || subject.subjectCode}>
                    <td><strong>{subject.subjectCode || 'Not available'}</strong></td>
                    <td>{subject.subjectName || 'Not available'}</td>
                    <td>{subject.department || 'Not available'}</td>
                    <td>{getSemesterLabel(subject)}</td>
                    <td>{assignedFacultyLabel(subject)}</td>
                    <td>{subject.scheme || '—'}</td>
                    <td>{subject.subjectType || '—'}</td>
                    <td>{subject.electiveGroup || '—'}</td>
                    <td>{subject.totalLectures ?? 'Not available'}</td>
                    <td><SubjectLink to={subjectProfilePath(subject)}><Visibility />View</SubjectLink></td>
                  </tr>
                ))}</tbody>
              </table>
            </TableWrap>
            <SubjectCards>
              {filteredSubjects.map((subject) => (
                <SubjectCard key={subject._id || subject.subjectCode} $pad="17px">
                  <CardHeader>
                    <div><strong>{subject.subjectName || 'Subject'}</strong><span>{subject.subjectCode || 'Subject code unavailable'}</span></div>
                    <SubjectLink to={subjectProfilePath(subject)}><Visibility />View</SubjectLink>
                  </CardHeader>
                  <MobileMeta>
                    <Meta><span>Department</span><strong>{subject.department || 'Not available'}</strong></Meta>
                    <Meta><span>Semester</span><strong>{getSemesterLabel(subject)}</strong></Meta>
                    <Meta><span>Assigned Faculty</span><strong>{assignedFacultyLabel(subject)}</strong></Meta>
                    <Meta><span>Scheme</span><strong>{subject.scheme || 'Not specified'}</strong></Meta>
                    <Meta><span>Subject Type</span><strong>{subject.subjectType || 'Not specified'}</strong></Meta>
                    {subject.electiveGroup && <Meta><span>Elective Group</span><strong>{subject.electiveGroup}</strong></Meta>}
                    <Meta><span>Total Lectures</span><strong>{subject.totalLectures ?? 'Not available'}</strong></Meta>
                  </MobileMeta>
                </SubjectCard>
              ))}
            </SubjectCards>
          </>
        )}
        {!isLoading && !loadError && subjects.length > 0 && (
          <DataNote>Legacy subject records without semester metadata continue to display and filter by their corresponding semester pair.</DataNote>
        )}
      </Content>
    </PageShell>
  );
};

export default AdminGetSubjects;
