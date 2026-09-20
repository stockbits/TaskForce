import PageContainer from "@shared/components/page-container/PageContainer";
import {
  ArchitectureIcon,
  ComponentLibraryIcon,
  ColourPaletteIcon,
} from "@shared/icons/applicationIcons";
import { Grid } from "@mui/material";
import ApplicationCard from "@shared/components/application-card/ApplicationCard";
import PageHeader from "@shared/components/page-header/PageHeader";

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Clean architecture foundation"
        title="A clearer base for TaskForce"
        description="The application shell, design system and feature boundaries are now separated so each area can be migrated without recreating the previous coupling."
      />
      <Grid container spacing={6}>
        <Grid item xs={12} md={4}>
          <ApplicationCard
            icon={<ArchitectureIcon />}
            title="Feature ownership"
            description="Business capabilities are isolated under descriptive feature folders."
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ApplicationCard
            icon={<ColourPaletteIcon />}
            title="Centralised theme"
            description="Colour, typography, shape and spacing decisions live in one shared theme."
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ApplicationCard
            icon={<ComponentLibraryIcon />}
            title="Reusable components"
            description="Shared components remain independent of individual business features."
          />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
