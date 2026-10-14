import styled, { keyframes, css } from 'styled-components';
import { colors, radius, shadow, transition, font } from '../styles/theme';

// ── Animations ──────────────────────────────────────────────────────────────

export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

export const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
`;

export const spinSlow = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

export const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ── Page Shell ───────────────────────────────────────────────────────────────

export const PageShell = styled.div`
  min-height: 100vh;
  background: ${colors.bgPage};
  font-family: ${font.family};
  transition: background-color 180ms ease, color 180ms ease;

  html[data-student-portal='true'] & {
    box-sizing: border-box;
    padding-top: 56px;
    padding-left: var(--student-sidebar-width, 240px);
    transition: padding-left 0.2s ease;
  }

  html[data-faculty-portal='true'] & {
    box-sizing: border-box;
    padding-top: 56px;
    padding-left: var(--faculty-sidebar-width, 240px);
    transition: padding-left 0.2s ease;
  }

  @media (max-width: 900px) {
    html[data-student-portal='true'] & {
      padding-left: 0;
    }

    html[data-faculty-portal='true'] & {
      padding-left: 0;
    }
  }
`;

export const PageContent = styled.div`
  padding: 32px 36px;
  animation: ${fadeUp} 0.28s ease both;

  @media (max-width: 900px) { padding: 24px 20px; }
  @media (max-width: 600px) { padding: 20px 16px; }
`;

// ── Card ─────────────────────────────────────────────────────────────────────

export const Card = styled.div`
  background: ${colors.bgCard};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  padding: ${({ $pad }) => $pad || '24px'};
  transition: ${transition.base};

  ${({ $hover }) => $hover && css`
    cursor: pointer;
    &:hover {
      box-shadow: ${shadow.cardHover};
      transform: translateY(-2px);
      border-color: rgba(79,70,229,0.2);
    }
  `}
`;

// ── Stat Card ─────────────────────────────────────────────────────────────────

export const StatCard = styled(Card)`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  cursor: default;
  transition: ${transition.base};

  &:hover {
    box-shadow: ${shadow.cardHover};
    transform: translateY(-3px);
    border-color: rgba(79,70,229,0.2);
  }
`;

export const StatIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $color }) => $color || colors.primaryLight};
  color: ${({ $iconColor }) => $iconColor || colors.primary};

  svg { font-size: 22px !important; }
`;

export const StatBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const StatLabel = styled.div`
  font-size: ${font.xs};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${colors.textMuted};
  margin-bottom: 4px;
`;

export const StatValue = styled.div`
  font-size: ${font['2xl']};
  font-weight: 700;
  color: ${colors.textPrimary};
  line-height: 1.2;
`;

export const StatSub = styled.div`
  font-size: ${font.xs};
  color: ${colors.textMuted};
  margin-top: 3px;
`;

// ── Form primitives ──────────────────────────────────────────────────────────

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

export const Label = styled.label`
  font-size: ${font.sm};
  font-weight: 500;
  color: ${colors.textSecondary};
  font-family: ${font.family};
`;

const inputBase = css`
  height: 42px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 14px;
  border: 1.5px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.base};
  font-family: ${font.family};
  color: ${colors.textPrimary};
  background: ${colors.white};
  outline: none;
  transition: ${transition.fast};

  &::placeholder { color: ${colors.textMuted}; }

  &:focus {
    border-color: ${colors.borderFocus};
    box-shadow: ${shadow.inputFocus};
  }

  &:disabled {
    background: ${colors.bgPage};
    color: ${colors.textMuted};
    cursor: not-allowed;
  }
`;

export const Input = styled.input`${inputBase}`;

export const Select = styled.select`
  ${inputBase}
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;

  &:hover:not(:disabled) { border-color: ${colors.textMuted}; }
`;

export const Textarea = styled.textarea`
  ${inputBase}
  height: auto;
  min-height: 90px;
  padding: 12px 14px;
  resize: vertical;
  line-height: 1.5;
`;

// ── Buttons ──────────────────────────────────────────────────────────────────

export const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: ${radius.md};
  font-size: ${font.sm};
  font-weight: 600;
  font-family: ${font.family};
  cursor: pointer;
  transition: ${transition.fast};
  white-space: nowrap;
  text-decoration: none;

  background: ${colors.primary};
  color: ${colors.white};

  &:hover {
    background: ${colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: ${shadow.btn};
  }

  &:active { transform: translateY(0); box-shadow: none; }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }

  ${({ $variant }) => $variant === 'outline' && css`
    background: transparent;
    color: ${colors.primary};
    border: 1.5px solid ${colors.primary};
    &:hover {
      background: ${colors.primaryLight};
      box-shadow: none;
    }
  `}

  ${({ $variant }) => $variant === 'ghost' && css`
    background: transparent;
    color: ${colors.textSecondary};
    &:hover {
      background: ${colors.bgPage};
      box-shadow: none;
      color: ${colors.textPrimary};
    }
  `}

  ${({ $variant }) => $variant === 'success' && css`
    background: ${colors.success};
    &:hover { background: #0da271; box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
  `}

  ${({ $variant }) => $variant === 'danger' && css`
    background: ${colors.danger};
    &:hover { background: #dc2626; box-shadow: 0 4px 14px rgba(239,68,68,0.3); }
  `}

  ${({ $variant }) => $variant === 'secondary' && css`
    background: ${colors.bgPage};
    color: ${colors.textSecondary};
    border: 1.5px solid ${colors.border};
    &:hover {
      background: ${colors.border};
      box-shadow: none;
      color: ${colors.textPrimary};
    }
  `}

  ${({ $full }) => $full && css`width: 100%;`}

  ${({ $sm }) => $sm && css`height: 34px; padding: 0 14px; font-size: ${font.xs};`}
