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

export const floatY = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
`;

export const spinSlow = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

// ── Page Shell ───────────────────────────────────────────────────────────────

export const PageShell = styled.div`
  min-height: 100vh;
  background: ${colors.bgPage};
  font-family: ${font.family};
`;

export const PageContent = styled.div`
  padding: 32px 40px;
  animation: ${fadeUp} 0.3s ease both;

  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`;

// ── Card ─────────────────────────────────────────────────────────────────────

export const Card = styled.div`
  background: ${colors.bgCard};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.card};
  padding: ${({ $pad }) => $pad || '28px'};
  transition: ${transition.base};

  ${({ $hover }) => $hover && css`
    &:hover {
      box-shadow: ${shadow.cardHover};
      transform: translateY(-2px);
    }
  `}
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
  height: 44px;
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

  &::placeholder {
    color: ${colors.textMuted};
  }

  &:focus {
    border-color: ${colors.borderFocus};
    box-shadow: ${shadow.inputFocus};
  }
`;

export const Input = styled.input`${inputBase}`;

export const Select = styled.select`
  ${inputBase}
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a96a8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 36px;
`;

export const Textarea = styled.textarea`
  ${inputBase}
  height: auto;
  min-height: 80px;
  padding: 12px 14px;
  resize: vertical;
  line-height: 1.5;
`;

// ── Buttons ──────────────────────────────────────────────────────────────────

export const Btn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  padding: 0 22px;
  border: none;
  border-radius: ${radius.md};
  font-size: ${font.base};
  font-weight: 500;
  font-family: ${font.family};
  cursor: pointer;
  transition: ${transition.fast};
  white-space: nowrap;

  background: ${colors.primary};
  color: ${colors.white};

  &:hover {
    background: ${colors.primaryHover};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(26,111,181,0.25);
  }

  &:active {
    transform: translateY(0);
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

  ${({ $full }) => $full && css`width: 100%;`}
`;

// ── Section heading ──────────────────────────────────────────────────────────

export const SectionTitle = styled.h2`
  font-size: ${font.xl};
  font-weight: 600;
  color: ${colors.textPrimary};
  font-family: ${font.family};
  margin: 0 0 20px 0;
`;

export const PageTitle = styled.h1`
  font-size: ${font['2xl']};
  font-weight: 700;
  color: ${colors.textPrimary};
  font-family: ${font.family};
  margin: 0 0 4px 0;
`;

export const Subtitle = styled.p`
  font-size: ${font.base};
  color: ${colors.textMuted};
  font-family: ${font.family};
  margin: 0 0 28px 0;
`;

// ── Divider ──────────────────────────────────────────────────────────────────

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${colors.border};
  margin: 20px 0;
`;

// ── Spinner ──────────────────────────────────────────────────────────────────

export const SpinnerRing = styled.div`
  width: 36px;
  height: 36px;
  border: 3px solid ${colors.border};
  border-top-color: ${colors.primary};
  border-radius: 50%;
  animation: ${spinSlow} 0.7s linear infinite;
`;

export const SpinnerWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
`;

// ── Info row (profile detail) ─────────────────────────────────────────────────

export const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 0;
  border-bottom: 1px solid ${colors.border};

  &:last-child { border-bottom: none; }
`;

export const InfoLabel = styled.span`
  font-size: ${font.xs};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${colors.textMuted};
  font-family: ${font.family};
`;

export const InfoValue = styled.span`
  font-size: ${font.md};
  color: ${colors.textPrimary};
  font-family: ${font.family};
  font-weight: 400;
`;

// ── Avatar ────────────────────────────────────────────────────────────────────

export const Avatar = styled.div`
  width: ${({ $size }) => $size || '72px'};
  height: ${({ $size }) => $size || '72px'};
  border-radius: 50%;
  background: ${colors.primaryLight};
  border: 2px solid ${colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $size }) => $size ? `calc(${$size} * 0.38)` : '26px'};
  font-weight: 600;
  color: ${colors.primary};
  font-family: ${font.family};
  text-transform: uppercase;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// ── Badge ─────────────────────────────────────────────────────────────────────

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
  font-weight: 600;
  font-family: ${font.family};
`;
