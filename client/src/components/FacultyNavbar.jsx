import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAlert } from 'react-alert';
import styled, { css } from 'styled-components';
import {
  AccountCircle,
  Assignment,
  Ballot,
  ChevronLeft,
  ChevronRight,
  Dashboard,
  EventAvailable,
  ExitToApp,
  Group,
  Menu,
  Person,
  School,
  VpnKey,
} from '@material-ui/icons';
import { facultyLogout } from '../redux/actions/facultyAction';
import { colors, font, shadow, transition } from '../styles/theme';
import { Avatar } from './UI';
import AdminSettingsPopover from './AdminSettingsPopover';

const Nav = styled.nav`
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  height: 56px;
  background: ${colors.white};
  border-bottom: 1px solid ${colors.border};
  box-shadow: ${shadow.nav};
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
  gap: 12px;

  @media (max-width: 600px) { padding: 0 12px; gap: 6px; }
`;

const BrandArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  position: relative;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: ${colors.textSecondary};
  cursor: pointer;
  transition: ${transition.fast};

  svg { font-size: 19px !important; }
  &:hover { background: ${colors.primaryLight}; color: ${colors.primary}; border-color: rgba(79,70,229,0.14); }
  &:focus-visible { outline: 2px solid ${colors.primary}; outline-offset: 2px; }
`;

const HamburgerButton = styled(IconButton)`
  display: none;
  @media (max-width: 900px) { display: inline-flex; }
`;

const LogoLink = styled(Link)`
  display: flex;
  flex-direction: column;
  text-decoration: none;
  line-height: 1.1;
`;

const LogoText = styled.span`
  color: ${colors.primary};
  font: 700 18px ${font.family};
  letter-spacing: -0.4px;
`;

const LogoSub = styled.span`
  color: ${colors.textMuted};
  font: 600 10px ${font.family};
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const FacultySummary = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
  padding: 4px 8px 4px 4px;
  border: 1px solid ${colors.border};
  border-radius: 12px;
  background: ${colors.bgPage};
  text-decoration: none;
`;

const FacultyName = styled.span`
  max-width: 150px;
  overflow: hidden;
  color: ${colors.textPrimary};
  font: 600 12px ${font.family};
  text-overflow: ellipsis;
  white-space: nowrap;
  @media (max-width: 520px) { display: none; }
`;

const Divider = styled.div`
  width: 1px;
  height: 22px;
  margin: 0 4px;
  background: ${colors.border};
`;

const Sidebar = styled.aside`
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  z-index: 30;
  width: ${({ $collapsed }) => ($collapsed ? '72px' : '240px')};
  overflow: visible;
  background: ${colors.white};
  border-right: 1px solid ${colors.border};
  box-shadow: ${shadow.nav};
  transition: width 0.2s ease, transform 0.2s ease;

  @media (max-width: 900px) {
    width: 260px;
    transform: translateX(${({ $mobileOpen }) => ($mobileOpen ? '0' : '-110%')});
  }
`;

const SidebarNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100%;
  padding: 16px 10px 20px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const MenuSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SectionLabel = styled.div`
  padding: 0 12px;
  color: ${colors.textMuted};
  font: 700 10px ${font.family};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  padding: 0 12px;
  border-radius: 10px;
  color: ${colors.textSecondary};
  text-decoration: none;
  white-space: nowrap;
  transition: ${transition.fast};

  ${({ $active }) => $active && css`
    color: ${colors.primary};
    background: ${colors.primaryLight};
    box-shadow: inset 0 0 0 1px rgba(79,70,229,0.08);
  `}

  &:hover { color: ${colors.textPrimary}; background: ${colors.bgPage}; }
  &:focus-visible { outline: 2px solid ${colors.primary}; outline-offset: 1px; }
  svg { flex: 0 0 auto; font-size: 18px !important; }
`;

const MenuLabel = styled.span`
  overflow: hidden;
  font: 500 13px ${font.family};
  text-overflow: ellipsis;
`;

const SidebarLogout = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  margin: 0 10px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: ${colors.danger};
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
  font: 600 13px ${font.family};
  transition: ${transition.fast};

  &:hover { background: ${colors.dangerLight}; }
  &:focus-visible { outline: 2px solid ${colors.danger}; outline-offset: 2px; }
  svg { flex: 0 0 auto; font-size: 18px !important; }
`;

const CollapseButton = styled.button`
  position: absolute;
  top: 16px;
  right: -13px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid ${colors.border};
  border-radius: 50%;
  background: ${colors.white};
  color: ${colors.textSecondary};
  box-shadow: ${shadow.xs};
  cursor: pointer;
  &:hover { color: ${colors.primary}; border-color: ${colors.primaryLight}; }
  &:focus-visible { outline: 2px solid ${colors.primary}; outline-offset: 2px; }
  @media (max-width: 900px) { display: none; }
`;

