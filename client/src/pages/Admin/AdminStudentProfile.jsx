import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowBack, InfoOutlined } from '@material-ui/icons';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Btn, Card, Input, Label, PageShell, PageTitle, Select } from '../../components/UI';
import { ADMIN_DEPARTMENTS, ADMIN_SECTIONS, semesterToYear } from '../../config/adminOptions';
import { colors, font, radius, shadow, transition } from '../../styles/theme';

const Content = styled.main`
  box-sizing: border-box;
  max-width: 1060px;
  margin: 0 auto;
  padding: 34px 24px 52px;
  font-family: ${font.family};
  animation: profileEnter 0.28s ease both;
  @keyframes profileEnter { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 18px;
  color: ${colors.textSecondary};
  font-size: 13px;
  text-decoration: none;
  transition: ${transition.fast};
  svg { font-size: 18px; }
  &:hover { color: ${colors.primary}; }
`;

const ProfileHeader = styled(Card)`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 22px 24px;
  margin-bottom: 18px;
  transition: ${transition.base};
  &:hover { box-shadow: ${shadow.cardHover}; transform: translateY(-1px); }
  @media (max-width: 500px) { align-items: flex-start; flex-direction: column; }
`;

const AvatarImage = styled.div`
  width: 76px;
  height: 76px;
  flex: 0 0 auto;
  overflow: hidden;
  display: grid;
  place-items: center;
  border: 2px solid ${colors.border};
  border-radius: 50%;
  background: ${colors.primaryLight};
  color: ${colors.primary};
  font-size: 28px;
  font-weight: 600;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const HeaderDetails = styled.div`
  min-width: 0;
  flex: 1;
`;

const Name = styled(PageTitle)`
  margin: 0 0 5px;
  font-size: 22px;
  overflow-wrap: anywhere;
`;

const Registration = styled.div`
  color: ${colors.textMuted};
  font: 13px 'Courier New', monospace;
  overflow-wrap: anywhere;
`;

const HeaderMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 11px;
`;

const MetaPill = styled.span`
  padding: 5px 9px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.sm};
  color: ${colors.textSecondary};
  background: ${colors.bgPage};
  font-size: 12px;
`;

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`;

const SectionTitle = styled.h2`
  margin: 0 0 17px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${colors.border};
  color: ${colors.textPrimary};
  font-size: 14px;
  font-weight: 600;
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 18px;
  @media (max-width: 440px) { grid-template-columns: 1fr; }
`;

const SubjectList = styled.ul`
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  li { padding: 10px 12px; border: 1px solid ${colors.border}; border-radius: ${radius.sm}; color: ${colors.textPrimary}; font-size: 13px; }
  span { display: block; margin-top: 3px; color: ${colors.textMuted}; font-size: 11px; }
