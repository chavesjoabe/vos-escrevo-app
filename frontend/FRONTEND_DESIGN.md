# FRONTEND_DESIGN.md — Bible Commentary Journal (Frontend Architecture)

## 1. Stack & Specifications

- **Framework & Language**: React 18 + TypeScript + Vite
- **UI & Layout**: MUI (Material UI v6) configured with the **Modern Studio & Monolithic Index** design system (inspired by the high-precision minimalism of `example.png` with complete Dark Mode & Light Mode support)
- **Authentication & Per-User Isolation (`AuthContext` & `authApi`)**:
  - **Session Management**: `AuthProvider` (`src/features/auth/AuthContext.tsx`) manages the authenticated user's session (`user`, `token`, `isAuthenticated`, `login`, `register`, `logout`) backed by `localStorage` (`commented_bible_auth_session_v1`).
  - **Automatic Bearer Token Injection**: `HttpClient` (`src/api/httpClient.ts`) automatically attaches `Authorization: Bearer <token>` to every API request.
  - **Strict Per-User Scoping**: Both backend persistence (`user_annotations` collection) and offline local fallback (`storageManager.ts` and `recentBooksStorage.ts`) scope all strokes, comment pages, and recent book history by `userId`. A user can never view or modify another user's strokes or comments.
- **Theme Architecture (`ThemeModeContext` & `getAppTheme`)**:
  - **Dynamic Theme Switcher**: React Context (`ThemeContext.tsx`) managing `'dark' | 'light'` state with persistent `localStorage` cache and automatic `data-theme` synchronization on the document root element.
  - **Dark Mode (Default Studio)**:
    - Background: Midnight Obsidian (`#0B0F17`)
    - Surface / Panels: Continuous Midnight Obsidian (`#0B0F17`) and Studio Cards (`rgba(255, 255, 255, 0.02)`)
    - Primary Accent: Crisp White (`#F8FAFC`) & Sky Blue (`#38BDF8`)
    - Secondary Accent: Atmospheric Slate Blue (`#5C82A6`)
    - Borders & Hairlines: Ultra-subtle divider hairlines (`rgba(255, 255, 255, 0.08)`)
    - Typography: Primary (`#F8FAFC`), Secondary (`#94A3B8`)
    - Dot Grid Matrix: `radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)` on 24px grid
    - Floating Dock: Frosted Midnight Obsidian (`rgba(15, 23, 42, 0.85)`, `backdropFilter: blur(20px)`)
  - **Light Mode (Clean Alabaster Slate)**:
    - Background: Pure Slate Alabaster (`#F8FAFC`)
    - Surface / Panels: Clean Canvas Paper (`#FAF9F6`) and Studio Cards (`#FFFFFF`)
    - Primary Accent: Deep Slate (`#0F172A`) & Cobalt Blue (`#0284C7`)
    - Secondary Accent: Atmospheric Blue (`#2563EB`) & Slate (`#64748B`)
    - Borders & Hairlines: Ultra-subtle divider hairlines (`rgba(0, 0, 0, 0.08)` / `#E2E8F0`)
    - Typography: Primary (`#0F172A`), Secondary (`#64748B`)
    - Dot Grid Matrix: `radial-gradient(rgba(0, 0, 0, 0.11) 1.15px, transparent 1.15px)` on 24px grid
    - Floating Dock: Frosted Alabaster (`rgba(248, 250, 252, 0.92)`, `backdropFilter: blur(20px)`)
- **Typography Architecture**:
  - **Display, Masthead & Interface**: **Inter** (300, 400, 500, 600, 700) — Precision engineered geometric sans-serif for sleek mastheads, two-tone titles, and crisp directory rows.
  - **Overlines, Monolithic Indices & Badges**: **JetBrains Mono** (400, 500, 600) — Monospaced numerals and uppercase labels (`01-05`, `NT / AT`, `VERSÍCULO DO DIA`, letter-spacing `0.14em–0.22em`).
  - **Scripture Reading & Versículo do Dia**: **Newsreader** (optical size 6..72, 400, 500, 600, italic) — Masterwork editorial serif engineered specifically for continuous, contemplative long-form reading on screens.
