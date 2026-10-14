import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Btn, Input, Label, PageShell, Select } from '../../components/UI';
import {
  adminFetchResults,
  adminFetchStudentResults,
  adminFetchSubjectDirectory,
  adminFetchSubjectResults,
} from '../../redux/actions/adminAction';
import {
  ADMIN_DEPARTMENTS,
  ADMIN_SECTIONS,
  ADMIN_SEMESTERS,
} from '../../config/adminOptions';
import { colors, font, radius, shadow, transition } from '../../styles/theme';

const Content = styled.main`
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 36px 24px 56px;
  font-family: ${font.family};
  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
  margin-bottom: 24px;
  h1 { margin: 0 0 6px; color: ${colors.textPrimary}; font-size: 25px; }
  p { margin: 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.5; }
  @media (max-width: 600px) { flex-direction: column; }
`;

const HeadingActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const FilterCard = styled.form`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: end;
  gap: 14px;
  padding: 20px;
  margin-bottom: 22px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  @media (max-width: 850px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 520px) { grid-template-columns: 1fr; padding: 16px; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const SearchField = styled(Field)`
  grid-column: span 2;
  @media (max-width: 520px) { grid-column: auto; }
`;

const FilterActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  @media (max-width: 520px) { button { flex: 1; } }
`;

const Stats = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
  margin: 0 0 22px;
`;

const Stat = styled.div`
  padding: 17px 18px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  box-shadow: ${shadow.card};
  transition: ${transition.fast};
  &:hover { transform: translateY(-2px); box-shadow: ${shadow.cardHover}; }
  span { display: block; margin-bottom: 7px; color: ${colors.textMuted}; font-size: 12px; }
  strong { color: ${colors.textPrimary}; font-size: 22px; font-weight: 650; }
`;

const TableCard = styled.section`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 17px 20px;
  border-bottom: 1px solid ${colors.border};
  h2 { margin: 0; font-size: 16px; font-weight: 600; color: ${colors.textPrimary}; }
  span { color: ${colors.textMuted}; font-size: 12px; }
  @media (max-width: 520px) { align-items: flex-start; flex-direction: column; }
