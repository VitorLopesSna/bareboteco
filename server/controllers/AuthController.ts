import type { Request, Response } from 'express';
import type { IAuthService } from '../services/interfaces/IAuthService.ts';
import { InputValidator } from '../security/InputValidator.ts';

/**
 * Single Responsibility: Handling HTTP endpoints for Authentication.
 * Dependency Inversion: Receives IAuthService.
 */
export class AuthController {
  private authService: IAuthService;

  constructor(authService: IAuthService) {
    this.authService = authService;
  }

  login = (req: Request, res: Response) => {
    try {
      const { username, password } = req.body || {};
      const clientIp = InputValidator.getClientIp(req);
      const result = this.authService.login(username, password, clientIp);

      if (result.error) {
        const statusCode = result.isLocked ? 429 : 401;
        return res.status(statusCode).json(result);
      }

      return res.json(result);
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: err?.message || 'Erro ao realizar login' });
    }
  };

  register = (req: Request, res: Response) => {
    try {
      const { username, name, password, role } = req.body || {};
      const result = this.authService.register({
        username,
        name,
        passwordPlain: password,
        role
      });

      if (result.error || !result.user) {
        return res.status(400).json({ error: result.error || 'Falha ao cadastrar usuário' });
      }

      return res.json({ token: result.token, user: result.user });
    } catch (err: any) {
      console.error('Register error:', err);
      return res.status(500).json({ error: err?.message || 'Erro ao cadastrar usuário' });
    }
  };

  me = (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : (req.query.token as string);

    if (!token) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = this.authService.validateSession(token);
    if (!user) {
      return res.status(401).json({ error: 'Sessão inválida ou expirada' });
    }

    return res.json({ user });
  };

  logout = (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : (req.body?.token as string);

    if (token) {
      this.authService.logout(token);
    }
    return res.json({ success: true });
  };

  listUsers = (_req: Request, res: Response) => {
    const users = this.authService.getAllUsers();
    return res.json({ users });
  };
}
