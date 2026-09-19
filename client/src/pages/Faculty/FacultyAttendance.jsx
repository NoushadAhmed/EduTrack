import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAlert } from 'react-alert';
import { DataGrid } from '@material-ui/data-grid';
import styled, { keyframes } from 'styled-components';
import FacultyNavbar from '../../components/FacultyNavbar';
import { Select, Btn, Card, FormGroup, Label, PageShell, SectionTitle } from '../../components/UI';
import { fetchStudents, markAttendance } from '../../redux/actions/facultyAction';
import { ADMIN_SEMESTERS, ADMIN_SECTIONS, semesterToYear } from '../../config/adminOptions';
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
  margin-bottom: 0;
`;

const FilterField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 150px;
  flex: 1;
`;

const GridWrap = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  overflow: hidden;
  margin-top: 24px;
`;

const SubjectRow = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${colors.border};
`;

const columns = [
  { field: 'id', headerName: 'No.', flex: 0.2 },
  { field: 'code', headerName: 'Reg. Number', flex: 0.5 },
  { field: 'name', headerName: 'Name', flex: 0.6 },
  { field: 'email', headerName: 'Email', flex: 0.5 },
];

const FacultyAttendance = () => {
  const store = useSelector((s) => s);
  const faculty = useSelector((s) => s.faculty);
  const navigate = useNavigate();
  const alert = useAlert();
  const dispatch = useDispatch();

  const department = faculty?.faculty?.faculty?.department;
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [checkedValue, setCheckedValue] = useState([]);

  if (!faculty.isAuthenticated) { navigate('/'); return null; }

  const rows = faculty.fetchedStudents.map((item, index) => ({
    id: index + 1,
    _id: item._id,
    code: item.registrationNumber,
    name: item.name,
    email: item.email,
  }));

  const getStudents = (e) => {
    e.preventDefault();
    dispatch(fetchStudents(department, semesterToYear(semester), section));
  };

  const setAttendance = (e) => {
    e.preventDefault();
    dispatch(markAttendance(checkedValue, subjectCode, department, semesterToYear(semester), section));
    setCheckedValue([]);
    alert.success('Attendance marked!');
  };

  return (
    <PageShell>
      <FacultyNavbar />
      <Content>
        <SectionTitle>Mark Attendance</SectionTitle>
        <Card>
          <FilterRow>
            <FilterField>
              <Label>Semester</Label>
              <Select value={semester} onChange={(e) => setSemester(e.target.value)} required>
                {ADMIN_SEMESTERS.map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </Select>
            </FilterField>
            <FilterField>
              <Label>Section</Label>
              <Select value={section} onChange={(e) => setSection(e.target.value)} required>
                <option value="">Select section</option>
                {ADMIN_SECTIONS.map((s) => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </Select>
            </FilterField>
            <Btn onClick={getStudents} style={{ height: 44, alignSelf: 'flex-end' }}>
              Search Students
            </Btn>
          </FilterRow>

          {faculty.allSubjectCodeList.length > 0 && (
            <SubjectRow>
              <FilterField>
                <Label>Subject</Label>
                <Select value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} required>
                  <option value="">Select subject</option>
                  {faculty.allSubjectCodeList.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </Select>
              </FilterField>
              <Btn onClick={setAttendance} style={{ height: 44, alignSelf: 'flex-end' }}>
                Submit Attendance
              </Btn>
            </SubjectRow>
          )}
        </Card>

        <GridWrap>
          <DataGrid
            checkboxSelection
            onSelectionModelChange={(ids) => {
              const selected = new Set(ids);
              const selectedStudents = rows.filter((row) => selected.has(row.id));
              setCheckedValue(selectedStudents.map((item) => item._id));
            }}
            rows={rows}
            columns={columns}
            pageSize={10}
            autoHeight
          />
        </GridWrap>
      </Content>
    </PageShell>
  );
};

export default FacultyAttendance;
