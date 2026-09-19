import PageContainer from "@shared/components/page-container/PageContainer";
import FeaturePlaceholder from "@shared/components/feature-placeholder/FeaturePlaceholder";
import PageHeader from "@shared/components/page-header/PageHeader";

export default function LiveSchedulePage() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Feature workspace"
        title="Live Schedule"
        description="Timeline, map, task table, resource table and selection behaviour will be migrated as cohesive parts of this feature."
      />
      <FeaturePlaceholder
        title="Ready for live-schedule migration"
        description="Timeline calculations and travel calculations will be separated from visual components."
      />
    </PageContainer>
  );
}
