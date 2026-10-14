import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAlert } from 'react-alert';
import styled from 'styled-components';
import {
  AccountCircle,
  ExitToApp,
  Menu,
} from '@material-ui/icons';
import { adminLogout } from '../redux/actions/adminAction';
import { colors, font, transition } from '../styles/theme';
import AdminSettingsPopover from './AdminSettingsPopover';

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  background: ${colors.white};
  border-bottom: 1px solid ${colors.border};
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
`;

const Inner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 16px;
  height: 64px;
  gap: 16px;
`;

const BrandArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const MobileMenuButton = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid ${colors.border};
  border-radius: 10px;
  background: ${colors.white};
  color: ${colors.textSecondary};
  cursor: pointer;
  transition: ${transition.fast};

  &:hover {
    background: ${colors.primaryLight};
    color: ${colors.primary};
    border-color: rgba(79, 70, 229, 0.2);
  }

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
  font-size: 20px;
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
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const UserSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 6px 6px;
  border-radius: 12px;
  background: ${colors.bgPage};
  border: 1px solid ${colors.border};
  margin-right: 4px;
`;

const Avatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.accent});
  color: ${colors.white};
  font-size: 12px;
  font-weight: 700;
  font-family: ${font.family};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Name = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${colors.textPrimary};
  white-space: nowrap;
`;

const NavBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: ${transition.fast};
  color: ${colors.textSecondary};
  position: relative;

  svg {
    font-size: 18px !important;
  }

  &:hover {
    background: ${colors.primaryLight};
    color: ${colors.primary};
    border-color: rgba(79, 70, 229, 0.14);
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
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
    padding: 4px 8px;
    border-radius: 6px;
    z-index: 200;
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 20px;
  background: ${colors.border};
  margin: 0 4px;
`;

const AdminNavbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const alert = useAlert();
  const admin = useSelector((state) => state.admin?.admin);

  const logout = () => {
    document.documentElement.removeAttribute('data-app-theme');
    dispatch(adminLogout());
    alert.success('Logged out');
    navigate('/admin/login');
  };

  const displayName = admin?.name || 'Admin';
  const nameInitial = displayName.trim().charAt(0)?.toUpperCase() || 'A';
  const avatarUrl = admin?.avatar?.url;

  return (
    <Nav>
      <Inner>
        <BrandArea>
          <MobileMenuButton type="button" aria-label="Open sidebar" onClick={onMenuClick}>
            <Menu fontSize="small" />
          </MobileMenuButton>
          <LogoLink to="/admin">
            <LogoText>EduTrack</LogoText>
            <LogoSub>Admin Portal</LogoSub>
          </LogoLink>
        </BrandArea>

        <Actions>
          <UserSummary>
            <Avatar>
              {avatarUrl ? <img src={avatarUrl} alt="" /> : nameInitial}
            </Avatar>
            <Name>{displayName}</Name>
          </UserSummary>

          <NavBtn title="Profile" aria-label="Open Admin Profile" onClick={() => navigate('/admin/profile')}>
            <AccountCircle style={{ color: 'inherit' }} />
          </NavBtn>
          <AdminSettingsPopover />

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
