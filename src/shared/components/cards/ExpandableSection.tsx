import { useId, type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { ExpandSectionIcon } from "@shared/icons/applicationIcons";
export default function ExpandableSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const identifier = useId();
  return (
    <Accordion disableGutters variant="outlined" sx={{ minWidth: 0 }}>
      <AccordionSummary
        expandIcon={<ExpandSectionIcon />}
        id={identifier}
        aria-controls={`${identifier}-content`}
      >
        <Typography fontWeight={700} sx={{ overflowWrap: "anywhere" }}>
          {title}
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        id={`${identifier}-content`}
        sx={{ overflowWrap: "anywhere" }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
}
