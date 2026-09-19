import { Box } from "@mui/material";
import FeaturePlaceholder from "@shared/components/feature-placeholder/FeaturePlaceholder";
import PageHeader from "@shared/components/page-header/PageHeader";

export default function LiveSchedulePage() {
  return (
    <Box sx={{ px: { xs: 2, sm: 3, lg: 5 }, py: { xs: 3, lg: 5 } }}>
      <PageHeader
        eyebrow="Feature workspace"
        title="Live Schedule"
        description="Timeline, map, task table, resource table and selection behaviour will be migrated as cohesive parts of this feature."
      />
      <FeaturePlaceholder
        title="Ready for live-schedule migration"
        description="Timeline calculations and travel calculations will be separated from visual components."
      />
    </Box>
  );
}
