import React from 'react';
import { Box, TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useFieldSizes from './useFieldSizes';

type Props = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearch?: () => void;
  placeholder?: string;
  size?: 'small' | 'medium';
  sx?: any;
  name?: string;
  showSearchButton?: boolean;
};

export default function GlobalSearchField({
  value,
  onChange,
  onKeyPress,
  onSearch,
  placeholder = '',
  size = 'small',
  sx = {},
  name = 'taskSearch',
  showSearchButton = false
}: Props) {
  const { INPUT_HEIGHT, CHIP_SIZE } = useFieldSizes();

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
    onKeyPress?.(e);
  };

  const endAdornment = showSearchButton && onSearch ? (
    <InputAdornment position="end">
      <IconButton
        size="small"
        onClick={onSearch}
        sx={{ mr: 0.5 }}
        aria-label="search"
      >
        <SearchIcon style={{ fontSize: 16 }} />
      </IconButton>
    </InputAdornment>
  ) : null;

  return (
    <Box sx={{ width: { xs: '100%', sm: 400 }, ...sx }}>
      <TextField
        name={name}
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        size={size}
        fullWidth
        sx={{
          '& input::placeholder': { color: 'text.secondary' },
          '& .MuiInputBase-input': {
            paddingTop: 0,
            paddingBottom: 0,
            fontSize: 13,
            lineHeight: `${CHIP_SIZE}px`
          },
          height: INPUT_HEIGHT
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon style={{ fontSize: 16 }} />
            </InputAdornment>
          ),
          endAdornment,
          sx: { height: INPUT_HEIGHT }
        }}
      />
    </Box>
  );
}
