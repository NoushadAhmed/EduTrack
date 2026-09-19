import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAlert } from 'react-alert';
import styled from 'styled-components';
import {
  Person, Dashboard, Ballot, VpnKey,
  ExitToApp, Group, Chat, Search,
} from '@material-ui/icons';
import { studentLogout, newerChats, previousChats } from '../redux/actions/studentAction';
import { colors, font, shadow, transition } from '../styles/theme';
import { Avatar, Badge } from './UI';

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

const ChatWrap = styled.div`
  position: relative;
  display: flex;
`;

const BadgeWrap = styled.span`
  position: absolute;
  top: 2px;
  right: 2px;
`;

const NavDivider = styled.div`
  width: 1px;
  height: 22px;
  background: ${colors.border};
  margin: 0 4px;
`;

const StudentNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const alert = useAlert();
  const student = useSelector((s) => s.student);
  const studentData = student?.student?.student;

  useEffect(() => {
    if (studentData?.name) {
      dispatch(newerChats(studentData.name));
      dispatch(previousChats(studentData.name));
    }
  }, [studentData?.name, dispatch]);

  const logout = () => {
    dispatch(studentLogout());
    navigate('/');
    alert.success('Logged out');
  };

  const avatarUrl = studentData?.avatar?.url;
  const firstLetter = studentData?.name ? studentData.name.charAt(0) : 'S';
  const chatCount = student?.newerChats?.length || 0;

  return (
    <Nav>
      <Inner>
        <LogoLink to="/home">
          <LogoText>EduTrack</LogoText>
          <LogoSub>Student Portal</LogoSub>
        </LogoLink>

        <Actions>
          <NavBtn title="Profile" onClick={() => navigate('/home')}>
            <Avatar $size="28px" style={{ cursor: 'pointer' }}>
              {avatarUrl ? <img src={avatarUrl} alt={firstLetter} /> : firstLetter}
            </Avatar>
          </NavBtn>

          <NavBtn title="Update Profile" onClick={() => navigate('/student/update')}>
            <Person style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Performance" onClick={() => navigate('/student/performance')}>
            <Dashboard style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Subjects" onClick={() => navigate('/student/subjects')}>
            <Ballot style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Attendance" onClick={() => navigate('/student/attendance')}>
            <Group style={{ color: 'inherit' }} />
          </NavBtn>
          <NavBtn title="Search Students" onClick={() => navigate('/student/search')}>
            <Search style={{ color: 'inherit' }} />
          </NavBtn>

          <ChatWrap>
            <NavBtn title="Messages" onClick={() => navigate('/student/chatList')}>
              <Chat style={{ color: 'inherit' }} />
            </NavBtn>
            {chatCount > 0 && (
              <BadgeWrap>
                <Badge>{chatCount}</Badge>
              </BadgeWrap>
            )}
          </ChatWrap>

          <NavBtn title="Change Password" onClick={() => navigate('/student/updatePassword')}>
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

export default StudentNavbar;
