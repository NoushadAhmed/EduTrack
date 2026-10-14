import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowBack, InfoOutlined } from '@material-ui/icons';
import styled from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Btn, Card, PageShell, PageTitle } from '../../components/UI';
import {
  adminFetchAvailableFacultySubjects,
  adminFetchFacultyAssignments,
  adminFetchFacultyDirectory,
  adminSaveFacultyAssignments,
} from '../../redux/actions/adminAction';
import { colors, radius, shadow, transition } from '../../styles/theme';

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

const Avatar = styled.div`
  display: grid;
  width: 78px;
  height: 78px;
  flex: 0 0 auto;
  overflow: hidden;
  place-items: center;
  border: 2px solid ${colors.border};
  border-radius: 50%;
  background: ${colors.primaryLight};
  color: ${colors.primary};
  font-size: 28px;
  font-weight: 600;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const HeaderInfo = styled.div`
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

const Pills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 11px;
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

const SubjectList = styled.ul`
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  li { padding: 10px 12px; border: 1px solid ${colors.border}; border-radius: ${radius.sm}; color: ${colors.textPrimary}; font-size: 13px; }
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

const AssignmentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  @media (max-width: 520px) { align-items: flex-start; flex-direction: column; }
`;

const AssignmentGroups = styled.div`
  display: grid;
  gap: 16px;
`;

const SemesterGroup = styled.section`
  h3 { margin: 0 0 9px; color: ${colors.textPrimary}; font-size: 13px; }
`;

const AssignmentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.sm};
  color: ${colors.textPrimary};
  font-size: 13px;
  & + & { margin-top: 7px; }
  small { display: block; margin-top: 3px; color: ${colors.textMuted}; font-size: 11px; }
`;

const SubjectType = styled.span`
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 999px;
  color: ${colors.primary};
  background: ${colors.primaryLight};
  font-size: 10px;
  font-weight: 600;
`;

const Editor = styled.div`
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.bgPage};
`;

const EditorToolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const SemesterSelect = styled.select`
  min-width: 190px;
  padding: 10px 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.sm};
  color: ${colors.textPrimary};
  background: ${colors.white};
  font: inherit;
`;

const SubjectChoices = styled.div`
  display: grid;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
`;

const SubjectChoice = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.sm};
  background: ${colors.white};
  color: ${colors.textPrimary};
  cursor: pointer;
  input { margin-top: 2px; accent-color: ${colors.primary}; }
  strong { font-size: 12px; }
  small { display: block; margin-top: 3px; color: ${colors.textMuted}; font-size: 11px; }
`;

const AssignmentMessage = styled.div`
  padding: 10px 12px;
  border-radius: ${radius.sm};
  color: ${({ $error }) => ($error ? '#b42318' : '#067647')};
  background: ${({ $error }) => ($error ? '#fef3f2' : '#ecfdf3')};
  font-size: 12px;
`;

const initialsFor = (name) => (name || 'Faculty')
  .trim()
  .split(/\s+/)
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

