import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";

/** Clerk appearance for the sign-in and sign-up cards. Variables first; a few
 *  element classes so the card matches the chalkboard instead of the old navy look. */
export const clerkAuthAppearance = {
  variables: {
    colorPrimary: "#F4D35E",
    colorBackground: "#22302C",
    colorText: "#EEE9DA",
    colorTextSecondary: "#AAB5AC",
    colorInputBackground: "#F7F1E1",
    colorInputText: "#24324A",
    colorNeutral: "#EEE9DA",
    fontFamily: "var(--font-atkinson), sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    card: "bg-board border border-line rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.45)]",
    headerTitle: "font-serif italic font-normal text-chalk",
    headerSubtitle: "font-sans text-muted",
    formFieldLabel: "font-sans text-chalk",
    formFieldInput: "rounded-xl border-line font-sans",
    formButtonPrimary:
      "bg-yellow text-slate hover:bg-yellow-bright font-bold rounded-full shadow-none",
    socialButtonsBlockButton:
      "border border-line rounded-xl text-chalk hover:bg-chalk/5",
    socialButtonsBlockButtonText: "font-sans font-bold text-chalk",
    dividerLine: "bg-line",
    dividerText: "text-muted font-sans",
    footerActionText: "text-muted font-sans",
    footerActionLink: "text-yellow hover:text-yellow-bright font-bold",
  },
};

export function AuthShell({
  children,
  kicker,
}: {
  children: React.ReactNode;
  kicker: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Wordmark />
      <p className="hand mt-8 text-[26px] text-yellow">{kicker}</p>
      <div className="relative z-10 mt-4 w-full max-w-md">{children}</div>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 text-[15px] text-muted-foreground transition-colors hover:text-chalk"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
      </Link>
    </div>
  );
}
