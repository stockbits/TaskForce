import { useState } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import CreatableSelectionField from "@shared/components/fields/CreatableSelectionField";
import DateTimeRangeField, {
  type DateTimeRangeValue,
} from "@shared/components/fields/DateTimeRangeField";
import DropdownField from "@shared/components/fields/DropdownField";
import MultipleSelectionField from "@shared/components/fields/MultipleSelectionField";
import SearchField from "@shared/components/fields/SearchField";
import SelectionField, {
  type SelectionOption,
} from "@shared/components/fields/SelectionField";
import TextInputField from "@shared/components/fields/TextInputField";
import ImportanceScoreField, {
  type ImportanceScoreValue,
} from "@features/task-management/components/fields/ImportanceScoreField";
import LocationCriterionField, {
  type LocationCriterionValue,
} from "@features/task-management/components/fields/LocationCriterionField";

export const exampleSelectionOptions: SelectionOption[] = [
  { identifier: "planning", label: "Planning" },
  { identifier: "delivery", label: "Delivery" },
  { identifier: "assurance", label: "Assurance" },
  {
    identifier: "long-label",
    label:
      "An intentionally long selection label to check wrapping on narrow screens",
  },
];

const locationCriterionOptions: SelectionOption[] = [
  { identifier: "starts-with", label: "Starts with" },
  { identifier: "contains", label: "Contains" },
  { identifier: "equals", label: "Equals" },
];

const initialDateTimeRange: DateTimeRangeValue = {
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
};

const inputGridStyles = {
  display: "grid",
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    lg: "repeat(2, minmax(0, 1fr))",
  },
  gap: 4,
  minWidth: 0,
};

export default function InputFieldExamples() {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState("No search submitted.");
  const [dropdownValue, setDropdownValue] = useState("planning");
  const [selection, setSelection] = useState<SelectionOption | null>(null);
  const [selections, setSelections] = useState<SelectionOption[]>([]);
  const [creatableValue, setCreatableValue] = useState<string | null>(null);
  const [dateTimeRange, setDateTimeRange] =
    useState<DateTimeRangeValue>(initialDateTimeRange);
  const [importanceScore, setImportanceScore] = useState<ImportanceScoreValue>({
    condition: "greater-than",
    score: null,
  });
  const [locationCriterion, setLocationCriterion] =
    useState<LocationCriterionValue>({
      criterionIdentifier: "contains",
      location: "",
    });

  return (
    <Stack spacing={4}>
      <Box>
        <Typography component="h2" variant="h5" gutterBottom>
          Input fields
        </Typography>
        <Typography color="text.secondary">
          Shared controls accept values, validation and options from their
          consumer. They contain no task data or page-specific rules.
        </Typography>
      </Box>

      <Box sx={inputGridStyles}>
        <TextInputField
          label="Standard text input"
          helperText="Use the Material UI field API for normal input behaviour."
        />
        <TextInputField
          label="Example validation"
          error
          helperText="A longer validation message wraps without widening the page."
        />
        <TextInputField label="Disabled input" disabled value="Unavailable" />
        <DropdownField
          label="Short fixed list"
          options={exampleSelectionOptions.slice(0, 3)}
          value={dropdownValue}
          onChange={setDropdownValue}
          helperText="Use a dropdown when the complete list is short."
        />
        <SelectionField
          label="Searchable single selection"
          options={exampleSelectionOptions}
          value={selection}
          onChange={setSelection}
        />
        <CreatableSelectionField
          label="Selection or new value"
          options={exampleSelectionOptions.map((option) => option.label)}
          value={creatableValue}
          onChange={setCreatableValue}
          helperText="Choose a suggestion or type a new value."
        />
        <Box sx={{ gridColumn: { lg: "1 / -1" }, minWidth: 0 }}>
          <MultipleSelectionField
            label="Searchable multiple selection"
            options={exampleSelectionOptions}
            value={selections}
            onChange={setSelections}
            maximumSelections={3}
            helperText="Filter the list, then select or clear only the visible options."
          />
        </Box>
        <SearchField
          label="Search examples"
          value={search}
          onChange={setSearch}
          onSearch={(value) => setSearchResult(`Submitted: ${value}`)}
          validate={(value) =>
            value.length > 0 && value.length < 2
              ? "Enter at least two characters."
              : undefined
          }
          helperText="Press Enter to submit. Validation comes from the consumer."
        />
        <Typography
          component="output"
          color="text.secondary"
          sx={{ alignSelf: "center", overflowWrap: "anywhere" }}
        >
          {searchResult}
        </Typography>
      </Box>

      <Divider />

      <Box>
        <Typography component="h3" variant="h6" gutterBottom>
          Responsive compound fields
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Related values stack on mobile and share a row when space permits.
        </Typography>
        <DateTimeRangeField value={dateTimeRange} onChange={setDateTimeRange} />
      </Box>

      <Divider />

      <Box>
        <Typography component="h3" variant="h6" gutterBottom>
          Task-management fields
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          These compose shared fields but remain with the feature because they
          express task-specific rules.
        </Typography>
        <Stack spacing={4}>
          <ImportanceScoreField
            value={importanceScore}
            onChange={setImportanceScore}
            helperText="Enter a score from 0 to 999."
          />
          <LocationCriterionField
            criterionOptions={locationCriterionOptions}
            value={locationCriterion}
            onChange={setLocationCriterion}
            helperText="The page supplies the permitted criterion types."
          />
        </Stack>
      </Box>
    </Stack>
  );
}
