import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { colors, font, radius, shadow, transition } from '../styles/theme';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ViewControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid ${colors.border};
  @media (max-width: 540px) { align-items: stretch; flex-direction: column; }
`;

const ToggleGroup = styled.div`
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  background: ${colors.bgPage};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
`;

const Toggle = styled.button`
  border: 0;
  border-radius: ${radius.sm};
  padding: 8px 12px;
  color: ${({ $active }) => ($active ? colors.primary : colors.textSecondary)};
  background: ${({ $active }) => ($active ? colors.white : 'transparent')};
  box-shadow: ${({ $active }) => ($active ? shadow.card : 'none')};
  font-family: ${font.family};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
`;

const DaySelect = styled.select`
  height: 38px;
  padding: 0 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.white};
  color: ${colors.textPrimary};
  font: 13px ${font.family};
`;

const ScrollArea = styled.div`
  width: 100%;
  overflow-x: auto;
  table { width: 100%; min-width: 860px; border-collapse: collapse; table-layout: fixed; }
  th, td { padding: 10px; border-right: 1px solid ${colors.border}; border-bottom: 1px solid ${colors.border}; vertical-align: top; }
  th:last-child, td:last-child { border-right: 0; }
  th { height: 40px; color: ${colors.textSecondary}; background: #f8fafc; font-size: 11px; font-weight: 650; text-align: left; }
  td { min-height: 74px; }
  th:first-child { width: 142px; }
`;

const PeriodLabel = styled.div`
  padding: 4px 2px;
  color: ${colors.textSecondary};
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
`;

const EntryCard = styled.button`
  display: block;
  width: 100%;
  margin: 0 0 7px;
  padding: 10px;
  border: 1px solid #cfe1f1;
  border-left: 3px solid ${colors.primary};
  border-radius: ${radius.sm};
  background: #f3f8fc;
  text-align: left;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  font-family: ${font.family};
  transition: ${transition.fast};
  &:hover { background: ${({ $clickable }) => ($clickable ? colors.primaryLight : '#f3f8fc')}; }
  strong { display: block; color: ${colors.textPrimary}; font-size: 12px; }
  span { display: block; margin-top: 4px; color: ${colors.textSecondary}; font-size: 11px; line-height: 1.4; }
`;

const Empty = styled.div`
  padding: 40px 20px;
  color: ${colors.textSecondary};
  text-align: center;
  font-size: 14px;
`;

const formatTime = (time) => {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return time || 'Time unavailable';
  const [hour, minute] = time.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
};

const TimetableGrid = ({ entries = [], onSelectEntry, periodSlots = [] }) => {
  const [mode, setMode] = useState('week');
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(DAYS.includes(today) ? today : 'Monday');
  const visibleDays = mode === 'week' ? DAYS : [selectedDay];
  const periods = useMemo(() => {
    if (Array.isArray(periodSlots) && periodSlots.length) {
      return [...periodSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    const unique = new Map();
    entries.forEach((entry) => {
      if (entry?.startTime && entry?.endTime) {
        unique.set(`${entry.startTime}-${entry.endTime}`, {
          startTime: entry.startTime,
          endTime: entry.endTime,
        });
      }
    });
    return [...unique.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [entries, periodSlots]);

  const matchesDay = (entry, day) => day === 'Saturday'
    ? entry?.day === 'Saturday' || entry?.day === 'Saturday (2nd)' || entry?.day === 'Saturday (4th)'
    : entry?.day === day;
  const cellEntries = (period, day) => entries.filter(
    (entry) => matchesDay(entry, day) && entry?.startTime === period.startTime
  );
  const coveredByMergedEntry = (period, day) => entries.some(
    (entry) => matchesDay(entry, day) && entry?.startTime < period.startTime && entry?.endTime > period.startTime
  );
  const rowSpanForEntry = (entry) => periods.filter(
    (period) => period.startTime >= entry.startTime && period.endTime <= entry.endTime
  ).length;

  if (!entries.length) {
    return <Empty>No timetable entries found for the selected filters.</Empty>;
  }

  return (
    <>
      <ViewControls>
        <ToggleGroup aria-label="Timetable view">
          <Toggle type="button" $active={mode === 'week'} onClick={() => setMode('week')}>Weekly View</Toggle>
          <Toggle type="button" $active={mode === 'day'} onClick={() => setMode('day')}>Day View</Toggle>
        </ToggleGroup>
        {mode === 'day' && (
          <DaySelect aria-label="Select day" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}>
            {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
          </DaySelect>
        )}
      </ViewControls>
      <ScrollArea>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              {visibleDays.map((day) => <th key={day}>{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={`${period.startTime}-${period.endTime}`}>
                <td>
                  <PeriodLabel>
                    {period.label && <strong>{period.label}<br /></strong>}
                    {formatTime(period.startTime)} – {formatTime(period.endTime)}
                  </PeriodLabel>
                </td>
                {visibleDays.map((day) => {
                  if (coveredByMergedEntry(period, day)) return null;
                  const periodEntries = cellEntries(period, day);
                  return <td key={`${period.startTime}-${period.endTime}-${day}`} rowSpan={Math.max(1, ...periodEntries.map(rowSpanForEntry))}>
                    {period.kind && period.kind !== 'CLASS' ? (
                      <EntryCard type="button" disabled><strong>{period.kind === 'LUNCH' ? 'LUNCH BREAK' : 'BREAK'}</strong></EntryCard>
                    ) : periodEntries.map((entry, index) => (
                      <EntryCard
                        key={entry._id || `${day}-${period.startTime}-${index}`}
                        type="button"
                        $clickable={Boolean(onSelectEntry)}
                        onClick={() => onSelectEntry?.(entry)}
                        disabled={!onSelectEntry}
                      >
                        <strong>{entry.subject?.subjectCode || 'Subject'} · {entry.subject?.subjectName || 'Name unavailable'}</strong>
                        {entry.faculty?.name && <span>{entry.faculty.name}{entry.faculty.registrationNumber ? ` · ${entry.faculty.registrationNumber}` : ''}{entry.faculty.designation ? ` · ${entry.faculty.designation}` : ''}</span>}
                        <span>
                          {entry.semester ? `Semester ${entry.semester} · ` : ''}
                          Section {entry.section || '—'}
                          {entry.room ? ` · Room ${entry.room}` : ''}
                        </span>
                      </EntryCard>
                    ))}
                  </td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </>
  );
};

export default TimetableGrid;
