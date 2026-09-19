import { Box } from "@mui/material";
import FeaturePlaceholder from "@shared/components/feature-placeholder/FeaturePlaceholder";
import PageHeader from "@shared/components/page-header/PageHeader";

export default function TaskManagementPage() {
  return (
    <Box sx={{ px: { xs: 2, sm: 3, lg: 5 }, py: { xs: 3, lg: 5 } }}>
      <PageHeader
        eyebrow="Feature workspace"
        title="Task Management"
        description="Task searching, filtering, table actions and progression workflows will be migrated into this feature boundary."
      />
      <FeaturePlaceholder
        title="Ready for task-management migration"
        description="The new feature will own its pages, components, hooks, types and utilities."
      />
    </Box>
  );
}
