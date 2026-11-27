import { SignIn } from "@clerk/nextjs";
import { AuthShell, clerkAuthAppearance } from "@/components/AuthShell";

export default function Page() {
  return (
    <AuthShell kicker="welcome back">
      <SignIn
        routing="path"
        path="/sign-in"
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
        appearance={clerkAuthAppearance}
      />
    </AuthShell>
  );
}
