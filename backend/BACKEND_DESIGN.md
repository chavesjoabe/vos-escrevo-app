# BACKEND_DESIGN.md — Bible Commentary Journal (Backend)

## 1. Stack

- Java 21
- Quarkus (RESTEasy Reactive + MongoDB with Panache + Hibernate Validator)
- MongoDB (Atlas cluster or local instance)

## 2. Layered Architecture

Follows the `resource` (controller) → `service` → `repository` pattern, with DTOs at the API boundary so MongoDB documents never leak directly into the REST contract.

```
com.biblejournal
 ├── auth
 │    ├── AuthResource.java                    // POST /auth/register, POST /auth/login, GET /auth/me
 │    ├── AuthService.java                     // registration, credential verification, profile lookup
 │    ├── TokenService.java                    // HMAC-SHA256 Bearer token generation & verification
 │    ├── PasswordHasher.java                  // PBKDF2WithHmacSHA256 salted password hashing
 │    ├── LoginRequest.java                    // DTO
 │    ├── RegisterRequest.java                 // DTO
 │    ├── AuthResponse.java                    // DTO (token + UserResponse)
 │    ├── AuthenticatedUser.java               // Verified principal extracted from Bearer token
 │    ├── UnauthorizedAccessException.java     // Mapped to 401 Unauthorized
 │    └── EmailAlreadyRegisteredException.java // Mapped to 409 Conflict
 ├── user
 │    ├── User.java                            // MongoDB entity (users collection)
 │    ├── UserRepository.java                  // Panache repository
 │    └── UserResponse.java                    // DTO
 ├── annotation
 │    ├── UserPericopeAnnotation.java          // MongoDB entity (user_annotations collection)
 │    └── UserPericopeAnnotationRepository.java// Scoped queries by (userId, pericopeId)
 ├── book
 │    ├── BookResource.java
 │    ├── BookService.java
 │    ├── BookRepository.java
 │    ├── Book.java                            // MongoDB entity (books collection)
 │    └── BookResponse.java
 ├── pericope
 │    ├── PericopeResource.java                // Authenticated pericope + stroke endpoints + daily verse
 │    ├── PericopeService.java                 // Merges read-only Pericope with UserPericopeAnnotation
 │    ├── PericopeRepository.java
 │    ├── Pericope.java                        // Read-only MongoDB entity (pericopes collection)
 │    ├── PericopeResponse.java                // DTO combining scripture + authenticated user's strokes
 │    ├── PericopeSummaryResponse.java
 │    ├── DailyVerseResponse.java              // DTO for random "Versículo do Dia"
 │    ├── CommentPage.java
 │    └── CommentPageRequest.java
 ├── stroke
 │    ├── Stroke.java                          // Embedded document
 │    ├── StrokePoint.java                     // Embedded document
 │    ├── StrokeRequest.java                   // DTO
 │    └── StrokePointRequest.java              // DTO
 └── config
      ├── BibleSeedLoader.java                 // Seeds 66 books / 1,189 chapters + ensures unique indexes
      ├── DomainExceptionMapper.java           // Maps domain exceptions to 401, 404, 409
      └── CorsConfig.java
```

## 3. Domain Model & MongoDB Collections

### 3.1 `users` Collection
Stores registered user accounts with salted PBKDF2 password hashes and a unique index on `email`.

```json
{
  "_id": "ObjectId",
  "name": "Joabe Chaves",
  "email": "joabe@example.com",
  "passwordHash": "65536:<base64-salt>:<base64-derived-key>",
  "createdAt": "2026-10-29T13:45:00Z"
}
```

### 3.2 `books` & `pericopes` Collections (Read-Only Scripture Catalog)
`pericopes` stores only the immutable Scripture text (`bookId`, `title`, `reference`, `orderInBook`, `verses`). User strokes and comments are **never** stored on the shared `Pericope` document.

