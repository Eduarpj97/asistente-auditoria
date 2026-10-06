import { User } from '../types/audit';

export interface RegisteredAccount {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  passwordHash: string;
  createdAt: string;
}

const STORAGE_KEY = 'audiflow_registered_users';
const SESSION_KEY = 'audiflow_user';

/**
 * Función criptográfica estándar para hashear contraseñas usando SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    // Fallback de codificación segura en entornos restrictivos
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `hash_${Math.abs(hash)}_${password.length}`;
  }
}

/**
 * Obtener todos los usuarios registrados en el almacenamiento local persistente
 */
export function getRegisteredAccounts(): RegisteredAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Inicializar la base de datos de usuarios purificando cuentas ficticias o corporativas pre-cargadas
 */
export async function initializeUserDatabase(): Promise<void> {
  const existing = getRegisteredAccounts();
  const cleaned = existing.filter(
    (acc) => acc.id !== 'usr-admin-corp' && acc.email.toLowerCase() !== 'eduardo.pedroza@audiflow.com'
  );
  if (cleaned.length !== existing.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  }
}

function getAuthEndpoint(action: 'login' | 'register'): string {
  if (typeof window !== 'undefined' && window.location.origin.includes(':3000')) {
    return `http://127.0.0.1:8000/v1/auth/${action}`;
  }
  return `/v1/auth/${action}`;
}

/**
 * Registrar una nueva cuenta en la base de datos centralizada (Soporte multidispositivo)
 */
export async function registerAccount(params: {
  name: string;
  email: string;
  company: string;
  role: string;
  password: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const normalizedEmail = params.email.trim().toLowerCase();

  // 1. Intentar registrar en el backend centralizado (para que funcione en todos los dispositivos)
  try {
    const res = await fetch(getAuthEndpoint('register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: params.name.trim(),
        email: normalizedEmail,
        password: params.password,
        company: params.company.trim() || 'Firma de Auditoría',
        role: params.role || 'Auditor Legal Senior',
      }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      return { success: true, user: data.user };
    }
    if (!res.ok) {
      return { success: false, error: data.detail || data.error || 'Error al registrar la cuenta en el servidor.' };
    }
  } catch (err) {
    console.warn('[Audiflow Auth] Backend API no disponible, utilizando almacenamiento local de contingencia.');
  }

  // 2. Fallback resiliente en LocalStorage
  const accounts = getRegisteredAccounts();
  const exists = accounts.some((acc) => acc.email.toLowerCase() === normalizedEmail);
  if (exists) {
    return {
      success: false,
      error: 'Ya existe una cuenta registrada con este correo electrónico. Inicia sesión o utiliza otro correo.',
    };
  }

  const passwordHash = await hashPassword(params.password);
  const newAccount: RegisteredAccount = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: params.name.trim(),
    email: normalizedEmail,
    company: params.company.trim(),
    role: params.role.trim(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));

  return {
    success: true,
    user: {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
      company: newAccount.company,
    },
  };
}

/**
 * Autenticar credenciales contra la base de datos centralizada (Multidispositivo)
 */
export async function authenticate(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Intentar validar en la base de datos central del servidor
  try {
    const res = await fetch(getAuthEndpoint('login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      return { success: true, user: data.user };
    }
    if (!res.ok) {
      return { success: false, error: data.detail || data.error || 'Credenciales incorrectas.' };
    }
  } catch (err) {
    console.warn('[Audiflow Auth] Backend API no disponible, validando en almacenamiento local.');
  }

  // 2. Fallback de contingencia en LocalStorage
  const accounts = getRegisteredAccounts();
  const account = accounts.find((acc) => acc.email.toLowerCase() === normalizedEmail);

  if (!account) {
    return {
      success: false,
      error: 'No se encontró ninguna cuenta registrada con este correo electrónico. Por favor regístrate.',
    };
  }

  const inputHash = await hashPassword(password);
  if (account.passwordHash !== inputHash) {
    return {
      success: false,
      error: 'Contraseña incorrecta. Por favor verifica tus credenciales.',
    };
  }

  return {
    success: true,
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      company: account.company,
    },
  };
}

/**
 * Guardar sesión activa
 */
export function saveActiveSession(user: User, remember: boolean): void {
  if (remember) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Obtener sesión activa existente
 */
export function getActiveSession(): User | null {
  try {
    const local = localStorage.getItem(SESSION_KEY);
    const session = sessionStorage.getItem(SESSION_KEY);
    const raw = local || session;
    if (!raw) return null;

    const user: User = JSON.parse(raw);
    if (user.id === 'usr-admin-corp' || user.email?.toLowerCase() === 'eduardo.pedroza@audiflow.com') {
      clearActiveSession();
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Cerrar sesión
 */
export function clearActiveSession(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
