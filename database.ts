import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { User, UserRole } from './src/types';

export interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
}

const SEED_FILE = path.join(process.cwd(), 'data', 'database.json');
const DB_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Cryptographic password hashing using PBKDF2 with SHA-512 and random salt
export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    const computedBuf = Buffer.from(computed, 'hex');
    if (storedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(storedBuf, computedBuf);
  } catch (err) {
    return false;
  }
}

// In-memory cache synced with disk
let cachedDb: DatabaseSchema | null = null;

function getInitialUsers(): StoredUser[] {
  const now = new Date().toISOString();

  return [
    {
      id: 'user-admin',
      username: 'admin',
      name: 'Gerente Geral',
      role: 'admin',
      passwordHash: '5c7c222d910e53e83d48f7ea3b3516689ed53f1c2a69e6d92f9429080b8d856e3103e266f8fadb5e9ee34a9ab8967c36b458545899a1657025c16ba0fb97ad15',
      salt: 'a1e5530019486f1467f85b0165a328c4',
      createdAt: now
    },
    {
      id: 'user-caixa',
      username: 'caixa',
      name: 'Operador de Caixa',
      role: 'caixa',
      passwordHash: 'b9f1dbc666b7af49747ff09b9ee3c3f8550ecc155318179823a99d11ab6b9be32aad2af538b502755110b1e5f6ad4bd54761d65b38d72c2623cd968dde1371f4',
      salt: 'bda913ba0aef8b373d6585392703774d',
      createdAt: now
    },
    {
      id: 'user-garcom',
      username: 'garcom',
      name: 'Carlos Garçom',
      role: 'garcom',
      passwordHash: '9653e632a0f3525a50f1df1fdc1cda2ee2260baef1bcee80cfa9ba93562dd2f587fd2cbf004f034f4ad3a35227699ed8dadc1f3e4666a25eaf94d453ec88fcce',
      salt: 'a268fb254260b6781bb613ef5e98bfee',
      createdAt: now
    }
  ];
}

export function loadDatabase(): DatabaseSchema {
  if (cachedDb) return cachedDb;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        cachedDb = parsed;
        return cachedDb;
      }
    } else if (fs.existsSync(SEED_FILE)) {
      const seedContent = fs.readFileSync(SEED_FILE, 'utf-8');
      const parsedSeed = JSON.parse(seedContent);
      if (parsedSeed && Array.isArray(parsedSeed.users) && parsedSeed.users.length > 0) {
        saveDatabase(parsedSeed);
        cachedDb = parsedSeed;
        return cachedDb;
      }
    }
  } catch (err) {
    console.error('Erro ao ler banco de dados em disco, reinicializando...', err);
  }

  // If file does not exist or empty, initialize with default encrypted users
  const defaultData: DatabaseSchema = {
    users: getInitialUsers()
  };

  saveDatabase(defaultData);
  cachedDb = defaultData;
  return cachedDb;
}

export function saveDatabase(data: DatabaseSchema) {
  cachedDb = data;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    // Atomic Write: Write to temp file then rename to guarantee file integrity
    const tempFile = path.join(DB_DIR, `database.${Date.now()}.${Math.random().toString(36).substring(2, 6)}.tmp`);
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.warn('Persistência em disco não disponível no ambiente atual, mantendo em memória:', err);
  }
}

export function findUserByUsername(username: string): StoredUser | undefined {
  if (!username || typeof username !== 'string') return undefined;
  const db = loadDatabase();
  return db.users.find(u => u.username && u.username.toLowerCase() === username.trim().toLowerCase());
}

export function findUserById(id: string): StoredUser | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const db = loadDatabase();
  return db.users.find(u => u.id === id);
}

export function listUsers(): User[] {
  const db = loadDatabase();
  // Return users without exposing passwordHash or salt
  return db.users.map(({ passwordHash, salt, ...safeUser }) => safeUser);
}

export function createUser(data: {
  username: string;
  name: string;
  passwordPlain: string;
  role: UserRole;
}): { success: boolean; user?: User; error?: string } {
  const cleanUsername = data.username.trim().toLowerCase();
  if (!cleanUsername || cleanUsername.length < 3) {
    return { success: false, error: 'Usuário deve ter pelo menos 3 caracteres' };
  }
  if (!data.passwordPlain || data.passwordPlain.length < 4) {
    return { success: false, error: 'Senha deve ter pelo menos 4 caracteres' };
  }

  const existing = findUserByUsername(cleanUsername);
  if (existing) {
    return { success: false, error: 'Este nome de usuário já está cadastrado' };
  }

  const { hash, salt } = hashPassword(data.passwordPlain);
  const newUser: StoredUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    username: cleanUsername,
    name: data.name.trim() || cleanUsername,
    role: data.role || 'garcom',
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString()
  };

  const db = loadDatabase();
  db.users.push(newUser);
  saveDatabase(db);

  const { passwordHash: _, salt: __, ...safeUser } = newUser;
  return { success: true, user: safeUser };
}

// Active session tokens mapped in memory
const activeSessions = new Map<string, { userId: string; createdAt: number }>();

export function createSession(userId: string): string {
  const token = `token-${crypto.randomBytes(24).toString('hex')}`;
  activeSessions.set(token, { userId, createdAt: Date.now() });
  return token;
}

export function getSessionUser(token: string): User | null {
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;

  // Session expiry after 7 days
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - session.createdAt > sevenDays) {
    activeSessions.delete(token);
    return null;
  }

  const stored = findUserById(session.userId);
  if (!stored) return null;

  const { passwordHash, salt, ...safeUser } = stored;
  return safeUser;
}

export function revokeSession(token: string): boolean {
  return activeSessions.delete(token);
}
