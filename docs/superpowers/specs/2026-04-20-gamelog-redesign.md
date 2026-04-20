# GameLog — Specyfikacja redesignu (2026-04-20)

## Cel

Przebudowa prostej aplikacji task-manager na pełnoprawny tracker gier wideo z systemem kont użytkowników, integracją RAWG API, biblioteką gier z statusami, oceną 0-100, recenzjami i dashboardem statystyk. Aplikacja gotowa do deploymentu na Azure.

## Stack technologiczny (bez zmian)

- **Backend:** .NET 9 (ASP.NET Core), Entity Framework Core, Azure SQL
- **Frontend:** React 19 + TypeScript + Tailwind CSS v3 + Vite
- **Auth:** JWT (7-day tokens), BCrypt passwords
- **Zewnętrzne API:** RAWG (rawg.io) — wyszukiwanie i dane o grach
- **Deploy:** Azure App Service (backend), Azure Static Web Apps (frontend), Azure Key Vault (sekrety)

## Modele danych

### User
| Pole | Typ | Opis |
|------|-----|------|
| Id | int | PK |
| Username | string | unikalna nazwa |
| Email | string | unikalne |
| PasswordHash | string | BCrypt |
| CreatedAt | DateTime | |

### Game (cache RAWG)
| Pole | Typ | Opis |
|------|-----|------|
| Id | int | PK |
| RawgId | int | ID z RAWG API |
| Title | string | tytuł gry |
| CoverImageUrl | string | URL okładki z RAWG |
| ReleaseYear | int? | rok premiery |
| Genres | string | JSON array gatunków |

### UserGame (biblioteka użytkownika)
| Pole | Typ | Opis |
|------|-----|------|
| Id | int | PK |
| UserId | int | FK → User |
| GameId | int | FK → Game |
| Status | enum | Planned / InProgress / Completed / Abandoned |
| Platform | string | np. PC, PS5, Xbox, Switch |
| Score | int? | 0-100, nullable |
| Review | string? | tekst recenzji, nullable |
| AddedAt | DateTime | |
| UpdatedAt | DateTime | |

## Architektura backendu

### Kontrolery
- `AuthController` — `POST /api/auth/register`, `POST /api/auth/login`
- `GamesController` — `GET /api/games/search?q=...`, `GET /api/games/{rawgId}`, `GET /api/games/popular` (proxy do RAWG — top gry wg RAWG rating, używane na stronie głównej; cache w DB)
- `LibraryController` — CRUD biblioteki zalogowanego użytkownika (`GET/POST/PUT/DELETE /api/library`)
- `StatsController` — `GET /api/stats` (KPI zalogowanego użytkownika), `GET /api/stats/top` (publiczne top gry)

### Serwisy
- `AuthService` — rejestracja, logowanie, generowanie JWT
- `RawgService` — integracja z RAWG API; wyniki cache'owane w tabeli `Games`

### Bezpieczeństwo
- Klucz RAWG API nigdy nie trafia do frontendu — backend jest proxy
- Klucz RAWG, JWT Secret, connection string → Azure Key Vault
- Endpointy `LibraryController` i `StatsController` (KPI użytkownika) chronione `[Authorize]`
- `GamesController` i `GET /api/stats/top` — publiczne

## Architektura frontendu

### Strony
| Ścieżka | Widoczność | Opis |
|---------|-----------|------|
| `/` | publiczna | Strona główna: sekcja "Top oceniane" (gry z najwyższą średnią oceną użytkowników z lokalnej bazy, endpoint `GET /api/stats/top`) + sekcja "Popularne" (top gry z RAWG, endpoint `GET /api/games/popular`). Zalogowany widzi dodatkowo sekcję KPI cards ze swoimi statystykami |
| `/login` | publiczna | Formularz logowania |
| `/register` | publiczna | Formularz rejestracji |
| `/library` | chroniona | Biblioteka gier użytkownika z filtrami po statusie |
| `/search` | chroniona | Wyszukiwarka gier przez RAWG, dodawanie do biblioteki |
| `/game/:id` | chroniona | Szczegóły gry + edycja statusu, platformy, oceny, recenzji |

### Komponenty
- `Navbar` — logo, linki nawigacyjne, Login/Register lub avatar + logout
- `KpiCard` — duża liczba z ikoną i etykietą (używany na stronie głównej dla zalogowanych)
- `GameCard` — okładka z RAWG, tytuł, platforma, badge statusu, ocena
- `StatusBadge` — kolorowy badge: Planned (niebieski), InProgress (fiolet), Completed (zielony), Abandoned (szary)
- `ScoreSlider` — suwak 0-100 z gradientem czerwony→żółty→zielony
- `AddToLibraryModal` — modal z wyborem statusu i platformy przy dodawaniu gry
- `AuthContext` — przechowuje JWT w localStorage, udostępnia user + token

## Design wizualny

### Paleta — "Dark Gaming"
| Token | Kolor | Użycie |
|-------|-------|--------|
| bg-primary | `#0F0E17` | tło główne |
| bg-card | `#1A1828` | karty, panele |
| accent-purple | `#7C3AED` | przyciski, aktywne elementy, status InProgress |
| accent-gold | `#F5A623` | oceny, wyróżnienia, KPI |
| text-primary | `#E8E8F0` | tekst główny |
| status-planned | `#3B82F6` | niebieski |
| status-inprogress | `#7C3AED` | fiolet |
| status-completed | `#10B981` | zielony |
| status-abandoned | `#6B7280` | szary |

## Flow użytkownika

1. Niezalogowany odwiedza `/` — widzi top gry i sugerowane tytuły z RAWG, w navbarze przyciski Login/Register
2. Rejestruje się lub loguje → przekierowanie na `/`
3. Zalogowany na `/` widzi dodatkowo KPI cards (liczba gier wg statusu, średnia ocena)
4. Przechodzi do `/search`, wpisuje tytuł → RAWG zwraca wyniki z okładkami
5. Klika "Dodaj" → `AddToLibraryModal` z wyborem statusu i platformy → gra trafia do biblioteki
6. W `/library` filtruje po statusie, klika grę
7. Na `/game/:id` edytuje status, platformę, przesuwa suwak oceny 0-100, pisze recenzję

## Azure Deploy

| Komponent | Usługa Azure |
|-----------|-------------|
| Backend | Azure App Service (Linux) lub Web App for Containers |
| Frontend | Azure Static Web Apps (Vite build) |
| Baza danych | Azure SQL Database |
| Sekrety | Azure Key Vault (infrastruktura już w `Program.cs`) |

Zmienne środowiskowe przez Key Vault:
- `RAWG_API_KEY`
- `JWT_SECRET`
- `DbConnectionString`

CORS: backend whitelist na domenę Azure Static Web App.

## Co zostaje usunięte

- Model `CloudTask` i cała logika task-managera
- `TaskController`, `CreateTaskDto`, `ReadTaskDto`
- Migracja `InitialCreate` (zostanie zastąpiona nową)
- Frontend Dashboard.tsx (zastąpiony nową stroną główną)
