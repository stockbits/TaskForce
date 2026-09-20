import Tooltip, { type TooltipProps } from "@mui/material/Tooltip";
/** Supplementary help only: essential labels must remain visible. */
export default function ApplicationTooltip(properties: TooltipProps) {
  return <Tooltip arrow describeChild {...properties} />;
}
