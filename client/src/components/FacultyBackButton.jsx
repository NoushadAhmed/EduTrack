import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowBack } from '@material-ui/icons';
import { colors, font, radius, transition } from '../styles/theme';

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 13px;
  margin-bottom: 22px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.white};
  color: ${colors.textSecondary};
  font: 600 13px ${font.family};
  text-decoration: none;
  transition: ${transition.fast};

  svg { font-size: 18px; }
  &:hover { color: ${colors.primary}; border-color: rgba(79,70,229,0.28); background: ${colors.primaryLight}; }
  &:focus-visible { outline: 2px solid ${colors.primary}; outline-offset: 2px; }
`;

const FacultyBackButton = () => (
  <BackLink to="/faculty">
    <ArrowBack />
    Back to Dashboard
  </BackLink>
);

export default FacultyBackButton;
