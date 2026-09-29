export interface LockoutInfo {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsCount: number;
  maxAttempts: number;
}

/**
 * Single Responsibility: Rate limiting and brute-force prevention.
 * Implements exponential/fixed lockout duration for consecutive failed attempts.
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; firstAttemptAt: number; lockedUntil: number }> = new Map();
  private readonly maxAttempts: number;
  private readonly lockoutDurationSeconds: number;
  private readonly windowDurationSeconds: number;

  constructor(
    maxAttempts = 5,
    lockoutDurationSeconds = 180, // 3 minutes lockout
    windowDurationSeconds = 300   // 5 minutes attempt window
  ) {
    this.maxAttempts = maxAttempts;
    this.lockoutDurationSeconds = lockoutDurationSeconds;
    this.windowDurationSeconds = windowDurationSeconds;
  }

  checkLockout(key: string): LockoutInfo {
    const cleanKey = key.trim().toLowerCase();
    const entry = this.attempts.get(cleanKey);
    const now = Date.now();

    if (!entry) {
      return {
        isLocked: false,
        remainingSeconds: 0,
        attemptsCount: 0,
        maxAttempts: this.maxAttempts
      };
    }

    // Check if currently locked
    if (entry.lockedUntil > now) {
      const remainingSeconds = Math.ceil((entry.lockedUntil - now) / 1000);
      return {
        isLocked: true,
        remainingSeconds,
        attemptsCount: entry.count,
        maxAttempts: this.maxAttempts
      };
    }

    // If lockout has passed or window expired, reset
    if (now - entry.firstAttemptAt > this.windowDurationSeconds * 1000) {
      this.attempts.delete(cleanKey);
      return {
        isLocked: false,
        remainingSeconds: 0,
        attemptsCount: 0,
        maxAttempts: this.maxAttempts
      };
    }

    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsCount: entry.count,
      maxAttempts: this.maxAttempts
    };
  }

  recordFailedAttempt(key: string): LockoutInfo {
    const cleanKey = key.trim().toLowerCase();
    const now = Date.now();
    const entry = this.attempts.get(cleanKey) || { count: 0, firstAttemptAt: now, lockedUntil: 0 };

    entry.count += 1;

    if (entry.count >= this.maxAttempts) {
      entry.lockedUntil = now + this.lockoutDurationSeconds * 1000;
      this.attempts.set(cleanKey, entry);
      return {
        isLocked: true,
        remainingSeconds: this.lockoutDurationSeconds,
        attemptsCount: entry.count,
        maxAttempts: this.maxAttempts
      };
    }

    this.attempts.set(cleanKey, entry);
    return {
      isLocked: false,
      remainingSeconds: 0,
      attemptsCount: entry.count,
      maxAttempts: this.maxAttempts
    };
  }

  resetAttempts(key: string): void {
    const cleanKey = key.trim().toLowerCase();
    this.attempts.delete(cleanKey);
  }
}
