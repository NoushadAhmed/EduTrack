import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import FacultyNavbar from '../../components/FacultyNavbar';
import FacultyBackButton from '../../components/FacultyBackButton';
import { Card, PageShell, SectionTitle } from '../../components/UI';
import { colors, font, radius } from '../../styles/theme';

const Content = styled.main`
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 36px 24px 56px;
  font-family: ${font.family};
  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const AssignmentCard = styled(Card)`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(0, 2fr);
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
  @media (max-width: 680px) { grid-template-columns: 1fr; }
`;

const SelectField = styled.label`
  display: grid;
  gap: 7px;
  color: ${colors.textSecondary};
  font-size: 12px;
  font-weight: 600;
  select {
    width: 100%;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid ${colors.border};
    border-radius: ${radius.md};
    background: ${colors.white};
    color: ${colors.textPrimary};
    font: 14px ${font.family};
  }
  select:focus-visible { outline: 2px solid ${colors.primary}; outline-offset: 2px; }
`;

const AssignmentDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  @media (max-width: 800px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media (max-width: 440px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

const Detail = styled.div`
  min-width: 0;
  padding: 10px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.sm};
  span { display: block; margin-bottom: 4px; color: ${colors.textMuted}; font-size: 10px; text-transform: uppercase; }
  strong { display: block; overflow-wrap: anywhere; color: ${colors.textPrimary}; font-size: 12px; }
`;

const TableWrap = styled.div`
  overflow: auto;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
`;

const Table = styled.table`
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  th, td {
    padding: 14px 16px;
    border-bottom: 1px solid ${colors.border};
    text-align: left;
    font-size: 14px;
    color: ${colors.textPrimary};
  }
  th {
    background: ${colors.bgPage};
    color: ${colors.textSecondary};
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  tr:last-child td { border-bottom: none; }
`;

const EmptyState = styled(Card)`
  text-align: center;
  color: ${colors.textSecondary};
  font-size: 14px;
  padding: 28px 20px;
`;

const ErrorState = styled(EmptyState)`
  color: #b42318;
`;

const FacultyStudents = () => {
  const facultyState = useSelector((state) => state.faculty);
  const isAuthenticated = Boolean(facultyState?.isAuthenticated);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [students, setStudents] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [studentsError, setStudentsError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;

    const loadAssignments = async () => {
      setAssignmentLoading(true);
      setAssignmentError('');
      try {
        const { data } = await axios.get('/api/faculty/assignedSubjects');
        const result = Array.isArray(data?.result) ? data.result : [];
        if (!active) return;
        setAssignments(result);
        setSelectedAssignmentId(result.length === 1 ? String(result[0]._id) : '');
      } catch (error) {
        if (active) setAssignmentError(error.response?.data?.message || 'Unable to load assigned subjects.');
      } finally {
        if (active) setAssignmentLoading(false);
      }
    };

    loadAssignments();
    return () => { active = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedAssignmentId) {
      setStudents([]);
      setStudentsError('');
      setStudentsLoading(false);
      return undefined;
    }

    let active = true;
    const loadStudents = async () => {
      setStudentsLoading(true);
      setStudentsError('');
      try {
        const { data } = await axios.get(
          `/api/faculty/assignedSubjects/${encodeURIComponent(selectedAssignmentId)}/students`
        );
        if (active) setStudents(Array.isArray(data?.result) ? data.result : []);
      } catch (error) {
        if (active) {
          setStudents([]);
          setStudentsError(error.response?.data?.message || 'Unable to load students for this subject.');
        }
      } finally {
        if (active) setStudentsLoading(false);
      }
    };

    loadStudents();
    return () => { active = false; };
  }, [isAuthenticated, selectedAssignmentId]);

  const selectedAssignment = useMemo(
    () => assignments.find((assignment) => String(assignment._id) === selectedAssignmentId),
    [assignments, selectedAssignmentId]
  );

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <PageShell>
      <FacultyNavbar />
      <Content>
        <FacultyBackButton />
        <SectionTitle>My Students</SectionTitle>

        {assignmentLoading ? (
          <EmptyState>Loading assigned subjects...</EmptyState>
        ) : assignmentError ? (
          <ErrorState>{assignmentError}</ErrorState>
        ) : assignments.length === 0 ? (
          <EmptyState>No subjects are assigned to your faculty account yet.</EmptyState>
        ) : (
          <>
            <AssignmentCard $pad="18px">
              <SelectField htmlFor="assigned-subject-select">
                Assigned Subject
                <select
                  id="assigned-subject-select"
                  value={selectedAssignmentId}
                  onChange={(event) => setSelectedAssignmentId(event.target.value)}
                >
                  {assignments.length > 1 && <option value="">Select an assigned subject</option>}
                  {assignments.map((assignment) => (
                    <option key={assignment._id} value={assignment._id}>
                      {assignment.subjectCode} - {assignment.subjectName} (Semester {assignment.semester})
                    </option>
                  ))}
                </select>
              </SelectField>

              {selectedAssignment ? (
                <AssignmentDetails>
                  <Detail><span>Subject Code</span><strong>{selectedAssignment.subjectCode}</strong></Detail>
                  <Detail><span>Subject Name</span><strong>{selectedAssignment.subjectName}</strong></Detail>
                  <Detail><span>Semester</span><strong>{selectedAssignment.semester}</strong></Detail>
                  <Detail><span>Year</span><strong>{selectedAssignment.year || Math.ceil(Number(selectedAssignment.semester) / 2)}</strong></Detail>
                  <Detail><span>Section</span><strong>{selectedAssignment.section || 'A'}</strong></Detail>
                </AssignmentDetails>
              ) : (
                <div style={{ color: colors.textMuted, fontSize: 13 }}>Choose a subject to view its students.</div>
              )}
            </AssignmentCard>

            {studentsLoading ? (
              <EmptyState>Loading students for {selectedAssignment?.subjectCode}...</EmptyState>
            ) : studentsError ? (
              <ErrorState>{studentsError}</ErrorState>
            ) : selectedAssignment && students.length === 0 ? (
              <EmptyState>No students assigned to {selectedAssignment.subjectCode} in Year {selectedAssignment.year || Math.ceil(Number(selectedAssignment.semester) / 2)}, Section {selectedAssignment.section || 'A'}.</EmptyState>
            ) : students.length > 0 ? (
              <TableWrap>
                <Table>
                  <thead>
                    <tr><th>USN</th><th>Student Name</th><th>Email</th></tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id || student.registrationNumber}>
                        <td>{student.registrationNumber}</td>
                        <td>{student.name}</td>
                        <td>{student.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrap>
            ) : null}
          </>
        )}
      </Content>
    </PageShell>
  );
};

export default FacultyStudents;