const AdminFacultyProfile = () => {
  const admin = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registrationNumber } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState('');
  const [isEditingAssignments, setIsEditingAssignments] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('1');
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [savingAssignments, setSavingAssignments] = useState(false);
  const faculties = Array.isArray(admin.allFaculty) ? admin.allFaculty : [];

  useEffect(() => {
    if (!admin.isAuthenticated) return undefined;
    let mounted = true;
    setIsLoading(true);
    setLoadError('');
    setAvatarLoadFailed(false);
    dispatch(adminFetchFacultyDirectory())
      .catch(() => {
        if (mounted) setLoadError('Faculty profile could not be loaded. Please try again.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [admin.isAuthenticated, dispatch, reloadKey]);

  useEffect(() => {
    if (!admin.isAuthenticated || !registrationNumber) return undefined;
    let mounted = true;
    setAssignmentLoading(true);
    dispatch(adminFetchFacultyAssignments(registrationNumber))
      .then((data) => {
        if (mounted) setAssignments(Array.isArray(data?.result) ? data.result : []);
      })
      .catch((error) => {
        if (mounted) setAssignmentError(error.response?.data?.message || 'Unable to load assigned subjects.');
      })
      .finally(() => { if (mounted) setAssignmentLoading(false); });
    return () => { mounted = false; };
  }, [admin.isAuthenticated, dispatch, registrationNumber]);

  useEffect(() => {
    if (!isEditingAssignments || assignmentLoading || !registrationNumber) return undefined;
    let mounted = true;
    setAvailableLoading(true);
    setAssignmentError('');
    const semesterNumber = Number(selectedSemester);
    setSelectedSubjectIds(
      assignments
        .filter((item) => item.semester === semesterNumber && item.academicYear === '2026-27')
        .map((item) => String(item.subject))
    );
    dispatch(adminFetchAvailableFacultySubjects(registrationNumber, semesterNumber))
      .then((data) => {
        if (mounted) setAvailableSubjects(Array.isArray(data?.result) ? data.result : []);
      })
      .catch((error) => {
        if (mounted) setAssignmentError(error.response?.data?.message || 'Unable to load department subjects.');
      })
      .finally(() => { if (mounted) setAvailableLoading(false); });
    return () => { mounted = false; };
  }, [isEditingAssignments, assignmentLoading, registrationNumber, selectedSemester, assignments, dispatch]);

  const toggleSubject = (subjectId) => {
    setSelectedSubjectIds((current) => current.includes(subjectId)
      ? current.filter((id) => id !== subjectId)
      : [...current, subjectId]);
  };

  const saveAssignments = async () => {
    setSavingAssignments(true);
    setAssignmentError('');
    setAssignmentSuccess('');
    try {
      const data = await dispatch(adminSaveFacultyAssignments(
        registrationNumber,
        Number(selectedSemester),
        selectedSubjectIds
      ));
      setAssignments(Array.isArray(data?.result) ? data.result : []);
      setAssignmentSuccess('Subject assignments saved for 2026-27.');
      setIsEditingAssignments(false);
    } catch (error) {
      setAssignmentError(error.response?.data?.message || 'Unable to save subject assignments.');
    } finally {
      setSavingAssignments(false);
    }
  };

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }
  const faculty = faculties.find((record) => record.registrationNumber === registrationNumber);
  const avatarUrl = !avatarLoadFailed ? faculty?.avatar?.url : null;
  const assignmentsByTerm = assignments.reduce((groups, assignment) => {
    const key = `${assignment.academicYear || 'Academic year'}-${assignment.semester}`;
    if (!groups[key]) groups[key] = { academicYear: assignment.academicYear, semester: assignment.semester, subjects: [] };
    groups[key].subjects.push(assignment);
    return groups;
  }, {});
  const sortedAssignmentGroups = Object.values(assignmentsByTerm).sort(
    (left, right) => left.semester - right.semester || String(left.academicYear).localeCompare(String(right.academicYear))
  );

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <BackLink to="/admin/faculty"><ArrowBack />Faculty Directory</BackLink>
        {isLoading ? (
          <Empty>Loading faculty profile...</Empty>
        ) : loadError ? (
          <Empty>
            {loadError}
            <Btn type="button" $variant="outline" onClick={() => setReloadKey((key) => key + 1)}>Retry</Btn>
          </Empty>
        ) : !faculty ? (
          <Empty>
            No faculty record was found for this registration number.
            <Btn as={Link} to="/admin/faculty">Return to faculty directory</Btn>
          </Empty>
        ) : (
          <>
            <ProfileHeader $pad="22px 24px">
              <Avatar>
                {avatarUrl ? <img src={avatarUrl} alt={`${faculty.name || 'Faculty'} profile`} onError={() => setAvatarLoadFailed(true)} /> : initialsFor(faculty.name)}
              </Avatar>
              <HeaderInfo>
                <Name>{faculty.name || 'Faculty profile'}</Name>
                <Registration>{faculty.registrationNumber || 'Registration number unavailable'}</Registration>
                <Pills>
                  <Pill>{faculty.department || 'Department unavailable'}</Pill>
                  {faculty.designation && <Pill>{faculty.designation}</Pill>}
                  {faculty.joiningYear && <Pill>Joined {faculty.joiningYear}</Pill>}
                  {Object.prototype.hasOwnProperty.call(faculty, 'status') && faculty.status && <Pill>{faculty.status}</Pill>}
                </Pills>
              </HeaderInfo>
            </ProfileHeader>

            <Grid>
              <Card $pad="22px">
                <SectionTitle>Personal Information</SectionTitle>
                <Details>
                  <Detail><span>Name</span><strong>{faculty.name || 'Not available'}</strong></Detail>
                  <Detail><span>Email</span><strong>{faculty.email || 'Not available'}</strong></Detail>
                  <Detail><span>Mobile</span><strong>{faculty.facultyMobileNumber || 'Not available'}</strong></Detail>
                  <Detail><span>Avatar</span><strong>{avatarUrl ? 'Profile image available' : 'No profile image available'}</strong></Detail>
                </Details>
              </Card>
              <Card $pad="22px">
                <SectionTitle>Professional Information</SectionTitle>
                <Details>
                  <Detail><span>Faculty Registration Number</span><strong>{faculty.registrationNumber || 'Not available'}</strong></Detail>
                  <Detail><span>Department</span><strong>{faculty.department || 'Not available'}</strong></Detail>
                  <Detail><span>Designation</span><strong>{faculty.designation || 'Not available'}</strong></Detail>
                  <Detail><span>Joining Year</span><strong>{faculty.joiningYear || 'Not available'}</strong></Detail>
                  {Object.prototype.hasOwnProperty.call(faculty, 'status') && <Detail><span>Status</span><strong>{faculty.status || 'Not available'}</strong></Detail>}
                </Details>
              </Card>
              <Card $pad="22px">
                <SectionTitle>Academic / Teaching Information</SectionTitle>
                {Array.isArray(faculty.subjectsCanTeach) && faculty.subjectsCanTeach.length > 0 ? (
                  <SubjectList>{faculty.subjectsCanTeach.map((subject, index) => <li key={`${subject}-${index}`}>{subject}</li>)}</SubjectList>
                ) : (
                  <Notice><InfoOutlined />No subjects-can-teach information is recorded for this faculty member.</Notice>
                )}
              </Card>
              <Card $pad="22px">
                <AssignmentHeader>
                  <SectionTitle style={{ margin: 0, padding: 0, border: 0 }}>Assigned Subjects</SectionTitle>
                  {!isEditingAssignments && (
                    <Btn type="button" onClick={() => { setAssignmentSuccess(''); setAssignmentError(''); setIsEditingAssignments(true); }}>
                      Assign Subjects
                    </Btn>
                  )}
                </AssignmentHeader>

                {assignmentLoading ? (
                  <Notice><InfoOutlined />Loading assigned subjects...</Notice>
                ) : assignmentError && !isEditingAssignments ? (
                  <AssignmentMessage $error>{assignmentError}</AssignmentMessage>
                ) : sortedAssignmentGroups.length ? (
                  <AssignmentGroups>
                    {sortedAssignmentGroups.map((group) => (
                      <SemesterGroup key={`${group.academicYear}-${group.semester}`}>
                        <h3>Semester {group.semester} · {group.academicYear}</h3>
                        {group.subjects
                          .slice()
                          .sort((left, right) => left.subjectCode.localeCompare(right.subjectCode))
                          .map((subject) => (
                            <AssignmentRow key={`${group.academicYear}-${group.semester}-${subject.subjectCode}`}>
                              <span>
                                <strong>{subject.subjectCode}</strong> - {subject.subjectName}
                                <small>Year {subject.year || Math.ceil(Number(subject.semester) / 2)} · Section {subject.section || 'Not specified'} · {subject.department || faculty.department}</small>
                              </span>
                              <SubjectType>{subject.subjectType || 'Subject'}</SubjectType>
                            </AssignmentRow>
                          ))}
                      </SemesterGroup>
                    ))}
                  </AssignmentGroups>
                ) : (
                  <Notice><InfoOutlined />No subjects have been assigned for this faculty member.</Notice>
                )}

                {assignmentSuccess && <AssignmentMessage style={{ marginTop: 12 }}>{assignmentSuccess}</AssignmentMessage>}

                {isEditingAssignments && (
                  <Editor style={{ marginTop: 14 }}>
                    <EditorToolbar>
                      <SemesterSelect
                        aria-label="Select semester"
                        value={selectedSemester}
                        onChange={(event) => setSelectedSemester(event.target.value)}
                      >
                        {Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => (
                          <option key={semester} value={semester}>Semester {semester}</option>
                        ))}
                      </SemesterSelect>
                      <span style={{ color: colors.textSecondary, fontSize: 12 }}>
                        {selectedSubjectIds.length} selected · Academic year 2026-27
                      </span>
                    </EditorToolbar>

                    {assignmentError && <AssignmentMessage $error>{assignmentError}</AssignmentMessage>}

                    {availableLoading ? (
                      <Notice><InfoOutlined />Loading {faculty.department} subjects...</Notice>
                    ) : availableSubjects.length ? (
                      <SubjectChoices>
                        {availableSubjects.map((subject) => (
                          <SubjectChoice key={subject._id}>
                            <input
                              type="checkbox"
                              checked={selectedSubjectIds.includes(String(subject._id))}
                              onChange={() => toggleSubject(String(subject._id))}
                            />
                            <span>
                              <strong>{subject.subjectCode} - {subject.subjectName}</strong>
                              <small>{subject.subjectType || 'Subject'}</small>
                            </span>
                          </SubjectChoice>
                        ))}
                      </SubjectChoices>
                    ) : (
                      <Notice><InfoOutlined />No {faculty.department} subjects are available for Semester {selectedSemester}.</Notice>
                    )}

                    <EditorToolbar>
                      <Btn type="button" onClick={saveAssignments} disabled={savingAssignments || availableLoading}>
                        {savingAssignments ? 'Saving...' : 'Save Assignments'}
                      </Btn>
                      <Btn type="button" $variant="outline" disabled={savingAssignments} onClick={() => { setIsEditingAssignments(false); setAssignmentError(''); }}>
                        Cancel
                      </Btn>
                    </EditorToolbar>
                  </Editor>
                )}
              </Card>
            </Grid>
          </>
        )}
      </Content>
    </PageShell>
  );
};

export default AdminFacultyProfile;
