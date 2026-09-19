import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import StudentNavbar from '../components/StudentNavbar';
import { Avatar, InfoRow, InfoLabel, InfoValue, Btn, PageShell, SectionTitle } from '../components/UI';
import { getStudentByRegNum } from '../redux/actions/studentAction';
import { colors, font, radius, shadow, transition } from '../styles/theme';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const Content = styled.div`
  max-width: 700px;
  margin: 0 auto;
  padding: 40px 24px;
  animation: ${fadeUp} 0.3s ease both;
  @media (max-width: 600px) { padding: 24px 16px; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const ProfileCard = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  transition: ${transition.base};
  &:hover { box-shadow: ${shadow.cardHover}; transform: translateY(-2px); }
`;

const Name = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${colors.textPrimary};
  font-family: ${font.family};
`;

const RegNum = styled.span`
  font-size: 12px;
  color: ${colors.textMuted};
  font-family: 'Courier New', monospace;
  background: ${colors.bgPage};
  padding: 3px 10px;
  border-radius: ${radius.full};
  border: 1px solid ${colors.border};
`;

const InfoCard = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  padding: 24px;
`;

const StudentDetails = () => {
  const student = useSelector((s) => s.student);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const [registrationNumber, setRegistrationNumber] = useState('');

  useEffect(() => {
    setRegistrationNumber(params.registrationNumber);
    dispatch(getStudentByRegNum(registrationNumber));
  }, [registrationNumber]);

  if (!student.isAuthenticated || registrationNumber === student?.student?.student?.registrationNumber) {
    navigate('/');
    return null;
  }

  const peer = student.regNumStudent;
  const avatarUrl = peer?.avatar?.url;
  const firstLetter = peer?.name ? peer.name.charAt(0) : 'S';

  return (
    <PageShell>
      <StudentNavbar />
      <Content>
        <SectionTitle>Student Profile</SectionTitle>
        <Grid>
          <ProfileCard>
            <Avatar $size="72px">
              {avatarUrl ? <img src={avatarUrl} alt={firstLetter} /> : firstLetter}
            </Avatar>
            <Name>{peer?.name}</Name>
            <RegNum>{registrationNumber}</RegNum>
            <Btn
              $full
              as={Link}
              to={`/chat/${student.student.student.registrationNumber}.${registrationNumber}`}
              style={{ marginTop: 8 }}
            >
              Send Message
            </Btn>
          </ProfileCard>

          <InfoCard>
            <InfoRow>
              <InfoLabel>Email</InfoLabel>
              <InfoValue>{peer?.email}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Department</InfoLabel>
              <InfoValue>{peer?.department}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Year</InfoLabel>
              <InfoValue>{peer?.year}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Section</InfoLabel>
              <InfoValue>{peer?.section}</InfoValue>
            </InfoRow>
          </InfoCard>
        </Grid>
      </Content>
    </PageShell>
  );
};

export default StudentDetails;