`;

// ── Page Header ───────────────────────────────────────────────────────────────

export const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 560px) { flex-direction: column; }
`;

export const PageHeaderText = styled.div``;

export const PageTitle = styled.h1`
  font-size: ${font['2xl']};
  font-weight: 700;
  color: ${colors.textPrimary};
  font-family: ${font.family};
  margin: 0 0 4px 0;
  letter-spacing: -0.3px;
`;

export const Subtitle = styled.p`
  font-size: ${font.sm};
  color: ${colors.textMuted};
  font-family: ${font.family};
  margin: 0;
  line-height: 1.5;
`;

export const SectionTitle = styled.h2`
  font-size: ${font.lg};
  font-weight: 600;
  color: ${colors.textPrimary};
  font-family: ${font.family};
  margin: 0 0 18px 0;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: ${font.md};
    font-weight: 600;
    color: ${colors.textPrimary};
  }

  span {
    font-size: ${font.xs};
    color: ${colors.textMuted};
  }
`;

// ── Divider ──────────────────────────────────────────────────────────────────

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${colors.border};
  margin: 20px 0;
`;

// ── Spinner ──────────────────────────────────────────────────────────────────

export const SpinnerRing = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid ${colors.border};
  border-top-color: ${colors.primary};
  border-radius: 50%;
  animation: ${spinSlow} 0.65s linear infinite;
`;

export const SpinnerWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
`;

// ── Info row ─────────────────────────────────────────────────────────────────

export const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 13px 0;
  border-bottom: 1px solid ${colors.border};

  &:last-child { border-bottom: none; }
`;

export const InfoLabel = styled.span`
  font-size: ${font.xs};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: ${colors.textMuted};
  font-family: ${font.family};
`;

export const InfoValue = styled.span`
  font-size: ${font.base};
  color: ${colors.textPrimary};
  font-family: ${font.family};
  font-weight: 400;
`;

// ── Avatar ────────────────────────────────────────────────────────────────────

export const Avatar = styled.div`
  width: ${({ $size }) => $size || '72px'};
  height: ${({ $size }) => $size || '72px'};
  border-radius: 50%;
  background: linear-gradient(135deg, ${colors.primary}, ${colors.accent});
  border: 2.5px solid ${colors.white};
  box-shadow: 0 0 0 2px ${colors.border}, 0 3px 10px rgba(15,23,42,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $size }) => $size ? `calc(${$size} * 0.38)` : '26px'};
  font-weight: 700;
  color: ${colors.white};
  font-family: ${font.family};
  text-transform: uppercase;
  overflow: hidden;
  flex-shrink: 0;
  transition: ${transition.fast};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// ── Status Badge ──────────────────────────────────────────────────────────────

export const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: ${radius.full};
  font-size: ${font.xs};
  font-weight: 600;
  letter-spacing: 0.03em;
  white-space: nowrap;

  ${({ $variant }) => {
    switch ($variant) {
      case 'success': return css`background: ${colors.successLight}; color: var(--success-text, #065F46);`;
      case 'warning': return css`background: ${colors.warningLight}; color: var(--warning-text, #92400E);`;
      case 'danger':  return css`background: ${colors.dangerLight}; color: var(--danger-text, #991B1B);`;
      case 'info':    return css`background: ${colors.secondaryLight}; color: var(--info-text, #0E7490);`;
      case 'accent':  return css`background: ${colors.accentLight}; color: var(--accent-text, #5B21B6);`;
      default:        return css`background: ${colors.bgPage}; color: ${colors.textSecondary};`;
    }
  }}
`;

// ── Notification Badge ────────────────────────────────────────────────────────

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: ${radius.full};
  background: ${colors.danger};
  color: white;
  font-size: 10px;
  font-weight: 700;
  font-family: ${font.family};
`;

// ── Table ─────────────────────────────────────────────────────────────────────

