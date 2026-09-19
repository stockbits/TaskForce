import PageContainer from "@shared/components/page-container/PageContainer";
import { DarkThemeIcon, LightThemeIcon } from "@shared/icons/applicationIcons";
import ApplicationButton from "@shared/components/buttons/ApplicationButton";
import { Box, Paper, Stack, Typography } from "@mui/material";
import PageHeader from "@shared/components/page-header/PageHeader";
import { useApplicationTheme } from "@shared/theme/ApplicationThemeProvider";

export default function ApplicationSettingsPage() {
  const { colourMode, toggleColourMode } = useApplicationTheme();

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Application preferences"
        title="Application Settings"
        description="Application-wide preferences remain separate from individual business features."
      />
      <Paper
        variant="outlined"
        sx={{ p: 6, maxWidth: 640, minWidth: 0, overflowWrap: "anywhere" }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={3}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6" fontWeight={750}>
              Colour theme
            </Typography>
            <Typography color="text.secondary">
              Current theme: {colourMode === "light" ? "Light" : "Dark"}
            </Typography>
          </Box>
          <ApplicationButton
            variant="contained"
            onClick={toggleColourMode}
            startIcon={
              colourMode === "light" ? <DarkThemeIcon /> : <LightThemeIcon />
            }
          >
            Use {colourMode === "light" ? "dark" : "light"} theme
          </ApplicationButton>
        </Stack>
      </Paper>
    </PageContainer>
  );
}
