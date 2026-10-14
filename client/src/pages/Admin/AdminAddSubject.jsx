import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAlert } from 'react-alert';
import styled, { keyframes } from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Input, Select, Btn, Card, FormGroup, Label, PageShell, SectionTitle } from '../../components/UI';
import { adminAddSubject } from '../../redux/actions/adminAction';
import { ADMIN_DEPARTMENTS, ADMIN_SEMESTERS, semesterToYear } from '../../config/adminOptions';
import { colors } from '../../styles/theme';

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

const AdminAddSubject = () => {
  const admin = useSelector((s) => s.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alert = useAlert();

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [totalLectures, setTotalLectures] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  const formHandler = async (e) => {
    e.preventDefault();
    const backendYear = semesterToYear(semester);
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await dispatch(adminAddSubject({
        department,
        year: backendYear,
        subjectCode,
        subjectName,
        totalLectures,
      }));
      alert.success('Subject added successfully');
      navigate('/admin/subjects');
    } catch (error) {
      const response = error.response?.data;
      const message = response?.message
        || Object.values(response || {}).filter((value) => typeof value === 'string').join(' ')
        || 'Subject could not be added. Please check the details and try again.';
      setSubmitError(message);
      alert.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <SectionTitle>Add Subject</SectionTitle>
        <Card>
          <form onSubmit={formHandler}>
            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Subject Name</Label>
              <Input placeholder="e.g. Data Structures" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} required />
            </FormGroup>

            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Subject Code</Label>
              <Input placeholder="e.g. CS301" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} required />
            </FormGroup>

            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Total Lectures</Label>
              <Input type="number" placeholder="e.g. 40" value={totalLectures} onChange={(e) => setTotalLectures(e.target.value)} required />
            </FormGroup>

            <FormGroup style={{ marginBottom: 14 }}>
              <Label>Department</Label>
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} required>
                <option value="">Select department</option>
                {ADMIN_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </FormGroup>

            <FormGroup style={{ marginBottom: 20 }}>
              <Label>Semester</Label>
              <Select value={semester} onChange={(e) => setSemester(e.target.value)} required>
                {ADMIN_SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </Select>
            </FormGroup>

            {submitError && <p role="alert" style={{ color: colors.danger, fontSize: 13, margin: '0 0 12px' }}>{submitError}</p>}
            <Btn type="submit" $full disabled={isSubmitting}>{isSubmitting ? 'Adding subject...' : 'Add Subject'}</Btn>
          </form>
        </Card>
      </Content>
    </PageShell>
  );
};

export default AdminAddSubject;
