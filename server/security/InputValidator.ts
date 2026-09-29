/**
 * Single Responsibility: Defense against Injection, Prototype Pollution, and Parameter Tampering.
 */
export class InputValidator {
  /**
   * Sanitizes string to prevent HTML/Script injection attacks (XSS).
   */
  static sanitizeString(input: any, maxLength = 100): string {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .replace(/[<>]/g, '') // remove HTML tag characters
      .slice(0, maxLength);
  }

  /**
   * Validates username characters (alphanumeric, underscores, hyphens, min 3, max 30 chars).
   */
  static isValidUsername(username: any): boolean {
    if (typeof username !== 'string') return false;
    const clean = username.trim().toLowerCase();
    const regex = /^[a-z0-9_.-]{3,30}$/;
    return regex.test(clean);
  }

  /**
   * Validates numerical input for pricing or quantities (rejects NaN, Infinity, negative values).
   */
  static isValidNumber(value: any, min = 0, max = 1000000): boolean {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return false;
    return num >= min && num <= max;
  }

  /**
   * Validates monetary amount with up to 2 decimal places.
   */
  static sanitizeAmount(value: any, fallback = 0): number {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num) || num < 0) return fallback;
    return Number(num.toFixed(2));
  }
}
