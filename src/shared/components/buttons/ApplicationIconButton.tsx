import { forwardRef } from "react";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
type ApplicationIconButtonProperties = Omit<IconButtonProps, "aria-label"> & {
  label: string;
};
const ApplicationIconButton = forwardRef<
  HTMLButtonElement,
  ApplicationIconButtonProperties
>(function ApplicationIconButton(
  { label, type = "button", ...properties },
  reference,
) {
  return (
    <IconButton
      ref={reference}
      type={type}
      aria-label={label}
      {...properties}
    />
  );
});
export default ApplicationIconButton;
