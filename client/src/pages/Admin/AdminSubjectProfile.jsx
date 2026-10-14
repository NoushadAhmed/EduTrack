import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowBack, InfoOutlined } from '@material-ui/icons';
import styled from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Btn, Card, PageShell, PageTitle } from '../../components/UI';
import { adminFetchSubjectDirectory } from '../../redux/actions/adminAction';
import { colors, radius, transition } from '../../styles/theme';

const Content = styled.main`
  box-sizing: border-box;
  width: 100%;
  max-width: 1060px;
  margin: 0 auto;
  padding: 34px 24px 52px;
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

const HeaderCard = styled(Card)`
  margin-bottom: 18px;
  transition: ${transition.base};
  &:hover { box-shadow: 0 4px 16px rgba(15,28,46,0.12); transform: translateY(-1px); }
`;

const Code = styled.div`
  margin-top: 8px;
  color: ${colors.textMuted};
  font: 13px 'Courier New', monospace;
  overflow-wrap: anywhere;
`;

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 13px;
`;

const Pill = styled.span`
  padding: 5px 9px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.sm};
  color: ${colors.textSecondary};
  background: ${colors.bgPage};
  font-size: 12px;
`;

const Grid = styled.div`
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

const Details = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 18px;
  @media (max-width: 440px) { grid-template-columns: 1fr; }
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

const AssignmentList = styled.div`
  display: grid;
  gap: 12px;
`;

const Assignment = styled.div`
  padding: 13px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.bgPage};
  strong { display: block; color: ${colors.textPrimary}; font-size: 14px; }
  small { display: block; margin-top: 5px; color: ${colors.textSecondary}; font-size: 12px; line-height: 1.5; }
`;

const Empty = styled.div`
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 36px 20px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  color: ${colors.textMuted};
  background: ${colors.white};
  text-align: center;
  font-size: 13px;
