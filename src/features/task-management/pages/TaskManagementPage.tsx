import PageContainer from "@shared/components/page-container/PageContainer";
import FeaturePlaceholder from "@shared/components/feature-placeholder/FeaturePlaceholder";
import PageHeader from "@shared/components/page-header/PageHeader";

export default function TaskManagementPage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Feature workspace"
        title="Task Management"
        description="Task searching, filtering, table actions and progression workflows will be migrated into this feature boundary."
      />
      <FeaturePlaceholder
        title="Ready for task-management migration"
        description="The new feature will own its pages, components, hooks, types and utilities."
      />
    </PageContainer>
  );
}
