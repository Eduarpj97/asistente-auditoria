import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AuditUploader } from './components/AuditUploader';
import { AuditHistory } from './components/AuditHistory';
import { AuditResultView } from './components/AuditResultView';
import { DeadlineAlerts } from './components/DeadlineAlerts';
import { ContractAudit, User, KeyDeadline } from './types/audit';
import { exportToPDF, exportToWord } from './utils/reportExporter';
import { CheckCircle2, AlertCircle } from 'lucide-react';

function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location.origin.includes(':3000')) {
    return 'http://127.0.0.1:8000';
  }
  return '';
}

export default function App() {
  // Authentication state (purga automática de cuentas corporativas pre-cargadas)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('audiflow_user');
    if (!saved) return null;
    try {
      const parsed: User = JSON.parse(saved);
      if (parsed.id === 'usr-admin-corp' || parsed.email?.toLowerCase() === 'eduardo.pedroza@audiflow.com') {
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

  // Active Navigation Tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Audits repository (100% reales, sin simulaciones ni datos de relleno)
  const [audits, setAudits] = useState<ContractAudit[]>(() => {
    const saved = localStorage.getItem('audiflow_audits');
    if (!saved) return [];
    try {
      const parsed: ContractAudit[] = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((a) => !a.id.startsWith('aud-2026-00')) : [];
    } catch {
      return [];
    }
  });

  // Selected audit for detail inspection
  const [selectedAudit, setSelectedAudit] = useState<ContractAudit | null>(null);

  // Key deadlines pool (derivado exclusivamente de auditorías reales)
  const [deadlines, setDeadlines] = useState<KeyDeadline[]>(() => {
    const saved = localStorage.getItem('audiflow_deadlines');
    if (!saved) return [];
    try {
      const parsed: KeyDeadline[] = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter((d) => !d.contractId?.startsWith('aud-2026-00')) : [];
    } catch {
      return [];
    }
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('audiflow_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('audiflow_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('audiflow_audits', JSON.stringify(audits));
  }, [audits]);

  useEffect(() => {
    localStorage.setItem('audiflow_deadlines', JSON.stringify(deadlines));
  }, [deadlines]);

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

  // Referencias para control de concurrencia y migración inicial
  const migrationAttemptedRef = useRef(false);
  const isRefreshingRef = useRef(false);

  // Sincronización con el servidor central: El servidor es la fuente única de verdad
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

          // Si el servidor está vacío pero el usuario tenía auditorías previas en este navegador,
          // subirlas una única vez al servidor para preservarlas
          if (serverAudits.length === 0 && !migrationAttemptedRef.current) {
            migrationAttemptedRef.current = true;
            const localSaved = localStorage.getItem('audiflow_audits');
            if (localSaved) {
              try {
                const parsedLocal: ContractAudit[] = JSON.parse(localSaved);
                if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
                  for (const audit of parsedLocal) {
                    await fetch(`${getApiBase()}/v1/audits/sync`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_email: email,
                        audit_id: audit.id,
                        audit_data: audit,
                      }),
                    });
                  }
                  const reRes = await fetch(`${getApiBase()}/v1/audits/user?email=${encodeURIComponent(email)}`);
                  if (reRes.ok) {
                    const reData = await reRes.json();
                    if (reData.success && Array.isArray(reData.audits)) {
                      setAudits(reData.audits);
                      return;
                    }
                  }
                }
              } catch {
                // Ignore parse errors
              }
            }
          }

          // El servidor es la fuente de verdad definitiva para esta cuenta
          setAudits((prev) => {
            if (prev.length === serverAudits.length) {
              const unchanged = prev.every((item, i) => item.id === serverAudits[i]?.id);
              if (unchanged) return prev;
            }
            return serverAudits;
          });

          // Sincronizar fechas límites asociadas a contratos
          const contractDeadlines: KeyDeadline[] = [];
          serverAudits.forEach((audit) => {
            if (audit.keyDeadlines) {
              audit.keyDeadlines.forEach((dl) => {
                contractDeadlines.push({
                  ...dl,
                  contractId: audit.id,
                  contractTitle: audit.contractTitle,
                });
              });
            }
          });

          setDeadlines((prev) => {
            const customDeadlines = prev.filter((d) => !d.contractId);
            return [...contractDeadlines, ...customDeadlines];
          });

          // Si la auditoría seleccionada fue eliminada en otro dispositivo, resetear selección
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

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
    setInactivityNotice(null);
    showToast(`¡Bienvenido a Audiflow, ${user.name}!`);
    refreshAudits(user.email);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedAudit(null);
    setInactivityNotice(null);
    localStorage.removeItem('audiflow_user');
    sessionStorage.removeItem('audiflow_user');
    setCurrentTab('dashboard');
    showToast('Sesión cerrada correctamente.', 'info');
  };

  // Completed new audit handler
  const handleAuditCompleted = async (newAudit: ContractAudit) => {
    // Actualización optimista inmediata
    setAudits((prev) => [newAudit, ...prev]);

    // Merge new deadlines into pool
    if (newAudit.keyDeadlines && newAudit.keyDeadlines.length > 0) {
      const newDls = newAudit.keyDeadlines.map((dl) => ({
        ...dl,
        contractId: newAudit.id,
        contractTitle: newAudit.contractTitle,
      }));
      setDeadlines((prev) => [...newDls, ...prev]);
    }

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
    return <AuthScreen onLoginSuccess={handleLogin} inactivityNotice={inactivityNotice} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col selection:bg-[#0F2744] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F2744] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold animate-in slide-in-from-bottom-5 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
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
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            audits={audits}
            deadlines={deadlines}
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#0F2744]">AUDIFLOW</span>
            <span>•</span>
            <span>Software de Auditoría y Control de Contratos © 2026</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Cifrado de extremo a extremo</span>
            <span>•</span>
            <span>Cumplimiento Legal y Normativo</span>
            <span>•</span>
            <span>Trazabilidad Integral</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
