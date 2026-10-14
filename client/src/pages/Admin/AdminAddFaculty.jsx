import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAlert } from 'react-alert';
import styled, { keyframes } from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Input, Select, Btn, Card, FormGroup, Label, PageShell, SectionTitle } from '../../components/UI';
import { adminAddFaculty } from '../../redux/actions/adminAction';
import { ADMIN_DEPARTMENTS } from '../../config/adminOptions';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;

  @media (max-width: 600px) { padding: 24px 16px; }
`;

const AdminAddFaculty = () => {
  const dispatch = useDispatch();
  const admin = useSelector((s) => s.admin);
  const navigate = useNavigate();
  const alert = useAlert();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [facultyMobileNumber, setFacultyMobileNumber] = useState('');

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  const formHandler = (e) => {
    e.preventDefault();
    dispatch(adminAddFaculty({ name, designation, department, facultyMobileNumber, email }));
    alert.success('Faculty registered successfully');
    navigate('/admin/faculties');
  };

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <SectionTitle>Add Faculty</SectionTitle>
        <Card>
          <form onSubmit={formHandler}>
            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Full Name</Label>
              <Input placeholder="Faculty full name" value={name} onChange={(e) => setName(e.target.value)} required />
            </FormGroup>

            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Email Address</Label>
              <Input type="email" placeholder="faculty@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </FormGroup>

            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Mobile Number</Label>
              <Input type="text" placeholder="10-digit number" value={facultyMobileNumber} onChange={(e) => setFacultyMobileNumber(e.target.value)} required />
            </FormGroup>

            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Department</Label>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                <option value="">Select department</option>
                {ADMIN_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FormGroup>

            <FormGroup style={{ marginBottom: 20 }}>
              <Label>Designation</Label>
              <Input placeholder="e.g. Assistant Professor" value={designation} onChange={(e) => setDesignation(e.target.value)} required />
            </FormGroup>

            <Btn type="submit" $full>Add Faculty</Btn>
          </form>
        </Card>
      </Content>
    </PageShell>
  );
};

export default AdminAddFaculty;
