//
//  Components.swift
//  Audiflow iOS Design System
//  Reusable UI Components adhering to DESIGN.md
//

import SwiftUI

// MARK: - Primary Action Button Style
public struct PrimaryButtonStyle: ButtonStyle {
    public var isFullWidth: Bool = true

    public init(isFullWidth: Bool = true) {
        self.isFullWidth = isFullWidth
    }

    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppFont.headline)
            .foregroundColor(Color.textOnDark)
            .padding(.vertical, AppSpacing.sm * 1.5)
            .padding(.horizontal, AppSpacing.lg)
            .frame(maxWidth: isFullWidth ? .infinity : nil)
            .background(
                LinearGradient(
                    colors: [Color.brandPrimary, Color.brandSecondary],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .cornerRadius(AppRadius.md)
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - Secondary Outline Button Style
public struct SecondaryButtonStyle: ButtonStyle {
    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(AppFont.headline)
            .foregroundColor(Color.brandPrimary)
            .padding(.vertical, AppSpacing.sm * 1.4)
            .padding(.horizontal, AppSpacing.lg)
            .background(Color.white)
            .overlay(
                RoundedRectangle(cornerRadius: AppRadius.md)
                    .stroke(Color.surfaceBorder, lineWidth: 1.5)
            )
            .cornerRadius(AppRadius.md)
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

// MARK: - Semantic Risk Badge (Semáforo Pill)
public enum RiskLevel: String {
    case low = "BAJO"
    case medium = "MEDIO"
    case notable = "NOTABLE"
    case high = "ALTO"

    var colors: (bg: Color, border: Color, text: Color) {
        switch self {
        case .low:
            return (Color.Risk.lowBg, Color.Risk.lowBorder, Color.Risk.lowText)
        case .medium:
            return (Color.Risk.mediumBg, Color.Risk.mediumBorder, Color.Risk.mediumText)
        case .notable:
            return (Color.Risk.notableBg, Color.Risk.notableBorder, Color.Risk.notableText)
        case .high:
            return (Color.Risk.highBg, Color.Risk.highBorder, Color.Risk.highText)
        }
    }
}

public struct RiskBadge: View {
    public let level: RiskLevel
    public var labelOverride: String? = nil

    public init(level: RiskLevel, labelOverride: String? = nil) {
        self.level = level
        self.labelOverride = labelOverride
    }

    public var body: some View {
        let theme = level.colors
        HStack(spacing: AppSpacing.xs) {
            Circle()
                .fill(theme.text)
                .frame(width: 6, height: 6)

            Text(labelOverride ?? "Riesgo \(level.rawValue)")
                .font(AppFont.caption)
                .foregroundColor(theme.text)
        }
        .padding(.horizontal, AppSpacing.md)
        .padding(.vertical, AppSpacing.xs * 1.2)
        .background(theme.bg)
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.full)
                .stroke(theme.border, lineWidth: 1)
        )
        .cornerRadius(AppRadius.full)
    }
}

// MARK: - Global Traffic Light Score Card
public struct TrafficLightScoreCard: View {
    public let score: Double
    public let level: RiskLevel
    public let summary: String

    public init(score: Double, level: RiskLevel, summary: String) {
        self.score = score
        self.level = level
        self.summary = summary
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.base) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: AppSpacing.xxs) {
                    Text("Puntuación de Riesgo Normativo")
                        .font(AppFont.caption)
                        .foregroundColor(Color.textSecondary)
                        .textCase(.uppercase)

                    HStack(alignment: .lastTextBaseline, spacing: AppSpacing.xs) {
                        Text("\(Int(score))")
                            .font(AppFont.display)
                            .foregroundColor(level.colors.text)

                        Text("/ 100")
                            .font(AppFont.titleMedium)
                            .foregroundColor(Color.textMuted)
                    }
                }

                Spacer()

                RiskBadge(level: level)
            }

            Text(summary)
                .font(AppFont.body)
                .foregroundColor(Color.textPrimary)
                .lineSpacing(3)
        }
        .padding(AppSpacing.lg)
        .background(Color.surfaceCard)
        .cornerRadius(AppRadius.lg)
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg)
                .stroke(Color.surfaceBorder, lineWidth: 1)
        )
        .cardElevation()
    }
}

// MARK: - Audit Finding Card (Cláusula Crítica)
public struct AuditFindingCard: View {
    public let category: String
    public let severity: RiskLevel
    public let title: String
    public let snippet: String
    public let recommendation: String

    public init(
        category: String,
        severity: RiskLevel,
        title: String,
        snippet: String,
        recommendation: String
    ) {
        self.category = category
        self.severity = severity
        self.title = title
        self.snippet = snippet
        self.recommendation = recommendation
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: AppSpacing.md) {
            HStack {
                Text(category)
                    .font(AppFont.caption)
                    .foregroundColor(Color.brandAccent)
                    .textCase(.uppercase)

                Spacer()

                RiskBadge(level: severity)
            }

            Text(title)
                .font(AppFont.headline)
                .foregroundColor(Color.textPrimary)

            // Cita textual del contrato
            VStack(alignment: .leading, spacing: AppSpacing.xs) {
                Text("CITA TEXTUAL DEL CONTRATO")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(Color.textMuted)

                Text("\"\(snippet)\"")
                    .font(AppFont.callout)
                    .italic()
                    .foregroundColor(Color.textSecondary)
                    .padding(AppSpacing.md)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.surfaceSubtle)
                    .cornerRadius(AppRadius.sm)
            }

            // Recomendación de negociación
            HStack(alignment: .top, spacing: AppSpacing.sm) {
                Image(systemName: "lightbulb.fill")
                    .font(.system(size: 13))
                    .foregroundColor(Color.brandAccent)
                    .padding(.top, 2)

                Text(recommendation)
                    .font(AppFont.subheadline)
                    .foregroundColor(Color.textPrimary)
            }
            .padding(.top, AppSpacing.xxs)
        }
        .padding(AppSpacing.lg)
        .background(Color.surfaceCard)
        .cornerRadius(AppRadius.lg)
        .overlay(
            RoundedRectangle(cornerRadius: AppRadius.lg)
                .stroke(Color.surfaceBorder, lineWidth: 1)
        )
        .cardElevation()
    }
}
