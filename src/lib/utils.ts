import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Small helper to compose Tailwind class names with variants
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


