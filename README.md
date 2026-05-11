# Gamelogg — Bartosz Piotrowski

Osobista biblioteka gier z integracją IGDB. Projekt natywnej aplikacji chmurowej w architekturze 3-warstwowej, przygotowany do self-hostingu przez Docker Compose.

## Stack technologiczny

| Warstwa | Technologia |
| :--- | :--- |
| Frontend | React 19 + TypeScript + Vite |
| Backend | ASP.NET Core 9 Web API |
| Baza danych | PostgreSQL 16 |
| Cache | Redis 7 |
| Reverse proxy | nginx (z opcjonalnym Let's Encrypt SSL) |
| Konteneryzacja | Docker Compose |

## Funkcje

- Biblioteka gier z filtrami i sortowaniem (siatka / lista)
- Statusy: Planowane, W trakcie, Ukończone, Porzucone
- Ocenianie gier (0–100) i notatki
- Strona szczegółów gry: opis, ocena IGDB, deweloper, platformy
- Sekcja „Popularne teraz" — premiery ostatniego miesiąca z IGDB
- Rekomendacje oparte na gatunkach z biblioteki użytkownika
- Tryb multiplayer (statystyki z Riot API i Steam)
- 3 motywy kolorystyczne (Neon / Crimson / Ocean)
- Feature flags — kontrola funkcji bez przebudowy
- Tłumaczenie opisów gier na polski (MyMemory API, cache Redis 30 dni)
- Opcjonalne SSL przez Let's Encrypt (certbot w kontenerze nginx)

## Szybki start

### Wymagania

- Docker Desktop (lub Docker Engine + Compose plugin)

### Uruchomienie

```bash
git clone <repo>
cd gamelog-app
cp .env.example .env   # lub edytuj .env bezpośrednio
docker compose up -d --build
```

Aplikacja dostępna pod `http://localhost`.

## Zmienne środowiskowe

Plik `.env` w katalogu głównym:

```env
# Klucze API (wymagane dla pełnej funkcjonalności)
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
RIOT_API_KEY=
STEAM_API_KEY=

# Baza danych i JWT
DB_PASSWORD=StrongPassword123!
JWT_SECRET=<min. 32 znaki>

# SSL (opcjonalne — zostaw puste dla HTTP)
DOMAIN=
SSL_EMAIL=

# Środowisko ASP.NET Core
ASPNETCORE_ENVIRONMENT=Production

# Feature flags
AUTH_ENABLED=true
MULTIPLAYER_ENABLED=true
SOCIAL_FEATURES_ENABLED=false
REVIEWS_ENABLED=true
BACKLOG_ENABLED=true
STATISTICS_ENABLED=false
TRANSLATION_ENABLED=true
```

### IGDB API

1. Utwórz aplikację na [dev.twitch.tv](https://dev.twitch.tv/console/apps)
2. Skopiuj Client ID i wygeneruj Client Secret
3. Wklej do `.env`

### SSL (Let's Encrypt)

Ustaw `DOMAIN=twoja.domena.pl` i `SSL_EMAIL=twoj@email.pl` — certbot automatycznie pobierze i odnowi certyfikat.

## Feature flags

Flagi sterują dostępnością funkcji w czasie działania — zmiana w `.env` i restart wystarczą.

| Flaga | Domyślnie | Opis |
| :--- | :---: | :--- |
| `AUTH_ENABLED` | `true` | Logowanie i rejestracja; `false` = tryb single-user (Admin) |
| `MULTIPLAYER_ENABLED` | `true` | Zakładka Multiplayer z integracją Riot/Steam |
| `REVIEWS_ENABLED` | `true` | Ocenianie i recenzje gier |
| `BACKLOG_ENABLED` | `true` | Zarządzanie backlogiem |
| `STATISTICS_ENABLED` | `false` | Rozszerzone statystyki użytkownika |
| `TRANSLATION_ENABLED` | `true` | Tłumaczenie opisów gier na polski |