export const TableWrap = styled.div`
  background: ${colors.white};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  overflow-x: auto;
  animation: ${fadeUp} 0.25s ease both;

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  th, td {
    padding: 12px 16px;
    border-bottom: 1px solid ${colors.border};
    font-size: ${font.sm};
    white-space: nowrap;
  }

  th {
    color: ${colors.textMuted};
    background: var(--table-header, #F8FAFC);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td { color: ${colors.textSecondary}; }

  tbody tr {
    transition: ${transition.fast};
    &:hover { background: var(--table-hover, #F4F5FF); }
    &:last-child td { border-bottom: 0; }
  }

  td strong { color: ${colors.textPrimary}; font-weight: 600; }
`;

// ── Empty State ───────────────────────────────────────────────────────────────

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  text-align: center;
  color: ${colors.textMuted};
  gap: 10px;

  svg { font-size: 40px !important; opacity: 0.4; }

  h4 {
    font-size: ${font.md};
    font-weight: 600;
    color: ${colors.textSecondary};
    margin: 0;
  }

  p {
    font-size: ${font.sm};
    margin: 0;
    max-width: 280px;
    line-height: 1.5;
  }
`;

// ── Skeleton ──────────────────────────────────────────────────────────────────

export const Skeleton = styled.div`
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s ease infinite;
  border-radius: ${({ $round }) => $round ? radius.full : radius.md};
  height: ${({ $h }) => $h || '16px'};
  width: ${({ $w }) => $w || '100%'};

  html[data-app-theme='dark'] & {
    background: linear-gradient(90deg, #1f2937 25%, #334155 50%, #1f2937 75%);
    background-size: 200% 100%;
  }
`;

// ── Alert Banner ──────────────────────────────────────────────────────────────

export const AlertBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: ${radius.md};
  font-size: ${font.sm};
  line-height: 1.5;
  margin-bottom: 20px;

  svg { flex-shrink: 0; font-size: 18px !important; margin-top: 1px; }

  ${({ $variant }) => {
    switch ($variant) {
      case 'success': return css`background: ${colors.successLight}; color: #065F46; border: 1px solid #A7F3D0;`;
      case 'warning': return css`background: ${colors.warningLight}; color: #92400E; border: 1px solid #FDE68A;`;
      case 'danger':  return css`background: ${colors.dangerLight}; color: #991B1B; border: 1px solid #FECACA;`;
      default:        return css`background: ${colors.primaryLight}; color: ${colors.primaryDark}; border: 1px solid #C7D2FE;`;
    }
  }}
`;

// ── Tabs ──────────────────────────────────────────────────────────────────────

export const TabBar = styled.div`
  display: flex;
  gap: 2px;
  border-bottom: 2px solid ${colors.border};
  margin-bottom: 24px;
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

export const Tab = styled.button`
  flex: 0 0 auto;
  padding: 10px 18px;
  border: 0;
  border-bottom: 2px solid ${({ $active }) => ($active ? colors.primary : 'transparent')};
  margin-bottom: -2px;
  background: transparent;
  color: ${({ $active }) => ($active ? colors.primary : colors.textSecondary)};
  font: 500 ${font.sm} ${font.family};
  cursor: pointer;
  transition: ${transition.fast};
  white-space: nowrap;

  &:hover {
    color: ${colors.primary};
    background: ${colors.primaryLight};
    border-radius: ${radius.sm} ${radius.sm} 0 0;
  }
`;

// ── Search Bar ────────────────────────────────────────────────────────────────

export const SearchWrap = styled.div`
  position: relative;
  flex: 1;

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${colors.textMuted};
    font-size: 18px !important;
    pointer-events: none;
  }

  input {
    padding-left: 40px;
  }
`;

// ── Filter Bar ────────────────────────────────────────────────────────────────

export const FilterBar = styled(Card)`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  padding: 16px 20px;
  margin-bottom: 20px;
`;

// ── Role Badge ────────────────────────────────────────────────────────────────

export const RoleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: ${radius.full};
  font-size: ${font.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  background: ${colors.primaryLight};
  color: ${colors.primary};
`;

// ── Profile Card ──────────────────────────────────────────────────────────────

export const ProfileCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
  padding: 28px 20px;
  transition: ${transition.base};

  &:hover {
    box-shadow: ${shadow.cardHover};
    transform: translateY(-3px);
  }
`;

export const ProfileName = styled.h2`
  font-size: ${font.lg};
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0;
`;

export const ProfileReg = styled.span`
  font-size: ${font.xs};
  color: ${colors.textMuted};
  font-family: 'Courier New', monospace;
  background: ${colors.bgPage};
  padding: 3px 10px;
  border-radius: ${radius.full};
  border: 1px solid ${colors.border};
`;

// ── Action Link (table) ───────────────────────────────────────────────────────

export const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.sm};
  color: ${colors.textSecondary};
  background: ${colors.white};
  font: 500 ${font.xs} ${font.family};
  text-decoration: none;
  cursor: pointer;
  transition: ${transition.fast};

  svg { font-size: 15px !important; }

  &:hover {
    color: ${colors.primary};
    border-color: ${colors.primary};
    background: ${colors.primaryLight};
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;
