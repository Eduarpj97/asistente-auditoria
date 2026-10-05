# Audiflow iOS Design System

Sistema de diseño nativo en **SwiftUI** derivado del archivo canónico [`DESIGN.md`](../DESIGN.md) siguiendo la especificación del estándar **ricoui-design-md**.

---

## Estructura del Módulo iOS

```
ios/
├── Sources/
│   ├── DesignTokens.swift          # Colores, Spacing, Typography, Radii y Sombras
│   ├── Components.swift            # Botones, RiskBadge, TrafficLightCard, AuditFindingCard
│   └── Views/
│       └── AuditDashboardView.swift # Vista de ejemplo completa con el Semáforo Normativo
└── README.md                       # Esta guía
```

---

## Cómo usar el "Alma" del diseño en tu proyecto de iOS (Xcode)

### Paso 1: Copiar los archivos a tu proyecto de Xcode
Simplemente arrastra la carpeta `ios/Sources` dentro de tu proyecto en Xcode (asegúrate de marcar *"Copy items if needed"* y seleccionar tu Target principal).

### Paso 2: Usar los Tokens de Diseño en cualquier Vista
Ahora cualquier vista de SwiftUI puede usar los tokens directamente sin inventar estilos:

```swift
import SwiftUI

struct MiContratoView: View {
    var body: some View {
        VStack(spacing: AppSpacing.md) {
            Text("Auditoría Legal")
                .font(AppFont.titleLarge)
                .foregroundColor(Color.textPrimary)

            RiskBadge(level: .high)

            Button("Auditar Ahora") {
                // acción
            }
            .buttonStyle(PrimaryButtonStyle())
        }
        .padding(AppSpacing.lg)
        .background(Color.surfaceCard)
        .cornerRadius(AppRadius.lg)
        .cardElevation()
    }
}
```

---

## Cómo usar `DESIGN.md` con Asistentes de IA (Xcode Copilot / Cursor)

Para que cualquier IA genere interfaces idénticas a la identidad de tu marca:
1. Mantén [`DESIGN.md`](../DESIGN.md) en la raíz de tu proyecto.
2. Cada vez que le pidas una pantalla a la IA, dale esta instrucción:
   > *"Genera la vista de carga de contratos en SwiftUI utilizando exclusivamente los tokens de `DESIGN.md` y los componentes de `DesignTokens.swift` (colores `brandPrimary`, espaciados `AppSpacing`, tipografías `AppFont` y botones `PrimaryButtonStyle`)."*
