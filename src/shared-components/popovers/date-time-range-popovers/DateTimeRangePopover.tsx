import React, { useRef } from 'react';
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
  const fromDateRef = useRef<HTMLInputElement>(null);
  const fromTimeRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);
  const toTimeRef = useRef<HTMLInputElement>(null);
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 280 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            type="date"
            name="fromDate"
            label="From"
            value={fromDate}
            onChange={(e) => onChangeField('fromDate', e.target.value)}
            size="small"
            InputLabelProps={{ shrink: true }}
            inputRef={fromDateRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <CalendarMonthIcon 
                    sx={{ 
                      fontSize: 18, 
                      color: 'action.active', 
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      zIndex: 10
                    }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = fromDateRef.current;
                      if (input) {
                        // Temporarily enable pointer events to allow the click
                        input.style.pointerEvents = 'auto';
                        // Use showPicker if available (modern browsers), otherwise click
                        if ('showPicker' in input && typeof input.showPicker === 'function') {
                          input.showPicker();
                        } else {
                          input.click();
                        }
                        // Reset pointer events after a short delay
                        setTimeout(() => {
                          input.style.pointerEvents = 'none';
                        }, 100);
                      }
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ 
              maxWidth: { xs: '100%', sm: '20ch' }, 
              minWidth: '20ch',
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                display: 'none',
                WebkitAppearance: 'none',
              },
              '& .MuiInputBase-input': {
                cursor: 'default',
                pointerEvents: 'none',
                '&:focus': {
                  cursor: 'default',
                }
              },
            }}
          />
          <TextField
            type="time"
            name="fromTime"
            value={fromTime}
            onChange={(e) => onChangeField('fromTime', e.target.value)}
            size="small"
            inputRef={fromTimeRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <ScheduleIcon 
                    sx={{ 
                      fontSize: 18, 
                      color: 'action.active', 
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      zIndex: 10
                    }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = fromTimeRef.current;
                      if (input) {
                        input.style.pointerEvents = 'auto';
                        if ('showPicker' in input && typeof input.showPicker === 'function') {
                          input.showPicker();
                        } else {
                          input.click();
                        }
                        setTimeout(() => {
                          input.style.pointerEvents = 'none';
                        }, 100);
                      }
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ 
              maxWidth: { xs: '100%', sm: '18ch' }, 
              minWidth: '18ch',
              '& input[type="time"]::-webkit-calendar-picker-indicator': {
                display: 'none',
                WebkitAppearance: 'none',
              },
              '& .MuiInputBase-input': {
                cursor: 'default',
                pointerEvents: 'none',
                '&:focus': {
                  cursor: 'default',
                }
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
            inputRef={toDateRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <CalendarMonthIcon 
                    sx={{ 
                      fontSize: 18, 
                      color: 'action.active', 
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      zIndex: 10
                    }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = toDateRef.current;
                      if (input) {
                        input.style.pointerEvents = 'auto';
                        if ('showPicker' in input && typeof input.showPicker === 'function') {
                          input.showPicker();
                        } else {
                          input.click();
                        }
                        setTimeout(() => {
                          input.style.pointerEvents = 'none';
                        }, 100);
                      }
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ 
              maxWidth: { xs: '100%', sm: '20ch' }, 
              minWidth: '20ch',
              '& input[type="date"]::-webkit-calendar-picker-indicator': {
                display: 'none',
                WebkitAppearance: 'none',
              },
              '& .MuiInputBase-input': {
                cursor: 'default',
                pointerEvents: 'none',
                '&:focus': {
                  cursor: 'default',
                }
              },
            }}
          />
          <TextField
            type="time"
            name="toTime"
            value={toTime}
            onChange={(e) => onChangeField('toTime', e.target.value)}
            size="small"
            inputRef={toTimeRef}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ mr: 1 }}>
                  <ScheduleIcon 
                    sx={{ 
                      fontSize: 18, 
                      color: 'action.active', 
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      zIndex: 10
                    }} 
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = toTimeRef.current;
                      if (input) {
                        input.style.pointerEvents = 'auto';
                        if ('showPicker' in input && typeof input.showPicker === 'function') {
                          input.showPicker();
                        } else {
                          input.click();
                        }
                        setTimeout(() => {
                          input.style.pointerEvents = 'none';
                        }, 100);
                      }
                    }}
                  />
                </InputAdornment>
              ),
            }}
            sx={{ 
              maxWidth: { xs: '100%', sm: '18ch' }, 
              minWidth: '18ch',
              '& input[type="time"]::-webkit-calendar-picker-indicator': {
                display: 'none',
                WebkitAppearance: 'none',
              },
              '& .MuiInputBase-input': {
                cursor: 'default',
                pointerEvents: 'none',
                '&:focus': {
                  cursor: 'default',
                }
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
