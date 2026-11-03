# DESIGN.md — Bible Commentary Journal

## 1. Product Vision

A digital replica of a handwritten Bible study journal for iPad, crafted with a
**Modern Studio & Archival Editorial** aesthetic (inspired by the high-precision
minimalism of `example.png` with support for both Dark Mode and Light Mode). Each
authenticated user has a strictly private study journal: each screen in the reader
presents an open, two-page hardbound book spread with a curated Bible passage
(**pericope**) on the left and a blank, dotted commentary page on the right. The user
reads with scholarly typographic clarity, underlines/highlights with soft markers,
and writes personal reflections using the Apple Pencil — evoking the tactile,
contemplative intimacy of a physical journal.

## 2. Glossary

| Term | Meaning |
|---|---|
| **User** | An authenticated account (`email` + `password`) that owns a strictly isolated set of handwritten strokes, highlights, and recent book history. |
| **Versículo do Dia** | A collapsible card on the Home page (`BookSelectionPage`), collapsed by default, that expands on click to display the inspirational verse of the day in non-italic sans-serif typography (`#94A3B8` / `#64748B`), updating once per calendar day. |
| **Book** | A book of the Bible (e.g. "Marcos"). Contains an ordered list of Pericopes, displayed in the sleek Monolithic Index directory. |
| **Pericope** | A read-only Scripture chapter/passage (e.g. "Mc 1:1-8") shared across the catalog. Never stores user strokes directly. |
| **UserPericopeAnnotation** | Per-user annotation document (`user_annotations` collection) keyed uniquely by `(userId, pericopeId)`, holding that specific user's `highlightStrokes` and `commentPage` (`date` + `strokes`). |
| **Comment Page** | The right-hand page paired 1:1 with a Pericope for a specific User. Features an adaptive dot grid matrix (`rgba(255,255,255,0.12)` on `#0B0F17` in Dark Mode; `rgba(0,0,0,0.11)` on `#FAF9F6` in Light Mode), holding the date field ("Data:") and the user's handwritten strokes. |
| **Stroke** | A single continuous pen or marker movement, captured as an ordered list of points with hardware pressure. The atomic unit of both handwriting and highlighting. |
| **Pencil tool (Pena / Lápis)** | Writing and underlining tool used across the journal. Inks feature sophisticated pastel-based tones (neither too dark nor too light, with optimal contrast): in Dark Mode (Giz Pastel `#D5DEE8`, Azul Céu Pastel `#7EB2DD`, Coral Pastel `#E58A82`, Menta Pastel `#84CEAB`, Lavanda Pastel `#BFA6DE`); in Light Mode (Grafite Suave `#526071`, Azul Pastel `#4F759B`, Terracota Suave `#B85D4B`, Sálvia Pastel `#4E7D63`, Lavanda Queimada `#7D5F8A`). |
| **Marker tool (Marcador)** | Highlighting tool used over the Scripture text. Illumination pastel pigments: Parchment Gold (`#FDE68A`), Willow Green (`#BBF7D0`), Morning Sky Mist (`#BAE6FD`), Dusty Wild Rose (`#FBCFE8`), and Muted Apricot (`#FED7AA`), fixed 50% opacity. |
| **Eraser tool (Borracha)** | Precision drag eraser that acts like a pencil — rubbing or dragging across strokes deletes them in real time via geometric vector intersection, complete with atomic swipe-level undo/redo and circular tip feedback. |

## 3. Core User Flow

1. **Authentication (`LoginPage`)**:
   - Unauthenticated users are presented with the **Login Page**, designed with the exact **Modern Studio** aesthetic and color palette of the Home page (Midnight Obsidian `#0B0F17` & Sky Blue `#38BDF8` in Dark Mode; Slate Alabaster `#F8FAFC` & Cobalt Blue `#0284C7` in Light Mode).
   - Users can sign in (`Entrar`) with `email` and `password` or create a new account (`Criar Conta`) with `name`, `email`, and `password`, receiving a signed Bearer token.
2. **Home Page (`BookSelectionPage`)**:
   - Displays the top studio bar with the logged-in user badge, Dark/Light mode toggle, and `Sair` (logout) button.
   - Displays the **"Versículo do Dia" (`DailyVerseCard`)** card right above the Book & Chapter selector. The card starts in a collapsed state (`expanded = false`); clicking its header expands it to reveal the inspirational verse of the day (rendered in non-italic sans-serif font with light gray color matching the page subtitle), which updates automatically on the next calendar day.
   - Displays the **Book & Chapter Selection Panel** and the **Monolithic Index Directory** of the user's last 5 accessed books.
3. **Reading & Commenting (`PericopeReaderPage`)**:
   - User picks a book and chapter → app loads the read-only `Pericope` scripture text together with the authenticated user's isolated `UserPericopeAnnotation`.
   - Presents the open-book split spread:
     - **Unified Adaptive Spread**: Both pages share identical backdrops (`#0B0F17` in Dark Mode / `#F8FAFC` in Light Mode) with an ambient central book spine gutter shadow (`boxShadow: inset -6px 0 20px -6px rgba(0,0,0,0.7)`), creating an authentic open-book illusion.
     - **Left Page**: Pericope text rendered in **Newsreader** editorial serif with subtle sky/cobalt verse numbers, markable with the Marker or Pencil tool.
     - **Right Page**: Comment Page (adaptive dot grid canvas, writable with the Pencil tool, streamlined "Data:" date stamp).
     - **Streamlined Vertical Real Estate**: Top navigation bar (50px) + Pinned Dual-Page Header (54px) compacts the chrome to 104px total.
     - **2-Finger Synchronized Scrolling**: As the user scrolls using a 2-finger pan gesture, the comment page drawing area scrolls in lockstep with the pericope text area, keeping commentary notes visually aligned with their respective verses. Single-finger dragging is strictly prevented from scrolling to protect palm resting.