`;

const Detail = styled.div`
  min-width: 0;
  span { display: block; margin-bottom: 4px; color: ${colors.textMuted}; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  strong { display: block; color: ${colors.textPrimary}; font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
`;

const Notice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 12px 14px;
  border: 1px solid #cfe2f4;
  border-radius: ${radius.md};
  color: ${colors.textSecondary};
  background: ${colors.primaryLight};
  font-size: 12px;
  line-height: 1.5;
  svg { flex: 0 0 auto; color: ${colors.primary}; font-size: 17px; }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
  @media (max-width: 440px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
`;

const Empty = styled.div`
  padding: 34px 18px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  color: ${colors.textMuted};
  background: ${colors.white};
  text-align: center;
  font-size: 13px;
`;

const getSemesterRange = (year) => {
  const normalized = Number(year);
  if (normalized < 1 || normalized > 4) return 'Not available';
  return `Semesters ${normalized * 2 - 1}-${normalized * 2} (Year ${normalized})`;
};

const AdminStudentProfile = () => {
  const admin = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const { registrationNumber } = useParams();
  const [searchParams] = useSearchParams();
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const isEditing = searchParams.get('edit') === '1';

  useEffect(() => {
    if (!admin.isAuthenticated) return undefined;
    setAvatarLoadFailed(false);
    let isMounted = true;
    axios.post('/api/admin/getAllStudent')
      .then(async ({ data }) => {
        const rows = Array.isArray(data?.result) ? data.result : [];
        const found = rows.find((row) => row.registrationNumber === registrationNumber);
        if (!isMounted) return;
        if (!found) {
          setLoadError('No student was found with this registration number.');
          return;
        }
        const safeRecord = {
          name: found.name,
          email: found.email,
          avatar: found.avatar,
          registrationNumber: found.registrationNumber,
          department: found.department,
          year: found.year,
          section: found.section,
          batch: found.batch,
          studentMobileNumber: found.studentMobileNumber,
          fatherName: found.fatherName,
          fatherMobileNumber: found.fatherMobileNumber,
          status: Object.prototype.hasOwnProperty.call(found, 'status') ? found.status : undefined,
        };
        setStudent(safeRecord);
        setForm({
          name: safeRecord.name || '',
          email: safeRecord.email || '',
          studentMobileNumber: safeRecord.studentMobileNumber || '',
          department: safeRecord.department || '',
          semester: safeRecord.year ? String(Number(safeRecord.year) * 2 - 1) : '1',
          section: safeRecord.section || '',
          fatherName: safeRecord.fatherName || '',
          fatherMobileNumber: safeRecord.fatherMobileNumber || '',
        });
        if (!safeRecord.department || !safeRecord.year) {
          if (isMounted) setSubjects(null);
          return;
        }
        try {
          const { data: subjectData } = await axios.post('/api/admin/getSubjects', {
            department: safeRecord.department,
            year: String(safeRecord.year),
          });
          if (isMounted) setSubjects(Array.isArray(subjectData?.result) ? subjectData.result : []);
        } catch (error) {
          if (isMounted) setSubjects(null);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        setLoadError(error.response?.status === 404
          ? 'No student records are available.'
          : 'Student profile could not be loaded. Please try again.');
      })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [admin.isAuthenticated, registrationNumber]);

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  if (isLoading || loadError || !student) {
    return <PageShell><AdminNavbar /><Content><AdminBackButton /><BackLink to="/admin/students"><ArrowBack />Student Directory</BackLink><Empty>{isLoading ? 'Loading student profile...' : loadError || 'Student profile is unavailable.'}</Empty></Content></PageShell>;
  }

  const avatarUrl = !avatarLoadFailed ? student.avatar?.url : null;
  const initials = (student.name || 'S').trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const legacyYear = semesterToYear(form?.semester || '1');

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <BackLink to="/admin/students"><ArrowBack />Student Directory</BackLink>
        <ProfileHeader $pad="22px 24px">
          <AvatarImage>{avatarUrl ? <img src={avatarUrl} alt={`${student.name || 'Student'} profile`} onError={() => setAvatarLoadFailed(true)} /> : initials}</AvatarImage>
          <HeaderDetails>
            <Name>{student.name || 'Student profile'}</Name>
            <Registration>{student.registrationNumber || 'Registration number unavailable'}</Registration>
            <HeaderMeta>
              <MetaPill>{student.department || 'Department unavailable'}</MetaPill>
              <MetaPill>{getSemesterRange(student.year)}</MetaPill>
              {student.section && <MetaPill>Section {student.section}</MetaPill>}
              {student.status && <MetaPill>{student.status}</MetaPill>}
            </HeaderMeta>
          </HeaderDetails>
          {!isEditing && <Btn as={Link} to={`?edit=1`} $variant="outline">Edit profile</Btn>}
        </ProfileHeader>

        {isEditing ? (
          <Card $pad="22px">
            <SectionTitle>Edit Student Information</SectionTitle>
            <Notice><InfoOutlined />These fields can be changed in this form, but the current backend has no Admin student-update API. Save is unavailable and changes will not be submitted. Semester {form?.semester || '1'} maps to legacy Year {legacyYear}.</Notice>
            {form && <form onSubmit={(event) => event.preventDefault()}>
              <FormGrid style={{ marginTop: 17 }}>
                <Field><Label htmlFor="edit-email">Email</Label><Input id="edit-email" name="email" type="email" value={form.email} onChange={updateForm} /></Field>
                <Field><Label htmlFor="edit-mobile">Student Mobile</Label><Input id="edit-mobile" name="studentMobileNumber" value={form.studentMobileNumber} onChange={updateForm} /></Field>
                <Field><Label htmlFor="edit-father-name">Father Name</Label><Input id="edit-father-name" name="fatherName" value={form.fatherName} onChange={updateForm} /></Field>
                <Field><Label htmlFor="edit-father-mobile">Father Mobile</Label><Input id="edit-father-mobile" name="fatherMobileNumber" value={form.fatherMobileNumber} onChange={updateForm} /></Field>
                <Field><Label htmlFor="edit-department">Department</Label><Select id="edit-department" name="department" value={form.department} onChange={updateForm}>{ADMIN_DEPARTMENTS.map((value) => <option key={value} value={value}>{value}</option>)}</Select></Field>
                <Field><Label htmlFor="edit-semester">Semester</Label><Select id="edit-semester" name="semester" value={form.semester} onChange={updateForm}>{Array.from({ length: 8 }, (_, index) => String(index + 1)).map((value) => <option key={value} value={value}>Semester {value}</option>)}</Select></Field>
                <Field><Label htmlFor="edit-section">Section</Label><Select id="edit-section" name="section" value={form.section} onChange={updateForm}>{ADMIN_SECTIONS.map((value) => <option key={value} value={value}>Section {value}</option>)}</Select></Field>
              </FormGrid>
              <ActionRow>
                <Btn type="button" disabled title="Admin update API is not available">Save changes</Btn>
                <Btn as={Link} to={`/admin/students/${encodeURIComponent(student.registrationNumber)}`} $variant="outline">Cancel</Btn>
              </ActionRow>
            </form>}
          </Card>
        ) : (
          <ProfileGrid>
            <Card $pad="22px">
              <SectionTitle>Personal Information</SectionTitle>
              <DetailsGrid>
                <Detail><span>Name</span><strong>{student.name || 'Not available'}</strong></Detail>
                <Detail><span>USN / Registration Number</span><strong>{student.registrationNumber || 'Not available'}</strong></Detail>
                <Detail><span>Email</span><strong>{student.email || 'Not available'}</strong></Detail>
                <Detail><span>Mobile</span><strong>{student.studentMobileNumber || 'Not available'}</strong></Detail>
                <Detail><span>Father Name</span><strong>{student.fatherName || 'Not available'}</strong></Detail>
                <Detail><span>Father Mobile</span><strong>{student.fatherMobileNumber || 'Not available'}</strong></Detail>
              </DetailsGrid>
            </Card>
            <Card $pad="22px">
              <SectionTitle>Academic Information</SectionTitle>
              <DetailsGrid>
                <Detail><span>Department</span><strong>{student.department || 'Not available'}</strong></Detail>
                <Detail><span>Semester</span><strong>{getSemesterRange(student.year)}</strong></Detail>
                <Detail><span>Section</span><strong>{student.section || 'Not available'}</strong></Detail>
                <Detail><span>Academic Year</span><strong>Not stored in student records</strong></Detail>
                <Detail><span>Batch</span><strong>{student.batch || 'Not available'}</strong></Detail>
                {student.status && <Detail><span>Status</span><strong>{student.status}</strong></Detail>}
              </DetailsGrid>
            </Card>
            <Card $pad="22px">
              <SectionTitle>Academic Record</SectionTitle>
              {subjects === null ? <Notice><InfoOutlined />Subjects could not be loaded through the existing Admin API.</Notice> : subjects.length === 0 ? <Notice><InfoOutlined />No subjects are available for this department and legacy year.</Notice> : <SubjectList>{subjects.map((subject) => <li key={subject._id || subject.subjectCode}>{subject.subjectName}<span>{subject.subjectCode} | {subject.totalLectures} total lectures</span></li>)}</SubjectList>}
              <Notice style={{ marginTop: 14 }}><InfoOutlined />Attendance and marks/results are not available through the current Admin APIs. Existing attendance and marks endpoints require student authentication.</Notice>
            </Card>
            <Card $pad="22px">
              <SectionTitle>Documents</SectionTitle>
              {avatarUrl ? <Detail><span>Profile image</span><strong><a href={avatarUrl} target="_blank" rel="noreferrer">View profile image</a></strong></Detail> : <Detail><span>Profile image</span><strong>No profile image is available.</strong></Detail>}
              <Notice style={{ marginTop: 14 }}><InfoOutlined />The current Student model does not include a document collection or document-management API.</Notice>
            </Card>
          </ProfileGrid>
        )}
      </Content>
    </PageShell>
  );
};

export default AdminStudentProfile;