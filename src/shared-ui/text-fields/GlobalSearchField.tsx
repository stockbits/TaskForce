import React from 'react';
import { Box, TextField, InputAdornment } from '@mui/material';
import { Search } from 'lucide-react';

type Props = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  size?: 'small' | 'medium';
  sx?: any;
  name?: string;
};

export default function GlobalSearchField({ value, onChange, placeholder = '', size = 'small', sx = {}, name = 'taskSearch' }: Props) {
  return (
    <Box sx={{ width: { xs: '100%', sm: 360 }, ...sx }}>
      <TextField
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        size={size}
        fullWidth
        sx={{ '& input::placeholder': { color: 'text.secondary' }, '& .MuiInputBase-input': { paddingTop: 0, paddingBottom: 0, fontSize: 13, lineHeight: '32px' }, height: 48 }}
        InputProps={{
          startAdornment: (<InputAdornment position="start"><Search size={16} /></InputAdornment>),
          sx: { height: 48 }
        }}
      />
    </Box>
  );
}
