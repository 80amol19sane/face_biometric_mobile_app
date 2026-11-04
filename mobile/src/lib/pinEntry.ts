/** The PIN keypad's rules, kept out of the screen so they can be tested. */
export function pressDigit(digits: string, digit: string, max: number): string {
  return /^\d$/.test(digit) && digits.length < max ? digits + digit : digits;
}

export const backspace = (digits: string) => digits.slice(0, -1);

export const canVerify = (digits: string, min: number) => digits.length >= min;

/** Dots for the display: filled for each digit entered, empty up to the longest allowed PIN. */
export function dotStates(digits: string, max: number): boolean[] {
  return Array.from({ length: max }, (_, i) => i < digits.length);
}
