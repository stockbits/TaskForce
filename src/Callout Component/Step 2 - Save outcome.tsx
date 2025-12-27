import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import Engineering from '@mui/icons-material/Engineering';
import { useTheme } from "@mui/material/styles";
import { sharedStyles } from './sharedStyles';

interface Step2Props {
  selectedGroup: string;
  resourceCountByGroup: Map<string, number>;
  isStarting: boolean;
}

export const Step2: React.FC<Step2Props> = ({
  selectedGroup,
  resourceCountByGroup,
  isStarting,
}) => {
  const theme = useTheme();
  const styles = sharedStyles(theme);

  return (
    <Stack spacing={2}>
      <Typography variant="overline" sx={styles.sectionTitle}>
        Confirm Callout Start
      </Typography>

      <Box sx={styles.confirmationBox(isStarting)}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Engineering sx={{
            fontSize: 20,
            color: isStarting ? 'warning.main' : 'success.main'
          }} />
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {isStarting ? 'Starting callout...' : `Ready to start callout for: ${selectedGroup}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {resourceCountByGroup.get(selectedGroup) ?? 0} engineers available
            </Typography>
          </Stack>
          {isStarting && (
            <Box sx={{ ml: 'auto' }}>
              <Typography variant="caption" color="warning.main">
                Opening callout panel...
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Stack>
  );
};