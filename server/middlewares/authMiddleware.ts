import type { Request, Response, NextFunction } from 'express';
import type { IAuthService } from '../services/interfaces/IAuthService.ts';
import type { AuditLogger } from '../security/AuditLogger.ts';
import type { User, UserRole } from '../../src/types.ts';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/**
 * Single Responsibility: Role-Based Access Control (RBAC) and request authentication verification.
 */
export function createAuthMiddleware(authService: IAuthService, auditLogger: AuditLogger) {
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.query.token as string);

    if (!token) {
      auditLogger.log({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'warn',
        ip: req.ip,
        details: `Tentativa de acesso não autenticado a ${req.method} ${req.path}`
      });
      return res.status(401).json({ error: 'Acesso não autorizado: Faça login para continuar' });
    }

    const user = authService.validateSession(token);
    if (!user) {
      auditLogger.log({
        type: 'UNAUTHORIZED_ACCESS',
        severity: 'warn',
        ip: req.ip,
        details: `Token de sessão expirado ou inválido em ${req.method} ${req.path}`
      });
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente' });
    }

    req.user = user;
    next();
  };

  const requireRole = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      // First ensure user is authenticated
      if (!req.user) {
        return requireAuth(req, res, () => {
          checkRole();
        });
      }
      checkRole();

      function checkRole() {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
          auditLogger.log({
            type: 'UNAUTHORIZED_ACCESS',
            severity: 'security_alert',
            ip: req.ip,
            username: req.user?.username,
            details: `Acesso negado: Perfil '${req.user?.role || 'anônimo'}' tentou acessar recurso restrito [${allowedRoles.join(', ')}] em ${req.method} ${req.path}`
          });
          return res.status(403).json({ 
            error: `Acesso restrito: Requer perfil [${allowedRoles.join(' ou ')}]. Seu perfil atual é '${req.user?.role}'.` 
          });
        }
        next();
      }
    };
  };

  return { requireAuth, requireRole };
}
