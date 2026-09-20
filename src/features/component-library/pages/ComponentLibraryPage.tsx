import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import PageContainer from "@shared/components/page-container/PageContainer";
import PageHeader from "@shared/components/page-header/PageHeader";
import ApplicationButton from "@shared/components/buttons/ApplicationButton";
import TextInputField from "@shared/components/fields/TextInputField";
import ExpandableSection from "@shared/components/cards/ExpandableSection";
import ApplicationDialog from "@shared/components/dialogs/ApplicationDialog";
import ApplicationPopover from "@shared/components/popovers/ApplicationPopover";
import ApplicationDataTable from "@shared/components/tables/ApplicationDataTable";
import ApplicationTooltip from "@shared/components/tooltips/ApplicationTooltip";
import { useNotification } from "@shared/components/notifications/NotificationProvider";
import InputFieldExamples, {
  exampleSelectionOptions,
} from "../examples/InputFieldExamples";
import ActionExamples from "../examples/ActionExamples";

const exampleRows = exampleSelectionOptions.map((option) => ({
  id: option.identifier,
  name: option.label,
  status: "Example only",
}));
const exampleColumns: GridColDef<(typeof exampleRows)[number]>[] = [
  { field: "name", headerName: "Name", minWidth: 280, flex: 1 },
  { field: "status", headerName: "Status", width: 180 },
];

/** Disposable examples only. No business data, persistence or feature workflows. */
export default function ComponentLibraryPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const notify = useNotification();
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Foundation preview"
        title="Component Library"
        description="Try the shared controls at different screen sizes. All values here are examples and are not saved."
      />
      <Stack spacing={6}>
        <InputFieldExamples />
        <ActionExamples />
        <Box>
          <Typography component="h2" variant="h5" gutterBottom>
            Dialogs and feedback
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Overlay controls keep focus and dismissal behaviour within Material
            UI contracts.
          </Typography>
          <Stack direction="row" useFlexGap flexWrap="wrap" spacing={3}>
            <ApplicationButton
              variant="contained"
              onClick={() => setDialogOpen(true)}
            >
              Open example dialog
            </ApplicationButton>
            <ApplicationButton
              variant="outlined"
              onClick={(event) => setPopoverAnchor(event.currentTarget)}
            >
              Open example popover
            </ApplicationButton>
            <ApplicationTooltip title="This notification contains example text only.">
              <ApplicationButton
                onClick={() =>
                  notify("Example notification. No data was saved.", "success")
                }
              >
                Show notification
              </ApplicationButton>
            </ApplicationTooltip>
          </Stack>
        </Box>
        <ExpandableSection title="Long content and keyboard behaviour">
          <Typography>
            These controls inherit the shared theme, preserve keyboard
            interaction and accept data from their consuming page.
          </Typography>
          <Typography>
            LongUnbrokenExampleIdentifierThatMustWrapInsteadOfPushingTheContainerOutsideTheMobileViewport
          </Typography>
        </ExpandableSection>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" variant="h6" gutterBottom>
            Example data table
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            On small screens, scroll inside the table to see every column.
          </Typography>
          <ApplicationDataTable
            label="Example records"
            rows={exampleRows}
            columns={exampleColumns}
            pageSizeOptions={[5, 10]}
            initialState={{
              pagination: { paginationModel: { pageSize: 5, page: 0 } },
            }}
            disableRowSelectionOnClick
          />
        </Box>
      </Stack>
      <ApplicationDialog
        open={dialogOpen}
        title="Example responsive dialog"
        onClose={() => setDialogOpen(false)}
        actions={
          <ApplicationButton onClick={() => setDialogOpen(false)}>
            Close example
          </ApplicationButton>
        }
      >
        <Typography sx={{ mb: 4 }}>
          The dialog fills a narrow screen, keeps its close button reachable,
          and returns focus when closed.
        </Typography>
        <TextInputField label="Example dialog input" multiline minRows={3} />
      </ApplicationDialog>
      <ApplicationPopover
        anchorElement={popoverAnchor}
        title="Example popover"
        onClose={() => setPopoverAnchor(null)}
      >
        <Typography>
          Content stays within the viewport. Escape or the close button
          dismisses this popover.
        </Typography>
      </ApplicationPopover>
    </PageContainer>
  );
}
