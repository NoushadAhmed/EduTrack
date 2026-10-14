import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { InfoOutlined, School, CheckCircleOutline } from '@material-ui/icons';
import AdminNavbar from '../components/AdminNavbar';
import AdminBackButton from '../components/AdminBackButton';
import { Btn, Card, Input, Label, PageShell, PageTitle, Select, Subtitle } from '../components/UI';
import {
  ACADEMIC_YEARS,
  ADMIN_DEPARTMENT_CODES,
  ADMIN_DEPARTMENTS,
  ADMIN_SECTIONS,
  ADMIN_SEMESTERS,
  semesterToYear,
} from '../config/adminOptions';
import { colors, font, radius, shadow, transition } from '../styles/theme';

const ACADEMIC_YEARS_KEY = 'edutrackAcademicYears';
const ACTIVE_ACADEMIC_YEAR_KEY = 'edutrackActiveAcademicYear';

const Content = styled.main`
  box-sizing: border-box;
  max-width: 1180px;
  margin: 0 auto;
  padding: 36px 24px 56px;
  font-family: ${font.family};
  animation: fadeUp 0.3s ease both;

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 22px;

  @media (max-width: 600px) { flex-direction: column; }
`;

const HeaderText = styled.div`
  min-width: 0;
  ${PageTitle} { margin-bottom: 6px; }
  ${Subtitle} { margin: 0; max-width: 680px; line-height: 1.55; }
`;

const PrimaryLink = styled(Btn)`
  text-decoration: none;
  flex-shrink: 0;
`;

const UnavailableAction = styled(Btn)`
  &:disabled {
    color: ${colors.textMuted};
    background: #e7ebf0;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
`;

const Notice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px 16px;
  margin-bottom: 22px;
  color: ${colors.textSecondary};
  background: ${colors.primaryLight};
  border: 1px solid #cfe2f4;
  border-radius: ${radius.md};
  font-size: 13px;
  line-height: 1.55;

  svg { flex: 0 0 auto; color: ${colors.primary}; font-size: 18px; margin-top: 1px; }
