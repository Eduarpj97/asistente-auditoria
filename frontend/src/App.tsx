import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { LoginTransition } from './components/LoginTransition';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AuditUploader } from './components/AuditUploader';
import { AuditHistory } from './components/AuditHistory';
import { AuditResultView } from './components/AuditResultView';
import { DeadlineAlerts } from './components/DeadlineAlerts';
import { ContractAudit, User, KeyDeadline, BackgroundAuditTask, AppNotification } from './types/audit';
import { exportToPDF, exportToWord } from './utils/reportExporter';
import { executeContractAuditApi } from './utils/auditProcessor';
import { playNotificationSound } from './utils/soundNotification';
import { extractDeadlinesFromAudits } from './utils/deadlineUtils';
import { BackgroundAuditWidget } from './components/BackgroundAuditWidget';
import { CheckCircle2, AlertCircle, Sparkles, ArrowRight, X } from 'lucide-react';

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      return 'http://127.0.0.1:8000';
    }
  }
  return '';
}

export default function App() {
  // Authentication state (persiste al recargar o refrescar la página)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('audiflow_user') || sessionStorage.getItem('audiflow_user');
    if (!saved) return null;
    try {
      const parsed: User = JSON.parse(saved);
      if (parsed.id === 'usr-admin-corp') {
        localStorage.removeItem('audiflow_user');
        sessionStorage.removeItem('audiflow_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Inactivity timeout state (15 minutos de inactividad para compliance de seguridad)
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

  // Entrance transition state para animar el ingreso tras autenticación exitosa
  const [loginTransitionUser, setLoginTransitionUser] = useState<User | null>(null);

  // Active Navigation Tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Theme setting: 'light' | 'dark' | 'system'
  const [themeSetting, setThemeSetting] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('audiflow_theme_setting');
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    const oldSaved = localStorage.getItem('audiflow_theme');
    if (oldSaved === 'dark' || oldSaved === 'light') return oldSaved;
    return 'system';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const effectiveTheme: 'light' | 'dark' =
    themeSetting === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themeSetting;

  useEffect(() => {
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('audiflow_theme_setting', themeSetting);
    localStorage.setItem('audiflow_theme', effectiveTheme);
  }, [effectiveTheme, themeSetting]);

  const handleSetTheme = (target?: 'light' | 'dark' | 'system') => {
    if (target) {
      setThemeSetting(target);
    } else {
      setThemeSetting((prev) => (effectiveTheme === 'light' ? 'dark' : 'light'));
    }
  };

  // Audits repository (100% reales, aislado estrictamente por usuario)
  const [audits, setAudits] = useState<ContractAudit[]>(() => {
    try {
      const savedUser = localStorage.getItem('audiflow_user') || sessionStorage.getItem('audiflow_user');
      if (!savedUser) return [];
      const user: User = JSON.parse(savedUser);
      if (!user?.email) return [];
      const saved = localStorage.getItem(`audiflow_audits_${user.email.toLowerCase()}`);
      if (!saved) return [];
      const parsed: ContractAudit[] = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((a) => !a.id.startsWith('aud-2026-00')) : [];
    } catch {
      return [];
    }
  });

  // Selected audit for detail inspection
  const [selectedAudit, setSelectedAudit] = useState<ContractAudit | null>(null);

  // Key deadlines pool (aislado estrictamente por usuario y poblado automáticamente)
  const [deadlines, setDeadlines] = useState<KeyDeadline[]>(() => {
    try {
      const savedUser = localStorage.getItem('audiflow_user') || sessionStorage.getItem('audiflow_user');
      if (!savedUser) return [];
      const user: User = JSON.parse(savedUser);
      if (!user?.email) return [];

      const savedAuditsRaw = localStorage.getItem(`audiflow_audits_${user.email.toLowerCase()}`);
      let baseDeadlines: KeyDeadline[] = [];
      if (savedAuditsRaw) {
        try {
          const parsedAudits: ContractAudit[] = JSON.parse(savedAuditsRaw);
          if (Array.isArray(parsedAudits)) {
            baseDeadlines = extractDeadlinesFromAudits(
              parsedAudits.filter((a) => !a.id.startsWith('aud-2026-00'))
            );
          }
        } catch {}
      }

      const saved = localStorage.getItem(`audiflow_deadlines_${user.email.toLowerCase()}`);
      if (!saved) return baseDeadlines;
      const parsed: KeyDeadline[] = JSON.parse(saved);
      if (!Array.isArray(parsed)) return baseDeadlines;

      const custom = parsed.filter((d) => !d.contractId || d.id?.startsWith('custom-dl-'));
      const existingIds = new Set(baseDeadlines.map((b) => b.id));
      return [...baseDeadlines, ...custom.filter((c) => !existingIds.has(c.id))];
    } catch {
      return [];
    }
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Active background audit task state
  const [activeAuditTask, setActiveAuditTask] = useState<BackgroundAuditTask | null>(null);

  // Unified notifications pool (aislado estrictamente por usuario)
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const savedUser = localStorage.getItem('audiflow_user') || sessionStorage.getItem('audiflow_user');
      if (!savedUser) return [];
      const user: User = JSON.parse(savedUser);
      if (!user?.email) return [];
      const saved = localStorage.getItem(`audiflow_notifs_${user.email.toLowerCase()}`);
      if (!saved) return [];
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  // Interactive completion notification banner (aviso de auditoría concluida)
  const [completionNotification, setCompletionNotification] = useState<ContractAudit | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to local storage aislado por cuenta
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('audiflow_user', JSON.stringify(currentUser));
      localStorage.setItem(`audiflow_audits_${currentUser.email.toLowerCase()}`, JSON.stringify(audits));
      localStorage.setItem(`audiflow_deadlines_${currentUser.email.toLowerCase()}`, JSON.stringify(deadlines));
      localStorage.setItem(`audiflow_notifs_${currentUser.email.toLowerCase()}`, JSON.stringify(notifications));
    } else {
      localStorage.removeItem('audiflow_user');
    }
  }, [currentUser, audits, deadlines, notifications]);

  // Cierre de sesión automático por inactividad (15 minutos)
  useEffect(() => {
    if (!currentUser) return;

    lastActivityRef.current = Date.now();

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetActivity, { passive: true });
    });

    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        setCurrentUser(null);
        setSelectedAudit(null);
        localStorage.removeItem('audiflow_user');
        sessionStorage.removeItem('audiflow_user');
        setInactivityNotice(
          'Tu sesión se ha cerrado automáticamente tras 15 minutos sin interacción para proteger la confidencialidad de las auditorías y normativas.'
        );
      }
    }, 10000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetActivity);
      });
      clearInterval(checkInterval);
    };
  }, [currentUser]);

  // Referencia para control de llamadas concurrentes
  const isRefreshingRef = useRef(false);

  // Sincronización con el servidor central: El servidor es la fuente única de verdad para cada cuenta
  const refreshAudits = useCallback(async (targetEmail?: string) => {
    const email = targetEmail || currentUser?.email;
    if (!email || isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    try {
      const res = await fetch(`${getApiBase()}/v1/audits/user?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.audits)) {
          const serverAudits: ContractAudit[] = data.audits;

          // El servidor es la fuente de verdad definitiva y exclusiva para la cuenta activa
          setAudits((prev) => {
            if (prev.length === serverAudits.length) {
              const unchanged = prev.every((item, i) => item.id === serverAudits[i]?.id);
              if (unchanged) return prev;
            }
            return serverAudits;
          });

          // Sincronizar fechas límites asociadas a los contratos de este usuario
          const contractDeadlines = extractDeadlinesFromAudits(serverAudits);

          setDeadlines((prev) => {
            const customDeadlines = prev.filter((d) => !d.contractId || d.id?.startsWith('custom-dl-'));
            const existingIds = new Set(contractDeadlines.map((c) => c.id));
            const uniqueCustom = customDeadlines.filter((c) => !existingIds.has(c.id));
            return [...contractDeadlines, ...uniqueCustom];
          });

          // Si la auditoría seleccionada ya no existe en el servidor para este usuario, resetear selección
          setSelectedAudit((prevSelected) => {
            if (prevSelected && !serverAudits.some((a) => a.id === prevSelected.id)) {
              return null;
            }
            return prevSelected;
          });
        }
      }
    } catch (err) {
      console.warn('[Audiflow Sync] Error sincronizando auditorías en segundo plano:', err);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [currentUser?.email]);

  // Sincronización inmediata al montar o al cambiar de usuario
  useEffect(() => {
    if (currentUser?.email) {
      refreshAudits(currentUser.email);
    }
  }, [currentUser?.email, refreshAudits]);

  // Sincronización en tiempo real: polling cada 4 segundos + evento focus/visibilidad
  useEffect(() => {
    if (!currentUser?.email) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshAudits(currentUser.email);
      }
    }, 4000);

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshAudits(currentUser.email);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [currentUser?.email, refreshAudits]);

  // Auth Handlers con aislamiento estricto entre cuentas
  const handleLogin = (user: User) => {
    // Disparar animación cinemática de bienvenida y carga del entorno
    setLoginTransitionUser(user);

    // Resetear inmediatamente datos anteriores en memoria para que no se filtren a la nueva cuenta
    setSelectedAudit(null);
    setCurrentUser(user);
    setCurrentTab('dashboard');
    setInactivityNotice(null);

    // Cargar caché local específica de este usuario si existe
    try {
      const userCached = localStorage.getItem(`audiflow_audits_${user.email.toLowerCase()}`);
      if (userCached) {
        setAudits(JSON.parse(userCached));
      } else {
        setAudits([]);
      }
    } catch {
      setAudits([]);
    }

    showToast(`¡Bienvenido a Audiflow, ${user.name}!`);
    refreshAudits(user.email);
  };

  const handleLogout = () => {
    // Limpieza total del estado para evitar que otra cuenta vea datos residuales
    setLoginTransitionUser(null);
    setCurrentUser(null);
    setSelectedAudit(null);
    setAudits([]);
    setDeadlines([]);
    setNotifications([]);
    setActiveAuditTask(null);
    setCompletionNotification(null);
    if (auditIntervalRef.current) {
      clearInterval(auditIntervalRef.current);
      auditIntervalRef.current = null;
    }
    setInactivityNotice(null);
    localStorage.removeItem('audiflow_user');
    sessionStorage.removeItem('audiflow_user');
    localStorage.removeItem('audiflow_audits'); // Eliminar clave residual global antigua
    localStorage.removeItem('audiflow_deadlines');
    setCurrentTab('dashboard');
    showToast('Sesión cerrada correctamente.', 'info');
  };

  // Referencia para el intervalo del ciclo de pasos de la auditoría en segundo plano
  const auditIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Iniciar auditoría asíncrona no bloqueante
  const handleStartBackgroundAudit = async (fileToUpload: File | Blob, uploadFileName: string) => {
    if (!currentUser?.email) return;

    if (auditIntervalRef.current) {
      clearInterval(auditIntervalRef.current);
    }

    const taskId = `task-${Date.now()}`;
    const initialStep = 'Extrayendo texto del contrato (OCR & Segmentación)...';
    setActiveAuditTask({
      id: taskId,
      fileName: uploadFileName,
      status: 'auditing',
      step: initialStep,
      startTime: Date.now(),
      isMinimized: false,
    });

    const steps = [
      'Extrayendo texto del contrato (OCR & Segmentación)...',
      'Evaluando 14 Controles Regulatorios (RGPD, SARLAFT, FCPA, ISO 27001)...',
      'Invocando inferencia semántica con Llama 3.1 8B en VPS de Oracle Cloud...',
      'Analizando cláusulas abusivas, asimetrías y penalizaciones de SLA...',
      'Consolidando dictamen jurídico y generando reporte de auditoría...',
    ];

    let currentStepIdx = 0;
    auditIntervalRef.current = setInterval(() => {
      currentStepIdx = (currentStepIdx + 1) % steps.length;
      setActiveAuditTask((prev) => (prev ? { ...prev, step: steps[currentStepIdx] } : null));
    }, 3800);

    try {
      const newAudit = await executeContractAuditApi(fileToUpload, uploadFileName, currentUser.email);
      if (auditIntervalRef.current) {
        clearInterval(auditIntervalRef.current);
        auditIntervalRef.current = null;
      }

      // 1. Guardar auditoría completada
      await handleAuditCompleted(newAudit);

      // 2. Reproducir tono sonoro sutil
      playNotificationSound();

      // 3. Registrar en Centro de Notificaciones
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        type: 'audit_completed',
        title: `¡Auditoría Finalizada!`,
        message: `Análisis normativo concluido para "${newAudit.contractTitle}". Score de riesgo: ${newAudit.overallRiskScore}/100.`,
        timestamp: new Date().toISOString(),
        read: false,
        contractId: newAudit.id,
        auditId: newAudit.id,
        urgency: newAudit.overallRiskScore > 60 ? 'urgent' : 'success',
        contractTitle: newAudit.contractTitle,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // 4. Mostrar aviso interactivo flotante con botón directo para ver dictamen
      setCompletionNotification(newAudit);

      // 5. Resetear tarea en segundo plano
      setActiveAuditTask(null);
    } catch (err: any) {
      if (auditIntervalRef.current) {
        clearInterval(auditIntervalRef.current);
        auditIntervalRef.current = null;
      }
      setActiveAuditTask(null);
      showToast(`Error durante la auditoría: ${err.message}`, 'info');
    }
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    showToast('Centro de notificaciones limpio.');
  };

  // Completed new audit handler
  const handleAuditCompleted = async (newAudit: ContractAudit) => {
    // Actualización optimista inmediata
    setAudits((prev) => [newAudit, ...prev]);

    // Merge new deadlines into pool de forma inmediata
    const newExtractedDeadlines = extractDeadlinesFromAudits([newAudit]);
    setDeadlines((prev) => {
      const existingIds = new Set(newExtractedDeadlines.map((d) => d.id));
      return [...newExtractedDeadlines, ...prev.filter((d) => !existingIds.has(d.id))];
    });

    setSelectedAudit(newAudit);
    setCurrentTab('detail');
    showToast('¡Auditoría de contrato completada con éxito!');

    // Persistir de inmediato en el servidor central
    if (currentUser?.email) {
      try {
        await fetch(`${getApiBase()}/v1/audits/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: currentUser.email,
            audit_id: newAudit.id,
            audit_data: newAudit,
          }),
        });
        refreshAudits(currentUser.email);
      } catch (err) {
        console.warn('[Audiflow Sync] Error al persistir auditoría en servidor:', err);
      }
    }
  };

  // Action handlers
  const handleSelectAudit = (audit: ContractAudit) => {
    setSelectedAudit(audit);
    setCurrentTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAudit = async (auditId: string) => {
    // Eliminación optimista en UI local
    setAudits((prev) => prev.filter((a) => a.id !== auditId));
    setDeadlines((prev) => prev.filter((d) => d.contractId !== auditId));
    if (selectedAudit?.id === auditId) {
      setSelectedAudit(null);
      setCurrentTab('history');
    }
    showToast('Documento eliminado del historial.');

    // Sincronizar eliminación en el servidor central
    if (currentUser?.email) {
      try {
        await fetch(
          `${getApiBase()}/v1/audits/sync/${auditId}?email=${encodeURIComponent(currentUser.email)}`,
          { method: 'DELETE' }
        );
        refreshAudits(currentUser.email);
      } catch (err) {
        console.warn('[Audiflow Sync] Error al eliminar auditoría del servidor:', err);
      }
    }
  };

  const handleExportPDF = (audit: ContractAudit) => {
    try {
      exportToPDF(audit);
      showToast('Reporte PDF descargado con éxito.');
    } catch (err) {
      console.error(err);
      showToast('Error al generar el PDF.', 'info');
    }
  };

  const handleExportWord = async (audit: ContractAudit) => {
    try {
      await exportToWord(audit);
      showToast('Reporte Word (.docx) descargado con éxito.');
    } catch (err) {
      console.error(err);
      showToast('Error al generar el documento Word.', 'info');
    }
  };

  const handleDismissDeadline = (deadlineId: string) => {
    setDeadlines((prev) =>
      prev.map((d) => (d.id === deadlineId ? { ...d, dismissed: true } : d))
    );
    showToast('Alerta marcada como atendida.');
  };

  const handleAddCustomDeadline = (newDl: KeyDeadline) => {
    setDeadlines((prev) => [newDl, ...prev]);
    showToast('Nueva alerta de vencimiento programada en calendario.');
  };

  // If user is not authenticated, show AuthScreen matching the uploaded design
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={handleLogin}
        inactivityNotice={inactivityNotice}
        theme={themeSetting}
        effectiveTheme={effectiveTheme}
        onToggleTheme={handleSetTheme}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] flex flex-col selection:bg-[#0071e3] selection:text-white transition-colors duration-200">
      {/* Animación cinemática de bienvenida y entrada a Audiflow */}
      {loginTransitionUser && (
        <LoginTransition
          user={loginTransitionUser}
          onComplete={() => setLoginTransitionUser(null)}
          effectiveTheme={effectiveTheme}
        />
      )}

      {/* Apple Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1d1d1f]/90 dark:bg-[#2c2c2e]/90 text-white px-5 py-3 rounded-full shadow-2xl backdrop-blur-xl flex items-center gap-2.5 text-xs sm:text-sm font-medium animate-in slide-in-from-bottom-5 duration-200 border border-white/10">
          <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          if (currentUser?.email) {
            refreshAudits(currentUser.email);
          }
        }}
        user={currentUser}
        onLogout={handleLogout}
        deadlines={deadlines}
        audits={audits}
        notifications={notifications}
        theme={themeSetting}
        effectiveTheme={effectiveTheme}
        onToggleTheme={handleSetTheme}
        onSelectDeadline={(dl) => {
          if (dl.contractId) {
            const found = audits.find((a) => a.id === dl.contractId);
            if (found) {
              handleSelectAudit(found);
              return;
            }
          }
          setCurrentTab('alerts');
        }}
        onSelectAuditById={(contractId) => {
          const found = audits.find((a) => a.id === contractId);
          if (found) {
            handleSelectAudit(found);
          }
        }}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onClearNotifications={handleClearNotifications}
        onUserUpdated={(updated) => {
          setCurrentUser(updated);
          showToast('Perfil actualizado correctamente', 'success');
        }}
      />

      {/* Interactive Completion Banner / Toast */}
      {completionNotification && (
        <aside
          aria-label="Aviso de auditoría completada"
          className="fixed top-20 right-6 z-50 max-w-sm sm:max-w-md w-full bg-white/95 dark:bg-[#1c1c1e]/95 text-[#1d1d1f] dark:text-[#f5f5f7] p-4 rounded-2xl shadow-2xl backdrop-blur-2xl border border-emerald-500/40 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300"
        >
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#34c759] shrink-0">
            <Sparkles className="w-5 h-5 text-[#34c759]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h5 className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
                ¡Auditoría Finalizada!
              </h5>
              <button
                type="button"
                onClick={() => setCompletionNotification(null)}
                className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[#86868b] dark:text-[#a1a1a6] mt-0.5 line-clamp-2">
              Se completó el análisis de &ldquo;{completionNotification.contractTitle}&rdquo;. Score de riesgo: {completionNotification.overallRiskScore}/100.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedAudit(completionNotification);
                  setCurrentTab('detail');
                  setCompletionNotification(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Ver Dictamen Ahora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCompletionNotification(null)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors cursor-pointer"
              >
                Descartar
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Floating Background Audit Widget cuando está minimizado */}
      {activeAuditTask && activeAuditTask.status === 'auditing' && activeAuditTask.isMinimized && (
        <BackgroundAuditWidget
          task={activeAuditTask}
          onMaximize={() =>
            setActiveAuditTask((prev) => (prev ? { ...prev, isMinimized: false } : null))
          }
          onCancel={() => {
            if (auditIntervalRef.current) {
              clearInterval(auditIntervalRef.current);
              auditIntervalRef.current = null;
            }
            setActiveAuditTask(null);
          }}
        />
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            audits={audits}
            deadlines={deadlines}
            user={currentUser}
            onSelectAudit={handleSelectAudit}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onExportPDF={handleExportPDF}
            onExportWord={handleExportWord}
          />
        )}

        {currentTab === 'upload' && (
          <AuditUploader
            onAuditCompleted={handleAuditCompleted}
            currentUserEmail={currentUser.email}
            onStartBackgroundAudit={handleStartBackgroundAudit}
            activeTask={activeAuditTask}
            onMinimizeAudit={() =>
              setActiveAuditTask((prev) => (prev ? { ...prev, isMinimized: true } : null))
            }
            onReopenAuditModal={() =>
              setActiveAuditTask((prev) => (prev ? { ...prev, isMinimized: false } : null))
            }
          />
        )}

        {currentTab === 'history' && (
          <AuditHistory
            audits={audits}
            onSelectAudit={handleSelectAudit}
            onDeleteAudit={handleDeleteAudit}
            onExportPDF={handleExportPDF}
            onExportWord={handleExportWord}
            onNavigateUpload={() => setCurrentTab('upload')}
          />
        )}

        {currentTab === 'alerts' && (
          <DeadlineAlerts
            deadlines={deadlines}
            audits={audits}
            onSelectAuditById={(contractId) => {
              const found = audits.find((a) => a.id === contractId);
              if (found) handleSelectAudit(found);
            }}
            onDismissDeadline={handleDismissDeadline}
            onAddCustomDeadline={handleAddCustomDeadline}
          />
        )}

        {currentTab === 'detail' && selectedAudit && (
          <AuditResultView
            audit={selectedAudit}
            onBack={() => setCurrentTab('history')}
            onExportPDF={handleExportPDF}
            onExportWord={handleExportWord}
          />
        )}
      </main>

      {/* Apple Footer */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.08] bg-transparent py-6 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#86868b]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">Audiflow</span>
            <span>•</span>
            <span>Software de Auditoría Legal y Control Normativo © 2026</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Cifrado de extremo a extremo</span>
            <span>•</span>
            <span>Cumplimiento Legal y Forense</span>
            <span>•</span>
            <span>Trazabilidad Integral</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
