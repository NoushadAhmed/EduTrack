import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAlert } from 'react-alert';
import { DataGrid } from '@material-ui/data-grid';
import styled, { keyframes } from 'styled-components';
import FacultyNavbar from '../../components/FacultyNavbar';
import { Input, Select, Btn, Card, FormGroup, Label, PageShell, SectionTitle } from '../../components/UI';
import { fetchStudents, uploadMarks } from '../../redux/actions/facultyAction';
import { ADMIN_DEPARTMENTS, ADMIN_SEMESTERS, ADMIN_SECTIONS, semesterToYear } from '../../config/adminOptions';
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
  min-width: 140px;
  flex: 1;
`;

const GridWrap = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  overflow: hidden;
  margin-top: 24px;
`;

const SecondRow = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${colors.border};
`;

const FacultyUploadMarks = () => {
  const alert = useAlert();
  const store = useSelector((s) => s);
  const faculty = useSelector((s) => s.faculty);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('');
  const [exam, setExam] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [marks, setMarks] = useState([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(true);

  if (!faculty.isAuthenticated) { navigate('/'); return null; }

  const handleInputChange = (value, _id) => {
    const newMarks = [...marks];
    const index = newMarks.findIndex((m) => m._id === _id);
    if (index === -1) newMarks.push({ _id, value });
    else newMarks[index].value = value;
    setMarks(newMarks);
  };

  const columns = [
    { field: 'id', headerName: 'No.', flex: 0.2 },
    { field: 'code', headerName: 'Reg. Number', flex: 0.5 },
    { field: 'name', headerName: 'Name', flex: 0.6 },
    {
      field: 'marks', headerName: 'Marks', flex: 0.4, sortable: false,
      renderCell: (params) => (
        <input
          type="number"
          placeholder="Enter marks"
          onChange={(e) => handleInputChange(e.target.value, params.getValue(params.id, 'id'))}
          style={{
            width: '100%', border: 'none', outline: 'none',
            fontFamily: 'Inter, sans-serif', fontSize: 13,
          }}
        />
      ),
    },
  ];

  const rows = faculty.fetchedStudents.map((item) => ({
    id: item._id,
    code: item.registrationNumber,
    name: item.name,
  }));

  const formHandler = (e) => {
    e.preventDefault();
    dispatch(fetchStudents(department, semesterToYear(semester), section));
    setIsFetchingStudents(false);
  };

  const secondFormHandler = (e) => {
    e.preventDefault();
    dispatch(uploadMarks(subjectCode, exam, totalMarks, marks, department, semesterToYear(semester), section));
    alert.success('Marks uploaded successfully');
  };

  return (
    <PageShell>
      <FacultyNavbar />
      <Content>
        <SectionTitle>Upload Marks</SectionTitle>
        <Card>
          {isFetchingStudents ? (
            <>
              <FilterRow>
                <FilterField>
                  <Label>Department</Label>
                  <Select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                    <option value="">Select department</option>
                    {ADMIN_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </Select>
                </FilterField>
                <FilterField>
                  <Label>Semester</Label>
                  <Select value={semester} onChange={(e) => setSemester(e.target.value)} required>
                    {ADMIN_SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                  </Select>
                </FilterField>
                <FilterField>
                  <Label>Section</Label>
                  <Select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">Select section</option>
                    {ADMIN_SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
                  </Select>
                </FilterField>
                <FilterField>
                  <Label>Exam</Label>
                  <Select value={exam} onChange={(e) => setExam(e.target.value)} required>
                    <option value="">Select exam</option>
                    <option value="Unit Test 1">Unit Test 1</option>
                    <option value="Unit Test 2">Unit Test 2</option>
                    <option value="Semester">Semester</option>
                  </Select>
                </FilterField>
              </FilterRow>
              <div style={{ marginTop: 16 }}>
                <Btn onClick={formHandler}>Search Students</Btn>
              </div>
            </>
          ) : (
            <SecondRow>
              <FilterField>
                <Label>Subject</Label>
                <Select value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} required>
                  <option value="">Select subject</option>
                  {faculty.allSubjectCodeList.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </Select>
              </FilterField>
              <FilterField>
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  required
                />
              </FilterField>
              <Btn onClick={secondFormHandler} style={{ alignSelf: 'flex-end', height: 44 }}>
                Submit Marks
              </Btn>
            </SecondRow>
          )}
        </Card>

        <GridWrap>
          <DataGrid rows={rows} columns={columns} pageSize={10} autoHeight />
        </GridWrap>
      </Content>
    </PageShell>
  );
};

export default FacultyUploadMarks;