- **Apple Pencil 240Hz Hardware Ink Pipeline**:
  - **Zero Streamline Tip Tracking (`streamline: 0.02`)**: Eliminates the physics spring delay algorithm, locking the SVG stroke path 100% glued to the Apple Pencil nib in real-time.
  - **Non-Passive Native Event Listeners (`{ passive: false }`)**: Direct `pointerdown`, `pointermove`, `pointerup`, and `touchstart` listener attachments bypass iPadOS Safari's 150ms Scribble gesture hold timer.
  - **Coalesced Hardware Points**: `event.getCoalescedEvents()` captures all 240Hz hardware sub-points sent by Apple Pencil digitizers.
  - **Direct SVG DOM Mutation**: Active stroke updates mutate `activePathRef.current.setAttribute('d', d)` directly in the DOM via `requestAnimationFrame` with 0 React re-renders while drawing.
  - **Instant Local Canvas Commit**: Finished strokes append to local component state in < 1ms on `pointerup`, while parent tree updates run in the background via `React.startTransition`.

## 2. Project Structure

```
src/
 ├── api/
 │    ├── httpClient.ts          // Fetch wrapper, Bearer token injection & ApiError handler
 │    ├── authApi.ts             // Login, Register & session persistence
 │    ├── storageManager.ts      // Per-user (userId::pericopeId) local persistence fallback
 │    ├── recentBooksStorage.ts  // Per-user recent books history (last 5 books)
 │    ├── mockData.ts            // Rich seed Bible pericopes
 │    ├── bookApi.ts
 │    └── pericopeApi.ts         // Pericope CRUD + random Verse of the Day fetcher
 ├── domain/
 │    ├── user.ts                // User & AuthSession types
 │    ├── dailyVerse.ts          // DailyVerse type ("Versículo do Dia")
 │    ├── stroke.ts              // Stroke, StrokePoint, Tool types
 │    ├── pericope.ts
 │    └── book.ts
 ├── features/
 │    ├── auth/
 │    │    ├── AuthContext.tsx   // AuthProvider & useAuth hook
 │    │    └── LoginPage.tsx     // Studio Login & Registration page matching Home Page design
 │    ├── bookSelection/
 │    │    ├── BookSelectionPage.tsx    // Masthead, DailyVerseCard, Book/Chapter selector, Recent books
 │    │    ├── DailyVerseCard.tsx       // Random "Versículo do Dia" card with shuffle & book jump
 │    │    └── BookListItem.tsx         // Table of Contents hairline row with tabular index & chevron
 │    └── pericopeReader/
 │         ├── PericopeReaderPage.tsx   // Pinned dual-page headers, unified split spread & gutter shadow
 │         ├── PericopeTextPanel.tsx    // Left panel (Newsreader scripture typography + HighlightLayer)
 │         ├── HighlightLayer.tsx       // SVG stroke overlay on text panel (Non-passive native listeners)
 │         ├── CommentPagePanel.tsx     // Right panel (Harmonized dot matrix + CommentCanvas)
 │         ├── CommentCanvas.tsx        // SVG stroke canvas on comment panel (Non-passive native listeners)
 │         ├── DrawingToolbar.tsx       // Sculpted frosted-glass floating stylus dock with jewel-pill minimize
 │         └── PericopeNavigation.tsx   // 50px streamlined bar + theme toggle + quiet save feedback
 ├── drawing/
 │    ├── useStrokeCapture.ts    // Native non-passive listeners & rAF 240Hz Apple Pencil drawing + drag eraser
 │    ├── strokeRenderer.ts      // perfect-freehand zero-streamline SVG path conversion
 │    ├── strokeCollision.ts     // Real-time geometric point-to-segment collision & sweep detection
 │    ├── RenderedStroke.tsx     // Memoized SVG stroke component (zero-latency re-renders)
 │    └── colorPalette.ts        // Curated fountain pen inks & illumination pastel highlighters
 ├── theme/
 │    ├── ThemeContext.tsx       // ThemeModeProvider, useThemeMode hook, and localStorage sync
 │    └── theme.ts               // getAppTheme(mode: 'dark' | 'light') with Inter, JetBrains Mono & Newsreader
 ├── index.css                   // data-theme CSS root variables and reset
 └── App.tsx                     // Root component wrapped with ThemeModeProvider & AuthProvider
```

## 3. Core Features & UX Architecture