4. **Writing & Per-User Persistence**:
   - User writes/highlights with the Apple Pencil using the **Sculpted Frosted-Glass Floating Dock** (`DrawingToolbar`).
   - Strokes are saved strictly under the authenticated user's `userId` (`PUT /pericopes/{pericopeId}/highlight-strokes` and `PUT /pericopes/{pericopeId}/comment-page` with `Authorization: Bearer <token>`).
   - **Strict User Isolation**: A user never has permission to view or modify another user's strokes or comments.

## 4. High-Level Architecture

```
┌─────────────────────────────┐   REST/JSON + Bearer    ┌───────────────────────────┐
│  React + TS + Vite + MUI    │ ───────────────────────▶ │  Java 21 + Quarkus        │
│  LoginPage + Home + Reader  │ ◀─────────────────────── │  Auth + Pericope + User   │
│  Dark & Light Mode Studio   │                          └─────────────┬─────────────┘
└─────────────────────────────┘                                        │
                                                                       ▼
                                                         ┌───────────────────────────┐
                                                         │  MongoDB                  │
                                                         │  - users                  │
                                                         │  - books (read-only)      │
                                                         │  - pericopes (read-only)  │
                                                         │  - user_annotations       │
                                                         └───────────────────────────┘
```

Frontend and backend are two independent codebases communicating through a
REST API with Bearer token authentication (details in `BACKEND_DESIGN.md`).

## 5. Domain Model (conceptual, storage-agnostic)

```
User
 ├── id
 ├── name
 ├── email (unique)
 └── passwordHash (PBKDF2WithHmacSHA256)

Book (read-only catalog)
 └── Pericope (ordered within Book, read-only Scripture)
      └── verses: { verseNumber: number, text: string }[]

UserPericopeAnnotation (strictly scoped by userId + pericopeId)
 ├── id
 ├── userId (references User.id)
 ├── pericopeId (references Pericope.id)
 ├── highlightStrokes: Stroke[]   (marker/pencil drawn over the text by this user)
 └── commentPage
      ├── date: the "Data:" field
      └── strokes: Stroke[]        (handwritten commentary by this user)

Stroke
 ├── strokeId
 ├── tool: "pencil" | "marker"
 ├── color: string (hex)
 ├── strokeWidth: number
 ├── opacity: number (fixed 0.5 for marker, 1.0 for pencil)
 └── points: { positionX: number, positionY: number, pressure: number }[]
```

**Why vector strokes instead of a raster image (PNG) of each page:**
- Smaller payloads over the network and in MongoDB.
- Resolution-independent — looks identical on any iPad screen size.
- Editable later (e.g. undo a single stroke, not the whole drawing).
- Portable to native: this point-array shape maps directly onto Apple's
  `PencilKit` (`PKStroke`) model, which removes a costly data-migration step
  when the app becomes native.

**Why a dedicated `UserPericopeAnnotation` collection (`user_annotations`):**
- Keeps the 1,189 seeded `Pericope` scripture documents pure and immutable.
- Guarantees strict per-user isolation at the database query boundary (`find("userId = ?1 and pericopeId = ?2", authenticatedUserId, pericopeId)`), preventing any user from ever seeing or overwriting another user's strokes or comments.

## 6. Non-Functional Requirements

- **Target device**: iPad + Apple Pencil, Safari (plus desktop browser support).
- **Aesthetic Standard (`example.png` Inspired)**:
  - Dark Mode: Midnight obsidian `#0B0F17`, atmospheric blue `#5C82A6`, sky accent `#38BDF8`, crisp text `#F8FAFC`.
  - Light Mode: Clean alabaster `#F8FAFC`, cobalt accent `#0284C7`, deep slate text `#0F172A`.
  - Unified visual identity across `LoginPage`, `BookSelectionPage` (with `DailyVerseCard`), and `PericopeReaderPage`.
- **Security & Access Control**:
  - Salted `PBKDF2WithHmacSHA256` password hashing and HMAC-SHA256 signed Bearer tokens.
  - User identity is always resolved from the verified `Authorization: Bearer <token>` header on the backend — never trusted from client request bodies or query parameters.
  - No user has permission to read or write another user's strokes or comments.
- **Performance**: stroke rendering must feel like real ink — zero streamline lag,
  240Hz hardware point capture, active path DOM mutation via `requestAnimationFrame`.
- **Touch & Gesture Discipline (Palm Rejection)**: Single-finger dragging must never
  scroll the page, ensuring users can rest their hand or finger naturally without
  accidental page shifts. Scrolling is exclusively triggered via 2-finger pan gestures,
  scrolling both the pericope text and the commentary drawing area synchronously.

## 7. Companion Documents

- `FRONTEND_DESIGN.md` — React/TS/Vite/MUI architecture, `LoginPage`, `AuthContext`, `DailyVerseCard`, Dark/Light mode theme system, Apple Pencil handling.
- `BACKEND_DESIGN.md` — Quarkus/MongoDB API, `users` and `user_annotations` collections, authentication endpoints, per-user isolation, and daily verse endpoint.
- `direction-approved.md` — Gate file recording the approved design direction.
