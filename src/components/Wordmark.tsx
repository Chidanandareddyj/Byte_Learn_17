import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Wordmark() {
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