### 3.1 Login Page (`LoginPage.tsx`)
- **Visual Parity with Home Page**:
  - Uses the exact same background (`#0B0F17` in Dark Mode, `#F8FAFC` in Light Mode), top control bar (`DIÁRIO DE COMENTÁRIOS · BLIVRE` + `Modo Claro / Modo Escuro` toggle), brand logo (`/logo-dark.png` / `/logo-light.png`), and two-tone masthead (`Estude a Palavra.` / `Escrito à mão.`).
- **Authentication Studio Card**:
  - Bordered studio panel (`rgba(255, 255, 255, 0.02)` with `rgba(255, 255, 255, 0.08)` border in Dark Mode; `#FFFFFF` with `#E2E8F0` border in Light Mode).
  - Inline tabs switching between **Entrar** (Login with `email` + `password`) and **Criar Conta** (Sign-up with `name` + `email` + `password`).
  - Password visibility toggle and inline error feedback (`Alert`).
  - Privacy footnote highlighting that every user's strokes and comments are strictly isolated.

### 3.2 Home Page (`BookSelectionPage.tsx`) & "Versículo do Dia" (`DailyVerseCard.tsx`)
- **Top Control Bar**:
  - Displays the monospaced brand overline, the authenticated user's name pill (`PersonOutlineIcon`), the Dark/Light theme switcher, `Resetar`, and `Sair` (Logout).
- **"Versículo do Dia" Card (`DailyVerseCard.tsx`)**:
  - Positioned above the Book & Chapter selector panel in a **collapsed initial state** (`expanded = false`).
  - Clicking the card header expands/collapses the card smoothly via MUI `Collapse`.
  - Resolves a deterministic daily inspirational verse for the current calendar day (`YYYY-MM-DD`) via `pericopeApi.getVerseOfTheDay()` (`GET /pericopes/verse-of-the-day` with local date-keyed persistence), updating only on the next day (no manual shuffle button).
  - Renders the verse text in the non-italic studio sans-serif font (`sansFontFamily`, `fontStyle: 'normal'`) and light gray tone (`#94A3B8` in Dark Mode, `#64748B` in Light Mode) matching the home page subtitle (`"Selecione um livro e capítulo..."`), alongside its Biblical reference and a quick `Abrir <Livro>` action button.
- **Book & Chapter Selection Panel & Monolithic Index Directory**:
  - Filter tabs (`Todos`, `Novo Testamento`, `Antigo Testamento`), cascading Book & Chapter selects, and the Monolithic Index Directory of the user's last 5 accessed books.

### 3.3 Pericope Reader (`PericopeReaderPage.tsx`)
- **Top Navigation Bar (`PericopeNavigation.tsx` — 50px)**:
  - Left section: Quick `Livros` button, current book title, and chapter selector.
  - Center section: Clickable **"vos-escrevo"** brand logo (`/logo-dark.png` in Dark Mode, `/logo-light.png` in Light Mode) centered in the top menu bar that saves any pending strokes and returns the user to the Home page (`BookSelectionPage`).
  - Right section: Theme toggle button, save indicator, and chapter pagination controls.
- **Pinned Dual-Page Header Bar (54px)**:
  - Left Header: Displays pericope title in **Newsreader** (`fontSize: '1.25rem'`, `fontWeight: 600`) and reference pill in sky/cobalt tint.
  - Right Header: Displays the "Data:" field with an archival manuscript date picker and quiet *"Anotações Pessoais"* label.
- **Unified Synchronized Scroll View**:
  - Below the pinned headers, a shared scroll container holds both the left Scripture panel and the right comment draw area in 1:1 lockstep.
  - Loads and saves strokes exclusively for the authenticated user.

## 4. Hardware Ink Performance, Palm Rejection & Gesture Rules

- **1:1 Tip Tracking (`streamline: 0.02`)**: Zero streamline physics lag; ink follows the physical Apple Pencil nib in real-time.
- **Safari iPadOS Gesture Cancellation**: Event listeners use `{ passive: false }` with `event.preventDefault()` on `pointerdown` and `touchstart`.
- **Strict 2-Finger Scrolling Requirement**: Single-finger drag on either panel is strictly prevented from scrolling the page to protect palm resting. Document scrolling is triggered exclusively by a 2-finger pan gesture (or mouse wheel / trackpad on desktop).

## 5. Running Locally & Testing on iPad

1. `npm install`
2. `npm run dev -- --host` (exposes dev server on local network e.g. `http://192.168.15.50:5173`).
3. Open `http://192.168.15.50:5173` on iPad Safari on the same Wi-Fi network.
