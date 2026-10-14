import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DataGrid } from '@material-ui/data-grid';
import styled, { keyframes } from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import Loader from '../../components/Loader';
import { Select, Btn, Card, FormGroup, Label, PageShell, SectionTitle } from '../../components/UI';
import { adminGetAllFaculty } from '../../redux/actions/adminAction';
import { ADMIN_DEPARTMENTS } from '../../config/adminOptions';
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
  min-width: 180px;
  flex: 1;
`;

const GridWrap = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  overflow: hidden;
`;

const AdminGetFaculty = () => {
  const admin = useSelector((s) => s.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [department, setDepartment] = useState('CSE');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (admin.allFaculty.length !== 0) setIsLoading(false);
  }, [admin.allFaculty.length]);

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  const formHandler = (e) => {
    e.preventDefault();
    setIsLoading(true);
    dispatch(adminGetAllFaculty({ department }));
  };

  const columns = [
    { field: 'id', headerName: 'No.', flex: 0.3 },
    { field: 'code', headerName: 'Registration Number', flex: 0.6 },
    { field: 'name', headerName: 'Name', flex: 0.6 },
    { field: 'email', headerName: 'Email', flex: 0.5 },
    { field: 'designation', headerName: 'Designation', flex: 0.5 },
  ];

  const rows = admin.allFaculty.map((item, index) => ({
    id: index + 1,
    code: item.registrationNumber,
    name: item.name,
    email: item.email,
    designation: item.designation,
  }));

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <SectionTitle>Search Faculty</SectionTitle>
        <Card style={{ marginBottom: 24 }}>
          <form onSubmit={formHandler}>
            <FilterRow>
              <FilterField>
                <Label>Department</Label>
                <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
                  {ADMIN_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
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

export default AdminGetFaculty;