`;

const TableScroll = styled.div`
  width: 100%;
  overflow-x: auto;
  table { width: 100%; min-width: 790px; border-collapse: collapse; text-align: left; }
  th { padding: 12px 16px; background: #f8fafc; color: ${colors.textSecondary}; font-size: 11px; font-weight: 600; white-space: nowrap; }
  td { padding: 13px 16px; border-top: 1px solid #edf0f5; color: ${colors.textSecondary}; font-size: 13px; white-space: nowrap; }
  tbody tr { transition: background 0.14s ease; }
  tbody tr:hover { background: #f8fbfe; }
  a { color: ${colors.primary}; font-weight: 600; text-decoration: none; }
  a:hover { text-decoration: underline; }
`;

const StateBox = styled.div`
  padding: 38px 20px;
  text-align: center;
  color: ${colors.textSecondary};
  font-size: 14px;
  p { margin: 0 0 14px; }
`;

const DetailGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
  gap: 12px;
  margin: 0 0 22px;
`;

const DetailItem = styled.div`
  min-width: 0;
  padding: 15px 16px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  span { display: block; margin-bottom: 6px; color: ${colors.textMuted}; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  strong { display: block; overflow-wrap: anywhere; color: ${colors.textPrimary}; font-size: 14px; font-weight: 600; }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 18px;
  color: ${colors.primary};
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const safe = (value) => (value === undefined || value === null || value === '' ? '—' : value);
const asYear = (student, subject) => student?.year ?? subject?.year;

const exportCsv = (records) => {
  const fields = [
    ['USN', (record) => record.student?.registrationNumber],
    ['Student Name', (record) => record.student?.name],
    ['Department', (record) => record.student?.department || record.department || record.subject?.department],
    ['Year', (record) => asYear(record.student, record.subject)],
    ['Section', (record) => record.student?.section || record.section],
    ['Subject Code', (record) => record.subject?.subjectCode],
    ['Subject Name', (record) => record.subject?.subjectName],
    ['Exam', (record) => record.exam],
    ['Marks', (record) => record.marks],
    ['Total Marks', (record) => record.totalMarks],
  ].filter(([, getValue]) => records.some((record) => getValue(record) !== undefined && getValue(record) !== null));

  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    fields.map(([label]) => escapeCell(label)).join(','),
    ...records.map((record) => fields.map(([, getValue]) => escapeCell(getValue(record))).join(',')),
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'edutrack-results.csv';
  link.click();
  URL.revokeObjectURL(url);
};

const StatCard = ({ label, value }) => (
  <Stat><span>{label}</span><strong>{value}</strong></Stat>
);

const ResultsTable = ({ records, detailType, onPublish, onReopen }) => {
  const hasStudent = records.some((record) => record.student);
  const hasSubject = records.some((record) => record.subject);
  const columns = detailType === 'student'
    ? [
      ['Subject Code', (record) => record.subject?.subjectCode],
      ['Subject Name', (record) => record.subject?.subjectName],
      ['Exam', (record) => record.exam],
      ['Marks', (record) => record.marks],
      ['Out of', (record) => record.totalMarks],
    ]
    : detailType === 'subject'
      ? [
        ['USN', (record) => record.student?.registrationNumber],
        ['Student Name', (record) => record.student?.name],
        ['Exam', (record) => record.exam],
        ['Marks', (record) => record.marks],
        ['Out of', (record) => record.totalMarks],
        ['Status', (record) => record.status || 'LEGACY'],
        ['Actions', () => 'Review'],
      ]
      : [
        ['USN', (record) => record.student?.registrationNumber],
        ['Student Name', (record) => record.student?.name],
        ['Department', (record) => record.student?.department || record.department || record.subject?.department],
        ['Year', (record) => asYear(record.student, record.subject)],
        ['Section', (record) => record.student?.section || record.section],
        ['Subject Code', (record) => record.subject?.subjectCode],
        ['Subject Name', (record) => record.subject?.subjectName],
        ['Exam', (record) => record.exam],
        ['Marks', (record) => record.marks],
        ['Total Marks', (record) => record.totalMarks],
        ['Status', (record) => record.status || 'LEGACY'],
        ['Actions', () => 'Review'],
      ].filter(([label]) => {
        if (label === 'USN' || label === 'Student Name') return hasStudent;
        if (label === 'Subject Code' || label === 'Subject Name') return hasSubject;
        return true;
      });

  const valueFor = (record, label, getValue) => {
    const value = getValue(record);
    if (label === 'USN' && value) {
      return (
        <Link to={`/admin/results/student/${encodeURIComponent(value)}`}>
          {value}
        </Link>
      );
    }
    if (label === 'Subject Code' && value) {
      return (
        <Link to={`/admin/results/subject/${encodeURIComponent(value)}`}>
          {value}
        </Link>
      );
    }
    if (label === 'Actions') {
      return record.status === 'SUBMITTED' ? (
        <button type="button" onClick={() => onPublish(record)}>Publish</button>
      ) : record.status === 'PUBLISHED' ? (
        <button type="button" onClick={() => onReopen(record)}>Reopen</button>
      ) : safe(value);
    }
    return safe(value);
  };

  if (!records.length) {
    return <StateBox>No results found for the selected filters.</StateBox>;
  }

  return (
    <TableScroll>
      <table>
        <thead>
          <tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={record._id || `${record.student?._id}-${record.subject?._id}-${record.exam}-${index}`}>
              {columns.map(([label, getValue]) => (
                <td key={label}>{valueFor(record, label, getValue)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
};

const AdminResults = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registrationNumber, subjectCode } = useParams();
  const admin = useSelector((state) => state.admin);
  const resultsState = useSelector((state) => state.admin.results);
  const subjects = useSelector((state) => state.admin.allSubject);
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [exam, setExam] = useState('');
  const [search, setSearch] = useState('');
  const [recordStatus, setRecordStatus] = useState('');
  const [publishNotice, setPublishNotice] = useState('');

  const detailType = registrationNumber ? 'student' : subjectCode ? 'subject' : null;

  const loadPage = () => {
    if (registrationNumber) {
      dispatch(adminFetchStudentResults(registrationNumber)).catch(() => {});
    } else if (subjectCode) {
      dispatch(adminFetchSubjectResults(subjectCode)).catch(() => {});
    } else {
      const filters = {
        ...(department && { department }),
        ...(semester && { semester }),
        ...(section && { section }),
        ...(selectedSubject && { subjectCode: selectedSubject }),
        ...(exam && { exam }),
        ...(recordStatus && { status: recordStatus }),
        ...(search.trim() && { search: search.trim() }),
      };
      dispatch(adminFetchResults(filters)).catch(() => {});
    }
  };

  useEffect(() => {
    if (registrationNumber) {
      dispatch(adminFetchStudentResults(registrationNumber)).catch(() => {});
    } else if (subjectCode) {
      dispatch(adminFetchSubjectResults(subjectCode)).catch(() => {});
    } else {
      dispatch(adminFetchResults()).catch(() => {});
      dispatch(adminFetchSubjectDirectory()).catch(() => {});
    }
  }, [dispatch, registrationNumber, subjectCode]);

  const records = resultsState?.records || [];
  const summary = resultsState?.summary;
  const student = resultsState?.student;
  const subject = resultsState?.subject;

  const detailStats = useMemo(() => {
    if (detailType === 'student' && summary) {
      return [
        ['Total Subjects', summary.totalSubjects],
        ['Total Marks', summary.totalMarks],
        ['Percentage', summary.percentage === undefined ? undefined : `${summary.percentage}%`],
      ].filter(([, value]) => value !== undefined && value !== null);
    }
    if (detailType === 'subject' && summary) {
      return [
        ['Students with Marks', summary.totalStudents],
        ['Average Marks', summary.averageMarks],
      ].filter(([, value]) => value !== undefined && value !== null);
    }
    return [];
  }, [detailType, summary]);

  if (!admin?.isAuthenticated) return <Navigate to="/admin/login" replace />;

  const pageTitle = detailType === 'student'
    ? 'Student Results'
    : detailType === 'subject'
      ? 'Subject Results'
      : 'Marks & Results';

  const studentYear = student?.year;

  const updatePublication = async (record, action) => {
    const actionLabel = action === 'publish' ? 'publish' : 'reopen for correction';
    if (!window.confirm(`Are you sure you want to ${actionLabel} ${record.exam || 'these marks'} for ${record.student?.registrationNumber || 'this student'}?`)) return;
    try {
      const path = action === 'publish' ? 'publish' : 'reopen';
      const { data } = await axios.post(`/api/admin/marks/${record._id}/${path}`);
      setPublishNotice(data.message || `Marks ${action === 'publish' ? 'published' : 'reopened'}.`);
      loadPage();
    } catch (error) {
      setPublishNotice(error.response?.data?.message || 'Unable to update marks status.');
    }
  };

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        {detailType && <BackLink to="/admin/results">← Back to results</BackLink>}
        <Heading>
          <div>
            <h1>{pageTitle}</h1>
            <p>
              {detailType === 'student'
                ? `Result records for ${safe(student?.registrationNumber)}`
                : detailType === 'subject'
                  ? `Result records for ${safe(subject?.subjectCode)}`
                  : 'Review marks entered by faculty across departments and subjects.'}
            </p>
          </div>
          <HeadingActions>
            {records.length > 0 && !detailType && (
              <Btn type="button" $variant="outline" onClick={() => exportCsv(records)}>
                Export CSV
              </Btn>
            )}
            {detailType === 'subject' && subjectCode && (
              <Btn type="button" $variant="outline" onClick={() => navigate(`/admin/subjects/${encodeURIComponent(subjectCode)}`)}>
                Subject profile
              </Btn>
            )}
          </HeadingActions>
        </Heading>

        {!detailType && (
          <FilterCard onSubmit={(event) => { event.preventDefault(); loadPage(); }}>
            <Field>
              <Label htmlFor="result-department">Department</Label>
              <Select id="result-department" value={department} onChange={(event) => setDepartment(event.target.value)}>
                <option value="">All departments</option>
                {ADMIN_DEPARTMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="result-semester">Semester</Label>
              <Select id="result-semester" value={semester} onChange={(event) => setSemester(event.target.value)}>
                <option value="">All semesters</option>
                {ADMIN_SEMESTERS.map((item) => <option key={item} value={item}>Semester {item}</option>)}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="result-section">Section</Label>
              <Select id="result-section" value={section} onChange={(event) => setSection(event.target.value)}>
                <option value="">All sections</option>
                {ADMIN_SECTIONS.map((item) => <option key={item} value={item}>Section {item}</option>)}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="result-subject">Subject</Label>
              <Select id="result-subject" value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)}>
                <option value="">All subjects</option>
                {(Array.isArray(subjects) ? subjects : []).map((item) => (
                  <option key={item._id || item.subjectCode} value={item.subjectCode}>
                    {item.subjectCode} — {item.subjectName}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="result-exam">Exam Type</Label>
              <Select id="result-exam" value={exam} onChange={(event) => setExam(event.target.value)}>
                <option value="">All exam types</option>
                {(resultsState?.exams || []).map((item) => <option key={item} value={item}>{item}</option>)}
                {exam && !(resultsState?.exams || []).includes(exam) && <option value={exam}>{exam}</option>}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="result-status">Workflow Status</Label>
              <Select id="result-status" value={recordStatus} onChange={(event) => setRecordStatus(event.target.value)}>
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PUBLISHED">Published</option>
                <option value="LEGACY">Legacy</option>
              </Select>
            </Field>
            <SearchField>
              <Label htmlFor="result-search">Search records</Label>
              <Input
                id="result-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Student USN or name, subject code or name"
              />
            </SearchField>
            <FilterActions>
              <Btn type="submit">Apply filters</Btn>
              <Btn
                type="button"
                $variant="ghost"
                onClick={() => {
                  setDepartment('');
                  setSemester('');
                  setSection('');
                  setSelectedSubject('');
                  setExam('');
                  setSearch('');
                  setRecordStatus('');
                  setPublishNotice('');
                  dispatch(adminFetchResults()).catch(() => {});
                }}
              >
                Clear
              </Btn>
            </FilterActions>
          </FilterCard>
        )}

        {resultsState?.loading ? (
          <TableCard><StateBox>Loading results...</StateBox></TableCard>
        ) : resultsState?.error ? (
          <TableCard>
            <StateBox>
              <p>Unable to load results.</p>
              <Btn type="button" onClick={loadPage}>Retry</Btn>
            </StateBox>
          </TableCard>
        ) : (
          <>
            {publishNotice && <StateBox>{publishNotice}</StateBox>}
            {!detailType && records.length > 0 && summary && (
              <Stats aria-label="Results summary">
                {summary.totalStudents !== undefined && <StatCard label="Total Students" value={summary.totalStudents} />}
                {summary.totalSubjects !== undefined && <StatCard label="Total Subjects" value={summary.totalSubjects} />}
                {summary.averageMarks !== undefined && <StatCard label="Average Marks" value={summary.averageMarks} />}
              </Stats>
            )}

            {detailType === 'student' && student && (
              <>
                <TableCard style={{ marginBottom: 20 }}>
                  <TableHeader><h2>Student Information</h2></TableHeader>
                  <DetailGrid style={{ padding: 18, marginBottom: 0 }}>
                    <DetailItem><span>USN</span><strong>{safe(student.registrationNumber)}</strong></DetailItem>
                    <DetailItem><span>Name</span><strong>{safe(student.name)}</strong></DetailItem>
                    <DetailItem><span>Department</span><strong>{safe(student.department)}</strong></DetailItem>
                    <DetailItem>
                      <span>Semester</span>
                      <strong>{studentYear ? `Year ${studentYear}; semester not recorded` : 'Not recorded'}</strong>
                    </DetailItem>
                    <DetailItem><span>Section</span><strong>{safe(student.section)}</strong></DetailItem>
                  </DetailGrid>
                </TableCard>
                {detailStats.length > 0 && (
                  <Stats aria-label="Student result summary">
                    {detailStats.map(([label, value]) => <StatCard key={label} label={label} value={value} />)}
                  </Stats>
                )}
              </>
            )}

            {detailType === 'subject' && subject && (
              <TableCard style={{ marginBottom: 20 }}>
                <TableHeader><h2>Subject Information</h2></TableHeader>
                <DetailGrid style={{ padding: 18, marginBottom: 0 }}>
                  <DetailItem><span>Subject Code</span><strong>{safe(subject.subjectCode)}</strong></DetailItem>
                  <DetailItem><span>Subject Name</span><strong>{safe(subject.subjectName)}</strong></DetailItem>
                  <DetailItem><span>Department</span><strong>{safe(subject.department)}</strong></DetailItem>
                  <DetailItem><span>Year</span><strong>{safe(subject.year)}</strong></DetailItem>
                </DetailGrid>
              </TableCard>
            )}

            <TableCard>
              <TableHeader>
                <h2>{detailType ? 'Subject-wise Results' : 'Marks Directory'}</h2>
                <span>{records.length} {records.length === 1 ? 'record' : 'records'}</span>
              </TableHeader>
              <ResultsTable
                records={records}
                detailType={detailType}
                onPublish={(record) => updatePublication(record, 'publish')}
                onReopen={(record) => updatePublication(record, 'reopen')}
              />
            </TableCard>
          </>
        )}
      </Content>
    </PageShell>
  );
};

export default AdminResults;
