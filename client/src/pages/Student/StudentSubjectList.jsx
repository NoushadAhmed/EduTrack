import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@material-ui/data-grid';
import { useSelector, useDispatch } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import StudentNavbar from '../../components/StudentNavbar';
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
  { field: 'id', headerName: 'No.', flex: 0.3 },
  { field: 'code', headerName: 'Subject Code', flex: 0.6 },
  { field: 'name', headerName: 'Subject Name', flex: 1 },
  { field: 'year', headerName: 'Year', flex: 0.3 },
  { field: 'total', headerName: 'Total Hours', flex: 0.4 },
];

const StudentSubjectList = () => {
  const student = useSelector((s) => s.student);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => { dispatch(getAllSubjects()); }, []);

  if (!student.isAuthenticated) { navigate('/'); return null; }

  const rows = student.allSubjects.map((item, index) => ({
    id: index + 1,
    code: item.subjectCode,
    name: item.subjectName,
    year: item.year,
    total: item.totalLectures,
  }));

  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <SectionTitle>My Subjects</SectionTitle>
        <GridWrap>
          <DataGrid rows={rows} columns={columns} pageSize={10} disableSelectionOnClick autoHeight />
        </GridWrap>
      </Content>
    </PageShell>
  );
};

export default StudentSubjectList;
