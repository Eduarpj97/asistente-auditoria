import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BackgroundAuditWidget } from '../components/BackgroundAuditWidget';
import { BackgroundAuditTask } from '../types/audit';

describe('BackgroundAuditWidget Component', () => {
  const mockTask: BackgroundAuditTask = {
    id: 'task-123',
    fileName: 'contrato_arrendamiento_2026.pdf',
    status: 'auditing',
    step: 'Invocando inferencia semántica con Llama 3.1 8B...',
    startTime: Date.now(),
    isMinimized: true,
  };

  it('debe renderizar el widget flotante con el nombre del contrato y el paso actual', () => {
    const onMaximize = vi.fn();
    const onCancel = vi.fn();

    render(
      <BackgroundAuditWidget
        task={mockTask}
        onMaximize={onMaximize}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText(/Auditoría en segundo plano/i)).toBeInTheDocument();
    expect(screen.getByText('contrato_arrendamiento_2026.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Invocando inferencia semántica/i)).toBeInTheDocument();
    expect(screen.getByText(/Puedes seguir navegando/i)).toBeInTheDocument();
  });

  it('debe invocar onMaximize al hacer clic en ver detalles o el botón de ampliar', () => {
    const onMaximize = vi.fn();
    const onCancel = vi.fn();

    render(
      <BackgroundAuditWidget
        task={mockTask}
        onMaximize={onMaximize}
        onCancel={onCancel}
      />
    );

    const btnVerDetalles = screen.getByText(/Ver detalles/i);
    fireEvent.click(btnVerDetalles);
    expect(onMaximize).toHaveBeenCalled();
  });

  it('debe invocar onCancel al hacer clic en el botón de cerrar/descartar', () => {
    const onMaximize = vi.fn();
    const onCancel = vi.fn();

    render(
      <BackgroundAuditWidget
        task={mockTask}
        onMaximize={onMaximize}
        onCancel={onCancel}
      />
    );

    const btnDescartar = screen.getByTitle(/Descartar vista/i);
    fireEvent.click(btnDescartar);
    expect(onCancel).toHaveBeenCalled();
  });

  it('no debe renderizar nada si el estado de la tarea no es "auditing"', () => {
    const completedTask: BackgroundAuditTask = {
      ...mockTask,
      status: 'completed',
    };

    const { container } = render(
      <BackgroundAuditWidget
        task={completedTask}
        onMaximize={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
