import React, { useState, useEffect } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AuditUploader } from './components/AuditUploader';
import { AuditHistory } from './components/AuditHistory';
import { AuditResultView } from './components/AuditResultView';
import { DeadlineAlerts } from './components/DeadlineAlerts';
import { INITIAL_AUDITS } from './data/sampleAudits';
import { ContractAudit, User, KeyDeadline } from './types/audit';
import { exportToPDF, exportToWord } from './utils/reportExporter';
import { clearActiveSession } from './utils/authService';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Authentication state - Carga sesión real y descarta sesiones demo legadas
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('audiflow_user') || sessionStorage.getItem('audiflow_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.id === 'usr-demo' || parsed.id === 'usr-101' || parsed.email === 'eduardo.auditor@audiflow.com') {
        localStorage.removeItem('audiflow_user');
        sessionStorage.removeItem('audiflow_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Active Navigation Tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Audits repository (Inicia limpio en 0)
  const [audits, setAudits] = useState<ContractAudit[]>(() => {
    const saved = localStorage.getItem('audiflow_audits_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // Selected audit for detail inspection
  const [selectedAudit, setSelectedAudit] = useState<ContractAudit | null>(null);

  // Key deadlines pool (Inicia limpio en 0)
  const [deadlines, setDeadlines] = useState<KeyDeadline[]>(() => {
    const saved = localStorage.getItem('audiflow_deadlines_v2');
    return saved ? JSON.parse(saved) : [];
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
    localStorage.setItem('audiflow_audits_v2', JSON.stringify(audits));
  }, [audits]);

  useEffect(() => {
    localStorage.setItem('audiflow_deadlines_v2', JSON.stringify(deadlines));
  }, [deadlines]);

  // Auth Handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
    showToast(`¡Bienvenido a Audiflow, ${user.name}!`);
  };

  const handleLogout = () => {
    clearActiveSession();
    setCurrentUser(null);
    setSelectedAudit(null);
    setCurrentTab('dashboard');
    showToast('Sesión cerrada correctamente.', 'info');
  };

  // Completed new audit handler
  const handleAuditCompleted = (newAudit: ContractAudit) => {
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
  };

  // Action handlers
  const handleSelectAudit = (audit: ContractAudit) => {
    setSelectedAudit(audit);
    setCurrentTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAudit = (auditId: string) => {
    setAudits((prev) => prev.filter((a) => a.id !== auditId));
    setDeadlines((prev) => prev.filter((d) => d.contractId !== auditId));
    if (selectedAudit?.id === auditId) {
      setSelectedAudit(null);
      setCurrentTab('history');
    }
    showToast('Documento eliminado del historial.');
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
    return <AuthScreen onLoginSuccess={handleLogin} />;
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
