import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import PageContainer from "@shared/components/page-container/PageContainer";
import PageHeader from "@shared/components/page-header/PageHeader";
import ApplicationButton from "@shared/components/buttons/ApplicationButton";
import TextInputField from "@shared/components/fields/TextInputField";
import SelectionField, {
  type SelectionOption,
} from "@shared/components/fields/SelectionField";
import MultipleSelectionField from "@shared/components/fields/MultipleSelectionField";
import SearchField from "@shared/components/fields/SearchField";
import ExpandableSection from "@shared/components/cards/ExpandableSection";
import ApplicationDialog from "@shared/components/dialogs/ApplicationDialog";
import ApplicationPopover from "@shared/components/popovers/ApplicationPopover";
import ApplicationDataTable from "@shared/components/tables/ApplicationDataTable";
import ApplicationTooltip from "@shared/components/tooltips/ApplicationTooltip";
import { useNotification } from "@shared/components/notifications/NotificationProvider";

const exampleOptions: SelectionOption[] = [
  { identifier: "planning", label: "Planning" },
  { identifier: "delivery", label: "Delivery" },
  {
    identifier: "long-label",
    label:
      "An intentionally long selection label to check wrapping on narrow screens",
  },
];
const exampleRows = exampleOptions.map((option) => ({
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
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<SelectionOption | null>(null);
  const [selections, setSelections] = useState<SelectionOption[]>([]);
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
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              lg: "repeat(2, minmax(0, 1fr))",
            },
            gap: 6,
          }}
        >
          <TextInputField
            label="Example name"
            helperText="Long content should remain usable without widening the page."
          />
          <SearchField
            label="Search examples"
            value={search}
            onChange={setSearch}
          />
          <SelectionField
            label="Example selection"
            options={exampleOptions}
            value={selection}
            onChange={setSelection}
          />
          <MultipleSelectionField
            label="Multiple selections"
            options={exampleOptions}
            value={selections}
            onChange={setSelections}
          />
          <TextInputField
            label="Example validation"
            error
            helperText="A longer validation message should wrap and remain readable."
          />
          <TextInputField
            label="Disabled example"
            disabled
            value="Unavailable"
          />
        </Box>
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
            rows={exampleRows.filter((row) =>
              row.name.toLowerCase().includes(search.toLowerCase()),
            )}
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
