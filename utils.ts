/**
 * Converts a numerical value to a grayscale hex color string.
 * @param value - The value to convert (clamped between 0 and 255).
 * @returns A hex color string (e.g., "#3a3a3a").
 */
export const valueToHex = (value: number): string => {
  const hex = Math.round(Math.max(0, Math.min(255, value)))
    .toString(16)
    .padStart(2, '0');
  return `#${hex}${hex}${hex}`;
};
