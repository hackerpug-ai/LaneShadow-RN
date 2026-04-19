# ErrorBoundary - STYLE PROPERTIES MATRIX

**Component:** ErrorBoundary
**RN Source:** `react-native/components/logging/error-boundary.tsx`
**Framework Primitives:** React Error Boundary API

---

## TRANSLATION SOURCES

| Source Type | Path | Purpose |
|---|---|---|---|
| RN Wrapper | `react-native/components/logging/error-boundary.tsx` | React error boundary with logging |
| View (RN) | `node_modules/react-native/Libraries/Components/View/View.js` | Container |
| Text (Paper) | `node_modules/react-native-paper/src/components/Typography/Text.tsx` | Error text |

---

## LAYOUT COMPOSITION

**Purpose:** React Error Boundary that catches component errors, logs them, and displays fallback UI

**Composition pattern:**
- Class component with error state
- getDerivedStateFromError for state capture
- componentDidCatch for logging
- Fallback UI with centered error message
- Optional custom fallback component
- DEV mode: displays error message

**Layout:** Full-screen centered error message when error occurs

---

## STYLE PROPERTIES MATRIX

### Layout — Fallback Container (View)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| flex | RN-wrapper | `1` | `Modifier.fillMaxSize()` | `.frame(maxWidth: .infinity, maxHeight: .infinity)` | n/a |
| justifyContent | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterVertically)` | `.frame(alignment: .center)` | n/a |
| alignItems | RN-wrapper | `'center'` | `Modifier.wrapContentSize(Alignment.CenterHorizontally)` | Included above | n/a |
| padding | RN-wrapper | `20` | `Modifier.padding(20.dp)` | `.padding(20)` | ESCALATE — propose `space.errorFallbackPadding = 20` |

### Typography — Error Message (Text)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| text | RN-wrapper | `'Something went wrong.'` | `Text("Something went wrong.")` | `Text("Something went wrong.")` | n/a |
| fontSize | RN-wrapper | `18` | `18.sp` | `.font(.system(size: 18))` | ESCALATE — propose `type.errorFallback.fontSize = 18` |
| marginBottom | RN-wrapper | `10` | `Modifier.padding(bottom = 10.dp)` | `.padding(.bottom, 10)` | ESCALATE — propose `space.errorMessageGap = 10` |

### Typography — Dev Error Details (Text, DEV mode only)

| Property | Source | Value | Android equivalent | iOS equivalent | Token mapping |
|---|---|---|---||---|---|
| fontSize | RN-wrapper | `12` | `12.sp` | `.font(.system(size: 12))` | ESCALATE — propose `type.errorDetails.fontSize = 12` |
| color | RN-wrapper | `'gray'` | `Color.Gray` | `Color.gray` | ESCALATE — propose `color.errorDetails = gray` |

---

## NOTES

- **Class component:** Uses React class component lifecycle methods
- **State capture:** getDerivedStateFromError sets hasError and error
- **Logging:** Logs to frontend logger with component stack
- **Fallback UI:** Centered "Something went wrong" message
- **DEV mode:** Shows error.message in gray below main message
- **Custom fallback:** Supports optional custom fallback component via prop
- **Normal rendering:** Returns children when no error
- **TestID:** None at boundary level (propagate to children)
- **Platform equivalent:** Android: try/catch with LaunchedEffect, iOS: generic error handling
