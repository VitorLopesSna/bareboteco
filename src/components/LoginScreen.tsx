import React, { useState, useEffect } from 'react';
import { 
  Wine, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ShieldAlert,
  Shield,
  ArrowRight, 
  UserPlus, 
  LogIn, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Sparkles,
  KeyRound,
  Timer
} from 'lucide-react';
import type { User, UserRole } from '../types';
import * as api from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Brute-force & Rate limiting security state
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('garcom');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  // Live countdown timer for brute force lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          setLoginError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    if (!loginUsername.trim() || !loginPassword) {
      setLoginError('Informe usuário e senha para continuar');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await api.loginUser(loginUsername.trim(), loginPassword);
      setRemainingAttempts(null);
      setLockoutSeconds(0);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao realizar login');
      if (err.isLocked && err.remainingSeconds) {
        setLockoutSeconds(err.remainingSeconds);
      }
      if (err.remainingAttempts !== undefined) {
        setRemainingAttempts(err.remainingAttempts);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Quick One-click Demo Login
  const handleQuickLogin = async (username: string, pass: string) => {
    if (lockoutSeconds > 0) return;
    setLoginUsername(username);
    setLoginPassword(pass);
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await api.loginUser(username, pass);
      setRemainingAttempts(null);
      setLockoutSeconds(0);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setLoginError(err.message || 'Erro ao realizar login rápido');
      if (err.isLocked && err.remainingSeconds) {
        setLockoutSeconds(err.remainingSeconds);
      }
      if (err.remainingAttempts !== undefined) {
        setRemainingAttempts(err.remainingAttempts);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regPassword) {
      setRegError('Preencha todos os campos obrigatórios');
      return;
    }

    setRegLoading(true);
    setRegError(null);
    setRegSuccessMsg(null);

    try {
      const res = await api.registerUser({
        name: regName.trim(),
        username: regUsername.trim(),
        password: regPassword,
        role: regRole
      });
      setRegSuccessMsg(`Usuário ${res.user.name} cadastrado com sucesso no banco de dados!`);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 1000);
    } catch (err: any) {
      setRegError(err.message || 'Erro ao cadastrar novo usuário');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 flex flex-col justify-center items-center p-4 sm:p-6 text-stone-100 selection:bg-amber-500 selection:text-stone-950">
      {/* Subtle background glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-stone-950 shadow-xl shadow-amber-500/20 mb-3 transform hover:scale-105 transition-transform">
            <Wine className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            Boteco & Bar
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 font-medium">
            Sistema de Gestão de Mesas, Estoque & Comandas
          </p>

          {/* Database & Security Banner */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-3 rounded-full bg-stone-800/90 border border-stone-700/80 text-[11px] font-semibold text-stone-300 shadow-xs">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Banco de Dados</span>
            <span className="text-stone-500">•</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300">Senha Criptografada (PBKDF2)</span>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-stone-900/90 backdrop-blur-md rounded-2xl border border-stone-800 shadow-2xl p-6 sm:p-8">
          {/* Tabs: Entrar vs Cadastrar */}
          <div className="flex rounded-xl bg-stone-950 p-1 mb-6 border border-stone-800/80">
            <button
              type="button"
              id="tab-login"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
                setRegError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar no Sistema</span>
            </button>
            <button
              type="button"
              id="tab-register"
              onClick={() => {
                setActiveTab('register');
                setLoginError(null);
                setRegError(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Novo Usuário</span>
            </button>
          </div>

          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Brute-force Lockout Alert Banner */}
              {lockoutSeconds > 0 && (
                <div className="p-4 rounded-xl bg-rose-950/80 border-2 border-rose-600/80 text-rose-200 text-xs space-y-2 shadow-lg animate-pulse">
                  <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>Bloqueio de Segurança Ativo</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed">
                    Muitas tentativas incorretas foram detectadas a partir deste dispositivo. O acesso foi suspenso temporariamente para proteção do sistema.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-rose-800/50">
                    <div className="flex items-center gap-1.5 text-rose-300 font-mono font-bold">
                      <Timer className="w-4 h-4 text-rose-400" />
                      <span>Desbloqueio em: {lockoutSeconds}s</span>
                    </div>
                    <span className="text-[11px] text-stone-400">Proteção Ativa contra Brute-Force</span>
                  </div>
                </div>
              )}

              {/* Standard error or attempt warnings (when not completely locked out) */}
              {loginError && lockoutSeconds === 0 && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <div className="flex-1">
                    <span>{loginError}</span>
                  </div>
                </div>
              )}

              {/* Remaining attempts notice before lockout */}
              {remainingAttempts !== null && remainingAttempts <= 3 && lockoutSeconds === 0 && (
                <div className="px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2 font-medium">
                  <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Atenção: Restam apenas <strong>{remainingAttempts}</strong> tentativa{remainingAttempts === 1 ? '' : 's'} antes do bloqueio da conta.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Nome de Usuário
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-username"
                    type="text"
                    disabled={lockoutSeconds > 0}
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    placeholder="Ex: admin, caixa ou garcom"
                    autoComplete="username"
                    required
                    className="w-full pl-9.5 pr-3 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors placeholder:text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    disabled={lockoutSeconds > 0}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    required
                    className="w-full pl-9.5 pr-10 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors placeholder:text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    disabled={lockoutSeconds > 0}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-200 disabled:opacity-40"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={loginLoading || lockoutSeconds > 0}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {lockoutSeconds > 0 ? (
                  <div className="flex items-center gap-2 text-stone-950">
                    <Lock className="w-4 h-4" />
                    <span>Acesso Bloqueado ({lockoutSeconds}s)</span>
                  </div>
                ) : loginLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verificando no Banco...</span>
                  </div>
                ) : (
                  <>
                    <span>Acessar Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{regSuccessMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Nome Completo
                </label>
                <input
                  id="input-reg-name"
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  required
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors placeholder:text-stone-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Usuário de Login (min. 3 caracteres)
                </label>
                <input
                  id="input-reg-username"
                  type="text"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  placeholder="Ex: joao_bar"
                  required
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors placeholder:text-stone-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Perfil de Acesso
                </label>
                <select
                  id="select-reg-role"
                  value={regRole}
                  onChange={e => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors cursor-pointer"
                >
                  <option value="admin">Gerente / Administrador (Acesso total)</option>
                  <option value="caixa">Operador de Caixa (Mesas, Fechamento e Caixa)</option>
                  <option value="garcom">Garçom (Lançamento de Pedidos e Mesas)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 mb-1.5">
                  Senha (será criptografada no banco)
                </label>
                <input
                  id="input-reg-password"
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  required
                  className="w-full px-3 py-2.5 bg-stone-950 border border-stone-700/80 rounded-xl text-stone-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors placeholder:text-stone-600"
                />
                <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  A senha é criptografada com salt criptográfico único e hash PBKDF2.
                </p>
              </div>

              <button
                type="submit"
                id="btn-submit-register"
                disabled={regLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-black text-xs sm:text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {regLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>Gravando no Banco...</span>
                  </div>
                ) : (
                  <>
                    <span>Gravar no Banco e Entrar</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Access Section */}
          <div className="mt-6 pt-5 border-t border-stone-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-400 mb-2.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Acesso Rápido de Demonstração</span>
            </div>
            <p className="text-[11px] text-stone-500 mb-3 leading-relaxed">
              Usuários cadastrados no banco com senhas criptografadas. Clique para entrar com 1 clique:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                id="quick-login-admin"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 hover:border-amber-500/60 hover:bg-stone-800/80 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-amber-400 group-hover:text-amber-300">admin</span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold">Admin</span>
                </div>
                <div className="text-[10px] text-stone-400 truncate mt-0.5">admin123</div>
              </button>

              <button
                type="button"
                id="quick-login-caixa"
                onClick={() => handleQuickLogin('caixa', 'caixa123')}
                className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 hover:border-amber-500/60 hover:bg-stone-800/80 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-stone-200 group-hover:text-white">caixa</span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 font-bold">Caixa</span>
                </div>
                <div className="text-[10px] text-stone-400 truncate mt-0.5">caixa123</div>
              </button>

              <button
                type="button"
                id="quick-login-garcom"
                onClick={() => handleQuickLogin('garcom', 'garcom123')}
                className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800 hover:border-amber-500/60 hover:bg-stone-800/80 transition-all text-left group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-stone-200 group-hover:text-white">garcom</span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold">Garçom</span>
                </div>
                <div className="text-[10px] text-stone-400 truncate mt-0.5">garcom123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security assurance note */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-stone-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
            <span>Validação de credenciais no servidor com PBKDF2 e salt único</span>
          </p>
        </div>
      </div>
    </div>
  );
};
