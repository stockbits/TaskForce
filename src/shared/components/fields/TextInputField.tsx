import { useId } from "react";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
export type TextInputFieldProperties = Omit<TextFieldProps, "label"> & {
  label: string;
};
export default function TextInputField({
  id,
  label,
  ...properties
}: TextInputFieldProperties) {
  const generatedIdentifier = useId();
  return (
    <TextField
      fullWidth
      id={id ?? generatedIdentifier}
      label={label}
      {...properties}
    />
  );
}
