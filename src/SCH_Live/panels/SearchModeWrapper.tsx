// src/SCH_Live/panels/SearchModeWrapper.tsx

import React from "react";
import SearchToolPanel, { SearchToolFilters } from "./SearchToolPanel";

interface Props {
  mode: string;
  onSearch: (f: SearchToolFilters) => void;
  onClear: () => void;
  dropdownData: any;
  resetKey: number;
}

export default function SearchModeWrapper({
  mode,
  onSearch,
  onClear,
  dropdownData,
  resetKey,
}: Props) {
  return (
    <SearchToolPanel
      mode={mode}
      onSearch={onSearch}
      onClear={onClear}
      dropdownData={dropdownData}
      resetKey={resetKey}
      hideActions={true}
    />
  );
}
