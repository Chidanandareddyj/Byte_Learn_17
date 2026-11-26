"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface NavbarProps {
  variant?: "landing" | "app";
}

const landingLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#examples", label: "Examples" },
  { href: "/#languages", label: "Languages" },
];

const clerkAppearance = {
  variables: {
    colorPrimary: "#F4D35E",
    colorText: "#EEE9DA",
    colorTextSecondary: "#AAB5AC",
    colorBackground: "#22302C",
    colorInputBackground: "#1A2421",
    colorInputText: "#EEE9DA",
    colorNeutral: "#EEE9DA",
    fontFamily: "var(--font-atkinson), sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    avatarBox: "h-9 w-9 ring-1 ring-chalk/30 cursor-pointer",
    userButtonPopoverCard:
      "bg-board border border-line rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.45)]",
    userButtonPopoverActionButton: "hover:bg-chalk/5 text-chalk",
    userButtonPopoverActionButtonText: "text-chalk font-sans",
    userButtonPopoverActionButtonIcon: "text-muted",
    userPreviewMainIdentifier: "text-chalk font-sans",
    userPreviewSecondaryIdentifier: "text-muted font-sans",
  },
};

function Wordmark() {
  return (
    <Link
      href="/"
      aria-label="ByteLearn home"
      className="inline-flex shrink-0 items-center gap-2.5 text-chalk transition-opacity hover:opacity-90"
      data-testid="link-home"
    >
      <GraduationCap
        className="h-[22px] w-[22px] text-yellow"
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span className="font-serif text-[19px] font-normal italic uppercase leading-none tracking-[0.14em]">
        ByteLearn
      </span>
    </Link>
  );
}

export function Navbar({ variant = "landing" }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((open) => !open);

  const mobileToggle = (
    <button
      type="button"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-chalk/25 text-chalk md:hidden"
      onClick={toggleMobileMenu}
      aria-expanded={isMobileMenuOpen}
      aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
    >
      {isMobileMenuOpen ? (
        <X className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Menu className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );

  if (variant === "landing") {
    return (
      <nav className="fixed inset-x-0 top-0 z-[100] border-b border-line/50 bg-slate/75 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-8 px-5 sm:px-8 lg:px-12">
          <Wordmark />

          <div className="ml-2 hidden items-center gap-7 md:flex">
            {landingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[15px] text-muted transition-colors hover:text-chalk"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <SignedOut>
              <Link
                href="/sign-in"
                className="hidden px-2 text-[15px] font-bold text-chalk/85 transition-colors hover:text-chalk sm:inline-flex"
                onClick={closeMenu}
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="btn-pill btn-pill-primary h-[42px] px-4 text-sm sm:px-5 sm:text-[15px]"
                onClick={closeMenu}
              >
                Start learning
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="hidden px-2 text-[15px] font-bold text-chalk/85 transition-colors hover:text-chalk sm:inline-flex"
                onClick={closeMenu}
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
            </SignedIn>
            {mobileToggle}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute inset-x-0 top-full border-b border-line bg-slate/95 px-5 py-5 shadow-2xl backdrop-blur-md md:hidden">
            <div className="flex flex-col gap-1">
              {landingLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-[15px] text-muted transition-colors hover:bg-chalk/5 hover:text-chalk"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <SignedOut>
              <div className="mt-4 flex flex-col gap-2 border-t border-line/70 pt-4">
                <Link
                  href="/sign-in"
                  className="btn-pill w-full"
                  onClick={closeMenu}
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="btn-pill btn-pill-primary w-full"
                  onClick={closeMenu}
                >
                  Start learning
                </Link>
              </div>
            </SignedOut>
            <SignedIn>
              <div className="mt-4 border-t border-line/70 pt-4">
                <Link
                  href="/dashboard"
                  className="btn-pill w-full"
                  onClick={closeMenu}
                >
                  Dashboard
                </Link>
              </div>
            </SignedIn>
          </div>
        )}
      </nav>
    );
  }

  // Application navbar (dashboard, learn, etc.)
  return (
    <nav className="fixed inset-x-0 top-0 z-[100] h-[72px] border-b border-line/70 bg-slate/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-6 px-5 sm:px-8 lg:px-10">
        <Wordmark />

        <div className="ml-2 hidden items-center gap-6 sm:flex">
          <Link
            href="/dashboard"
            className="text-[15px] font-bold text-chalk/85 transition-colors hover:text-chalk"
            data-testid="button-dashboard"
          >
            Dashboard
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />
          <SignedOut>
            <Link
              href="/sign-in"
              className="hidden px-2 text-[15px] font-bold text-chalk/85 transition-colors hover:text-chalk sm:inline-flex"
              onClick={closeMenu}
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="btn-pill btn-pill-primary hidden h-[42px] px-5 text-[15px] sm:inline-flex"
              onClick={closeMenu}
            >
              Start learning
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
          </SignedIn>
          {mobileToggle}
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-slate/95 px-5 py-5 shadow-2xl backdrop-blur-md sm:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2.5 text-[15px] text-muted transition-colors hover:bg-chalk/5 hover:text-chalk"
              onClick={closeMenu}
            >
              Dashboard
            </Link>
          </div>
          <SignedOut>
            <div className="mt-4 flex flex-col gap-2 border-t border-line/70 pt-4">
              <Link href="/sign-in" className="btn-pill w-full" onClick={closeMenu}>
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="btn-pill btn-pill-primary w-full"
                onClick={closeMenu}
              >
                Start learning
              </Link>
            </div>
          </SignedOut>
        </div>
      )}
    </nav>
  );
}