```json
{
  "_id": "ObjectId",
  "bookId": "ObjectId",
  "title": "Salmos 119",
  "reference": "119:1-176",
  "orderInBook": 119,
  "verses": [
    { "verseNumber": 105, "text": "Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho." }
  ]
}
```

### 3.3 `user_annotations` Collection (Per-User Strokes & Comment Page)
All highlight strokes and comment pages are stored in `user_annotations`, indexed uniquely by `(userId, pericopeId)`.
- `userId` is always extracted from the verified `Authorization: Bearer <token>` header via `TokenService`.
- Every read and write operation in `PericopeService` queries `UserPericopeAnnotationRepository.findByUserIdAndPericopeId(authenticatedUserId, pericopeId)`.
- **Strict Permission Boundary**: A user has zero access to another user's strokes or comments.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "pericopeId": "ObjectId",
  "updatedAt": "2026-10-29T14:00:00Z",
  "highlightStrokes": [
    {
      "strokeId": "uuid",
      "tool": "marker",
      "color": "#FDE68A",
      "strokeWidth": 18,
      "opacity": 0.5,
      "points": [
        { "positionX": 42.5, "positionY": 118.2, "pressure": 0.6 }
      ]
    }
  ],
  "commentPage": {
    "date": "2026-10-29",
    "strokes": [
      {
        "strokeId": "uuid",
        "tool": "pencil",
        "color": "#7EB2DD",
        "strokeWidth": 3,
        "opacity": 1.0,
        "points": [
          { "positionX": 12.0, "positionY": 30.4, "pressure": 0.8 }
        ]
      }
    ]
  }
}
```

## 4. REST API

| Method | Path | Auth Required | Purpose |
|---|---|---|---|
| POST | `/auth/register` | No | Create a new user account (`name`, `email`, `password`) and return Bearer token |
| POST | `/auth/login` | No | Authenticate with `email` + `password` and return Bearer token |
| GET | `/auth/me` | Yes (`Bearer`) | Return the authenticated user's profile |
| GET | `/books` | No | List all books ordered by testament order |
| GET | `/books/{bookId}/pericopes` | No | Lightweight list of chapters/pericopes for navigation |
| GET | `/pericopes/verse-of-the-day` | No | Return the inspirational verse of the day ("Versículo do Dia"), deterministically selected per calendar day (`LocalDate.now().toEpochDay()`) |
| GET | `/pericopes/{pericopeId}` | Yes (`Bearer`) | Full pericope verses + the authenticated user's own `highlightStrokes` and `commentPage` |
| PUT | `/pericopes/{pericopeId}/highlight-strokes` | Yes (`Bearer`) | Replace `highlightStrokes` exclusively for the authenticated user on this pericope |
| PUT | `/pericopes/{pericopeId}/comment-page` | Yes (`Bearer`) | Replace `commentPage` (`date` + `strokes`) exclusively for the authenticated user on this pericope |

## 5. Seeding & Indexes (`BibleSeedLoader`)

On startup (when `bible.seed.enabled=true`), `BibleSeedLoader` seeds the 66 books and 1,189 chapters from `/seed/blivre-bible.json` if not yet present, and ensures the following MongoDB indexes:
- `books`: ascending index on `orderInTestament`
- `pericopes`: compound index on `(bookId, orderInBook)`
- `users`: unique index on `email`
- `user_annotations`: unique compound index on `(userId, pericopeId)`

## 6. Validation & Error Handling

- Request payloads (`LoginRequest`, `RegisterRequest`, `StrokeRequest`, `CommentPageRequest`) are validated with `jakarta.validation` annotations.
- Domain exceptions are mapped via `DomainExceptionMapper`:
  - `UnauthorizedAccessException` → `401 Unauthorized`
  - `PericopeNotFoundException` / `BookNotFoundException` → `404 Not Found`
  - `EmailAlreadyRegisteredException` → `409 Conflict`