`;

const FilterBar = styled(Card)`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 18px 20px;
  margin-bottom: 22px;

  @media (max-width: 700px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 440px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 6px;
`;

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  border-bottom: 1px solid ${colors.border};
  margin-bottom: 22px;
  overflow-x: auto;
`;

const Tab = styled.button`
  flex: 0 0 auto;
  padding: 11px 16px;
  border: 0;
  border-bottom: 2px solid ${({ $active }) => ($active ? colors.primary : 'transparent')};
  background: transparent;
  color: ${({ $active }) => ($active ? colors.primary : colors.textSecondary)};
  font: 500 13px ${font.family};
  cursor: pointer;
  transition: ${transition.fast};

  &:hover { color: ${colors.primary}; background: ${colors.primaryLight}; }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;

  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const Summary = styled(Card)`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 17px 18px;
`;

const SummaryIcon = styled.div`
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: ${radius.md};
  color: ${colors.primary};
  background: ${colors.primaryLight};
`;

const SummaryLabel = styled.span`
  display: block;
  color: ${colors.textMuted};
  font-size: 12px;
  margin-bottom: 3px;
`;

const SummaryValue = styled.strong`
  display: block;
  color: ${colors.textPrimary};
  font-size: 16px;
  font-weight: 600;
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 14px;

  h2 { margin: 0; color: ${colors.textPrimary}; font-size: 16px; font-weight: 600; }
  span { color: ${colors.textMuted}; font-size: 12px; }

  @media (max-width: 520px) { align-items: flex-start; flex-direction: column; }
`;

const DepartmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const DepartmentCard = styled(Card)`
  padding: 16px;
  transition: ${transition.base};
  &:hover { transform: translateY(-2px); box-shadow: ${shadow.cardHover}; }
`;

const DepartmentTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 13px;
`;

const DepartmentName = styled.strong`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const DepartmentCode = styled.span`
  padding: 3px 8px;
  color: ${colors.textSecondary};
  background: ${colors.bgPage};
  border: 1px solid ${colors.border};
  border-radius: ${radius.sm};
  font: 12px 'Courier New', monospace;
`;

const Counts = styled.div`
  display: flex;
  gap: 16px;
  color: ${colors.textMuted};
  font-size: 12px;
  strong { color: ${colors.textSecondary}; font-weight: 600; }
`;

const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 18px;
  margin-top: 22px;

  @media (max-width: 760px) { grid-template-columns: 1fr; }
`;

const InnerTitle = styled.h3`
  margin: 0 0 5px;
  color: ${colors.textPrimary};
  font-size: 14px;
  font-weight: 600;
`;

const SupportingText = styled.p`
  margin: 0 0 16px;
  color: ${colors.textMuted};
  font-size: 12px;
  line-height: 1.5;
`;

const YearList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  @media (max-width: 460px) { grid-template-columns: 1fr; }
`;

const YearItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid ${({ $active }) => ($active ? '#b9d7ef' : colors.border)};
  border-radius: ${radius.md};
  background: ${({ $active }) => ($active ? colors.primaryLight : colors.white)};
  color: ${colors.textPrimary};
  font-size: 13px;
  font-weight: 500;

  span { min-width: 0; overflow-wrap: anywhere; }
  small { color: ${colors.primary}; font-size: 11px; font-weight: 600; white-space: nowrap; }
`;

const YearForm = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  margin-top: 14px;
  align-items: end;

  @media (max-width: 460px) { grid-template-columns: 1fr; }
`;

const SectionList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const SectionOption = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 12px;
  border: 1px solid ${({ $active }) => ($active ? '#b9d7ef' : colors.border)};
  border-radius: ${radius.md};
  color: ${({ $active }) => ($active ? colors.primary : colors.textSecondary)};
  background: ${({ $active }) => ($active ? colors.primaryLight : colors.white)};
  font: 500 13px ${font.family};
  cursor: pointer;
  transition: ${transition.fast};
  &:hover { border-color: ${colors.primary}; }
`;

const DataTable = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.white};

  table { width: 100%; min-width: 680px; border-collapse: collapse; text-align: left; }
  th, td { padding: 13px 15px; border-bottom: 1px solid ${colors.border}; font-size: 13px; }
  th { color: ${colors.textMuted}; background: #f8fafd; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  td { color: ${colors.textSecondary}; }
  tbody tr:last-child td { border-bottom: 0; }
  td strong { color: ${colors.textPrimary}; font-weight: 600; }
`;

const InlineNote = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin: 12px 0 0;
  color: ${colors.textMuted};
  font-size: 12px;
  line-height: 1.5;
  svg { flex: 0 0 auto; font-size: 16px; }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const Status = styled.div`
  margin-top: 13px;
  padding: 11px 13px;
  border-radius: ${radius.sm};
  color: ${colors.textSecondary};
  background: ${colors.bgPage};
  font-size: 12px;
  line-height: 1.5;
`;

const academicYearKey = (value) => String(value || '').trim().replace(/(\d{4})[-/](\d{2,4})/, (_, start, end) => `${start}-${end.slice(-2)}`);

const Empty = styled.div`
  padding: 28px 18px;
  color: ${colors.textMuted};
  border: 1px dashed ${colors.border};
  border-radius: ${radius.md};
  font-size: 13px;
  text-align: center;
`;

const safeStoredYears = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(ACADEMIC_YEARS_KEY) || '[]');
    return Array.isArray(stored) ? [...new Set([...ACADEMIC_YEARS, ...stored.filter((year) => /^\d{4}-\d{2}$/.test(year))])] : ACADEMIC_YEARS;
  } catch (error) {
    return ACADEMIC_YEARS;
  }
};

const formatAcademicYear = (year) => year;

const responseRows = (response, key = 'result') => {
  if (Array.isArray(response.data)) return response.data;
  return Array.isArray(response.data?.[key]) ? response.data[key] : [];
};

const AdminAcademic = () => {
  const admin = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const initialAcademicYear = ACADEMIC_YEARS[2];
  const [years, setYears] = useState(safeStoredYears);
  const [activeYear, setActiveYear] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_ACADEMIC_YEAR_KEY);
    return saved || initialAcademicYear;
  });
  const [yearStart, setYearStart] = useState(String(new Date().getFullYear() + 1));
  const [yearMessage, setYearMessage] = useState('');
  const [department, setDepartment] = useState(ADMIN_DEPARTMENTS[0]);
  const [semester, setSemester] = useState('5');
  const [section, setSection] = useState(ADMIN_SECTIONS[0]);
  const [tab, setTab] = useState('overview');
  const [records, setRecords] = useState({ students: null, faculty: null, subjects: null });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');

  useEffect(() => {
    if (!admin.isAuthenticated) return undefined;
    let isMounted = true;
    setIsLoading(true);

    Promise.allSettled([
      axios.post('/api/admin/getAllStudent'),
      axios.post('/api/admin/getAllFaculty'),
      axios.post('/api/admin/getAllSubject'),
    ]).then(([studentsResult, facultyResult, subjectsResult]) => {
      if (!isMounted) return;
      setRecords({
        students: studentsResult.status === 'fulfilled' ? responseRows(studentsResult.value) : null,
        faculty: facultyResult.status === 'fulfilled' ? responseRows(facultyResult.value) : null,
        subjects: subjectsResult.status === 'fulfilled' ? responseRows(subjectsResult.value) : null,
      });
      setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, [admin.isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(ACADEMIC_YEARS_KEY, JSON.stringify(years));
  }, [years]);

  useEffect(() => {
    localStorage.setItem(ACTIVE_ACADEMIC_YEAR_KEY, activeYear);
  }, [activeYear]);

  useEffect(() => {
    setSelectedSubject('');
    setSelectedFaculty('');
  }, [department, semester]);

  const backendYear = semesterToYear(semester);
  const visibleSubjects = (records.subjects || []).filter((subjectRecord) => (
    subjectRecord.department === department &&
    (subjectRecord.semester
      ? Number(subjectRecord.semester) === Number(semester)
      : String(subjectRecord.year) === backendYear)
  ));
  const facultyForSubject = (subjectRecord) => {
    const assignments = (Array.isArray(subjectRecord.assignedFaculty) ? subjectRecord.assignedFaculty : [])
      .filter((assignment) => (
        Number(assignment.semester) === Number(semester) &&
        (!assignment.section || assignment.section === section) &&
        (!assignment.academicYear || !activeYear || academicYearKey(assignment.academicYear) === academicYearKey(activeYear))
      ));
    if (!assignments.length) return 'No faculty assigned yet.';
    return assignments.map((assignment) => {
      const facultyRecord = assignment.faculty || {};
      const identity = [facultyRecord.registrationNumber, facultyRecord.designation].filter(Boolean).join(' · ');
      return `${facultyRecord.name || 'Faculty unavailable'}${identity ? ` (${identity})` : ''} · Section ${assignment.section || 'Not specified'} · ${assignment.academicYear || 'Academic year not specified'}`;
    }).join('; ');
  };
  const visibleFaculty = (records.faculty || []).filter((facultyRecord) => (
    facultyRecord.department === department
  ));
  const sectionStudents = records.students?.filter((student) => (
    student.department === department &&
    String(student.year) === backendYear &&
    student.section === section
  ));

  if (!admin.isAuthenticated) {
    navigate('/admin/login');
    return null;
  }

  const addAcademicYear = (event) => {
    event.preventDefault();
    const start = Number(yearStart);
    if (!Number.isInteger(start) || start < 2000 || start > 2098) {
      setYearMessage('Enter a start year between 2000 and 2098.');
      return;
    }
    const year = `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
    if (years.includes(year)) {
      setYearMessage(`${formatAcademicYear(year)} already exists.`);
      return;
    }
    const updatedYears = [...years, year].sort((left, right) => Number(left.slice(0, 4)) - Number(right.slice(0, 4)));
    setYears(updatedYears);
    setActiveYear(year);
    setYearMessage(`${formatAcademicYear(year)} added and set active in this browser.`);
  };

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <Header>
          <HeaderText>
            <PageTitle>Academic Management</PageTitle>
            <Subtitle>Organize academic years, departments, semesters, sections, subjects, and teaching assignments.</Subtitle>
          </HeaderText>
          <PrimaryLink as={Link} to="/admin/add/subjects">Add Subject</PrimaryLink>
        </Header>

        <Notice>
          <InfoOutlined />
          <span>Subjects with semester metadata are shown in that semester. Legacy records without a semester use their Year 1-4 value. Saved faculty assignments are matched by subject, department, semester, section, and academic year.</span>
        </Notice>

        <FilterBar $pad="18px 20px">
          <Field>
            <Label htmlFor="academic-year">Active academic year</Label>
            <Select id="academic-year" value={activeYear} onChange={(event) => setActiveYear(event.target.value)}>
              {!years.includes(activeYear) && <option value={activeYear}>{formatAcademicYear(activeYear)}</option>}
              {years.map((year) => <option key={year} value={year}>{formatAcademicYear(year)}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="academic-department">Department</Label>
            <Select id="academic-department" value={department} onChange={(event) => setDepartment(event.target.value)}>
              {ADMIN_DEPARTMENTS.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="academic-semester">Semester</Label>
            <Select id="academic-semester" value={semester} onChange={(event) => setSemester(event.target.value)}>
              {ADMIN_SEMESTERS.map((value) => <option key={value} value={value}>Semester {value}</option>)}
            </Select>
          </Field>
        </FilterBar>

        <SummaryGrid>
          <Summary $pad="17px 18px">
            <SummaryIcon><CheckCircleOutline /></SummaryIcon>
            <div><SummaryLabel>Active academic year</SummaryLabel><SummaryValue>{formatAcademicYear(activeYear)}</SummaryValue></div>
          </Summary>
          <Summary $pad="17px 18px">
            <SummaryIcon><School /></SummaryIcon>
            <div><SummaryLabel>Departments</SummaryLabel><SummaryValue>{ADMIN_DEPARTMENTS.length} departments</SummaryValue></div>
          </Summary>
          <Summary $pad="17px 18px">
            <SummaryIcon><School /></SummaryIcon>
            <div><SummaryLabel>Academic structure</SummaryLabel><SummaryValue>8 semesters | 2 sections</SummaryValue></div>
          </Summary>
        </SummaryGrid>

        <Tabs role="tablist" aria-label="Academic management sections">
          <Tab type="button" role="tab" aria-selected={tab === 'overview'} $active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</Tab>
          <Tab type="button" role="tab" aria-selected={tab === 'subjects'} $active={tab === 'subjects'} onClick={() => setTab('subjects')}>Subjects</Tab>
          <Tab type="button" role="tab" aria-selected={tab === 'assignments'} $active={tab === 'assignments'} onClick={() => setTab('assignments')}>Faculty Assignment</Tab>
        </Tabs>

        {tab === 'overview' && <>
          <SectionHeading>
            <h2>Departments</h2>
            <span>{isLoading ? 'Loading directory counts...' : 'Counts use existing student and faculty records'}</span>
          </SectionHeading>
          <DepartmentGrid>
            {ADMIN_DEPARTMENTS.map((name) => {
              const studentCount = records.students?.filter((student) => student.department === name).length;
              const facultyCount = records.faculty?.filter((facultyRecord) => facultyRecord.department === name).length;
              return (
                <DepartmentCard key={name} $pad="16px">
                  <DepartmentTop><DepartmentName>{name}</DepartmentName><DepartmentCode>{ADMIN_DEPARTMENT_CODES[name]}</DepartmentCode></DepartmentTop>
                  <Counts>
                    <span><strong>{studentCount ?? 'N/A'}</strong> students</span>
                    <span><strong>{facultyCount ?? 'N/A'}</strong> faculty</span>
                  </Counts>
                </DepartmentCard>
              );
            })}
          </DepartmentGrid>

          <SplitGrid>
            <Card $pad="20px">
              <SectionHeading>
                <div><InnerTitle>Academic Years</InnerTitle><span>Active year is highlighted</span></div>
                <span>Browser only</span>
              </SectionHeading>
              <YearList>
                {years.map((year) => (
                  <YearItem key={year} $active={activeYear === year}>
                    <span>{formatAcademicYear(year)}</span>
                    {activeYear === year && <small>Active</small>}
                  </YearItem>
                ))}
              </YearList>
              <YearForm onSubmit={addAcademicYear}>
                <Field>
                  <Label htmlFor="new-academic-year">Add academic year by start year</Label>
                  <Input id="new-academic-year" type="number" min="2000" max="2098" value={yearStart} onChange={(event) => setYearStart(event.target.value)} placeholder="2027" />
                </Field>
                <Btn type="submit">Add year</Btn>
              </YearForm>
              {yearMessage && <Status role="status">{yearMessage}</Status>}
              <InlineNote><InfoOutlined />These years are saved in this browser only; shared academic-year management needs a backend model and API.</InlineNote>
            </Card>

            <Card $pad="20px">
              <SectionHeading>
                <div><InnerTitle>Sections</InnerTitle><span>Semester {semester} | {department}</span></div>
                <span>{sectionStudents == null ? 'Student count unavailable' : `${sectionStudents.length} students in ${section}`}</span>
              </SectionHeading>
              <SectionList>
                {ADMIN_SECTIONS.map((value) => (
                  <SectionOption key={value} type="button" $active={section === value} onClick={() => setSection(value)} aria-pressed={section === value}>
                    Section {value}<span>{section === value ? 'Selected' : ''}</span>
                  </SectionOption>
                ))}
              </SectionList>
              <InlineNote><InfoOutlined />Sections are read from existing student records. Subject records do not currently have a section field.</InlineNote>
            </Card>
          </SplitGrid>
        </>}

        {tab === 'subjects' && <Card $pad="20px">
          <SectionHeading>
            <div><InnerTitle>Subjects</InnerTitle><span>{department} | Semester {semester}</span></div>
            <PrimaryLink as={Link} to="/admin/subjects" $variant="outline">Open Subject Search</PrimaryLink>
          </SectionHeading>
          <SupportingText>Assignments below are matched to {department}, Semester {semester}, Section {section}, Academic year {formatAcademicYear(activeYear)}. Legacy subject records without a semester use their year grouping.</SupportingText>
          {isLoading ? <Empty>Loading subjects...</Empty> : visibleSubjects.length === 0 ? <Empty>No subjects found for {department}, Semester {semester}.</Empty> : (
            <DataTable>
              <table>
                <thead><tr><th>Subject Code</th><th>Subject Name</th><th>Total Lectures</th><th>Semester / Year</th><th>Section</th><th>Assigned Faculty</th></tr></thead>
                <tbody>
                  {visibleSubjects.map((subjectRecord) => (
                    <tr key={subjectRecord._id || subjectRecord.subjectCode}>
                      <td><strong>{subjectRecord.subjectCode}</strong></td>
                      <td>{subjectRecord.subjectName}</td>
                      <td>{subjectRecord.totalLectures}</td>
                      <td>{subjectRecord.semester ? `Semester ${subjectRecord.semester}` : `Year ${subjectRecord.year}`}</td>
                      <td>{section}</td>
                      <td>{facultyForSubject(subjectRecord)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataTable>
          )}
        </Card>}

        {tab === 'assignments' && <Card $pad="20px">
          <SectionHeading>
            <div><InnerTitle>Faculty Assignment</InnerTitle><span>Choose a subject and a faculty member</span></div>
            <span>{visibleFaculty.length} faculty in {department}</span>
          </SectionHeading>
          <FormGrid>
            <Field>
              <Label htmlFor="assignment-subject">Subject - Semester {semester}</Label>
              <Select id="assignment-subject" value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)}>
                <option value="">Select subject</option>
                {visibleSubjects.map((subjectRecord) => <option key={subjectRecord._id || subjectRecord.subjectCode} value={subjectRecord._id}>{subjectRecord.subjectName} ({subjectRecord.subjectCode})</option>)}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="assignment-faculty">Faculty</Label>
              <Select id="assignment-faculty" value={selectedFaculty} onChange={(event) => setSelectedFaculty(event.target.value)}>
                <option value="">Select faculty</option>
                {visibleFaculty.map((facultyRecord) => <option key={facultyRecord._id || facultyRecord.registrationNumber} value={facultyRecord._id}>{facultyRecord.name}{facultyRecord.registrationNumber ? ` - ${facultyRecord.registrationNumber}` : ''}</option>)}
              </Select>
            </Field>
          </FormGrid>
          <UnavailableAction type="button" disabled title="Assignment persistence is not available in the backend">Assign Faculty</UnavailableAction>
          <Status role="status">Assignment changes are disabled in this panel. This view uses the saved faculty assignment records.</Status>
          <SupportingText style={{ marginTop: 20, marginBottom: 0 }}>
            {records.subjects === null || records.faculty === null
              ? 'Saved assignment data is unavailable because subject or faculty records could not be loaded.'
              : 'Faculty teaching qualifications are not treated as assignments; only saved subject assignments appear above.'}
          </SupportingText>
        </Card>}
      </Content>
    </PageShell>
  );
};

export default AdminAcademic;
