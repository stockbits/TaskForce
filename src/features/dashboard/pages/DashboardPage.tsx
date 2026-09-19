import ArchitectureOutlined from "@mui/icons-material/AccountTreeOutlined";
import ComponentsOutlined from "@mui/icons-material/WidgetsOutlined";
import PaletteOutlined from "@mui/icons-material/PaletteOutlined";
import { Box, Grid } from "@mui/material";
import ApplicationCard from "@shared/components/application-card/ApplicationCard";
import PageHeader from "@shared/components/page-header/PageHeader";

export default function DashboardPage() {
  return (
    <Box sx={{ px: { xs: 2, sm: 3, lg: 5 }, py: { xs: 3, lg: 5 } }}>
      <PageHeader
        eyebrow="Clean architecture foundation"
        title="A clearer base for TaskForce"
        description="The application shell, design system and feature boundaries are now separated so each area can be migrated without recreating the previous coupling."
      />
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <ApplicationCard
            icon={<ArchitectureOutlined />}
            title="Feature ownership"
            description="Business capabilities are isolated under descriptive feature folders."
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ApplicationCard
            icon={<PaletteOutlined />}
            title="Centralised theme"
            description="Colour, typography, shape and spacing decisions live in one shared theme."
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ApplicationCard
            icon={<ComponentsOutlined />}
            title="Reusable components"
            description="Shared components remain independent of individual business features."
          />
        </Grid>
      </Grid>
    </Box>
  );
}
