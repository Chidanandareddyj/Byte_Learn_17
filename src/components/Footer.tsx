import { GraduationCap } from "lucide-react";
import Link from "next/link";

const productLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#examples", label: "Examples" },
  { href: "/#languages", label: "Languages" },
  { href: "/dashboard", label: "Dashboard" },
];

const companyLinks = ["About", "Contact", "Privacy"];

export function Footer() {
  return (
    <footer className="relative z-10 mt-20 w-full border-t border-line/70">
      <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              aria-label="ByteLearn home"
              className="inline-flex items-center gap-2.5 text-chalk transition-opacity hover:opacity-90"
            >
              <GraduationCap
                className="h-6 w-6 text-yellow"
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <span className="font-serif text-[20px] font-normal italic uppercase leading-none tracking-[0.14em]">
                ByteLearn
              </span>
            </Link>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              A warm classroom for curious minds. Turn any question into a
              chalkboard-style lesson, narrated in the language you think in.
            </p>
            <p className="hand mt-4 text-[22px] text-yellow">
              learn something new today
            </p>
          </div>

          <div>
            <h2 className="mono-label mb-5 text-chalk/80">Product</h2>
            <ul className="space-y-3 text-[15px] text-muted">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-chalk"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mono-label mb-5 text-chalk/80">Company</h2>
            <ul className="space-y-3 text-[15px] text-muted">
              {companyLinks.map((label) => (
                <li key={label}>
                  <span
                    aria-disabled="true"
                    title={`${label} is coming soon`}
                    className="inline-flex cursor-default items-center gap-2"
                  >
                    {label}
                    <span className="mono-label rounded-full border border-yellow/30 px-2 py-0.5 text-[9px] text-yellow/80">
                      soon
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="mono-label">
            © {new Date().getFullYear()} ByteLearn
          </p>
          <p className="mono-label">
            Made for curious minds · 9 languages
          </p>
        </div>
      </div>
    </footer>
  );
}
