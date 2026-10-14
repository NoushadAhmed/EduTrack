import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Navigate, useSearchParams } from 'react-router-dom';
import { DataGrid } from '@material-ui/data-grid';
import styled, { keyframes } from 'styled-components';
import FacultyNavbar from '../../components/FacultyNavbar';
import FacultyBackButton from '../../components/FacultyBackButton';
import { Btn, Card, PageShell, SectionTitle } from '../../components/UI';
import { colors, font, radius } from '../../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
  max-width: 1050px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;
  @media (max-width: 600px) { padding: 24px 16px; }
`;
const Controls = styled(Card)`
  display: grid;
  grid-template-columns: minmax(240px, 1fr) auto;
  gap: 16px;
  align-items: end;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;
const SelectField = styled.label`
  display: grid;
  gap: 7px;
  color: ${colors.textSecondary};
  font: 600 12px ${font.family};
  select {
    width: 100%; min-height: 44px; padding: 0 12px;
    border: 1px solid ${colors.border}; border-radius: ${radius.md};
    background: ${colors.white}; color: ${colors.textPrimary}; font: 14px ${font.family};
  }
`;
const Notice = styled.div`
  margin-top: 16px; padding: 12px 14px; border-radius: ${radius.md};
  background: ${({ $error }) => $error ? '#fff1f0' : '#ecfdf3'};
  color: ${({ $error }) => $error ? '#b42318' : '#067647'}; font-size: 14px;
`;
const GridWrap = styled.div`
  background: ${colors.white}; border: 1px solid ${colors.border};
  border-radius: ${radius.lg}; overflow: hidden; margin-top: 20px;
`;
const SubjectMeta = styled.div`
  margin-top: 14px; color: ${colors.textSecondary}; font-size: 14px;
  strong { color: ${colors.textPrimary}; }
`;
const HistorySection = styled.section`
  margin-top: 30px;
`;
const HistoryFilters = styled.div`
  display: flex; justify-content: flex-end; margin: 12px 0;
  select { min-height: 40px; min-width: 240px; padding: 0 10px; border: 1px solid ${colors.border}; border-radius: ${radius.md}; background: ${colors.white}; color: ${colors.textPrimary}; font: 13px ${font.family}; }
`;
const HistoryCard = styled(Card)`
  margin-top: 14px;
  padding: 0;
  overflow: hidden;
`;
const HistoryTableWrap = styled.div`overflow-x: auto;`;
const HistoryTable = styled.table`
  width: 100%; min-width: 700px; border-collapse: collapse;
  th, td { padding: 13px 15px; text-align: left; border-bottom: 1px solid ${colors.border}; color: ${colors.textPrimary}; font-size: 13px; }
  th { background: ${colors.bgPage}; color: ${colors.textSecondary}; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
  tr:last-child td { border-bottom: 0; }
`;
const StatusPill = styled.span`
  display: inline-flex; padding: 4px 9px; border-radius: 999px;
  background: ${({ $present }) => $present ? '#ecfdf3' : '#fff1f0'};
  color: ${({ $present }) => $present ? '#067647' : '#b42318'};
  font-size: 11px; font-weight: 700;
`;
const SummaryCard = styled(Card)`
  margin-top: 18px; border-color: rgba(16, 185, 129, .25);
  background: #f2fbf6;
`;
const SummaryGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 12px;
`;
const SummaryItem = styled.div`
  padding: 11px 12px; border: 1px solid ${colors.border}; border-radius: ${radius.md}; background: ${colors.white};
  span { display: block; color: ${colors.textMuted}; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
  strong { color: ${colors.textPrimary}; font-size: 13px; }
`;
const columns = [
  { field: 'id', headerName: 'No.', width: 80 },
  { field: 'code', headerName: 'Reg. Number', flex: 0.7, minWidth: 150 },
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 180 },
  { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
];
const localDateValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const FacultyAttendance = () => {
  const isAuthenticated = Boolean(useSelector((state) => state.faculty?.isAuthenticated));
  const [searchParams] = useSearchParams();
  const requestedAssignmentId = searchParams.get('assignmentId') || '';
  const [assignments, setAssignments] = useState([]);
  const [assignmentId, setAssignmentId] = useState('');
  const [sessionDate, setSessionDate] = useState(localDateValue);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submittedSummary, setSubmittedSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyAssignmentFilter, setHistoryAssignmentFilter] = useState('');
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    axios.get('/api/faculty/assignedSubjects')
      .then(({ data }) => {
        if (!active) return;
        const rows = Array.isArray(data?.result) ? data.result : [];
        setAssignments(rows);
        const requested = rows.find((row) => String(row._id) === requestedAssignmentId);
        setAssignmentId(requested ? String(requested._id) : rows.length === 1 ? String(rows[0]._id) : '');
      })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load assigned subjects.'); })
      .finally(() => { if (active) setLoadingAssignments(false); });
    return () => { active = false; };
  }, [isAuthenticated, requestedAssignmentId]);

  useEffect(() => {
    if (!isAuthenticated || !assignmentId) {
      setStudents([]); setSelectedIds([]); return undefined;
    }
    let active = true;
    setLoadingStudents(true); setError(''); setSuccess(''); setSelectedIds([]);
    setSubmittedSummary(null);
    axios.get(`/api/faculty/assignedSubjects/${encodeURIComponent(assignmentId)}/students`)
      .then(({ data }) => { if (active) setStudents(Array.isArray(data?.result) ? data.result : []); })
      .catch((err) => {
        if (active) { setStudents([]); setError(err.response?.data?.message || 'Unable to load students for this subject.'); }
      })
      .finally(() => { if (active) setLoadingStudents(false); });
    return () => { active = false; };
  }, [isAuthenticated, assignmentId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setHistory([]); setHistoryError(''); setLoadingHistory(false); return undefined;
    }
    let active = true;
    setLoadingHistory(true); setHistoryError('');
    const selectedHistoryAssignment = assignments.find((item) =>
      String(item.assignmentId || item._id) === historyAssignmentFilter
    );
    const historyParams = new URLSearchParams();
    if (selectedHistoryAssignment) {
      historyParams.set('assignmentId', String(selectedHistoryAssignment.assignmentId || selectedHistoryAssignment._id));
      historyParams.set('subjectId', String(selectedHistoryAssignment.subjectId || selectedHistoryAssignment.subject));
      historyParams.set('department', String(selectedHistoryAssignment.department || ''));
      historyParams.set('semester', String(selectedHistoryAssignment.semester || ''));
      historyParams.set('year', String(selectedHistoryAssignment.year || Math.ceil(Number(selectedHistoryAssignment.semester) / 2)));
      historyParams.set('section', String(selectedHistoryAssignment.section || 'A'));
      if (selectedHistoryAssignment.academicYear) historyParams.set('academicYear', selectedHistoryAssignment.academicYear);
    }
    const query = historyParams.toString() ? `?${historyParams.toString()}` : '';
    axios.get(`/api/faculty/attendanceHistory${query}`)
      .then(({ data }) => { if (active) setHistory(Array.isArray(data?.result) ? data.result : []); })
      .catch((err) => { if (active) setHistoryError(err.response?.data?.message || 'Unable to load attendance history.'); })
      .finally(() => { if (active) setLoadingHistory(false); });
    return () => { active = false; };
  }, [isAuthenticated, assignments, historyAssignmentFilter, historyRefreshKey]);

  const selectedAssignment = useMemo(
    () => assignments.find((item) => String(item._id) === assignmentId),
    [assignments, assignmentId]
  );
  const rows = students.map((student, index) => ({
    id: student._id, number: index + 1, code: student.registrationNumber,
    name: student.name, email: student.email,
  }));
  const gridRows = rows.map(({ id, ...row }) => ({ id, ...row, idLabel: id }));

  const submitAttendance = async () => {
    if (!assignmentId || !students.length || saving) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const { data } = await axios.post('/api/faculty/markAttendance', {
        assignmentId,
        selectedStudents: selectedIds,
        sessionDate,
      });
      setSubmittedSummary(data.session);
      setSuccess(data.message || 'Attendance submitted successfully');
      setSelectedIds([]);
      setHistoryRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save attendance.');
    } finally { setSaving(false); }
  };

  if (!isAuthenticated) return <Navigate to="/" replace />;
  return (
    <PageShell>
      <FacultyNavbar />
      <Content>
        <FacultyBackButton />
        <SectionTitle>Mark Attendance</SectionTitle>
        <Controls>
          <SelectField htmlFor="attendance-assignment">
            Assigned Subject
            <select id="attendance-assignment" value={assignmentId} onChange={(event) => setAssignmentId(event.target.value)} disabled={loadingAssignments || assignments.length === 0}>
              <option value="">{loadingAssignments ? 'Loading assigned subjects...' : 'Select an assigned subject'}</option>
              {assignments.map((item) => (
                <option key={item._id} value={item._id}>{item.subjectCode} — {item.subjectName} (Semester {item.semester}, Year {item.year || Math.ceil(Number(item.semester) / 2)}, Section {item.section || 'A'})</option>
              ))}
            </select>
          </SelectField>
          <SelectField htmlFor="attendance-date">
            Attendance Date
            <input id="attendance-date" type="date" value={sessionDate} max={localDateValue()} onChange={(event) => setSessionDate(event.target.value)} style={{ width: '100%', minHeight: 44, padding: '0 12px', border: `1px solid ${colors.border}`, borderRadius: radius.md, color: colors.textPrimary, font: `14px ${font.family}` }} />
          </SelectField>
          <Btn onClick={submitAttendance} disabled={!selectedAssignment || !students.length || saving || loadingStudents} style={{ height: 44 }}>
            {saving ? 'Saving...' : 'Submit Attendance'}
          </Btn>
        </Controls>
        {selectedAssignment && (
          <SubjectMeta><strong>{selectedAssignment.subjectCode}</strong> · Semester {selectedAssignment.semester} · Year {selectedAssignment.year || Math.ceil(Number(selectedAssignment.semester) / 2)} · Section {selectedAssignment.section || 'A'} · Present selected: <strong>{selectedIds.length}</strong> / {students.length}</SubjectMeta>
        )}
        {error && <Notice $error>{error}</Notice>}
        {success && <Notice>✓ {success}</Notice>}
        {submittedSummary && (
          <SummaryCard>
            <strong>Attendance Submitted</strong>
            <SummaryGrid>
              <SummaryItem><span>Subject</span><strong>{submittedSummary.subjectCode} — {submittedSummary.subjectName}</strong></SummaryItem>
              <SummaryItem><span>Date</span><strong>{new Date(`${submittedSummary.sessionDate}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></SummaryItem>
              <SummaryItem><span>Semester</span><strong>{submittedSummary.semester}</strong></SummaryItem>
              <SummaryItem><span>Section</span><strong>{submittedSummary.section}</strong></SummaryItem>
              <SummaryItem><span>Present</span><strong>{submittedSummary.presentCount} / {submittedSummary.totalStudents}</strong></SummaryItem>
              <SummaryItem><span>Absent</span><strong>{submittedSummary.absentCount} / {submittedSummary.totalStudents}</strong></SummaryItem>
            </SummaryGrid>
          </SummaryCard>
        )}
        {loadingStudents ? <Card style={{ marginTop: 20 }}>Loading students for this assigned subject...</Card> : null}
        {!loadingAssignments && assignments.length === 0 && <Card style={{ marginTop: 20 }}>No subjects are assigned to your faculty account yet.</Card>}
        {!loadingStudents && selectedAssignment && students.length === 0 && <Card style={{ marginTop: 20 }}>No students are enrolled in the assigned class.</Card>}
        {students.length > 0 && (
          <GridWrap>
            <DataGrid
              checkboxSelection
              rows={gridRows}
              columns={columns.map((column) => column.field === 'id' ? { ...column, field: 'number' } : column)}
              pageSize={10}
              autoHeight
              disableSelectionOnClick
              selectionModel={selectedIds}
              onSelectionModelChange={(ids) => setSelectedIds(ids.map(String))}
            />
          </GridWrap>
        )}
        <HistorySection>
            <SectionTitle>Attendance History</SectionTitle>
            <HistoryFilters>
              <select aria-label="Filter attendance history by subject" value={historyAssignmentFilter} onChange={(event) => setHistoryAssignmentFilter(event.target.value)}>
                <option value="">All Subjects</option>
                {assignments.map((item) => <option key={item.assignmentId || item._id} value={item.assignmentId || item._id}>{item.subjectCode} — {item.subjectName} (Sem {item.semester}, Section {item.section || 'A'})</option>)}
              </select>
            </HistoryFilters>
            {loadingHistory ? <Card>Loading attendance history...</Card> : historyError ? <Notice $error>{historyError}</Notice> : history.length === 0 ? <Card>No attendance records found.</Card> : (
              <HistoryCard>
                <HistoryTableWrap>
                  <HistoryTable>
                    <thead><tr><th>Date</th><th>Subject</th><th>Semester</th><th>Section</th><th>Present</th><th>Absent</th><th>Attendance</th><th>Details</th></tr></thead>
                    <tbody>{history.map((session) => (
                      <React.Fragment key={session._id}>
                        <tr>
                          <td>{new Date(`${session.sessionDate}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td>{session.subjectCode} — {session.subjectName}</td>
                          <td>{session.semester}</td><td>{session.section}</td>
                          <td>{session.presentCount}</td><td>{session.absentCount}</td><td>{session.attendanceRecords?.length ? `${((session.presentCount / session.attendanceRecords.length) * 100).toFixed(1)}%` : '—'}</td>
                          <td><button type="button" onClick={() => setExpandedSessionId(expandedSessionId === session._id ? '' : session._id)}>{expandedSessionId === session._id ? 'Hide Details' : 'View Details'}</button></td>
                        </tr>
                        {expandedSessionId === session._id && (
                          <tr><td colSpan="8"><HistoryTable>
                            <thead><tr><th>USN</th><th>Student Name</th><th>Status</th></tr></thead>
                            <tbody>{(session.attendanceRecords || []).map((record, index) => (
                              <tr key={record.student?._id || record.student?.registrationNumber || index}>
                                <td>{record.student?.registrationNumber || 'Student unavailable'}</td>
                                <td>{record.student?.name || 'Student unavailable'}</td>
                                <td><StatusPill $present={record.status === 'Present'}>{record.status}</StatusPill></td>
                              </tr>
                            ))}</tbody>
                          </HistoryTable></td></tr>
                        )}
                      </React.Fragment>
                    ))}</tbody>
                  </HistoryTable>
                </HistoryTableWrap>
              </HistoryCard>
            )}
        </HistorySection>
      </Content>
    </PageShell>
  );
};

export default FacultyAttendance;
