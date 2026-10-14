import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Btn, Label, PageShell, Select } from '../../components/UI';
import { adminFetchReports } from '../../redux/actions/adminAction';
import {
  ACADEMIC_YEARS,
  ADMIN_DEPARTMENTS,
  ADMIN_SECTIONS,
  ADMIN_SEMESTERS,
} from '../../config/adminOptions';
import { colors, font, radius, shadow, transition } from '../../styles/theme';

const reportTypes = [
  ['overview', 'Overview'],
  ['students', 'Student Report'],
  ['attendance', 'Attendance Report'],
  ['results', 'Marks & Results Report'],
  ['fees', 'Fees Report'],
  ['faculty', 'Faculty Report'],
  ['academic', 'Academic Performance'],
];

const Content = styled.main`
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 36px 24px 56px;
  font-family: ${font.family};
  @media (max-width: 600px) { padding: 24px 16px 40px; }
  @media print {
    width: 100%;
    padding: 0;
    .no-print { display: none !important; }
    background: white;
  }
`;

const Heading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
  h1 { margin: 0 0 6px; color: ${colors.textPrimary}; font-size: 25px; }
  p { margin: 0; color: ${colors.textMuted}; font-size: 14px; line-height: 1.5; }
  @media (max-width: 560px) { flex-direction: column; }
`;

const HeadingActions = styled.div`
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
`;

const FilterCard = styled.form`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  align-items: end;
  gap: 13px;
  padding: 18px;
  margin-bottom: 20px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  @media (max-width: 850px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 560px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 400px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  @media (max-width: 400px) { button { flex: 1; } }
`;

const Stats = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
`;

const Stat = styled(Link)`
  display: block;
  padding: 16px 18px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  box-shadow: ${shadow.card};
  text-decoration: none;
  transition: ${transition.fast};
  &:hover { transform: translateY(-2px); box-shadow: ${shadow.cardHover}; border-color: #bfd5e8; }
  span { display: block; margin-bottom: 7px; color: ${colors.textMuted}; font-size: 12px; }
  strong { color: ${colors.textPrimary}; font-size: 22px; font-weight: 650; overflow-wrap: anywhere; }
`;

const Section = styled.section`
  padding: 19px;
  margin-bottom: 18px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  h2 { margin: 0; color: ${colors.textPrimary}; font-size: 16px; font-weight: 650; }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid ${colors.border};
  p { margin: 0; color: ${colors.textMuted}; font-size: 11px; }
  @media (max-width: 520px) { align-items: flex-start; flex-direction: column; }
`;

const GridTwo = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 750px) { grid-template-columns: 1fr; }
`;

const ChartList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 13px;
`;

const BarRow = styled.div`
  display: grid;
  grid-template-columns: minmax(90px, 150px) minmax(60px, 1fr) auto;
  align-items: center;
  gap: 10px;
  @media (max-width: 480px) { grid-template-columns: minmax(74px, 110px) minmax(40px, 1fr) auto; gap: 7px; }
`;

const BarLabel = styled.span`
  overflow: hidden;
  color: ${colors.textSecondary};
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BarTrack = styled.div`
  height: 11px;
  overflow: hidden;
  border-radius: ${radius.full};
  background: #eef2f7;
`;

const BarFill = styled.div`
  width: ${({ $width }) => `${$width}%`};
  height: 100%;
  min-width: ${({ $width }) => ($width > 0 ? '2px' : '0')};
  border-radius: inherit;
  background: ${colors.primary};
