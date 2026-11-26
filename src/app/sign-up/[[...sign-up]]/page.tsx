import { SignUp } from "@clerk/nextjs";
import { AuthShell, clerkAuthAppearance } from "@/components/AuthShell";

export default function Page() {
  return (
    <AuthShell kicker="pull up a seat">
      <SignUp
        routing="path"
        path="/sign-up"
        fallbackRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
        appearance={clerkAuthAppearance}
      />
    </AuthShell>
  );
}
