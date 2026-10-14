import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useAlert } from 'react-alert';
import styled, { css } from 'styled-components';
import {
  Dashboard,
  School,
  People,
  Person,
  LibraryBooks,
  EventAvailable,
  Assessment,
  AccountBalanceWallet,
  BarChart,
  AccountCircle,
  ExitToApp,
  ChevronLeft,
  ChevronRight,
} from '@material-ui/icons';
import { adminLogout } from '../redux/actions/adminAction';
import { colors, font, shadow, transition, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED } from '../styles/theme';

const menuSections = [
  {
    label: 'Main',
    items: [
      { to: '/admin', label: 'Dashboard', icon: Dashboard },
    ],
  },
  {
    label: 'Academic Management',
    items: [
      { to: '/admin/academic', label: 'Academic Management', icon: School },
      { to: '/admin/students', label: 'Students', icon: People },
      { to: '/admin/faculty', label: 'Faculty', icon: Person },
      { to: '/admin/subjects', label: 'Subjects', icon: LibraryBooks },
      { to: '/admin/attendance', label: 'Attendance', icon: EventAvailable },
      { to: '/admin/results', label: 'Marks & Results', icon: Assessment },
      { to: '/admin/timetable', label: 'Timetable', icon: EventAvailable },
    ],
  },
  {
    label: 'Directories',
    items: [
      { to: '/admin/students', label: 'Student Directory', icon: People },
      { to: '/admin/faculty', label: 'Faculty Directory', icon: Person },
      { to: '/admin/subjects', label: 'Subject Directory', icon: LibraryBooks },
    ],
  },
  {
    label: 'Optional Modules',
    items: [
      { to: '/admin/fees', label: 'Fees', icon: AccountBalanceWallet },
      { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/admin/profile', label: 'Profile', icon: AccountCircle },
    ],
  },
];

const SidebarShell = styled.aside`
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: ${({ $collapsed }) => ($collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH)};
  background: ${colors.white};
  border-right: 1px solid ${colors.border};
  box-shadow: ${shadow.nav};
  z-index: 20;
  transition: width 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 900px) {
    width: 260px;
    transform: translateX(${({ $open }) => ($open ? '0' : '-110%')});
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
    transition: transform 0.2s ease;
    top: 64px;
  }
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 16px 10px 20px;
  overflow-y: auto;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SectionTitle = styled.div`
  padding: 0 12px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${colors.textMuted};
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
  transition: ${transition.fast};
  position: relative;
  white-space: nowrap;

  ${({ $active }) => $active && css`
    background: ${colors.primaryLight};
    color: ${colors.primary};
    box-shadow: inset 0 0 0 1px rgba(79,70,229,0.08);
  `}

  &:hover {
    background: ${colors.bgPage};
    color: ${colors.textPrimary};
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 1px;
  }

  svg {
    flex-shrink: 0;
    font-size: 18px !important;
  }
`;

const Label = styled.span`
  font-size: 13px;
  font-weight: 500;
  font-family: ${font.family};
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ToggleButton = styled.button`
  position: absolute;
  right: -13px;
  top: 18px;
  width: 26px;
  height: 26px;
  border: 1px solid ${colors.border};
  border-radius: 50%;
  background: ${colors.white};
  color: ${colors.textSecondary};
  box-shadow: ${shadow.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;

  &:hover {
    color: ${colors.primary};
    border-color: rgba(79, 70, 229, 0.2);
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

const SidebarFooter = styled.button`
  margin: 6px 10px 0;
  border: 0;
  background: transparent;
  color: ${colors.danger};
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  font-family: ${font.family};
  transition: ${transition.fast};

  &:hover {
    background: ${colors.dangerLight};
  }

  &:focus-visible {
    outline: 2px solid ${colors.danger};
    outline-offset: 2px;
  }
`;

const AdminSidebar = ({ collapsed, mobileOpen, onClose, onToggleCollapse }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alert = useAlert();

  const handleLogout = () => {
    dispatch(adminLogout());
    alert.success('Logged out');
    navigate('/admin/login');
    if (onClose) onClose();
  };

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {typeof onToggleCollapse === 'function' && (
        <ToggleButton type="button" onClick={onToggleCollapse} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
        </ToggleButton>
      )}
      <SidebarShell $collapsed={collapsed} $open={mobileOpen}>
        <Nav>
          {menuSections.map((section) => (
            <Section key={section.label}>
              {!collapsed && <SectionTitle>{section.label}</SectionTitle>}
              {section.items.map(({ to, label, icon: Icon }) => (
                <MenuItem key={label} to={to} $active={isActive(to)} title={collapsed ? label : undefined} onClick={onClose}>
                  <Icon fontSize="small" />
                  {!collapsed && <Label>{label}</Label>}
                </MenuItem>
              ))}
            </Section>
          ))}
          <SidebarFooter type="button" onClick={handleLogout} title={collapsed ? 'Logout' : undefined}>
            <ExitToApp fontSize="small" />
            {!collapsed && 'Logout'}
          </SidebarFooter>
        </Nav>
      </SidebarShell>
    </>
  );
};

export default AdminSidebar;
