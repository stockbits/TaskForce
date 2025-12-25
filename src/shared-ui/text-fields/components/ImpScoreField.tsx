import React from 'react';
import { TextField, InputAdornment, IconButton, Typography } from '@mui/material';
import BaseField from '../base/BaseField';
import { BaseFieldProps } from '../types';
import useFieldSizes from '../utils/useFieldSizes';

type Condition = 'greater' | 'less' | 'equal' | '';

interface ImpScoreFieldProps extends BaseFieldProps {
  condition: Condition;
  value: string;
  onConditionChange?: (next: Condition) => void;
  onValueChange?: (next: string) => void;
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

const ImpScoreField = React.forwardRef<HTMLInputElement, ImpScoreFieldProps>(function ImpScoreField({
  condition,
  value,
  onConditionChange,
  onValueChange,
  label,
  sx,
  ...baseFieldProps
}, ref) {
  const { INPUT_HEIGHT, CHIP_SIZE, MAX_WIDTH, MIN_WIDTH } = useFieldSizes();

  const current: Condition = (condition as Condition) || 'greater';

  const handleCycle = () => {
    const idx = ORDER.indexOf(current);
    const next = ORDER[(idx + 1) % ORDER.length] || 'greater';
    onConditionChange?.(next);
  };

  return (
    <BaseField label={label} sx={sx} {...baseFieldProps}>
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
              <IconButton size="small" onClick={handleCycle} aria-label={LABEL[current]} sx={{ p: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '16px' }}>{SYMBOL[current]}</Typography>
              </IconButton>
            </InputAdornment>
          ),
          sx: { height: INPUT_HEIGHT }
        }}
        sx={{ '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, fontSize: 13, lineHeight: `${CHIP_SIZE}px` }, height: INPUT_HEIGHT, maxWidth: MAX_WIDTH, minWidth: MIN_WIDTH }}
        inputRef={ref}
      />
    </BaseField>
  );
});

export default ImpScoreField;
