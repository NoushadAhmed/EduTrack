import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAlert } from 'react-alert';
import styled, { css } from 'styled-components';
import {
  AccountCircle,
  Assessment,
  Assignment,
  Chat,
  ChevronLeft,
  ChevronRight,
  Dashboard,
  EventAvailable,
  AccountBalanceWallet,
  ExitToApp,
  Group,
  Menu,
  Notifications,
  Person,
  Search,
  VpnKey,
} from '@material-ui/icons';
import { studentLogout, newerChats, previousChats } from '../redux/actions/studentAction';
import { colors, font, shadow, transition } from '../styles/theme';
import { Avatar, Badge } from './UI';
import AdminSettingsPopover from './AdminSettingsPopover';

const Nav = styled.nav`
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 100;
  height: 56px;
  background: ${colors.white};
  border-bottom: 1px solid ${colors.border};
  box-shadow: ${shadow.nav};
  transition: left 0.2s ease, background 0.2s ease;

`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
  gap: 12px;

  @media (max-width: 600px) {
    padding: 0 12px;
    gap: 6px;
  }
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
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: ${colors.textSecondary};
  cursor: pointer;
  transition: ${transition.fast};
  position: relative;

  svg { font-size: 19px !important; }

  &:hover {
    background: ${colors.primaryLight};
    color: ${colors.primary};
    border-color: rgba(79, 70, 229, 0.14);
  }

  &[title]:hover::after {
    content: attr(title);
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: ${colors.textPrimary};
    color: ${colors.white};
    font: 11px ${font.family};
    white-space: nowrap;
    padding: 4px 8px;
    border-radius: 6px;
    z-index: 200;
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }

  @media (max-width: 420px) {
    width: 32px;
    height: 32px;
  }
`;

const HamburgerButton = styled(IconButton)`
  display: none;

  @media (max-width: 900px) {
    display: inline-flex;
  }
`;

const LogoLink = styled(Link)`
  display: flex;
  flex-direction: column;
  text-decoration: none;
  line-height: 1.1;
`;

const LogoText = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: ${colors.primary};
  font-family: ${font.family};
  letter-spacing: -0.4px;
`;

const LogoSub = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: ${colors.textMuted};
  font-family: ${font.family};
  letter-spacing: 0.07em;
  text-transform: uppercase;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  @media (max-width: 420px) {
    gap: 0;
  }
`;

const StudentSummary = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 4px;
  padding: 4px 8px 4px 4px;
  border-radius: 12px;
  border: 1px solid ${colors.border};
  background: ${colors.bgPage};
  text-decoration: none;
`;

const StudentName = styled.span`
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${colors.textPrimary};
  font: 600 12px ${font.family};

  @media (max-width: 520px) {
    display: none;
  }
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
    box-shadow: inset 0 0 0 1px rgba(79, 70, 229, 0.08);
  `}

  &:hover {
    color: ${colors.textPrimary};
    background: ${colors.bgPage};
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 1px;
  }

  svg { flex: 0 0 auto; font-size: 18px !important; }
`;

const MenuLabel = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  font: 500 13px ${font.family};
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
    background: rgba(15, 23, 42, 0.28);
  }
`;

const menuSections = [
  {
    title: 'Main',
    items: [{ to: '/home', label: 'Dashboard', icon: Dashboard }],
  },
  {
    title: 'Academics',
    items: [
      { to: '/student/subjects', label: 'Subjects', icon: Assignment },
      { to: '/student/attendance', label: 'Attendance', icon: Group },
      { to: '/student/performance', label: 'Marks & Results', icon: Assessment },
      { to: '/student/timetable', label: 'Timetable', icon: EventAvailable },
      { to: '/student/fees', label: 'Fees & Receipts', icon: AccountBalanceWallet },
    ],
  },
  {
    title: 'Student',
    items: [
      { to: '/student/update', label: 'Edit Profile', icon: Person },
      { to: '/student/search', label: 'Search Students', icon: Search },
      { to: '/student/chatList', label: 'Messages', icon: Chat },
    ],
  },
  {
    title: 'Account',
    items: [{ to: '/student/updatePassword', label: 'Change Password', icon: VpnKey }],
  },
];

const StudentNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const alert = useAlert();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const student = useSelector((state) => state.student);
  const studentData = student?.student?.student || {};
  const chatCount = student?.newerChats?.length || 0;

  useEffect(() => {
    document.documentElement.setAttribute('data-student-portal', 'true');
    return () => {
      document.documentElement.removeAttribute('data-student-portal');
      document.documentElement.style.removeProperty('--student-sidebar-width');
      document.documentElement.removeAttribute('data-student-collapsed');
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--student-sidebar-width',
      collapsed ? '72px' : '240px'
    );
    document.documentElement.toggleAttribute('data-student-collapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (studentData?.name) {
      dispatch(newerChats(studentData.name));
      dispatch(previousChats(studentData.name));
    }
  }, [studentData?.name, dispatch]);

  const logout = () => {
    document.documentElement.removeAttribute('data-student-portal');
    document.documentElement.removeAttribute('data-app-theme');
    document.documentElement.style.removeProperty('--student-sidebar-width');
    document.documentElement.removeAttribute('data-student-collapsed');
    dispatch(studentLogout());
    navigate('/');
    alert.success('Logged out');
  };

  const avatarUrl = studentData?.avatar?.url;
  const firstLetter = studentData?.name ? studentData.name.charAt(0).toUpperCase() : 'S';
  const isActive = (path) => path === '/home'
    ? location.pathname === '/home'
    : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      <Nav>
        <Inner>
          <BrandArea>
            <HamburgerButton
              type="button"
              title="Open menu"
              aria-label="Open menu"
              onClick={() => setMobileOpen((open) => !open)}
            >
              <Menu />
            </HamburgerButton>
            <LogoLink to="/home">
              <LogoText>EduTrack</LogoText>
              <LogoSub>Student Portal</LogoSub>
            </LogoLink>
          </BrandArea>
          <Actions>
            <StudentSummary to="/home" title="Student profile">
              <Avatar $size="28px">
                {avatarUrl ? <img src={avatarUrl} alt={studentData?.name || 'Student'} /> : firstLetter}
              </Avatar>
              <StudentName>{studentData?.name || 'Student'}</StudentName>
            </StudentSummary>
            <IconButton type="button" title="Profile" aria-label="Profile" onClick={() => navigate('/home')}>
              <AccountCircle />
            </IconButton>
            <IconButton type="button" title="Notifications and messages" aria-label="Notifications and messages" onClick={() => navigate('/student/chatList')}>
              <Notifications />
              {chatCount > 0 && <Badge style={{ position: 'absolute', top: 0, right: 0 }}>{chatCount}</Badge>}
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
                  key={to}
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

export default StudentNavbar;
