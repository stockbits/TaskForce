import React from 'react';
import { Box, TextField, InputAdornment, IconButton, Tooltip } from '@mui/material';
import type { TextFieldProps } from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';
import useFieldSizes from './useFieldSizes';

type Props = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSearch?: () => void;
  size?: 'small' | 'medium';
  sx?: any;
  name?: string;
  showSearchButton?: boolean;
  validateExact?: (value: string) => boolean;
  searchTooltip?: string;
} & Partial<TextFieldProps>;

const GlobalSearchField = React.forwardRef<HTMLInputElement, Props>(function GlobalSearchField(props, ref) {
  const {
    value,
    onChange,
    onKeyPress,
    onSearch,
    size = 'small',
    sx = {},
    name = 'taskSearch',
    showSearchButton = false,
    validateExact,
    searchTooltip,
    ...rest
  } = props;

  const { INPUT_HEIGHT, CHIP_SIZE, MIN_WIDTH } = useFieldSizes();
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

  const endAdornment = (
    <InputAdornment position="end">
      {showSearchButton && onSearch && (
        <Tooltip title={searchTooltip} arrow>
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
        </Tooltip>
      )}
    </InputAdornment>
  );

  return (
    <Box sx={{ minWidth: MIN_WIDTH, width: 'fit-content', maxWidth: { xs: '100%', sm: '90ch' }, ...sx }}>
      <TextField
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e);
          if (error) setError(false);
        }}
        onKeyPress={handleKeyPress}
        placeholder="Search tasks..."
        size={size}
        sx={{
          minWidth: MIN_WIDTH,
          width: 'fit-content',
          '& input::placeholder': { color: 'text.secondary' },
          '& .MuiInputBase-input': {
            paddingTop: 0,
            paddingBottom: 0,
            fontSize: 13,
            lineHeight: `${CHIP_SIZE}px`
          },
          height: INPUT_HEIGHT,
          maxWidth: { xs: '100%', sm: '90ch' }
        }}
        error={error}
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
        inputRef={ref}
        {...rest}
      />
    </Box>
  );
});

export default GlobalSearchField;
