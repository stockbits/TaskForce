import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import Brightness2Icon from '@mui/icons-material/Brightness2';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { useSettings } from '../System Settings/Settings Manager - Component';

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings();

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Theme Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Theme Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1">Theme Mode:</Typography>
                <IconButton
                  onClick={() => updateSetting('themeMode', settings.themeMode === 'light' ? 'dark' : 'light')}
                  sx={{
                    borderRadius: '50%',
                    padding: 1,
                    backgroundColor: 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  {settings.themeMode === 'dark' ? (
                    <Brightness2Icon sx={{ fontSize: 24 }} />
                  ) : (
                    <WbSunnyIcon sx={{ fontSize: 24 }} />
                  )}
                </IconButton>
                <Typography variant="body2" color="text.secondary">
                  {settings.themeMode === 'light' ? 'Light Mode' : 'Dark Mode'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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