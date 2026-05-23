export const FOCAL_POSITIONS = ["center", "top", "bottom"] as const;

export type FocalPosition = (typeof FOCAL_POSITIONS)[number];

export function normalizeFocalPosition(value: string | null | undefined): FocalPosition {
  return value === "top" || value === "bottom" ? value : "center";
}

export function focalPositionToCss(value: string | null | undefined): string {
  const focalPosition = normalizeFocalPosition(value);

  if (focalPosition === "top") {
    return "center top";
  }

  if (focalPosition === "bottom") {
    return "center bottom";
  }

  return "center center";
}
