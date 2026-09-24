import * as p from "@clack/prompts";
import color from "picocolors";
import { parseDate } from "./status";

/** Returns the value, or exits cleanly when the user hits Ctrl+C / Esc. */
export function required<T>(
  value: T,
  message = "Cancelled",
): Exclude<T, symbol> {
  if (p.isCancel(value)) {
    p.cancel(message);
    process.exit(0);
  }

  return value as Exclude<T, symbol>;
}

/** Blank input means "no value" for every optional banner field. */
export function optionalText(value: string): string | null {
  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

export function validateUrl(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";

  if (trimmed === "") return "A URL is required here.";

  try {
    new URL(trimmed);
    return undefined;
  } catch {
    return "That is not a valid URL (include https://).";
  }
}

/** Same as `validateUrl`, but blank is allowed and means "clear it". */
export function validateOptionalUrl(
  value: string | undefined,
): string | undefined {
  return (value?.trim() ?? "") === "" ? undefined : validateUrl(value);
}

/** Blank is allowed and means "unset"; bare numbers are rejected. */
export function validateOptionalDate(
  value: string | undefined,
): string | undefined {
  const trimmed = value?.trim() ?? "";

  if (trimmed === "") return undefined;

  return parseDate(trimmed)
    ? undefined
    : "Use a date like 2026-09-01T22:00:00Z, not a plain number.";
}

/** Renders a value for review output, with a visible marker for "not set". */
export function display(value: string | boolean | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return color.dim("—");
  }

  if (typeof value === "boolean") {
    return value ? color.green("yes") : color.dim("no");
  }

  return value;
}
