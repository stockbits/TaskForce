import React from 'react';
import { Box, TextField, InputAdornment, IconButton, Typography } from '@mui/material';
import type { SxProps } from '@mui/material';
import useFieldSizes from './useFieldSizes';

type Condition = 'greater' | 'less' | 'equal' | '';

interface Props {
  condition: Condition;
  value: string;
  onConditionChange?: (next: Condition) => void;
  onValueChange?: (next: string) => void;
  sx?: SxProps;
  label?: string;
}

const ORDER: Condition[] = ['greater', 'less', 'equal'];

const SYMBOL: Record<Condition, string> = {
  greater: '>',
  less: '<',
  equal: '=',
  '': '>'
};

const LABEL: Record<Condition, string> = {
  greater: 'Greater Than',
  less: 'Less Than',
  equal: 'Equal',
  '': 'Greater Than'
};

const ImpScoreField = React.forwardRef<HTMLInputElement, Props>(function ImpScoreField({ condition, value, onConditionChange, onValueChange, sx, label }, ref) {
  const { INPUT_HEIGHT, CHIP_SIZE } = useFieldSizes();

  const current: Condition = (condition as Condition) || 'greater';

  const handleCycle = () => {
    const idx = ORDER.indexOf(current);
    const next = ORDER[(idx + 1) % ORDER.length] || 'greater';
    onConditionChange?.(next);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start', ...((sx as any) || {}) }}>
      {label && <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>}
      <TextField
        size="small"
        placeholder=""
        value={value}
        onChange={(e) => {
          // normalize to digits only and enforce max 3 characters (0-999)
          const raw = String(e.target.value || '');
          const digits = raw.replace(/\D/g, '').slice(0, 3);
          onValueChange?.(digits);
        }}
        type="text"
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 3, min: 0, max: 999 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton size="small" onClick={handleCycle} aria-label={LABEL[current]} sx={{ p: 0.5, color: 'primary.main' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '16px' }}>{SYMBOL[current]}</Typography>
              </IconButton>
            </InputAdornment>
          ),
          sx: { height: INPUT_HEIGHT }
        }}
        sx={{ '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, fontSize: 13, lineHeight: `${CHIP_SIZE}px` }, height: INPUT_HEIGHT, width: 'fit-content' }}
        inputRef={ref}
      />
    </Box>
  );
});

export default ImpScoreField;
