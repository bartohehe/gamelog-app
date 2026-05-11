# Media API Integration Design

**Date:** 2026-05-11  
**Scope:** TMDB + Jikan API integration for media search in GameLog  
**Status:** Approved

---

## Problem

`MediaSearchPage` currently searches a hardcoded static list of ~29 titles. No real cover images are shown — only gradient placeholders. Users cannot discover new titles beyond the preset catalogue.

---

## Solution Overview

Add a unified backend search endpoint (`GET /api/mediasearch`) that proxies TMDB (films + series) and Jikan/MyAnimeList (anime) in parallel, normalises results into a single DTO, and caches them in Redis. The frontend calls this endpoint with a 600ms debounce. Real cover image URLs are persisted in `UserMedia.CoverImageUrl` when a title is added to the library.

---

## Architecture

```
Frontend (MediaSearchPage)
  │  debounce 600ms
  ▼
GET /api/mediasearch?q={q}&type={type}   ← no [Authorize] required
  │
  ├─ type=Film | type=Serial → TmdbService only
  ├─ type=Anime              → JikanService only
  └─ type=all                → Task.WhenAll(TmdbService, JikanService)
  │
  ├─ Cache check: Redis key "mediasearch:{type}:{q.lower}" TTL 60 min
  │
  └─ Returns List<MediaSearchResultDto>
```

---

## Backend

### New Files

**`backend/Services/ITmdbService.cs`**
```csharp
public interface ITmdbService
{
    Task<List<MediaSearchResultDto>> SearchAsync(string query, string type);
}
```

**`backend/Services/TmdbService.cs`**
- Registered as `AddHttpClient<ITmdbService, TmdbService>()`
- API key from `config["ExternalApis:Tmdb:ApiKey"]`
- Endpoint: `https://api.themoviedb.org/3/search/multi?query={q}&language=pl-PL&page=1`
- Maps `media_type=movie` → `Type="Film"`, `media_type=tv` → `Type="Serial"`
- Filters out `media_type=person`
- Cover: `https://image.tmdb.org/t/p/w500/{poster_path}` (null if no poster)
- ExternalId format: `"tmdb:{id}"`
- Popularity: TMDB `popularity` field (float → int)
- Genres: resolved from TMDB genre IDs using a hardcoded genre map (avoids extra API call)
- Year: parsed from `release_date` / `first_air_date` (first 4 chars)
- Runtime: `null` (not in multi-search response; acceptable)
- Episodes: `null` (not in multi-search response)

**`backend/Services/IJikanService.cs`**
```csharp
public interface IJikanService
{
    Task<List<MediaSearchResultDto>> SearchAsync(string query);
}
```

**`backend/Services/JikanService.cs`**
- Registered as `AddHttpClient<IJikanService, JikanService>()`
- No API key required
- Endpoint: `https://api.jikan.moe/v4/anime?q={q}&limit=20&sfw=true`
- Cover: `data[].images.jpg.large_image_url`
- ExternalId: `"mal:{mal_id}"`
- Creator: `data[].studios[0].name` (first studio, or empty string)
- Genres: `data[].genres[].name`
- Episodes: `data[].episodes` (nullable int)
- Year: `data[].aired.prop.from.year` (nullable)
- Popularity: `data[].members` (int, capped at 999999 for sorting)
- CriticScore: `data[].score` (float × 10 → int 0–100, null if no score)

**`backend/Controllers/MediaSearchController.cs`**
- Route: `GET /api/mediasearch`
- Query params: `q` (string, required, min 2 chars), `type` (string, default "all")
- No `[Authorize]` — public endpoint
- Cache key: `$"mediasearch:{type.ToLower()}:{q.ToLower().Trim()}"`
- Cache TTL: 60 minutes
- On empty `q` or `q.Length < 2`: returns empty list (no API call)
- Error handling: if TMDB or Jikan call fails, logs warning and returns partial results (the other source still works)
- Results merged and sorted by `Popularity` descending

**`backend/DTOs/Media/MediaSearchResultDto.cs`**
```csharp
public record MediaSearchResultDto(
    string ExternalId,
    string Title,
    string Type,           // "Film" | "Serial" | "Anime"
    int Year,
    List<string> Genres,
    string Creator,
    string? CoverImageUrl,
    string? Runtime,
    int? Episodes,
    int? CriticScore,
    int Popularity
);
```

### Configuration

`appsettings.json` / env vars:
```
ExternalApis__Tmdb__ApiKey=<key>
```

Jikan requires no key.

### Registration in `Program.cs`
```csharp
builder.Services.AddHttpClient<ITmdbService, TmdbService>();
builder.Services.AddHttpClient<IJikanService, JikanService>();
```

---

## Frontend

### New type in `types/index.ts`
```ts
export interface MediaSearchResultDto {
  externalId: string;
  title: string;
  type: MediaType;
  year: number;
  genres: string[];
  creator: string;
  coverImageUrl?: string;
  runtime?: string;
  episodes?: number;
  criticScore?: number;
  popularity: number;
}
```

### Updated `services/mediaService.ts`
Add:
```ts
export const searchMedia = (q: string, type = 'all') =>
  api.get<MediaSearchResultDto[]>('/api/mediasearch', { params: { q, type } })
     .then(r => r.data);
```

### Updated `pages/MediaSearchPage.tsx`
- Debounce: 250ms → 600ms
- Replace static `POPULAR_MEDIA` filter with `searchMedia(debounced, typeFilter)` call
- Loading state: spinner replaces result list while fetching
- Error state: inline message "Nie udało się wyszukać — spróbuj ponownie"
- Empty state (no query): unchanged — trending chips + genre grid still use static data for UX warmth
- `ResultRow` component: uses `coverImageUrl` from API result for a real thumbnail (40×56px, `object-fit: cover`, border-radius 6px) beside the text — replaces the plain type-icon div

### Updated `AddModal` in `MediaSearchPage.tsx`
- `AddMediaDto.coverImageUrl` filled from `MediaSearchResultDto.coverImageUrl`
- Saves real cover URL to DB → shows on `MediaPage` immediately

### `MediaPage.tsx` — no changes needed
`MediaCover` component already renders `<img>` when `coverImageUrl` is set.

---

## Environment / Docker

**.env.example** — add:
```
# TMDB API key — zarejestruj na https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key_here
```

**docker-compose.yml** — backend `environment` section, add:
```yaml
- ExternalApis__Tmdb__ApiKey=${TMDB_API_KEY:-}
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| TMDB down | Log warning, return Jikan results only (for `type=all`) |
| Jikan down | Log warning, return TMDB results only (for `type=all`) |
| Both down | Return empty list, frontend shows error message |
| `q` < 2 chars | Return empty list immediately, no API call |
| TMDB key missing | TmdbService returns empty list + logs error |
| Jikan rate limit (429) | Log warning, return empty list for anime portion |

---

## Caching Strategy

- Key pattern: `mediasearch:{type}:{q}` (lowercased, trimmed)
- TTL: 60 minutes
- Uses existing `ICacheService.GetOrSetAsync<T>()` — Redis with in-memory fallback already implemented
- Cache is per query string — different queries cached independently

---

## Out of Scope

- Pagination (TMDB/Jikan page 2+) — first page sufficient for search UX
- Saving `externalId` to `UserMedia` — not needed for current features
- Runtime/episodes from TMDB detail endpoint — would require extra API call per result
- Anime manga support
