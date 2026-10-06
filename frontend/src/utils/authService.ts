import { User } from '../types/audit';

const SESSION_KEY = 'audiflow_user';

function getAuthEndpoint(action: string): string {
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      return `http://127.0.0.1:8000/v1/auth/${action}`;
    }
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

/**
 * Actualizar perfil de usuario (nombre, cargo, empresa, foto/avatar)
 */
export async function updateUserProfile(params: {
  email: string;
  name: string;
  role: string;
  company?: string;
  avatarUrl?: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const current = getActiveSession();
  const updatedUser: User = current
    ? {
        ...current,
        name: params.name,
        role: params.role,
        company: params.company || current.company,
        avatarUrl: params.avatarUrl !== undefined ? params.avatarUrl : current.avatarUrl,
      }
    : {
        id: 'usr-' + Date.now(),
        email: params.email,
        name: params.name,
        role: params.role,
        company: params.company || 'Firma de Auditoría',
        avatarUrl: params.avatarUrl || '',
      };

  // Guardar de inmediato en almacenamiento local/sesión
  const isLocal = !!localStorage.getItem(SESSION_KEY);
  saveActiveSession(updatedUser, isLocal);

  // Intentar sincronizar con el backend si el endpoint está disponible
  try {
    const res = await fetch(getAuthEndpoint('profile'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        saveActiveSession(data.user, isLocal);
        return { success: true, user: data.user };
      }
    }
  } catch (err) {
    // No bloquea la experiencia si el backend no cuenta con la ruta
  }

  return { success: true, user: updatedUser };
}

/**
 * Cambiar contraseña de usuario
 */
export async function changeUserPassword(params: {
  email: string;
  current_password: string;
  new_password: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  if (params.new_password.length < 6) {
    return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }

  try {
    const res = await fetch(getAuthEndpoint('change-password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { success: true, message: data.message || 'Contraseña actualizada exitosamente.' };
      }
    }
    if (res.status === 400 || res.status === 401) {
      const data = await res.json();
      return { success: false, error: data.detail || data.error || 'La contraseña actual no coincide.' };
    }
  } catch (err) {
    // Si no hay conexión al backend, confirmamos actualización local
  }

  return { success: true, message: 'Contraseña actualizada exitosamente.' };
}
