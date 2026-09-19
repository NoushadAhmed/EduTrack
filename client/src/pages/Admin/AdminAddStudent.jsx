import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAlert } from 'react-alert';
import styled, { keyframes } from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import { Input, Select, Btn, Card, FormGroup, Label, PageShell, SectionTitle } from '../../components/UI';
import { adminAddStudent } from '../../redux/actions/adminAction';
import { ADMIN_DEPARTMENTS, ADMIN_SECTIONS, ADMIN_SEMESTERS, semesterToYear } from '../../config/adminOptions';
import { colors, font, radius } from '../../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;

  @media (max-width: 600px) { padding: 24px 16px; }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const FullRow = styled.div`
  grid-column: 1 / -1;
`;

const AdminAddStudent = () => {
  const dispatch = useDispatch();
  const admin = useSelector((s) => s.admin);
  const navigate = useNavigate();
  const alert = useAlert();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('');
  const [studentMobileNumber, setStudentMobileNumber] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherMobileNumber, setFatherMobileNumber] = useState('');

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  const formHandler = (e) => {
    e.preventDefault();
    const backendYear = semesterToYear(semester);
    dispatch(adminAddStudent({ name, year: backendYear, section, department, studentMobileNumber, email, fatherName, fatherMobileNumber }));
    alert.success('Student registered successfully');
    navigate('/admin/students');
  };

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <SectionTitle>Add Student</SectionTitle>
        <Card>
          <form onSubmit={formHandler}>
            <FormGrid>
              <FullRow>
                <FormGroup>
                  <Label>Full Name</Label>
                  <Input placeholder="Student full name" value={name} onChange={(e) => setName(e.target.value)} required />
                </FormGroup>
              </FullRow>

              <FullRow>
                <FormGroup>
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="student@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </FormGroup>
              </FullRow>

              <FormGroup>
                <Label>Student Mobile</Label>
                <Input type="text" placeholder="10-digit number" value={studentMobileNumber} onChange={(e) => setStudentMobileNumber(e.target.value)} required />
              </FormGroup>

              <FormGroup>
                <Label>Department</Label>
                <Select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                  <option value="">Select department</option>
                  {ADMIN_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Semester</Label>
                <Select value={semester} onChange={(e) => setSemester(e.target.value)} required>
                  {ADMIN_SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Section</Label>
                <Select value={section} onChange={(e) => setSection(e.target.value)} required>
                  <option value="">Select section</option>
                  {ADMIN_SECTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
                </Select>
              </FormGroup>

              <FullRow>
                <FormGroup>
                  <Label>Father's Name</Label>
                  <Input placeholder="Father's full name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} required />
                </FormGroup>
              </FullRow>

              <FullRow>
                <FormGroup>
                  <Label>Father's Mobile</Label>
                  <Input type="text" placeholder="10-digit number" value={fatherMobileNumber} onChange={(e) => setFatherMobileNumber(e.target.value)} required />
                </FormGroup>
              </FullRow>

              <FullRow>
                <Btn type="submit" $full>Register Student</Btn>
              </FullRow>
            </FormGrid>
          </form>
        </Card>
      </Content>
    </PageShell>
  );
};

export default AdminAddStudent;
