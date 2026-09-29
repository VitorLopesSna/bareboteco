import type { Table, Product, Order, StockMovement, PrinterConfig, SalesReport, User, UserRole, AuthResponse } from '../types';

const TOKEN_KEY = 'boteco_auth_token';
const USER_KEY = 'boteco_auth_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export function removeStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function removeStoredUser() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {}
}

export interface LoginError extends Error {
  isLocked?: boolean;
  remainingSeconds?: number;
  remainingAttempts?: number;
}

export async function loginUser(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.error || 'Erro ao realizar login') as LoginError;
    error.isLocked = data.isLocked;
    error.remainingSeconds = data.remainingSeconds;
    error.remainingAttempts = data.remainingAttempts;
    throw error;
  }
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function registerUser(payload: {
  username: string;
  name: string;
  password: string;
  role: UserRole;
}): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erro ao cadastrar usuário');
  }
  setStoredToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function checkCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      removeStoredToken();
      removeStoredUser();
      return null;
    }
    const data = await res.json();
    setStoredUser(data.user);
    return data.user;
  } catch {
    // If offline or network error, fallback to stored user if exists
    return getStoredUser();
  }
}

export async function logoutUser(): Promise<void> {
  const token = getStoredToken();
  try {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      });
    }
  } catch {}
  removeStoredToken();
  removeStoredUser();
}

export async function fetchUsersList(): Promise<User[]> {
  const res = await fetch('/api/auth/users');
  if (!res.ok) throw new Error('Falha ao listar usuários');
  const data = await res.json();
  return data.users;
}

export interface AppState {
  tables: Table[];
  products: Product[];
  activeOrders: Record<string, Order>;
  historyOrders: Order[];
  stockMovements: StockMovement[];
  printerConfig: PrinterConfig;
}

export async function fetchAppState(): Promise<AppState> {
  const res = await fetch('/api/state');
  if (!res.ok) throw new Error('Falha ao carregar estado do servidor');
  return res.json();
}

export async function openTable(
  tableId: string, 
  waiterName?: string, 
  customerName?: string, 
  guestsCount?: number
): Promise<{ table: Table; order: Order }> {
  const res = await fetch(`/api/tables/${tableId}/open`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ waiterName, customerName, guestsCount })
  });
  if (!res.ok) throw new Error('Falha ao abrir mesa');
  return res.json();
}

export async function addItemsToTable(
  tableId: string, 
  items: Array<{ productId: string; quantity: number; notes?: string }>, 
  waiterName?: string
): Promise<{ table: Table; order: Order; newItems: any[] }> {
  const res = await fetch(`/api/tables/${tableId}/add-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, waiterName })
  });
  if (!res.ok) throw new Error('Falha ao adicionar itens ao pedido');
  return res.json();
}

export async function markItemsAsPrinted(
  tableId: string, 
  itemIds?: string[]
): Promise<{ success: boolean; table: Table; order: Order }> {
  const res = await fetch(`/api/tables/${tableId}/mark-printed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds })
  });
  if (!res.ok) throw new Error('Falha ao marcar itens impressos');
  return res.json();
}

export async function requestTableBill(tableId: string): Promise<{ table: Table; order: Order }> {
  const res = await fetch(`/api/tables/${tableId}/request-bill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Falha ao solicitar conta');
  return res.json();
}

export async function checkoutTable(
  tableId: string, 
  data: {
    paymentMethod: 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito';
    discount?: number;
    includeServiceTax?: boolean;
    customerName?: string;
    idempotencyKey?: string;
    cardLast4?: string;
    cardBrand?: string;
  }
): Promise<{ success: boolean; table: Table; closedOrder: Order; paymentReceipt?: any }> {
  const token = getStoredToken();
  const idempotencyKey = data.idempotencyKey || `idem-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const res = await fetch(`/api/tables/${tableId}/checkout`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ ...data, idempotencyKey })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Falha ao fechar conta da mesa');
  }
  return res.json();
}

export async function reopenOrder(
  orderId: string,
  targetTableId?: string
): Promise<{ success: boolean; table: Table; order: Order }> {
  const token = getStoredToken();
  const res = await fetch(`/api/orders/${orderId}/reopen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ targetTableId })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Falha ao reativar comanda');
  }
  return data;
}

export async function fetchSecurityStatus(): Promise<any> {
  const res = await fetch('/api/security/status');
  if (!res.ok) throw new Error('Falha ao verificar status de segurança');
  return res.json();
}

export async function fetchSecurityAuditLogs(): Promise<{ logs: any[] }> {
  const token = getStoredToken();
  const res = await fetch('/api/security/audit-logs', {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error('Falha ao obter registros de auditoria (requer perfil admin)');
  return res.json();
}

export async function generatePixBRCode(amount: number, txId?: string): Promise<{
  brCode: string;
  txId: string;
  e2eId: string;
  pixKey: string;
  amount: number;
  qrCodeUrl: string;
}> {
  const res = await fetch('/api/payments/pix/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, txId })
  });
  if (!res.ok) throw new Error('Falha ao gerar cobrança PIX');
  return res.json();
}

export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  if (!res.ok) throw new Error('Falha ao criar produto');
  return res.json();
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  if (!res.ok) throw new Error('Falha ao atualizar produto');
  return res.json();
}

export async function adjustStock(
  productId: string, 
  quantityChange: number, 
  reason?: string, 
  type?: string
): Promise<{ product: Product; movement: StockMovement }> {
  const res = await fetch(`/api/products/${productId}/adjust-stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantityChange, reason, type })
  });
  if (!res.ok) throw new Error('Falha ao ajustar estoque');
  return res.json();
}

export async function fetchReports(): Promise<SalesReport> {
  const res = await fetch('/api/reports');
  if (!res.ok) throw new Error('Falha ao carregar relatórios');
  return res.json();
}

export async function updatePrinterConfig(config: Partial<PrinterConfig>): Promise<PrinterConfig> {
  const res = await fetch('/api/printer-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Falha ao salvar configurações da impressora');
  return res.json();
}
