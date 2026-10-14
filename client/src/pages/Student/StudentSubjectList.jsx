import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@material-ui/data-grid';
import { useSelector, useDispatch } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import StudentNavbar from '../../components/StudentNavbar';
import StudentBackButton from '../../components/StudentBackButton';
import { PageShell, SectionTitle } from '../../components/UI';
import { getAllSubjects } from '../../redux/actions/studentAction';
import { colors, radius } from '../../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;
  @media (max-width: 600px) { padding: 24px 16px; }
`;

const GridWrap = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  overflow: hidden;
`;

const columns = [
  { field: 'id', headerName: 'No.', width: 65 },
  { field: 'code', headerName: 'Subject Code', width: 140 },
  { field: 'name', headerName: 'Subject Name', minWidth: 220, flex: 1 },
  { field: 'semester', headerName: 'Semester', width: 105 },
  { field: 'section', headerName: 'Section', width: 100 },
  { field: 'academicYear', headerName: 'Academic Year', width: 130 },
  { field: 'faculty', headerName: 'Assigned Faculty', minWidth: 190, flex: 1 },
  { field: 'facultyRegistration', headerName: 'Faculty Registration', minWidth: 170, flex: 0.7 },
  { field: 'facultyDesignation', headerName: 'Designation', minWidth: 170, flex: 0.7 },
  { field: 'year', headerName: 'Year', width: 75 },
  { field: 'total', headerName: 'Total Hours', width: 105 },
];

const StudentSubjectList = () => {
  const student = useSelector((s) => s.student);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const studentProfile = student?.student?.student || student?.student || {};

  useEffect(() => { dispatch(getAllSubjects()); }, [dispatch]);

  if (!student?.isAuthenticated) { navigate('/'); return null; }

  const basicRows = (student?.allSubjects || []).map((item, index) => ({
    id: index + 1,
    code: item?.subjectCode || '—',
    name: item?.subjectName || '—',
    year: item?.year || '—',
    total: item?.totalLectures || 0,
  }));

  const rows = basicRows.map((row, index) => {
    const item = student?.allSubjects?.[index] || {};
    const assignments = Array.isArray(item.assignedFaculty) ? item.assignedFaculty : [];
    const teachers = assignments.map((assignment) => assignment.faculty || {});
    return {
      ...row,
      id: item._id || row.id,
      semester: item.semester ? `Semester ${item.semester}` : 'Not specified',
      section: assignments.length
        ? [...new Set(assignments.map((assignment) => assignment.section || 'Not specified'))].join(', ')
        : studentProfile.section || 'Not specified',
      academicYear: assignments.length
        ? [...new Set(assignments.map((assignment) => assignment.academicYear || 'Not specified'))].join(', ')
        : 'Not specified',
      faculty: teachers.length ? teachers.map((faculty) => faculty.name || 'Faculty unavailable').join(', ') : 'No faculty assigned yet.',
      facultyRegistration: teachers.length ? teachers.map((faculty) => faculty.registrationNumber || 'Not available').join(', ') : '—',
      facultyDesignation: teachers.length ? teachers.map((faculty) => faculty.designation || 'Not available').join(', ') : '—',
    };
  });

  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <StudentBackButton />
        <SectionTitle>My Subjects</SectionTitle>
        <GridWrap>
          <DataGrid rows={rows} columns={columns} pageSize={10} disableSelectionOnClick autoHeight />
        </GridWrap>
      </Content>
    </PageShell>
  );
};

export default StudentSubjectList;
