1. Color Palette (Semantic Tokens)
Surface & Background
surface.primary: #0E0F11 (Main background, deep charcoal)
surface.secondary: #1A1C1F (Bottom sheets and secondary containers)
surface.elevated: #24272B (Cards, input fields, and elevated panels)
surface.divider: rgba(255,255,255,0.08) (Thin lines and borders)
surface.sheetScrim: rgba(0,0,0,0.55) (Dimming background for overlays)
Typography
text.primary: rgba(255,255,255,0.92) (High emphasis text)
text.secondary: rgba(255,255,255,0.72) (Medium emphasis text)
text.muted: rgba(255,255,255,0.55) (Placeholders and disabled text)
text.inverse: #0E0F11 (Dark text for light backgrounds like the Copper button)
Intent & Brand
intent.primary: #B87333 (Copper - Main brand/action color)
intent.primaryPressed: #8C5A2B (Active state for copper buttons)
intent.secondary: rgba(255,255,255,0.12) (Subtle background for secondary actions)
Route & Status
route.selected: #B87333 (Active route on map)
route.alternate: rgba(255,255,255,0.45) (Alternative route options)
status.error: #E35D6A (Destructive actions and errors)
status.warning: #D98E04 (Wind advisories and alerts)
2. Typography System
Display Font: SpaceGrotesk (Used for headers and branding)
UI Font: Inter (Used for functional text, labels, and body copy)
Token	Size	Weight	Font Family
xxl	32px	Semibold	SpaceGrotesk
xl	24px	Semibold	SpaceGrotesk
lg	20px	Semibold	Inter
md	16px	Regular	Inter
sm	14px	Medium	Inter
xs	12px	Regular	Inter
3. Layout & Shapes
Border Radius:
sm: 8px (Small controls)
md: 12px (Buttons, Inputs)
lg: 16px (Cards, Overlays)
xl: 20px (Bottom Sheet top corners)
Spacing: Ranges from xs (6px) to xl (24px) to maintain a clean, industrial layout.
4. Motion & Animation
Duration: short (140ms) and medium (220ms).
Easing: easeOut (Standard material-style curve).