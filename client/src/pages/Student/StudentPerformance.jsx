import React, { useEffect } from 'react';
import { DataGrid } from '@material-ui/data-grid';
import { useSelector, useDispatch } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import StudentNavbar from '../../components/StudentNavbar';
import { PageShell, SectionTitle } from '../../components/UI';
import { getMarks } from '../../redux/actions/studentAction';
import { colors, font, radius } from '../../styles/theme';

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

const ExamSection = styled.div`
  margin-bottom: 32px;
`;

const ExamTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
  font-family: ${font.family};
`;

const GridWrap = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  overflow: hidden;
`;

const columns = [
  { field: 'id', headerName: 'No.', flex: 0.2 },
  { field: 'code', headerName: 'Subject Code', flex: 0.5 },
  { field: 'name', headerName: 'Subject Name', flex: 1 },
  { field: 'marks', headerName: 'Marks', flex: 0.3 },
  { field: 'totalMarks', headerName: 'Total Marks', flex: 0.4 },
];

const buildRows = (arr) =>
  (arr || []).map((item, index) => ({
    id: index + 1,
    code: item.subject?.subjectCode,
    name: item.subject?.subjectName,
    marks: item.marks,
    totalMarks: item.totalMarks,
  }));

const StudentPerformance = () => {
  const dispatch = useDispatch();
  const student = useSelector((s) => s.student);

  useEffect(() => { dispatch(getMarks()); }, [dispatch]);

  const rows1 = buildRows(student?.allMarks?.UnitTest1);
  const rows2 = buildRows(student?.allMarks?.UnitTest2);
  const rows3 = buildRows(student?.allMarks?.Semester);

  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <SectionTitle>Performance</SectionTitle>

        <ExamSection>
          <ExamTitle>Unit Test 1</ExamTitle>
          <GridWrap>
            <DataGrid rows={rows1} columns={columns} pageSize={10} disableSelectionOnClick autoHeight />
          </GridWrap>
        </ExamSection>

        <ExamSection>
          <ExamTitle>Unit Test 2</ExamTitle>
          <GridWrap>
            <DataGrid rows={rows2} columns={columns} pageSize={10} disableSelectionOnClick autoHeight />
          </GridWrap>
        </ExamSection>

        <ExamSection>
          <ExamTitle>Semester</ExamTitle>
          <GridWrap>
            <DataGrid rows={rows3} columns={columns} pageSize={10} disableSelectionOnClick autoHeight />
          </GridWrap>
        </ExamSection>
      </Content>
    </PageShell>
  );
};

export default StudentPerformance;
