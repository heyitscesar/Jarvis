import { describe, it, expect } from 'vitest';
import { valueToHex } from './utils';

describe('valueToHex', () => {
  it('should convert a middle value correctly', () => {
    expect(valueToHex(128)).toBe('#808080');
  });

  it('should convert the minimum value (0) correctly', () => {
    expect(valueToHex(0)).toBe('#000000');
  });

  it('should convert the maximum value (255) correctly', () => {
    expect(valueToHex(255)).toBe('#ffffff');
  });

  it('should handle single-digit hex values by padding with a zero', () => {
    expect(valueToHex(10)).toBe('#0a0a0a');
  });

  it('should round floating point numbers', () => {
    expect(valueToHex(128.7)).toBe('#818181');
    expect(valueToHex(128.4)).toBe('#808080');
  });

  it('should clamp values below 0', () => {
    expect(valueToHex(-10)).toBe('#000000');
  });

  it('should clamp values above 255', () => {
    expect(valueToHex(300)).toBe('#ffffff');
  });
});
