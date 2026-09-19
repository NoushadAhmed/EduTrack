import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@material-ui/data-grid';
import styled, { keyframes } from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import Loader from '../../components/Loader';
import { Select, Btn, Card, Label, PageShell, SectionTitle } from '../../components/UI';
import { adminGetAllSubject } from '../../redux/actions/adminAction';
import { ADMIN_DEPARTMENTS, ADMIN_SEMESTERS, semesterToYear } from '../../config/adminOptions';
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
  min-width: 160px;
  flex: 1;
`;

const GridWrap = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  overflow: hidden;
`;

const AdminGetSubjects = () => {
  const admin = useSelector((s) => s.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [department, setDepartment] = useState('CSE');
  const [semester, setSemester] = useState('1');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (admin.allSubject.length !== 0) setIsLoading(false);
  }, [admin.allSubject]);

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  const formHandler = (e) => {
    e.preventDefault();
    setIsLoading(true);
    dispatch(adminGetAllSubject({ department, year: semesterToYear(semester) }));
  };

  const columns = [
    { field: 'id', headerName: 'No.', flex: 0.2 },
    { field: 'code', headerName: 'Subject Code', flex: 0.5 },
    { field: 'name', headerName: 'Subject Name', flex: 1 },
    { field: 'total', headerName: 'Total Lectures', flex: 0.4 },
  ];

  const rows = admin.allSubject.map((item, index) => ({
    id: index + 1,
    code: item.subjectCode,
    name: item.subjectName,
    total: item.totalLectures,
  }));

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <SectionTitle>Search Subjects</SectionTitle>
        <Card style={{ marginBottom: 24 }}>
          <form onSubmit={formHandler}>
            <FilterRow>
              <FilterField>
                <Label>Department</Label>
                <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  {ADMIN_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </FilterField>
              <FilterField>
                <Label>Semester</Label>
                <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
                  {ADMIN_SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </Select>
              </FilterField>
              <Btn type="submit" style={{ height: 44, alignSelf: 'flex-end' }}>Search</Btn>
            </FilterRow>
          </form>
        </Card>

        {isLoading ? <Loader /> : (
          <GridWrap>
            <DataGrid rows={rows} columns={columns} pageSize={10} disableSelectionOnClick autoHeight />
          </GridWrap>
        )}
      </Content>
    </PageShell>
  );
};

export default AdminGetSubjects;
