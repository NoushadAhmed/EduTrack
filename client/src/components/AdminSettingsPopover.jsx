import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { Settings, WbSunny, Brightness2, Check } from '@material-ui/icons';
import { colors, font, radius, shadow, transition } from '../styles/theme';

const THEME_KEY = 'edutrack-theme';

const Root = styled.div`
  position: relative;
`;

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid ${({ $open }) => ($open ? 'rgba(79, 70, 229, 0.2)' : 'transparent')};
  border-radius: 10px;
  background: ${({ $open }) => ($open ? colors.primaryLight : 'transparent')};
  color: ${({ $open }) => ($open ? colors.primary : colors.textSecondary)};
  cursor: pointer;
  transition: ${transition.fast};

  svg { font-size: 18px !important; }

  &:hover {
    background: ${colors.primaryLight};
    color: ${colors.primary};
    border-color: rgba(79, 70, 229, 0.14);
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }
`;

const Popover = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  z-index: 300;
  width: 264px;
  padding: 16px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  background: ${colors.white};
  color: ${colors.textPrimary};
  box-shadow: ${shadow.modal};
  animation: settingsPopoverIn 0.14s ease-out;

  @keyframes settingsPopoverIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 420px) {
    position: fixed;
    top: 58px;
    right: 10px;
    width: min(264px, calc(100vw - 20px));
  }
`;

const Heading = styled.h2`
  margin: 0 0 14px;
  font: 700 14px ${font.family};
  color: ${colors.textPrimary};
`;

const Label = styled.div`
  margin-bottom: 8px;
  color: ${colors.textSecondary};
  font: 600 11px ${font.family};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const ThemeChoices = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ThemeOption = styled.button`
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 8px;
  border: 1px solid ${({ $selected }) => ($selected ? colors.primary : colors.border)};
  border-radius: ${radius.md};
  background: ${({ $selected }) => ($selected ? colors.primaryLight : colors.white)};
  color: ${({ $selected }) => ($selected ? colors.primary : colors.textSecondary)};
  font: 600 12px ${font.family};
  cursor: pointer;
  transition: ${transition.fast};

  &:hover {
    border-color: ${colors.primary};
    color: ${colors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }

  svg { font-size: 16px; }
`;

const AdminSettingsPopover = () => {
  const location = useLocation();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => (
    window.localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  ));

  useEffect(() => {
    document.documentElement.setAttribute('data-app-theme', theme);
  }, [theme]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const changeTheme = (nextTheme) => {
    window.localStorage.setItem(THEME_KEY, nextTheme);
    setTheme(nextTheme);
  };

  return (
    <Root ref={rootRef}>
      <Trigger
        type="button"
        title="Settings"
        aria-label="Settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="admin-settings-popover"
        $open={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <Settings />
      </Trigger>
      {open && (
        <Popover id="admin-settings-popover" role="dialog" aria-label="Admin settings">
          <Heading>Settings</Heading>
          <Label>Appearance</Label>
          <ThemeChoices role="group" aria-label="Appearance">
            <ThemeOption
              type="button"
              $selected={theme === 'light'}
              aria-pressed={theme === 'light'}
              onClick={() => changeTheme('light')}
            >
              <WbSunny /> Light
              {theme === 'light' && <Check />}
            </ThemeOption>
            <ThemeOption
              type="button"
              $selected={theme === 'dark'}
              aria-pressed={theme === 'dark'}
              onClick={() => changeTheme('dark')}
            >
              <Brightness2 /> Dark
              {theme === 'dark' && <Check />}
            </ThemeOption>
          </ThemeChoices>
        </Popover>
      )}
    </Root>
  );
};

export default AdminSettingsPopover;
