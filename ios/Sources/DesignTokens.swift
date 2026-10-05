//
//  DesignTokens.swift
//  Audiflow iOS Design System
//  Generated based on DESIGN.md (ricoui-design-md specification)
//

import SwiftUI

// MARK: - Color Hex Initializer
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Design Tokens: Brand Colors
public extension Color {
    // Primary Brand
    static let brandPrimary = Color(hex: "#0F2744")
    static let brandSecondary = Color(hex: "#1E3E62")
    static let brandAccent = Color(hex: "#2563EB")
    static let brandAccentLight = Color(hex: "#3B82F6")

    // Surfaces & Canvas (Adaptive Light/Dark Support)
    static let surfaceCanvas = Color(hex: "#F8FAFC")
    static let surfaceCard = Color.white
    static let surfaceSubtle = Color(hex: "#F1F5F9")
    static let surfaceBorder = Color(hex: "#E2E8F0")

    // Typography Colors
    static let textPrimary = Color(hex: "#0F172A")
    static let textSecondary = Color(hex: "#475569")
    static let textMuted = Color(hex: "#94A3B8")
    static let textOnDark = Color.white

    // Semantic Risk Matrix (Semáforo Normativo)
    struct Risk {
        public static let lowBg = Color(hex: "#ECFDF5")
        public static let lowBorder = Color(hex: "#A7F3D0")
        public static let lowText = Color(hex: "#059669")

        public static let mediumBg = Color(hex: "#FEFCE8")
        public static let mediumBorder = Color(hex: "#FDE047")
        public static let mediumText = Color(hex: "#D97706")

        public static let notableBg = Color(hex: "#FFF7ED")
        public static let notableBorder = Color(hex: "#FDBA74")
        public static let notableText = Color(hex: "#EA580C")

        public static let highBg = Color(hex: "#FEF2F2")
        public static let highBorder = Color(hex: "#FECACA")
        public static let highText = Color(hex: "#DC2626")
    }
}

// MARK: - Design Tokens: Spacing Scale (4pt/8pt Grid)
public enum AppSpacing {
    /// 2pt
    public static let xxs: CGFloat = 2
    /// 4pt
    public static let xs: CGFloat = 4
    /// 8pt
    public static let sm: CGFloat = 8
    /// 12pt
    public static let md: CGFloat = 12
    /// 16pt (Standard Screen Padding)
    public static let base: CGFloat = 16
    /// 24pt (Card Padding)
    public static let lg: CGFloat = 24
    /// 32pt
    public static let xl: CGFloat = 32
    /// 48pt
    public static let xxl: CGFloat = 48
}

// MARK: - Design Tokens: Corner Radii
public enum AppRadius {
    /// 4pt (Tags)
    public static let xs: CGFloat = 4
    /// 8pt (Buttons & Fields)
    public static let sm: CGFloat = 8
    /// 12pt (Cards & Modals)
    public static let md: CGFloat = 12
    /// 18pt (Large Container Cards)
    public static let lg: CGFloat = 18
    /// 9999pt (Fully Rounded Pills)
    public static let full: CGFloat = 9999
}

// MARK: - Design Tokens: Typography System
public enum AppFont {
    public static let display = Font.system(size: 32, weight: .bold, design: .default)
    public static let titleLarge = Font.system(size: 24, weight: .bold, design: .default)
    public static let titleMedium = Font.system(size: 20, weight: .semibold, design: .default)
    public static let headline = Font.system(size: 17, weight: .semibold, design: .default)
    public static let body = Font.system(size: 16, weight: .regular, design: .default)
    public static let callout = Font.system(size: 15, weight: .medium, design: .default)
    public static let subheadline = Font.system(size: 14, weight: .regular, design: .default)
    public static let caption = Font.system(size: 12, weight: .semibold, design: .default)
}

// MARK: - Design Tokens: Shadows & Elevation
public struct CardElevationModifier: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 3)
            .shadow(color: Color.black.opacity(0.02), radius: 1, x: 0, y: 1)
    }
}

public extension View {
    func cardElevation() -> some View {
        modifier(CardElevationModifier())
    }
}
