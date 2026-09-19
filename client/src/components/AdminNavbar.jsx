import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAlert } from 'react-alert';
import styled from 'styled-components';
import {
  PersonAdd, LibraryAdd, HowToReg, Person,
  ExitToApp, Group, LibraryBooks,
} from '@material-ui/icons';
import { adminLogout } from '../redux/actions/adminAction';
import { colors, font, shadow, transition } from '../styles/theme';

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
  letter-spacing: 0.02em;
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

const Divider = styled.div`
  width: 1px;
  height: 22px;
  background: ${colors.border};
  margin: 0 4px;
`;

const AdminNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const alert = useAlert();

  const logout = () => {
    dispatch(adminLogout());
    alert.success('Logged out');
    navigate('/admin/login');
  };

  return (
    <Nav>
      <Inner>
        <LogoLink to="/admin">
          <LogoText>EduTrack</LogoText>
          <LogoSub>Admin Portal</LogoSub>
        </LogoLink>

        <Actions>
          <NavBtn title="Add Student" onClick={() => navigate('/admin/add/students')}>
            <PersonAdd style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Add Faculty" onClick={() => navigate('/admin/add/faculties')}>
            <HowToReg style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Add Subject" onClick={() => navigate('/admin/add/subjects')}>
            <LibraryAdd style={{ color: 'inherit' }} />
          </NavBtn>

          <Divider />

          <NavBtn title="Search Students" onClick={() => navigate('/admin/students')}>
            <Person style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Search Faculty" onClick={() => navigate('/admin/faculties')}>
            <Group style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Search Subjects" onClick={() => navigate('/admin/subjects')}>
            <LibraryBooks style={{ color: 'inherit' }} />
          </NavBtn>

          <Divider />

          <NavBtn title="Log out" onClick={logout}>
            <ExitToApp style={{ color: 'inherit' }} />
          </NavBtn>
        </Actions>
      </Inner>
    </Nav>
  );
};

export default AdminNavbar;
