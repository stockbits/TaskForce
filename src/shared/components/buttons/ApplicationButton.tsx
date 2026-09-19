import { forwardRef } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
const ApplicationButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function ApplicationButton({ type = "button", ...properties }, reference) {
    return <Button ref={reference} type={type} {...properties} />;
  },
);
export default ApplicationButton;
