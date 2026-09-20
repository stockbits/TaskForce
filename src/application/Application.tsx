import ApplicationLayout from "@application/layout/ApplicationLayout";
import ApplicationProviders from "@application/providers/ApplicationProviders";

export default function Application() {
  return (
    <ApplicationProviders>
      <ApplicationLayout />
    </ApplicationProviders>
  );
}
