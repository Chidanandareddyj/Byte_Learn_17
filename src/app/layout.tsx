import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import {
  Atkinson_Hyperlegible,
  Caveat,
  Fraunces,
  Space_Mono,
} from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-caveat",
  display: "swap",
});

/* Indic scripts (Devanagari, Telugu, Tamil, Kannada, Malayalam, Bengali,
   Gujarati) fall back to the OS's installed Noto/system fonts via the
   font stacks in globals.css. next/font Noto loaders broke the build. */

export const metadata: Metadata = {
  title: "ByteLearn — Ask it. Learn it.",
  description:
    "Turn any question into a chalkboard-style animated lesson, narrated in English, Hindi, Telugu, Tamil, Kannada, Malayalam, Bengali, Marathi or Gujarati.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVariables = [
    fraunces.variable,
    atkinson.variable,
    spaceMono.variable,
    caveat.variable,
  ].join(" ");

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${fontVariables} font-sans antialiased overflow-x-hidden min-h-screen`}
        >
          {/* Providers ensure TanStack Query and theming are available across the app */}
          <AppProviders>{children}</AppProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
