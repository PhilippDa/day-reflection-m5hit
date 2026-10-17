/** Text color that stays readable on a `#rrggbb` background: black or white. */
export function readableInk(background: string): "#000000" | "#ffffff" {
  const channel = (offset: number): number => {
    const value = Number.parseInt(background.slice(offset, offset + 2), 16) / 255;
    return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  // Switch where white and near-black have the same contrast ratio against the background (about 4.6 to 1 at worst).
  return luminance > 0.179 ? "#000000" : "#ffffff";
}
