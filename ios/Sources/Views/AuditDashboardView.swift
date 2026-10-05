//
//  AuditDashboardView.swift
//  Audiflow iOS App
//  Example SwiftUI Screen built using the Audiflow Design System
//

import SwiftUI

public struct AuditDashboardView: View {
    @State private var isAuditing: Bool = false

    public init() {}

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: AppSpacing.lg) {
                    // Header Status
                    HStack {
                        VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                            Text("AUDIFLOW COMPLIANCE")
                                .font(AppFont.caption)
                                .foregroundColor(Color.brandAccent)
                                .tracking(1.2)

                            Text("Resumen de Auditoría")
                                .font(AppFont.titleLarge)
                                .foregroundColor(Color.textPrimary)
                        }

                        Spacer()

                        Image(systemName: "shield.lefthalf.filled.badge.checkmark")
                            .font(.system(size: 28))
                            .foregroundColor(Color.brandPrimary)
                    }
                    .padding(.top, AppSpacing.sm)

                    // Semáforo Principal Card
                    TrafficLightScoreCard(
                        score: 80.0,
                        level: .high,
                        summary: "ALERTA CRÍTICA: Se detectaron contingencias de severidad ALTA en protección de datos (Habeas Data & IA) y prevención de lavado de activos (SARLAFT/UBO)."
                    )

                    // Sección de Hallazgos Críticos
                    VStack(alignment: .leading, spacing: AppSpacing.md) {
                        Text("Hallazgos Críticos de la IA (Llama 3.1)")
                            .font(AppFont.headline)
                            .foregroundColor(Color.textPrimary)

                        // Finding 1
                        AuditFindingCard(
                            category: "Protección de Datos & IA (Normativa 2026)",
                            severity: .high,
                            title: "Reentrenamiento no autorizado de Modelos de IA",
                            snippet: "El cliente autoriza que el proveedor use sus datos para reentrenar modelos de IA.",
                            recommendation: "Exigir cláusula de exclusión expresa (Opt-out) y prohibir la ingesta de secretos comerciales en modelos fundacionales."
                        )

                        // Finding 2
                        AuditFindingCard(
                            category: "Cumplimiento Contractual",
                            severity: .high,
                            title: "Exoneración de Responsabilidad por Dolo o Negligencia",
                            snippet: "El proveedor se exonera de responsabilidad ante fugas de datos y caídas del sistema.",
                            recommendation: "Pactar nulidad de exoneración ante dolo o culpa grave y establecer un Liability Cap razonable a 12 meses de facturación."
                        )
                    }

                    // Acciones Principales
                    VStack(spacing: AppSpacing.sm) {
                        Button {
                            // Acción para auditar nuevo contrato
                        } label: {
                            HStack {
                                Image(systemName: "doc.badge.plus")
                                Text("Auditar Nuevo Contrato")
                            }
                        }
                        .buttonStyle(PrimaryButtonStyle())

                        Link(destination: URL(string: "https://audiflow-audit.abbynex.site/normativas/normativa_auditoria_vigente_2026.md")!) {
                            HStack {
                                Image(systemName: "book.pages")
                                Text("Consultar Normativas 2026 (.md)")
                            }
                        }
                        .buttonStyle(SecondaryButtonStyle())
                    }
                    .padding(.top, AppSpacing.sm)
                }
                .padding(.horizontal, AppSpacing.base)
                .padding(.bottom, AppSpacing.xxl)
            }
            .background(Color.surfaceCanvas.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    AuditDashboardView()
}
