import React from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControlLabel,
  Switch,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useSettings } from '../contexts/SettingsContext';

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Schedule Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Schedule Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoLoadResources}
                    onChange={(e) => updateSetting('autoLoadResources', e.target.checked)}
                    size="small"
                  />
                }
                label="Auto-load Resources"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                When enabled, resources will be loaded automatically when you select a division.
                When disabled, resources will only load when you run a search.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}