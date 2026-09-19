import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import PageHeader from "@shared/components/page-header/PageHeader";
import { useApplicationTheme } from "@shared/theme/ApplicationThemeProvider";

export default function ApplicationSettingsPage() {
  const { colourMode, toggleColourMode } = useApplicationTheme();

  return (
    <Box sx={{ px: { xs: 2, sm: 3, lg: 5 }, py: { xs: 3, lg: 5 } }}>
      <PageHeader
        eyebrow="Application preferences"
        title="Application Settings"
        description="Application-wide preferences remain separate from individual business features."
      />
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 640 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems={{ sm: "center" }} justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={750}>Colour theme</Typography>
            <Typography color="text.secondary">
              Current theme: {colourMode === "light" ? "Light" : "Dark"}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={toggleColourMode}
            startIcon={colourMode === "light" ? <DarkModeOutlined /> : <LightModeOutlined />}
          >
            Use {colourMode === "light" ? "dark" : "light"} theme
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
