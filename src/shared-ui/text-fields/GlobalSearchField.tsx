import React from 'react';
import { Box, TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import useFieldSizes from './useFieldSizes';

type Props = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSearch?: () => void;
  placeholder?: string;
  size?: 'small' | 'medium';
  sx?: any;
  name?: string;
  showSearchButton?: boolean;
  validateExact?: (value: string) => boolean;
  errorMessage?: string;
};

export default function GlobalSearchField(props: Props) {
  const {
    value,
    onChange,
    onKeyPress,
    onSearch,
    placeholder = '',
    size = 'small',
    sx = {},
    name = 'taskSearch',
    showSearchButton = false,
    validateExact,
    errorMessage,
  } = props;

  const { INPUT_HEIGHT, CHIP_SIZE } = useFieldSizes();
  const [error, setError] = React.useState<boolean>(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      if (validateExact && !validateExact(value)) {
        setError(true);
        return;
      }
      onSearch();
    }
    onKeyPress?.(e);
  };

  const endAdornment = showSearchButton && onSearch ? (
    <InputAdornment position="end">
      <IconButton
        size="small"
        onClick={() => {
          if (validateExact && !validateExact(value)) {
            setError(true);
            return;
          }
          onSearch?.();
        }}
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
        onChange={(e) => {
          onChange(e);
          if (error) setError(false);
        }}
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
          // Avoid duplicate icons when an explicit search button exists
          startAdornment: showSearchButton ? undefined : (
            <InputAdornment position="start">
              <SearchIcon style={{ fontSize: 16 }} />
            </InputAdornment>
          ),
          endAdornment,
          sx: { height: INPUT_HEIGHT }
        }}
        error={error}
        helperText={undefined}
      />
    </Box>
  );
}
