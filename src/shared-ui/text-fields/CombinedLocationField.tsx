import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton, Menu, MenuItem, Box, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import useFieldSizes from './useFieldSizes';

interface CombinedLocationFieldProps {
  locationType: string;
  locationValue: string;
  onTypeChange: (value: string) => void;
  onValueChange: (value: string) => void;
  label?: string;
}

const TYPE_OPTIONS = [
  { value: 'postCode', label: 'Postcode' },
  { value: 'location', label: 'Location' },
  { value: 'groupCode', label: 'Group Code' },
];

const CombinedLocationField: React.FC<CombinedLocationFieldProps> = ({
  locationType,
  locationValue,
  onTypeChange,
  onValueChange,
  label = "Location",
}) => {
  const { INPUT_HEIGHT, MAX_WIDTH, MIN_WIDTH, FIELD_GAP } = useFieldSizes();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleIconClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleTypeSelect = (value: string) => {
    onTypeChange(value);
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: FIELD_GAP, alignItems: 'flex-start' }}>
      <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
      <TextField
        size="small"
        value={locationValue}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder=""
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconButton size="small" onClick={handleIconClick} sx={{ p: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ),
          sx: { height: INPUT_HEIGHT }
        }}
        sx={{ maxWidth: MAX_WIDTH, minWidth: MIN_WIDTH }}
      />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {TYPE_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === locationType}
            onClick={() => handleTypeSelect(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default CombinedLocationField;