`;

const semesterRange = (year) => {
  const normalized = Number(year);
  if (normalized < 1 || normalized > 4) return 'Not available';
  const first = normalized * 2 - 1;
  return `Semesters ${first}-${first + 1} (Year ${normalized})`;
};

const semesterLabel = (subject) => (
  subject.semester ? `Semester ${subject.semester}` : semesterRange(subject.year)
);

const AdminSubjectProfile = () => {
  const admin = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { subjectCode } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [studentCount, setStudentCount] = useState(null);
  const [eligibleFaculty, setEligibleFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [assignmentSection, setAssignmentSection] = useState('A');
  const [assignmentError, setAssignmentError] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const subjects = Array.isArray(admin.allSubject) ? admin.allSubject : [];

  useEffect(() => {
    if (!admin.isAuthenticated) return undefined;
    let mounted = true;
    setIsLoading(true);
    setLoadError('');
    setStudentCount(null);
    dispatch(adminFetchSubjectDirectory())
      .catch(() => {
        if (mounted) setLoadError('Subject profile could not be loaded. Please try again.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [admin.isAuthenticated, dispatch, reloadKey]);

  const subject = subjects.find((record) => String(record._id) === subjectCode)
    || subjects.find((record) => record.subjectCode === subjectCode);
  const assignedFaculty = Array.isArray(subject?.assignedFaculty) ? subject.assignedFaculty : [];

  useEffect(() => {
    if (!admin.isAuthenticated || !subject?._id || assignedFaculty.length) return undefined;
    let mounted = true;
    axios.get(`/api/admin/subjects/${subject._id}/eligible-faculty`)
      .then(({ data }) => {
        if (mounted) setEligibleFaculty(Array.isArray(data?.result) ? data.result : []);
      })
      .catch(() => {
        if (mounted) setAssignmentError('Eligible faculty could not be loaded.');
      });
    return () => { mounted = false; };
  }, [admin.isAuthenticated, subject?._id, assignedFaculty.length]);

  const assignFaculty = async (event) => {
    event.preventDefault();
    if (!selectedFaculty || !subject?._id) return;
    setIsAssigning(true);
    setAssignmentError('');
    try {
      await axios.post(`/api/admin/subjects/${subject._id}/assignments`, {
        facultyId: selectedFaculty,
        section: assignmentSection,
        academicYear: subject.academicYear || undefined,
      });
      await dispatch(adminFetchSubjectDirectory());
    } catch (error) {
      setAssignmentError(error.response?.data?.message || 'Faculty could not be assigned.');
    } finally {
      setIsAssigning(false);
    }
  };

  useEffect(() => {
    if (!admin.isAuthenticated || !subject?._id) return undefined;
    let mounted = true;
    axios.post('/api/admin/getAllStudent')
      .then(({ data }) => {
        if (!mounted) return;
        const students = Array.isArray(data?.result) ? data.result : [];
        const enrolled = students.filter((student) => (
          Array.isArray(student.subjects)
          && student.subjects.some((reference) => String(reference?._id || reference) === String(subject._id))
        ));
        setStudentCount(enrolled.length);
      })
      .catch(() => {
        if (mounted) setStudentCount(null);
      });
    return () => { mounted = false; };
  }, [admin.isAuthenticated, subject?._id]);

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <BackLink to="/admin/subjects"><ArrowBack />Subject Directory</BackLink>
        {isLoading ? (
          <Empty>Loading subject profile...</Empty>
        ) : loadError ? (
          <Empty>
            {loadError}
            <Btn type="button" $variant="outline" onClick={() => setReloadKey((key) => key + 1)}>Retry</Btn>
          </Empty>
        ) : !subject ? (
          <Empty>
            No subject record was found for this subject code.
            <Btn as={Link} to="/admin/subjects">Return to subject directory</Btn>
          </Empty>
        ) : (
          <>
            <HeaderCard $pad="22px 24px">
              <PageTitle>{subject.subjectName || 'Subject profile'}</PageTitle>
              <Code>{subject.subjectCode || 'Subject code unavailable'}</Code>
              <Pills>
                <Pill>{subject.department || 'Department unavailable'}</Pill>
              <Pill>{semesterLabel(subject)}</Pill>
              {subject.academicYear && <Pill>Academic year {subject.academicYear}</Pill>}
                {subject.totalLectures !== null && subject.totalLectures !== undefined && <Pill>{subject.totalLectures} total lectures</Pill>}
              </Pills>
            </HeaderCard>

            <Grid>
              <Card $pad="22px">
                <SectionTitle>Subject Information</SectionTitle>
                <Details>
                  <Detail><span>Subject Code</span><strong>{subject.subjectCode || 'Not available'}</strong></Detail>
                  <Detail><span>Subject Name</span><strong>{subject.subjectName || 'Not available'}</strong></Detail>
                  <Detail><span>Department</span><strong>{subject.department || 'Not available'}</strong></Detail>
                  <Detail><span>Semester</span><strong>{semesterLabel(subject)}</strong></Detail>
                  <Detail><span>Academic Year</span><strong>{subject.academicYear || 'Not specified'}</strong></Detail>
                  <Detail><span>Total Lectures</span><strong>{subject.totalLectures ?? 'Not available'}</strong></Detail>
                </Details>
              </Card>
              <Card $pad="22px">
                <SectionTitle>Faculty Information</SectionTitle>
                {assignedFaculty.length ? (
                  <AssignmentList>
                    {assignedFaculty.map((assignment) => (
                      <Assignment key={assignment._id || `${assignment.faculty?._id}-${assignment.semester}-${assignment.section}`}>
                        <strong>{assignment.faculty?.name || 'Faculty record unavailable'}</strong>
                        <small>
                          Registration number: {assignment.faculty?.registrationNumber || 'Not available'}<br />
                          Designation: {assignment.faculty?.designation || 'Not available'}<br />
                          Department: {assignment.department || subject.department || 'Not available'} · Semester {assignment.semester || subject.semester || 'Not specified'} · Section {assignment.section || 'Not specified'}<br />
                          Academic year: {assignment.academicYear || 'Not specified'}
                        </small>
                      </Assignment>
                    ))}
                  </AssignmentList>
                ) : (
                  <>
                    <Notice><InfoOutlined />No faculty assigned yet.</Notice>
                    <form onSubmit={assignFaculty} style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                      <label style={{ color: colors.textSecondary, fontSize: 12 }} htmlFor="subject-faculty">Assign an eligible existing faculty member</label>
                      <select id="subject-faculty" value={selectedFaculty} onChange={(event) => setSelectedFaculty(event.target.value)} required>
                        <option value="">Select faculty</option>
                        {eligibleFaculty.map((faculty) => (
                          <option key={faculty._id} value={faculty._id}>{faculty.name} · {faculty.registrationNumber || 'Registration number unavailable'} · {faculty.designation}</option>
                        ))}
                      </select>
                      <label style={{ color: colors.textSecondary, fontSize: 12 }} htmlFor="assignment-section">Section</label>
                      <input id="assignment-section" value={assignmentSection} onChange={(event) => setAssignmentSection(event.target.value)} maxLength={12} required />
                      {assignmentError && <Notice><InfoOutlined />{assignmentError}</Notice>}
                      {!eligibleFaculty.length && !assignmentError && <small>No eligible faculty members are available for this department and subject.</small>}
                      <Btn type="submit" disabled={!eligibleFaculty.length || isAssigning || !selectedFaculty}>
                        {isAssigning ? 'Assigning…' : 'Assign faculty'}
                      </Btn>
                    </form>
                  </>
                )}
              </Card>
              <Card $pad="22px">
                <SectionTitle>Student Information</SectionTitle>
                <Details>
                  <Detail><span>Enrolled Students</span><strong>{studentCount === null ? 'Not available' : studentCount}</strong></Detail>
                </Details>
                {studentCount === null && <Notice style={{ marginTop: 14 }}><InfoOutlined />Enrollment count could not be loaded from the existing student records API.</Notice>}
              </Card>
              <Card $pad="22px">
                <SectionTitle>Academic Information</SectionTitle>
                <Details>
                  <Detail><span>Attendance</span><strong>{subject.attendance ? 'Attendance reference exists' : 'No attendance reference'}</strong></Detail>
                </Details>
                {!subject.semester && <Notice style={{ marginTop: 14 }}><InfoOutlined />This legacy subject record has no semester number; its year covers two semesters.</Notice>}
              </Card>
            </Grid>
          </>
        )}
      </Content>
    </PageShell>
  );
};

export default AdminSubjectProfile;
