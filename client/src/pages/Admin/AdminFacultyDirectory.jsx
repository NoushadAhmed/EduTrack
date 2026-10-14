import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Visibility } from '@material-ui/icons';
import styled, { keyframes } from 'styled-components';
import AdminNavbar from '../../components/AdminNavbar';
import AdminBackButton from '../../components/AdminBackButton';
import { Btn, Card, Input, Label, PageShell, PageTitle, Select, Subtitle } from '../../components/UI';
import { ADMIN_DEPARTMENTS } from '../../config/adminOptions';
import { adminFetchFacultyDirectory } from '../../redux/actions/adminAction';
import { colors, font, radius, shadow, transition } from '../../styles/theme';

const EMPTY_FACULTY_LIST = [];

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Content = styled.main`
  box-sizing: border-box;
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 36px 24px 52px;
  animation: ${fadeUp} 0.28s ease both;
  @media (max-width: 600px) { padding: 24px 16px 40px; }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
  h1 { margin-bottom: 5px; }
  p { margin: 0; }
  @media (max-width: 560px) { flex-direction: column; }
`;

const Filters = styled(Card)`
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(3, minmax(150px, 1fr));
  align-items: end;
  gap: 13px;
  padding: 18px;
  margin-bottom: 18px;
  @media (max-width: 850px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 450px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
`;

const SearchWrap = styled.div`
  position: relative;
  svg { position: absolute; top: 12px; left: 12px; color: ${colors.textMuted}; font-size: 19px; }
  ${Input} { padding-left: 40px; }
`;

const ResultsBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 1px 10px;
  color: ${colors.textMuted};
  font-size: 12px;
  strong { color: ${colors.textPrimary}; font-size: 14px; font-weight: 600; }
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.white};
  box-shadow: ${shadow.card};
  table { width: 100%; min-width: 940px; border-collapse: collapse; text-align: left; }
  th, td { padding: 13px 14px; border-bottom: 1px solid ${colors.border}; font-size: 13px; white-space: nowrap; }
  th { color: ${colors.textMuted}; background: #f8fafd; font-size: 11px; font-weight: 600; text-transform: uppercase; }
  td { color: ${colors.textSecondary}; }
  tbody tr { transition: ${transition.fast}; }
  tbody tr:hover { background: #f8fbfe; }
  tbody tr:last-child td { border-bottom: 0; }
  td strong { color: ${colors.textPrimary}; font-weight: 600; }
  @media (max-width: 760px) { display: none; }
`;

const FacultyCards = styled.div`
  display: none;
  gap: 12px;
  @media (max-width: 760px) { display: grid; }
`;

const FacultyCard = styled(Card)`
  display: grid;
  gap: 12px;
  padding: 17px;
  transition: ${transition.base};
  animation: ${fadeUp} 0.22s ease both;
  &:hover { transform: translateY(-2px); box-shadow: ${shadow.cardHover}; }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  strong { display: block; color: ${colors.textPrimary}; font-size: 15px; }
  span { display: block; margin-top: 4px; color: ${colors.textMuted}; font: 12px ${font.family}; overflow-wrap: anywhere; }
`;

const MobileMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const Meta = styled.div`
  min-width: 0;
  span { display: block; margin-bottom: 3px; color: ${colors.textMuted}; font-size: 10px; text-transform: uppercase; }
  strong { display: block; color: ${colors.textSecondary}; font-size: 12px; font-weight: 500; overflow-wrap: anywhere; }
`;

const ProfileLink = styled(Link)`
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 9px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.sm};
  color: ${colors.textSecondary};
  background: ${colors.white};
  font: 500 12px ${font.family};
  text-decoration: none;
  transition: ${transition.fast};
  svg { font-size: 16px; }
  &:hover { color: ${colors.primary}; border-color: ${colors.primary}; background: ${colors.primaryLight}; }
`;

const Empty = styled.div`
  padding: 36px 20px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  color: ${colors.textMuted};
  background: ${colors.white};
  text-align: center;
  font-size: 13px;
`;

const AdminFacultyDirectory = () => {
  const admin = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [joiningYear, setJoiningYear] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const faculties = Array.isArray(admin.allFaculty) ? admin.allFaculty : EMPTY_FACULTY_LIST;

  useEffect(() => {
    if (!admin.isAuthenticated) return undefined;
    let mounted = true;
    setIsLoading(true);
    setLoadError('');
    dispatch(adminFetchFacultyDirectory())
      .catch(() => {
        if (mounted) setLoadError('Faculty records could not be loaded. Please try again.');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => { mounted = false; };
  }, [admin.isAuthenticated, dispatch, reloadKey]);

  const designations = useMemo(() => (
    [...new Set(faculties.map((faculty) => faculty.designation).filter(Boolean))]
      .sort((first, second) => String(first).localeCompare(String(second)))
  ), [faculties]);
  const joiningYears = useMemo(() => (
    [...new Set(faculties.map((faculty) => faculty.joiningYear).filter((year) => year !== null && year !== undefined && year !== ''))]
      .sort((first, second) => Number(second) - Number(first))
      .map(String)
  ), [faculties]);

  const filteredFaculties = useMemo(() => {
    const query = search.trim().toLowerCase();
    return faculties.filter((faculty) => {
      const matchesSearch = !query || [
        faculty.registrationNumber,
        faculty.name,
        faculty.email,
      ].some((value) => String(value || '').toLowerCase().includes(query));
      return matchesSearch
        && (!department || faculty.department === department)
        && (!designation || faculty.designation === designation)
        && (!joiningYear || String(faculty.joiningYear || '') === joiningYear);
    });
  }, [faculties, search, department, designation, joiningYear]);

  if (!admin.isAuthenticated) { navigate('/admin/login'); return null; }

  return (
    <PageShell>
      <AdminNavbar />
      <Content>
        <AdminBackButton />
        <Header>
          <div>
            <PageTitle>Faculty Management</PageTitle>
            <Subtitle>Search and review faculty records across departments.</Subtitle>
          </div>
          <Btn as={Link} to="/admin/add/faculties">+ Add Faculty</Btn>
        </Header>

        <Filters $pad="18px">
          <Field>
            <Label htmlFor="faculty-search">Search faculty</Label>
            <SearchWrap>
              <Search />
              <Input id="faculty-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Registration number, name, or email" />
            </SearchWrap>
          </Field>
          <Field>
            <Label htmlFor="faculty-department">Department</Label>
            <Select id="faculty-department" value={department} onChange={(event) => setDepartment(event.target.value)}>
              <option value="">All departments</option>
              {ADMIN_DEPARTMENTS.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="faculty-designation">Designation</Label>
            <Select id="faculty-designation" value={designation} onChange={(event) => setDesignation(event.target.value)}>
              <option value="">All designations</option>
              {designations.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="faculty-joining-year">Joining year</Label>
            <Select id="faculty-joining-year" value={joiningYear} onChange={(event) => setJoiningYear(event.target.value)}>
              <option value="">All joining years</option>
              {joiningYears.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </Field>
        </Filters>

        <ResultsBar>
          <strong>{isLoading ? 'Loading faculty...' : `${filteredFaculties.length} faculty`}</strong>
          <span>of {faculties.length} records</span>
        </ResultsBar>
        {loadError ? (
          <Empty>
            {loadError}{' '}
            <Btn type="button" $variant="outline" onClick={() => setReloadKey((key) => key + 1)}>Retry</Btn>
          </Empty>
        ) : isLoading ? (
          <Empty>Loading faculty records...</Empty>
        ) : filteredFaculties.length === 0 ? (
          <Empty>{faculties.length ? 'No faculty match these search and filter criteria.' : 'No faculty records are available.'}</Empty>
        ) : (
          <>
            <TableWrap>
              <table>
                <thead><tr>
                  <th>Registration Number</th><th>Name</th><th>Email</th><th>Department</th><th>Designation</th><th>Mobile</th><th>Joining Year</th>
                  {faculties.some((faculty) => Object.prototype.hasOwnProperty.call(faculty, 'status')) && <th>Status</th>}
                  <th>Action</th>
                </tr></thead>
                <tbody>{filteredFaculties.map((faculty) => (
                  <tr key={faculty._id || faculty.registrationNumber}>
                    <td><strong>{faculty.registrationNumber || 'Not available'}</strong></td>
                    <td>{faculty.name || 'Not available'}</td>
                    <td>{faculty.email || 'Not available'}</td>
                    <td>{faculty.department || 'Not available'}</td>
                    <td>{faculty.designation || 'Not available'}</td>
                    <td>{faculty.facultyMobileNumber || 'Not available'}</td>
                    <td>{faculty.joiningYear || 'Not available'}</td>
                    {faculties.some((item) => Object.prototype.hasOwnProperty.call(item, 'status')) && <td>{faculty.status || 'Not available'}</td>}
                    <td><ProfileLink to={`/admin/faculty/${encodeURIComponent(faculty.registrationNumber || '')}`}><Visibility />View Profile</ProfileLink></td>
                  </tr>
                ))}</tbody>
              </table>
            </TableWrap>
            <FacultyCards>
              {filteredFaculties.map((faculty) => (
                <FacultyCard key={faculty._id || faculty.registrationNumber} $pad="17px">
                  <CardHeader>
                    <div><strong>{faculty.name || 'Faculty member'}</strong><span>{faculty.registrationNumber || 'Registration number unavailable'}</span></div>
                    <ProfileLink to={`/admin/faculty/${encodeURIComponent(faculty.registrationNumber || '')}`}><Visibility />View</ProfileLink>
                  </CardHeader>
                  <MobileMeta>
                    <Meta><span>Email</span><strong>{faculty.email || 'Not available'}</strong></Meta>
                    <Meta><span>Department</span><strong>{faculty.department || 'Not available'}</strong></Meta>
                    <Meta><span>Designation</span><strong>{faculty.designation || 'Not available'}</strong></Meta>
                    <Meta><span>Mobile</span><strong>{faculty.facultyMobileNumber || 'Not available'}</strong></Meta>
                    <Meta><span>Joining Year</span><strong>{faculty.joiningYear || 'Not available'}</strong></Meta>
                    {Object.prototype.hasOwnProperty.call(faculty, 'status') && <Meta><span>Status</span><strong>{faculty.status || 'Not available'}</strong></Meta>}
                  </MobileMeta>
                </FacultyCard>
              ))}
            </FacultyCards>
          </>
        )}
      </Content>
    </PageShell>
  );
};

export default AdminFacultyDirectory;