const Backdrop = styled.button`
  display: none;
  @media (max-width: 900px) {
    display: ${({ $visible }) => ($visible ? 'block' : 'none')};
    position: fixed;
    inset: 56px 0 0;
    z-index: 25;
    border: 0;
    background: rgba(15,23,42,0.28);
  }
`;

const menuSections = [
  { title: 'Main', items: [{ to: '/faculty', label: 'Dashboard', icon: Dashboard }] },
  {
    title: 'Academic',
    items: [
      { to: '/faculty/subjects', label: 'My Subjects', icon: Assignment },
      { to: '/faculty/students', label: 'My Students / Directory', icon: School },
      { to: '/faculty/attendance', label: 'Attendance', icon: Group },
      { to: '/faculty/marks', label: 'Marks & Results', icon: Ballot },
      { to: '/faculty/timetable', label: 'Timetable', icon: EventAvailable },
    ],
  },
  {
    title: 'Account',
    items: [
      { to: '/faculty/profile', label: 'My Profile', icon: Person },
      { to: '/faculty/updatePassword', label: 'Change Password', icon: VpnKey },
    ],
  },
];

const FacultyNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const alert = useAlert();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const faculty = useSelector((state) => state.faculty);
  const facultyData = faculty?.faculty?.faculty || faculty?.faculty || {};

  useEffect(() => {
    document.documentElement.setAttribute('data-faculty-portal', 'true');
    return () => {
      document.documentElement.removeAttribute('data-faculty-portal');
      document.documentElement.style.removeProperty('--faculty-sidebar-width');
      document.documentElement.removeAttribute('data-faculty-collapsed');
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--faculty-sidebar-width', collapsed ? '72px' : '240px');
    document.documentElement.toggleAttribute('data-faculty-collapsed', collapsed);
  }, [collapsed]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const logout = () => {
    document.documentElement.removeAttribute('data-faculty-portal');
    document.documentElement.style.removeProperty('--faculty-sidebar-width');
    document.documentElement.removeAttribute('data-faculty-collapsed');
    dispatch(facultyLogout());
    alert.success('Logged out');
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/faculty') return location.pathname === '/faculty';
    if (path === '/faculty/profile') return location.pathname === '/faculty/profile';
    if (path === '/faculty/students') return location.pathname === '/faculty/students';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  const avatarUrl = facultyData?.avatar?.url;
  const firstLetter = facultyData?.name?.charAt(0)?.toUpperCase() || 'F';

  return (
    <>
      <Nav>
        <Inner>
          <BrandArea>
            <HamburgerButton type="button" title="Open menu" aria-label="Open menu" onClick={() => setMobileOpen((open) => !open)}>
              <Menu />
            </HamburgerButton>
            <LogoLink to="/faculty">
              <LogoText>EduTrack</LogoText>
              <LogoSub>Faculty Portal</LogoSub>
            </LogoLink>
          </BrandArea>
          <Actions>
            <FacultySummary to="/faculty/profile" title="Faculty profile">
              <Avatar $size="28px">
                {avatarUrl ? <img src={avatarUrl} alt={facultyData?.name || 'Faculty'} /> : firstLetter}
              </Avatar>
              <FacultyName>{facultyData?.name || 'Faculty'}</FacultyName>
            </FacultySummary>
            <IconButton type="button" title="Profile" aria-label="Profile" onClick={() => navigate('/faculty/profile')}>
              <AccountCircle />
            </IconButton>
            <AdminSettingsPopover />
            <Divider />
            <IconButton type="button" title="Log out" aria-label="Log out" onClick={logout}>
              <ExitToApp />
            </IconButton>
          </Actions>
        </Inner>
      </Nav>

      <Sidebar $collapsed={collapsed} $mobileOpen={mobileOpen}>
        <CollapseButton
          type="button"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((value) => !value)}
        >
          {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
        </CollapseButton>
        <SidebarNav>
          {menuSections.map((section) => (
            <MenuSection key={section.title}>
              {!collapsed && <SectionLabel>{section.title}</SectionLabel>}
              {section.items.map(({ to, label, icon: Icon }) => (
                <MenuItem
                  key={`${section.title}-${label}`}
                  to={to}
                  title={collapsed ? label : undefined}
                  $active={isActive(to)}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon />
                  {!collapsed && <MenuLabel>{label}</MenuLabel>}
                </MenuItem>
              ))}
            </MenuSection>
          ))}
          <SidebarLogout type="button" title={collapsed ? 'Log out' : undefined} onClick={logout}>
            <ExitToApp />
            {!collapsed && 'Log out'}
          </SidebarLogout>
        </SidebarNav>
      </Sidebar>
      <Backdrop $visible={mobileOpen} aria-label="Close menu" onClick={() => setMobileOpen(false)} />
    </>
  );
};

export default FacultyNavbar;
