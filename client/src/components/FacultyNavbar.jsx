import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAlert } from 'react-alert';
import styled from 'styled-components';
import { Person, Dashboard, Ballot, VpnKey, ExitToApp, Group } from '@material-ui/icons';
import { facultyLogout } from '../redux/actions/facultyAction';
import { colors, font, shadow, transition } from '../styles/theme';
import { Avatar } from './UI';

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background: ${colors.white};
  border-bottom: 1px solid ${colors.navBorder};
  box-shadow: ${shadow.nav};
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 56px;

  @media (max-width: 600px) {
    padding: 0 16px;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  flex-direction: column;
  text-decoration: none;
`;

const LogoText = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: ${colors.primary};
  font-family: ${font.family};
  letter-spacing: -0.3px;
  line-height: 1.2;
`;

const LogoSub = styled.span`
  font-size: 10px;
  font-weight: 500;
  color: ${colors.textMuted};
  font-family: ${font.family};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const NavBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: ${transition.fast};
  color: ${colors.textSecondary};
  position: relative;

  svg { font-size: 20px !important; }

  &:hover {
    background: ${colors.primaryLight};
    color: ${colors.primary};
  }

  &[title]:hover::after {
    content: attr(title);
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors.textPrimary};
    color: white;
    font-size: 11px;
    font-family: ${font.family};
    white-space: nowrap;
    padding: 3px 8px;
    border-radius: 4px;
    pointer-events: none;
    z-index: 200;
  }
`;

const NavDivider = styled.div`
  width: 1px;
  height: 22px;
  background: ${colors.border};
  margin: 0 4px;
`;

const FacultyNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const alert = useAlert();
  const faculty = useSelector((s) => s.faculty);
  const facultyData = faculty?.faculty?.faculty;

  const logout = () => {
    dispatch(facultyLogout());
    alert.success('Logged out');
    navigate('/');
  };

  const avatarUrl = facultyData?.avatar?.url;
  const firstLetter = facultyData?.name ? facultyData.name.charAt(0) : 'F';

  return (
    <Nav>
      <Inner>
        <LogoLink to="/faculty">
          <LogoText>EduTrack</LogoText>
          <LogoSub>Faculty Portal</LogoSub>
        </LogoLink>

        <Actions>
          <NavBtn title="Profile" onClick={() => navigate('/faculty')}>
            <Avatar $size="28px" style={{ cursor: 'pointer' }}>
              {avatarUrl ? <img src={avatarUrl} alt={firstLetter} /> : firstLetter}
            </Avatar>
          </NavBtn>

          <NavBtn title="Update Profile" onClick={() => navigate('/faculty/update')}>
            <Person style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Dashboard" onClick={() => navigate('/faculty')}>
            <Dashboard style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Attendance" onClick={() => navigate('/faculty/attendance')}>
            <Group style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Upload Marks" onClick={() => navigate('/faculty/marks')}>
            <Ballot style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Change Password" onClick={() => navigate('/faculty/updatePassword')}>
            <VpnKey style={{ color: 'inherit' }} />
          </NavBtn>

          <NavDivider />

          <NavBtn title="Log out" onClick={logout}>
            <ExitToApp style={{ color: 'inherit' }} />
          </NavBtn>
        </Actions>
      </Inner>
    </Nav>
  );
};

export default FacultyNavbar;
