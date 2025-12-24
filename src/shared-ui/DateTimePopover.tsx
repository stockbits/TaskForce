import React from 'react';
import { Menu, Box, Stack, TextField, InputAdornment } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AppButton from '@/shared-ui/button';

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  fromDate: string;
  fromTime: string;
  toDate: string;
  toTime: string;
  onChangeField: (name: string, value: string) => void;
  onClear?: () => void;
}

export default function DateTimePopover({
  anchorEl,
  open,
  onClose,
  fromDate,
  fromTime,
  toDate,
  toTime,
  onChangeField,
  onClear,
}: Props) {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 220 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            type="date"
            name="fromDate"
            label="From"
            value={fromDate}
            onChange={(e) => onChangeField('fromDate', e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <CalendarMonthIcon 
                    sx={{ fontSize: 18, color: 'action.active', cursor: 'pointer' }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = e.currentTarget.closest('.MuiTextField-root')?.querySelector('input');
                      input?.focus();
                      input?.click();
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ 
              maxWidth: { xs: '100%', sm: '15ch' }, 
              minWidth: '15ch',
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                display: 'none',
                WebkitAppearance: 'none',
              },
            }}
          />
          <TextField
            type="time"
            name="fromTime"
            value={fromTime}
            onChange={(e) => onChangeField('fromTime', e.target.value)}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <ScheduleIcon 
                    sx={{ fontSize: 18, color: 'action.active', cursor: 'pointer' }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = e.currentTarget.closest('.MuiTextField-root')?.querySelector('input');
                      input?.focus();
                      input?.click();
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ 
              maxWidth: { xs: '100%', sm: '10ch' }, 
              minWidth: '10ch',
              '& input[type="time"]::-webkit-calendar-picker-indicator': {
                display: 'none',
                WebkitAppearance: 'none',
              },
            }}
          />
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            type="date"
            name="toDate"
            label="To"
            value={toDate}
            onChange={(e) => onChangeField('toDate', e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <CalendarMonthIcon 
                    sx={{ fontSize: 18, color: 'action.active', cursor: 'pointer' }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = e.currentTarget.closest('.MuiTextField-root')?.querySelector('input');
                      input?.focus();
                      input?.click();
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ 
              maxWidth: { xs: '100%', sm: '15ch' }, 
              minWidth: '15ch',
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                display: 'none',
                WebkitAppearance: 'none',
              },
            }}
          />
          <TextField
            type="time"
            name="toTime"
            value={toTime}
            onChange={(e) => onChangeField('toTime', e.target.value)}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <ScheduleIcon 
                    sx={{ fontSize: 18, color: 'action.active', cursor: 'pointer' }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = e.currentTarget.closest('.MuiTextField-root')?.querySelector('input');
                      input?.focus();
                      input?.click();
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ 
              maxWidth: { xs: '100%', sm: '10ch' }, 
              minWidth: '10ch',
              '& input[type="time"]::-webkit-calendar-picker-indicator': {
                display: 'none',
                WebkitAppearance: 'none',
              },
            }}
          />
        </Stack>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <AppButton variant="contained" size="small" onClick={() => { onClear && onClear(); }}>
            Clear
          </AppButton>
          <AppButton variant="contained" size="small" onClick={onClose}>
            Apply
          </AppButton>
        </Box>
      </Box>
    </Menu>
  );
}
