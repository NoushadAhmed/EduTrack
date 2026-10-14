import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import FacultyNavbar from '../../components/FacultyNavbar';
import FacultyBackButton from '../../components/FacultyBackButton';
import { Card, PageShell, SectionTitle } from '../../components/UI';
import { colors, font, radius } from '../../styles/theme';

const Content = styled.main`
  width: min(1100px, 100%);
  margin: 0 auto;
  padding: 36px 24px 56px;
  font-family: ${font.family};
  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  @media (max-width: 640px) { flex-direction: column; align-items: flex-start; }
`;

const TableWrap = styled.div`
  overflow: auto;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
`;

const Table = styled.table`
  width: 100%;
  min-width: 1050px;
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

const FacultySubjects = () => {
  const faculty = useSelector((state) => state.faculty);
  const isAuthenticated = Boolean(faculty?.isAuthenticated);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await axios.get('/api/faculty/assignedSubjects');
        const assignments = Array.isArray(data?.result) ? data.result : [];

        if (!active) return;
        setSubjects(assignments);
      } catch {
        if (active) setError('Unable to load subjects.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => { active = false; };
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/" replace />;

  return (
    <PageShell>
      <FacultyNavbar />
      <Content>
        <FacultyBackButton />
        <Header>
          <SectionTitle>My Subjects</SectionTitle>
        </Header>

        {loading ? (
          <EmptyState>Loading subjects...</EmptyState>
        ) : error ? (
          <EmptyState>{error}</EmptyState>
        ) : subjects.length === 0 ? (
          <EmptyState>No subjects assigned yet.</EmptyState>
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Semester</th>
                  <th>Subject Type</th>
                  <th>Assigned Faculty</th>
                  <th>Registration Number</th>
                  <th>Designation</th>
                  <th>Section</th>
                  <th>Academic Year</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={`${subject.subjectCode}-${subject.semester}-${subject.academicYear}`}>
                    <td>{subject.subjectCode}</td>
                    <td>{subject.subjectName}</td>
                    <td>{subject.semester}</td>
                    <td>{subject.facultyDetails?.name || 'Faculty record unavailable'}</td>
                    <td>{subject.facultyDetails?.registrationNumber || 'Not available'}</td>
                    <td>{subject.facultyDetails?.designation || 'Not available'}</td>
                    <td>{subject.sectionRecorded || 'Not specified'}</td>
                    <td>{subject.academicYear || 'Not specified'}</td>
                    <td>{subject.subjectType || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Content>
    </PageShell>
  );
};

export default FacultySubjects;