`;

const BarValue = styled.strong`
  min-width: 42px;
  color: ${colors.textPrimary};
  font-size: 11px;
  text-align: right;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  table { width: 100%; min-width: 560px; border-collapse: collapse; text-align: left; }
  th { padding: 11px 13px; background: #f8fafc; color: ${colors.textSecondary}; font-size: 11px; font-weight: 600; white-space: nowrap; }
  td { padding: 12px 13px; border-top: 1px solid #edf0f5; color: ${colors.textSecondary}; font-size: 12px; white-space: nowrap; }
  a { color: ${colors.primary}; font-weight: 600; text-decoration: none; }
`;

const Empty = styled.div`
  padding: 23px 12px;
  border-radius: ${radius.md};
  background: #f8fafc;
  color: ${colors.textMuted};
  text-align: center;
  font-size: 13px;
`;

const Note = styled.div`
  padding: 12px 14px;
  margin-bottom: 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.white};
  color: ${colors.textSecondary};
  font-size: 12px;
  line-height: 1.5;
`;

const ErrorBox = styled.div`
  padding: 36px 20px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  color: ${colors.textSecondary};
  text-align: center;
  p { margin: 0 0 14px; }
`;

const yearLabel = (year) => {
  const number = Number(year);
  if (!number) return year || '—';
  const semesters = number <= 1 ? 'Semesters 1–2' : `Semesters ${number * 2 - 1}–${number * 2}`;
  return `Year ${number} · ${semesters}`;
};

const displayNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const Chart = ({ title, rows, valueKey = 'count', formatter, labeler }) => {
  const validRows = (rows || []).filter((row) => Number.isFinite(Number(row[valueKey])));
  if (!validRows.length) {
    return <Section><SectionHeader><h2>{title}</h2></SectionHeader><Empty>No data available for the selected filters.</Empty></Section>;
  }
  const max = Math.max(...validRows.map((row) => Number(row[valueKey])), 0);
  return (
    <Section>
      <SectionHeader><h2>{title}</h2></SectionHeader>
      <ChartList role="img" aria-label={title}>
        {validRows.map((row, index) => {
          const value = Number(row[valueKey]);
          const width = max > 0 ? (value / max) * 100 : 0;
          const label = labeler ? labeler(row) : row.label ?? row._id ?? 'Not recorded';
          return (
            <BarRow key={`${label}-${index}`}>
              <BarLabel title={label}>{label}</BarLabel>
              <BarTrack><BarFill $width={width} /></BarTrack>
              <BarValue>{formatter ? formatter(value) : displayNumber(value)}</BarValue>
            </BarRow>
          );
        })}
      </ChartList>
    </Section>
  );
};

const AnalyticsTable = ({ title, rows, columns, emptyText = 'No data available for the selected filters.' }) => (
  <Section>
    <SectionHeader><h2>{title}</h2><p>{rows?.length || 0} records</p></SectionHeader>
    {rows?.length ? (
      <TableWrap>
        <table>
          <thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row._id || `${row.registrationNumber || row.subjectCode || row.name}-${index}`}>
                {columns.map((column) => (
                  <td key={column.label}>{column.render ? column.render(row) : column.value(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    ) : <Empty>{emptyText}</Empty>}
  </Section>
);

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const downloadCsv = (name, headers, rows) => {
  if (!rows.length) return;
  const csv = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
};

const reportCsvData = (type, data) => {
  if (type === 'students') {
    const rows = data.students?.byDepartment || [];
    return ['students-by-department.csv', ['Department', 'Students'], rows.map((row) => [row._id, row.count])];
  }
  if (type === 'attendance') {
    const rows = data.attendance?.byDepartment || [];
    return ['attendance-by-department.csv', ['Department', 'Attendance Percentage'], rows.map((row) => [row._id, row.percentage])];
  }
  if (type === 'results') {
    const rows = data.results?.bySubject || [];
    return ['subject-results.csv', ['Subject Code', 'Subject Name', 'Average Marks', 'Average Percentage'], rows.map((row) => [row.subjectCode, row.subjectName, row.averageMarks, row.averagePercentage])];
  }
  if (type === 'fees') {
    const rows = data.fees?.byDepartment || [];
    return ['fees-by-department.csv', ['Department', 'Total Fees', 'Fees Collected', 'Pending Fees', 'Collection Percentage'], rows.map((row) => [row._id, row.totalFees, row.feesCollected, row.pendingFees, row.collectionPercentage])];
  }
  if (type === 'faculty') {
    const rows = data.faculty?.byDesignation || [];
    return ['faculty-by-designation.csv', ['Designation', 'Faculty'], rows.map((row) => [row._id, row.count])];
  }
  if (type === 'academic') {
    const attendanceRows = data.attendance?.lowestStudents || [];
    return ['academic-performance-attendance.csv', ['USN', 'Student', 'Department', 'Year', 'Section', 'Attendance Percentage'], attendanceRows.map((row) => [row.registrationNumber, row.name, row.department, yearLabel(row.year), row.section, row.percentage])];
  }
  const rows = data.students?.byDepartment || [];
  return ['overview-students-by-department.csv', ['Department', 'Students'], rows.map((row) => [row._id, row.count])];
};

const AdminReports = () => {
  const dispatch = useDispatch();
  const admin = useSelector((state) => state.admin);
  const reportState = useSelector((state) => state.admin.reports);
  const data = reportState?.data;
  const [filters, setFilters] = useState({
    academicYear: '',
    department: '',
    semester: '',
    section: '',
    type: 'overview',
  });

  const load = (values = filters) => {
    const params = Object.fromEntries(
      Object.entries(values).filter(([, value]) => value !== '')
    );
    dispatch(adminFetchReports(params)).catch(() => {});
  };

  useEffect(() => {
    dispatch(adminFetchReports()).catch(() => {});
  }, [dispatch]);

  const chartOptions = useMemo(
    () => ({
      percent: (value) => `${displayNumber(value, 1)}%`,
      year: (row) => yearLabel(row._id),
    }),
    []
  );

  if (!admin?.isAuthenticated) return <Navigate to="/admin/login" replace />;

  const studentGroups = data?.students || {};
  const attendance = data?.attendance || {};
  const results = data?.results || {};
  const fees = data?.fees || {};
  const faculty = data?.faculty || {};
  const summary = data?.summary || {};
  const type = filters.type;
  const csvData = data ? reportCsvData(type, data) : null;

  const StatCard = ({ label, value, to }) => (
    <Stat className="no-print" to={to}>
      <span>{label}</span>
      <strong>{value}</strong>
    </Stat>
  );

  const renderStudents = () => (
    <>
      {studentGroups.total !== null && (
        <Stats><StatCard label="Total Students" value={displayNumber(studentGroups.total)} to="/admin/students" /></Stats>
      )}
      <GridTwo>
        <Chart title="Students by Department" rows={studentGroups.byDepartment} />
        <Chart title="Students by Year / Semester Group" rows={studentGroups.byYear} labeler={chartOptions.year} />
        <Chart title="Students by Section" rows={studentGroups.bySection} labeler={(row) => row._id ? `Section ${row._id}` : 'Not recorded'} />
      </GridTwo>
      <Note>Registration dates and active/inactive status are not stored in the current student model, so registration trends and active-status reports are unavailable.</Note>
    </>
  );

  const renderAttendance = () => (
    <>
      {attendance.overall?.averageAttendance !== undefined && attendance.overall?.averageAttendance !== null && (
        <Stats><StatCard label="Average Attendance" value={`${displayNumber(attendance.overall.averageAttendance, 1)}%`} to="/admin/attendance" /></Stats>
      )}
      <GridTwo>
        <Chart title="Attendance by Department" rows={attendance.byDepartment} valueKey="percentage" formatter={chartOptions.percent} />
        <Chart title="Attendance by Year / Semester Group" rows={attendance.byYear} valueKey="percentage" formatter={chartOptions.percent} labeler={chartOptions.year} />
      </GridTwo>
      <AnalyticsTable
        title="Subject Attendance"
        rows={attendance.bySubject}
        columns={[
          { label: 'Subject Code', value: (row) => row.subjectCode || '—' },
          { label: 'Subject Name', value: (row) => row.subjectName || '—' },
          { label: 'Department', value: (row) => row.department || '—' },
          { label: 'Year', value: (row) => yearLabel(row.year) },
          { label: 'Attendance', value: (row) => `${displayNumber(row.percentage, 1)}%` },
        ]}
      />
      <AnalyticsTable
        title="Lowest Recorded Student Attendance"
        rows={attendance.lowestStudents}
        columns={[
          { label: 'USN', value: (row) => row.registrationNumber || '—' },
          { label: 'Student', value: (row) => row.name || '—' },
          { label: 'Department', value: (row) => row.department || '—' },
          { label: 'Year', value: (row) => yearLabel(row.year) },
          { label: 'Section', value: (row) => row.section || '—' },
          { label: 'Attendance', value: (row) => `${displayNumber(row.percentage, 1)}%` },
        ]}
        emptyText="No attendance percentages are available for these students."
      />
      <Note>The existing attendance records do not define a low-attendance threshold. This table ranks the lowest recorded attendance averages; it does not label students as failing or at risk.</Note>
    </>
  );

  const renderResults = () => (
    <>
      {results.overall?.averageMarks !== undefined && (
        <Stats>
          <StatCard label="Average Marks" value={displayNumber(results.overall.averageMarks, 2)} to="/admin/results" />
          <StatCard label="Average Score" value={`${displayNumber(results.overall.averagePercentage, 1)}%`} to="/admin/results" />
        </Stats>
      )}
      <GridTwo>
        <Chart title="Average Score by Department" rows={results.byDepartment} valueKey="averagePercentage" formatter={chartOptions.percent} />
        <Chart title="Average Score by Year / Semester Group" rows={results.byYear} valueKey="averagePercentage" formatter={chartOptions.percent} labeler={chartOptions.year} />
      </GridTwo>
      <AnalyticsTable
        title="Subject Performance (lowest average first)"
        rows={results.bySubject}
        columns={[
          { label: 'Subject Code', value: (row) => row.subjectCode || '—' },
          { label: 'Subject Name', value: (row) => row.subjectName || '—' },
          { label: 'Department', value: (row) => row.department || '—' },
          { label: 'Year', value: (row) => yearLabel(row.year) },
          { label: 'Average Marks', value: (row) => displayNumber(row.averageMarks, 2) },
          { label: 'Average Score', value: (row) => `${displayNumber(row.averagePercentage, 1)}%` },
        ]}
      />
      <AnalyticsTable
        title="Top Students by Recorded Average Score"
        rows={results.topStudents}
        columns={[
          { label: 'USN', value: (row) => row.registrationNumber || '—' },
          { label: 'Student', value: (row) => row.name || '—' },
          { label: 'Department', value: (row) => row.department || '—' },
          { label: 'Year', value: (row) => yearLabel(row.year) },
          { label: 'Section', value: (row) => row.section || '—' },
          { label: 'Average Score', value: (row) => `${displayNumber(row.averagePercentage, 1)}%` },
        ]}
      />
      <Note>The Marks model stores scores and maximum marks but no grading scale or pass threshold. Pass/fail percentages and grade distributions are therefore unavailable.</Note>
    </>
  );

  const renderFees = () => (
    <>
      {fees.overall && (
        <Stats>
          <StatCard label="Total Fees" value={displayNumber(fees.overall.totalFees)} to="/admin/fees" />
          <StatCard label="Fees Collected" value={displayNumber(fees.overall.feesCollected)} to="/admin/fees" />
          <StatCard label="Pending Fees" value={displayNumber(fees.overall.pendingFees)} to="/admin/fees" />
          <StatCard label="Fee Records" value={displayNumber(fees.overall.records)} to="/admin/fees" />
          <StatCard label="Partially Paid Records" value={displayNumber(fees.overall.partiallyPaid)} to="/admin/fees" />
          {fees.overall.collectionPercentage !== null && (
            <StatCard label="Collection Percentage" value={`${displayNumber(fees.overall.collectionPercentage, 1)}%`} to="/admin/fees" />
          )}
        </Stats>
      )}
      <GridTwo>
        <Chart title="Fee Collection by Department" rows={fees.byDepartment} valueKey="feesCollected" />
        <Chart title="Pending Fees by Department" rows={fees.byDepartment} valueKey="pendingFees" />
      </GridTwo>
      <Chart
        title="Fee Records by Payment Status"
        rows={(fees.statuses || []).map((item) => ({ ...item, label: item._id }))}
      />
    </>
  );

  const renderFaculty = () => (
    <>
      {faculty.total !== null && (
        <Stats><StatCard label="Total Faculty" value={displayNumber(faculty.total)} to="/admin/faculty" /></Stats>
      )}
      <GridTwo>
        <Chart title="Faculty by Department" rows={faculty.byDepartment} />
        <Chart title="Faculty by Designation" rows={faculty.byDesignation} />
      </GridTwo>
      <Note>Faculty-subject qualifications are not persisted assignments in this system. Faculty workload cannot be reported reliably from the available data.</Note>
    </>
  );

  const renderAcademic = () => (
    <>
      <GridTwo>
        {attendance.overall?.averageAttendance !== undefined && attendance.overall?.averageAttendance !== null && (
          <Stats><StatCard label="Average Attendance" value={`${displayNumber(attendance.overall.averageAttendance, 1)}%`} to="/admin/attendance" /></Stats>
        )}
        {results.overall?.averagePercentage !== undefined && (
          <Stats><StatCard label="Average Recorded Score" value={`${displayNumber(results.overall.averagePercentage, 1)}%`} to="/admin/results" /></Stats>
        )}
      </GridTwo>
      {renderAttendance()}
      {renderResults()}
    </>
  );

  const renderOverview = () => (
    <>
      <Stats>
        {summary.totalStudents !== undefined && <StatCard label="Total Students" value={displayNumber(summary.totalStudents)} to="/admin/students" />}
        {summary.totalFaculty !== undefined && <StatCard label="Total Faculty" value={displayNumber(summary.totalFaculty)} to="/admin/faculty" />}
        {summary.totalSubjects !== undefined && <StatCard label="Total Subjects" value={displayNumber(summary.totalSubjects)} to="/admin/subjects" />}
        {summary.averageAttendance !== undefined && <StatCard label="Average Attendance" value={`${displayNumber(summary.averageAttendance, 1)}%`} to="/admin/attendance" />}
        {summary.averageMarks !== undefined && <StatCard label="Average Marks" value={displayNumber(summary.averageMarks, 2)} to="/admin/results" />}
        {summary.feesCollected !== undefined && <StatCard label="Fees Collected" value={displayNumber(summary.feesCollected)} to="/admin/fees" />}
        {summary.pendingFees !== undefined && <StatCard label="Pending Fees" value={displayNumber(summary.pendingFees)} to="/admin/fees" />}
        {summary.timetableEntries !== undefined && <StatCard label="Timetable Entries" value={displayNumber(summary.timetableEntries)} to="/admin/timetable" />}
      </Stats>
      <GridTwo>
        <Chart title="Students by Department" rows={studentGroups.byDepartment} />
        <Chart title="Students by Year / Semester Group" rows={studentGroups.byYear} labeler={chartOptions.year} />
      </GridTwo>
    </>
  );

  const reportBody = () => {
    if (type === 'students') return renderStudents();
    if (type === 'attendance') return renderAttendance();
    if (type === 'results') return renderResults();
    if (type === 'fees') return renderFees();
    if (type === 'faculty') return renderFaculty();
    if (type === 'academic') return renderAcademic();
    return renderOverview();
  };

  const title = reportTypes.find(([key]) => key === type)?.[1] || 'Overview';

  return (
    <PageShell>
      <div className="no-print"><AdminNavbar /></div>
      <Content>
        <AdminBackButton />
        <Heading>
          <div>
            <h1>Reports &amp; Analytics</h1>
            <p>{title} · Reports are calculated from persisted EduTrack records.</p>
          </div>
          <HeadingActions className="no-print">
            <Btn type="button" $variant="outline" disabled={!data || !csvData?.[2]?.length} onClick={() => csvData && downloadCsv(...csvData)}>
              Export CSV
            </Btn>
            <Btn type="button" $variant="outline" onClick={() => window.print()}>Print Report</Btn>
          </HeadingActions>
        </Heading>

        <FilterCard className="no-print" onSubmit={(event) => { event.preventDefault(); load(); }}>
          <Field>
            <Label htmlFor="report-academic-year">Academic Year</Label>
            <Select id="report-academic-year" value={filters.academicYear} onChange={(event) => setFilters({ ...filters, academicYear: event.target.value })}>
              <option value="">All years</option>
              {ACADEMIC_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="report-department">Department</Label>
            <Select id="report-department" value={filters.department} onChange={(event) => setFilters({ ...filters, department: event.target.value })}>
              <option value="">All departments</option>
              {ADMIN_DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="report-semester">Semester</Label>
            <Select id="report-semester" value={filters.semester} onChange={(event) => setFilters({ ...filters, semester: event.target.value })}>
              <option value="">All semesters</option>
              {ADMIN_SEMESTERS.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="report-section">Section</Label>
            <Select id="report-section" value={filters.section} onChange={(event) => setFilters({ ...filters, section: event.target.value })}>
              <option value="">All sections</option>
              {ADMIN_SECTIONS.map((section) => <option key={section} value={section}>Section {section}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="report-type">Report Type</Label>
            <Select id="report-type" value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
              {reportTypes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </Select>
          </Field>
          <Actions>
            <Btn type="submit">Apply filters</Btn>
            <Btn
              type="button"
              $variant="ghost"
              onClick={() => {
                const cleared = { academicYear: '', department: '', semester: '', section: '', type: filters.type };
                setFilters(cleared);
                load(cleared);
              }}
            >
              Clear
            </Btn>
          </Actions>
        </FilterCard>

        {filters.academicYear && (
          <Note>
            The selected academic year applies to fee and timetable records. Student, attendance, and marks schemas do not store academic year, so those report sections use the other selected filters only.
          </Note>
        )}
        {data?.unavailableSections?.length > 0 && (
          <Note role="status">
            Some report data could not be loaded: {data.unavailableSections.join(', ')}. Other successfully loaded sections are still available.
          </Note>
        )}

        {reportState?.loading ? (
          <ErrorBox>Loading report data...</ErrorBox>
        ) : reportState?.error ? (
          <ErrorBox>
            <p>Unable to load report data.</p>
            <Btn type="button" onClick={() => load()}>Retry</Btn>
          </ErrorBox>
        ) : data ? (
          reportBody()
        ) : (
          <ErrorBox>No data available for the selected filters.</ErrorBox>
        )}
      </Content>
    </PageShell>
  );
};

export default AdminReports;
