import type { User, UserRole } from '../../src/types.ts';
import type { IAuthService, LoginResult } from './interfaces/IAuthService.ts';
import type { IUserRepository } from '../repositories/interfaces/IUserRepository.ts';
import type { RateLimiter } from '../security/RateLimiter.ts';
import type { AuditLogger } from '../security/AuditLogger.ts';
import { InputValidator } from '../security/InputValidator.ts';
import { 
  verifyPassword, 
  createUser, 
  createSession, 
  getSessionUser, 
  revokeSession 
} from '../../database.ts';

/**
 * Single Responsibility: User authentication, brute-force defense, and credential auditing.
 * Dependency Inversion: Operates with IUserRepository, RateLimiter, and AuditLogger abstractions.
 */
export class AuthService implements IAuthService {
  constructor(
    private userRepo: IUserRepository,
    private rateLimiter?: RateLimiter,
    private auditLogger?: AuditLogger
  ) {}

  login(username: string, passwordPlain: string, clientIp = '127.0.0.1'): LoginResult {
    const cleanUsername = InputValidator.sanitizeString(username, 50).toLowerCase();

    if (!cleanUsername || !passwordPlain) {
      return { error: 'Usuário e senha são obrigatórios' };
    }

    // 1. Check Rate Limiter (Brute-force protection)
    const rateLimitKey = `${clientIp}:${cleanUsername}`;
    if (this.rateLimiter) {
      const lockout = this.rateLimiter.checkLockout(rateLimitKey);
      if (lockout.isLocked) {
        this.auditLogger?.log({
          type: 'LOGIN_LOCKED',
          severity: 'security_alert',
          ip: clientIp,
          username: cleanUsername,
          details: `Tentativa de login rejeitada: conta/IP temporariamente bloqueado por excesso de tentativas (${lockout.remainingSeconds}s restantes)`
        });
        return {
          error: `Acesso bloqueado temporariamente por excesso de tentativas incorretas. Tente novamente em ${lockout.remainingSeconds} segundos.`,
          isLocked: true,
          remainingSeconds: lockout.remainingSeconds
        };
      }
    }

    // 2. Fetch stored user
    const storedUser = this.userRepo.findByUsername(cleanUsername);
    if (!storedUser) {
      return this.handleFailedLogin(rateLimitKey, cleanUsername, clientIp);
    }

    // 3. Cryptographic password verification (PBKDF2 timing-safe)
    const isValid = verifyPassword(passwordPlain, storedUser.passwordHash, storedUser.salt);
    if (!isValid) {
      return this.handleFailedLogin(rateLimitKey, cleanUsername, clientIp);
    }

    // 4. Success: Reset failed attempts counter and issue session token
    this.rateLimiter?.resetAttempts(rateLimitKey);
    const token = createSession(storedUser.id);
    const { passwordHash: _, salt: __, ...safeUser } = storedUser;

    this.auditLogger?.log({
      type: 'LOGIN_SUCCESS',
      severity: 'info',
      ip: clientIp,
      username: cleanUsername,
      details: `Login bem-sucedido para '${cleanUsername}' (${safeUser.role})`
    });

    return { token, user: safeUser };
  }

  private handleFailedLogin(rateLimitKey: string, username: string, clientIp: string): LoginResult {
    let isLocked = false;
    let remainingSeconds = 0;
    let remainingAttempts: number | undefined = undefined;

    if (this.rateLimiter) {
      const lockoutInfo = this.rateLimiter.recordFailedAttempt(rateLimitKey);
      isLocked = lockoutInfo.isLocked;
      remainingSeconds = lockoutInfo.remainingSeconds;
      remainingAttempts = Math.max(0, lockoutInfo.maxAttempts - lockoutInfo.attemptsCount);
    }

    this.auditLogger?.log({
      type: isLocked ? 'LOGIN_LOCKED' : 'LOGIN_FAILED',
      severity: isLocked ? 'security_alert' : 'warn',
      ip: clientIp,
      username,
      details: isLocked
        ? `Conta bloqueada após atingir limite de tentativas falhas (restam ${remainingSeconds}s)`
        : `Tentativa de login com senha incorreta para '${username}' (${remainingAttempts} tentativas restantes)`
    });

    if (isLocked) {
      return {
        error: `Conta bloqueada por excesso de tentativas incorretas. Aguarde ${remainingSeconds} segundos antes de tentar novamente.`,
        isLocked: true,
        remainingSeconds
      };
    }

    const attemptWarning = remainingAttempts !== undefined 
      ? ` (Você tem mais ${remainingAttempts} tentativa${remainingAttempts === 1 ? '' : 's'} antes do bloqueio)` 
      : '';

    return {
      error: `Usuário ou senha incorretos.${attemptWarning}`,
      isLocked: false,
      remainingAttempts
    };
  }

  register(data: {
    username: string;
    name: string;
    passwordPlain: string;
    role?: UserRole;
  }): { token?: string; user?: User; error?: string } {
    const cleanUsername = InputValidator.sanitizeString(data.username, 30).toLowerCase();
    const cleanName = InputValidator.sanitizeString(data.name, 50);

    if (!InputValidator.isValidUsername(cleanUsername)) {
      return { error: 'Nome de usuário inválido. Utilize de 3 a 30 letras, números ou _ - .' };
    }

    const result = createUser({
      username: cleanUsername,
      name: cleanName,
      passwordPlain: data.passwordPlain,
      role: data.role || 'garcom'
    });

    if (!result.success || !result.user) {
      return { error: result.error || 'Falha ao cadastrar usuário' };
    }

    const token = createSession(result.user.id);
    return { token, user: result.user };
  }

  validateSession(token: string): User | null {
    if (!token) return null;
    return getSessionUser(token);
  }

  logout(token: string): boolean {
    if (!token) return true;
    return revokeSession(token);
  }

  getAllUsers(): User[] {
    return this.userRepo.findAll();
  }
}
