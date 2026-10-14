import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Message, Inbox } from '@material-ui/icons';
import StudentNavbar from '../../components/StudentNavbar';
import StudentBackButton from '../../components/StudentBackButton';
import { PageShell, SectionTitle, Btn } from '../../components/UI';
import { colors, font, radius, shadow, transition } from '../../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;
  @media (max-width: 600px) { padding: 24px 16px; }
`;

const ChatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: 10px;
  box-shadow: ${shadow.card};
  transition: ${transition.fast};

  &:hover {
    box-shadow: ${shadow.cardHover};
    transform: translateY(-1px);
  }
`;

const IconWrap = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${colors.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ChatName = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: ${colors.textPrimary};
  font-family: ${font.family};
`;

const SectionLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${colors.textMuted};
  margin: 20px 0 10px;
  font-family: ${font.family};
`;

const Empty = styled.p`
  font-size: 14px;
  color: ${colors.textMuted};
  text-align: center;
  padding: 32px 0;
  font-family: ${font.family};
`;

const StudentChats = () => {
  const student = useSelector((s) => s.student);
  const newer = student.newerChats || [];
  const previous = student.previousChats || [];

  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <StudentBackButton />
        <SectionTitle>Messages</SectionTitle>

        {newer.length > 0 && <SectionLabel>New Messages</SectionLabel>}
        {newer.map((res, index) => (
          <ChatItem key={index}>
            <IconWrap>
              <Message style={{ color: colors.primary, fontSize: 20 }} />
            </IconWrap>
            <ChatName>{res.senderName}</ChatName>
            <Link to={`/chat/${res.receiverRegistrationNumber}.${res.senderRegistrationNumber}`}>
              <Btn style={{ height: 36, padding: '0 16px', fontSize: 13 }}>Open</Btn>
            </Link>
          </ChatItem>
        ))}

        {previous.length > 0 && <SectionLabel>Previous Conversations</SectionLabel>}
        {previous.map((res, index) => (
          <ChatItem key={index}>
            <IconWrap>
              <Inbox style={{ color: colors.primary, fontSize: 20 }} />
            </IconWrap>
            <ChatName>{res.receiverName}</ChatName>
            <Link to={`/chat/${res.senderRegistrationNumber}.${res.receiverRegistrationNumber}`}>
              <Btn $variant="outline" style={{ height: 36, padding: '0 16px', fontSize: 13 }}>Open</Btn>
            </Link>
          </ChatItem>
        ))}

        {newer.length === 0 && previous.length === 0 && (
          <Empty>No messages yet.</Empty>
        )}
      </Content>
    </PageShell>
  );
};

export default StudentChats;
