import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DataGrid } from '@material-ui/data-grid';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import StudentNavbar from '../../components/StudentNavbar';
import StudentBackButton from '../../components/StudentBackButton';
import { Select, Btn, Card, Label, PageShell, SectionTitle } from '../../components/UI';
import { colors, radius } from '../../styles/theme';
import { ADMIN_DEPARTMENTS, ADMIN_YEARS, ADMIN_SECTIONS } from '../../config/adminOptions';

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

const FilterRow = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const FilterField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
  flex: 1;
`;

const GridWrap = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  overflow: hidden;
`;

const StudentSearch = () => {
  const student = useSelector((s) => s.student);
  const studentData = student.student?.student || {};

  const [department, setDepartment] = useState(studentData.department || '');
  const [year, setYear] = useState(String(studentData.year || ''));
  const [section, setSection] = useState(studentData.section || '');
  const [result, setResult] = useState([]);

  const fetchStudents = async () => {
    try {
      const { data } = await axios.post('/api/student/getAllStudents', { department, year, section });
      setResult(data.result);
    } catch (err) {
      alert('Something went wrong.');
    }
  };

  const columns = [
    { field: 'num', headerName: 'No.', flex: 0.2 },
    { field: 'id', headerName: 'Reg. Number', flex: 0.5 },
    { field: 'name', headerName: 'Name', flex: 0.5 },
    { field: 'section', headerName: 'Section', flex: 0.3 },
  ];

  const rows = (result || []).map((item, index) => ({
    num: index + 1,
    id: item.registrationNumber,
    name: item.name,
    section: item.section,
  }));

  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <StudentBackButton />
        <SectionTitle>Search Students</SectionTitle>
        <Card style={{ marginBottom: 24 }}>
          <form onSubmit={(e) => { e.preventDefault(); fetchStudents(); }}>
            <FilterRow>
              <FilterField>
                <Label>Department</Label>
                <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  <option value="">All Departments</option>
                  {ADMIN_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </FilterField>
              <FilterField>
                <Label>Year</Label>
                <Select value={year} onChange={(e) => setYear(e.target.value)}>
                  <option value="">All Years</option>
                  {ADMIN_YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                </Select>
              </FilterField>
              <FilterField>
                <Label>Section</Label>
                <Select value={section} onChange={(e) => setSection(e.target.value)}>
                  <option value="">All Sections</option>
                  {ADMIN_SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
                </Select>
              </FilterField>
              <Btn type="submit" style={{ height: 44, alignSelf: 'flex-end' }}>Search</Btn>
            </FilterRow>
          </form>
        </Card>

        <GridWrap>
          <DataGrid rows={rows} columns={columns} pageSize={10} autoHeight />
        </GridWrap>
      </Content>
    </PageShell>
  );
};

export default StudentSearch;
