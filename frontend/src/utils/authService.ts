import { User } from '../types/audit';

const SESSION_KEY = 'audiflow_user';

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

  // Registrar SIEMPRE en el servidor central (sin fallback local — garantiza acceso multidispositivo)
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
    return { success: false, error: data.detail || data.error || 'Error al registrar la cuenta en el servidor.' };
  } catch (err) {
    console.error('[Audiflow Auth] Servidor no disponible:', err);
    return {
      success: false,
      error: 'Servidor no disponible. Verifica tu conexión a internet e intenta de nuevo.',
    };
  }
}

/**
 * Autenticar credenciales contra la base de datos centralizada (Multidispositivo)
 */
export async function authenticate(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Autenticar SIEMPRE contra el servidor central (sin fallback local — acceso multidispositivo garantizado)
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
    return {
      success: false,
      error: data.detail || data.error || 'Credenciales incorrectas. Verifica tu correo y contraseña.',
    };
  } catch (err) {
    console.error('[Audiflow Auth] Servidor no disponible:', err);
    return {
      success: false,
      error: 'Servidor no disponible. Verifica tu conexión a internet e intenta de nuevo.',
    };
  }
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
    if (user.id === 'usr-admin-corp') {
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
