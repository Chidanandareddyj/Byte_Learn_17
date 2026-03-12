import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  title: "ByteLearn",
  description: "Ask it. Learn it. Visual Mathematics Generator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${sourceSerif.variable} ${jetbrainsMono.variable} font-serif antialiased bg-bytelearn-back text-[#f0f4f2] text-sm overflow-x-hidden min-h-screen`}>
          {/* Providers ensure TanStack Query and theming are available across the app */}
          <AppProviders>{children}</AppProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
