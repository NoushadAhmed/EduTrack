import React from 'react';
import styled from 'styled-components';
import { format } from 'timeago.js';
import { colors, font, radius } from '../styles/theme';

const Row = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  align-items: ${({ $own }) => $own ? 'flex-end' : 'flex-start'};
`;

const Bubble = styled.p`
  max-width: 72%;
  padding: 10px 14px;
  border-radius: ${({ $own }) => $own ? '14px 14px 4px 14px' : '14px 14px 14px 4px'};
  background: ${({ $own }) => $own ? colors.primary : colors.bgPage};
  color: ${({ $own }) => $own ? 'white' : colors.textPrimary};
  font-size: 14px;
  font-family: ${font.family};
  line-height: 1.5;
  border: ${({ $own }) => $own ? 'none' : `1px solid ${colors.border}`};
  word-break: break-word;
`;

const Time = styled.span`
  font-size: 11px;
  color: ${colors.textMuted};
  margin-top: 4px;
  font-family: ${font.family};
`;

export default function Message({ message, own }) {
  return (
    <Row $own={own}>
      <Bubble $own={own}>{message.message}</Bubble>
      <Time>{format(message.createdAt)}</Time>
    </Row>
  );
}
