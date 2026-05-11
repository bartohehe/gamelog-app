# Specyfikacja: System Oceniania przez Ranking (Ranking Rating System)

## Kontekst

Projekt: `gamelog-app` — React 19 + TypeScript + Vite (frontend), ASP.NET Core 9 (backend), PostgreSQL (baza).

Istniejący system: pojedyncze pole `Score` (int?, 0–100) na modelu `UserGame`, edytowane przez `ScoreSlider` w `GameDetailPage`.

Nowy system: użytkownik umieszcza grę na liście rankingowej per kategoria (drag & drop), algorytm przelicza wynik końcowy ze średniej ważonej pozycji.

Przełączanie: **feature flag** `ADVANCED_RATING_ENABLED` — `false` = stary system (ScoreSlider 0–100), `true` = nowy system rankingowy.

---

## Feature Flag

### `.env.example`

Dodać nową linię:
```
ADVANCED_RATING_ENABLED=false
```

### Backend — `Options/FeatureFlags.cs`

Dodać pole do istniejącej klasy `FeatureFlags`:
```csharp
public bool AdvancedRatingEnabled { get; set; } = false;
```

### Frontend — `contexts/FeatureFlagsContext.tsx`

Dodać pole do interfejsu `FeatureFlags` i obiektu `defaults`:
```ts
advancedRatingEnabled: boolean;  // default: false
```

---

## Definicje kategorii

Kategorie są stałe (hardcoded), nie edytowalne przez użytkownika w tej wersji.

```ts
// frontend/src/constants/ratingCategories.ts  (nowy plik)

export interface RatingCategory {
  id: string;
  label: string;       // po polsku
  weight: number;      // suma = 100
}

export const RATING_CATEGORIES: RatingCategory[] = [
  { id: 'gameplay',      label: 'Gameplay',      weight: 35 },
  { id: 'story',         label: 'Fabuła',         weight: 25 },
  { id: 'graphics',      label: 'Grafika',        weight: 15 },
  { id: 'audio',         label: 'Audio',          weight: 10 },
  { id: 'replayability', label: 'Replayability',  weight: 10 },
  { id: 'difficulty',    label: 'Trudność',       weight:  5 },
];
```

---

## Algorytm przeliczania wyniku

### Wynik per kategoria

Pozycja gry w rankingu (0-indexed) → wynik 0–100:

```
score = round(40 + (1 - position / (totalGames + 1)) * 55)
```

- #1 z 5 gier → `40 + (1 - 1/6) * 55 ≈ 86`
- #3 z 5 gier → `40 + (1 - 3/6) * 55 ≈ 68`
- #5 z 5 gier → `40 + (1 - 5/6) * 55 ≈ 49`
- Jedyna gra w rankingu (#1 z 1) → `40 + (1 - 1/2) * 55 = 67`

### Wynik końcowy

Średnia ważona wyników per kategoria, normalizowana do kategorii które użytkownik uzupełnił:

```
finalScore = round(Σ(categoryScore × weight) / Σ(usedWeights))
```

Jeśli użytkownik uzupełnił tylko 4/6 kategorii — mianownik to suma wag tych 4 kategorii (nie 100). Wynik końcowy jest zapisywany w istniejącym polu `UserGame.Score`.

### Obliczanie pozycji po stronie frontendu

Pozycja jest obliczana na podstawie kolejności gier w `CategoryRanking[]` (patrz model poniżej). Backend nie oblicza wyników — frontend oblicza i wysyła gotowy `Score` do `PUT /api/library/{id}`.

---

## Modele danych

### Nowa tabela PostgreSQL: `CategoryRankings`

```csharp
// backend/Models/CategoryRanking.cs  (nowy plik)

namespace CloudBackend.Models;

public class CategoryRanking
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string CategoryId { get; set; } = string.Empty;  // "gameplay", "story", etc.
    public int UserGameId { get; set; }
    public UserGame UserGame { get; set; } = null!;
    public int Position { get; set; }  // 0-indexed, posortowane rosnąco = lepsze
    public DateTime UpdatedAt { get; set; }
}
```

### DbContext

W `Data/AppDbContext.cs` dodać:
```csharp
public DbSet<CategoryRanking> CategoryRankings => Set<CategoryRanking>();
```

W `OnModelCreating`:
```csharp
// Unikalność: jeden UserGame może być tylko raz per kategoria per user
modelBuilder.Entity<CategoryRanking>()
    .HasIndex(r => new { r.UserId, r.CategoryId, r.UserGameId })
    .IsUnique();
```

### Migration

Wygenerować przez:
```
dotnet ef migrations add AddCategoryRankings
dotnet ef database update
```

---

## Backend API

### Nowy kontroler: `CategoryRankingsController.cs`

**Endpoint: `GET /api/categoryRankings/{categoryId}`**

Zwraca pełny ranking danej kategorii dla zalogowanego użytkownika, posortowany po `Position` rosnąco.

Response DTO:
```csharp
public record CategoryRankingItemDto(
    int UserGameId,
    int IgdbId,
    string Title,
    string CoverImageUrl,
    int Position
);
```

**Endpoint: `PUT /api/categoryRankings/{categoryId}`**

Zastępuje cały ranking danej kategorii. Body: lista `UserGameId` w kolejności od najlepszej do najgorszej (frontend przesyła po każdej zmianie pozycji).

Request DTO:
```csharp
public record UpdateCategoryRankingDto(List<int> UserGameIds);
```

Logika:
1. Usuń istniejące rekordy dla `(userId, categoryId)`.
2. Wstaw nowe rekordy z `Position` = indeks w liście (0 = najlepsza).
3. Zwróć `200 OK`.

Endpoint jest idempotentny — bezpieczne do wielokrotnego wywołania.

**Endpoint: `GET /api/categoryRankings`**

Zwraca wszystkie rankingi użytkownika naraz (optymalizacja — jeden request przy otwarciu modalu).

Response: `Dictionary<string, List<CategoryRankingItemDto>>` — klucz to `categoryId`.

### Kontroler: autoryzacja

Wszystkie endpointy `[Authorize]`. Gdy `AUTH_ENABLED=false`, mechanizm single-user już istnieje w middleware — nie wymaga zmian.

---

## Frontend — nowe pliki

### `services/rankingService.ts` (nowy)

```ts
import api from './api';

export interface RankingItem {
  userGameId: number;
  igdbId: number;
  title: string;
  coverImageUrl: string;
  position: number;
}

export const getAllRankings = () =>
  api.get<Record<string, RankingItem[]>>('/api/categoryRankings').then(r => r.data);

export const updateCategoryRanking = (categoryId: string, userGameIds: number[]) =>
  api.put(`/api/categoryRankings/${categoryId}`, { userGameIds });
```

### `components/RankingRatingModal.tsx` (nowy)

Modal oceniania przez ranking. Zastępuje `ScoreSlider` w `GameDetailPage` gdy `advancedRatingEnabled === true`.

#### Props

```ts
interface Props {
  game: UserGameDto;          // gra która jest oceniana
  onClose: () => void;
  onSaved: (newScore: number) => void;
}
```

#### Stan wewnętrzny

```ts
// Rankingi per kategoria — kopia z API, modyfikowana lokalnie
const [rankings, setRankings] = useState<Record<string, RankingItem[]>>({});
// Pozycje nowej gry per kategoria — null = nie umieszczona
const [placements, setPlacements] = useState<Record<string, number | null>>({});
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [activeCategory, setActiveCategory] = useState('gameplay');
```

#### Ładowanie danych

```ts
useEffect(() => {
  getAllRankings().then(data => {
    // Usuń aktualną grę z rankingów (na czas edycji)
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([cat, items]) => [
        cat,
        items.filter(i => i.userGameId !== game.id)
      ])
    );
    setRankings(cleaned);
    // Wczytaj obecne pozycje gry jeśli już była oceniana
    const existing: Record<string, number | null> = {};
    RATING_CATEGORIES.forEach(cat => {
      existing[cat.id] = null;
    });
    setPlacements(existing);
    setLoading(false);
  });
}, []);
```

#### Drag & drop

Używać natywnego HTML5 Drag and Drop API (bez zewnętrznych bibliotek — projekt nie ma `@dnd-kit` ani `react-beautiful-dnd` w dependencies).

- Karta nowej gry jest `draggable`.
- Strefy upuszczania (`drop-zone`) między każdym elementem listy i na początku/końcu.
- `onDragOver` → `e.preventDefault()` + podświetlenie strefy.
- `onDrop` → wstaw grę na pozycję, zapisz placement.
- Gdy gra jest już umieszczona — pokaż przycisk "Cofnij" zamiast karty do przeciągania.

#### Obliczanie i zapis

```ts
const computeScore = (): number => {
  let weightedSum = 0;
  let usedWeights = 0;
  RATING_CATEGORIES.forEach(cat => {
    const pos = placements[cat.id];
    if (pos === null) return;
    const total = rankings[cat.id].length; // bez nowej gry
    const catScore = Math.round(40 + (1 - (pos + 1) / (total + 2)) * 55);
    weightedSum += catScore * cat.weight;
    usedWeights += cat.weight;
  });
  return usedWeights > 0 ? Math.round(weightedSum / usedWeights) : 0;
};

const handleSave = async () => {
  setSaving(true);
  // 1. Wyślij zaktualizowane rankingi do API per kategoria
  await Promise.all(
    RATING_CATEGORIES
      .filter(cat => placements[cat.id] !== null)
      .map(cat => {
        const pos = placements[cat.id]!;
        const newList = [...rankings[cat.id]];
        newList.splice(pos, 0, { userGameId: game.id, /* ... */ position: pos });
        const ids = newList.map(i => i.userGameId);
        return updateCategoryRanking(cat.id, ids);
      })
  );
  // 2. Oblicz i przekaż wynik do rodzica (który zapisze przez PUT /api/library/{id})
  const score = computeScore();
  onSaved(score);
  setSaving(false);
  onClose();
};
```

#### Stylowanie

Używać wyłącznie zmiennych z `useTheme()` (`t.bg`, `t.bgCard`, `t.bgElevated`, `t.border`, `t.borderHover`, `t.accent`, `t.accentLight`, `t.accentGlow`, `t.text`, `t.textMuted`, `t.textFaint`, `t.inputBg`, `t.inputBorder`).

Rozmiar modalu: `maxWidth: 860px`, `maxHeight: 90vh`, scroll wewnętrzny.

Layout: dwukolumnowy grid — lewa kolumna lista kategorii (200px), prawa kolumna aktywny ranking (flex: 1).

Font: `'Inter', sans-serif` — taki jak cała aplikacja.

**Nie używać** żadnych zewnętrznych fontów, custom CSS klas, Tailwind (projekt używa Tailwind ale wszystkie komponenty modalne używają inline styles jak `AddToLibraryModal.tsx`).

Styl karty gry w rankingu: wzorować na `GameRowCard.tsx`. Styl modalu (backdrop, border-radius, shadow): wzorować dokładnie na `AddToLibraryModal.tsx`.

Pasek postępu (ile kategorii uzupełniono): 6 kropek w nagłówku, kolor `t.accent` gdy uzupełniona, `t.textFaint` gdy pusta.

Przycisk "Zapisz": `background: t.accent`, disabled gdy żadna kategoria nie uzupełniona.

---

## Frontend — modyfikacje istniejących plików

### `types/index.ts`

Dodać:
```ts
export interface CategoryRankingItem {
  userGameId: number;
  igdbId: number;
  title: string;
  coverImageUrl: string;
  position: number;
}
```

### `contexts/FeatureFlagsContext.tsx`

Dodać `advancedRatingEnabled: boolean` do interfejsu `FeatureFlags` i `defaults` (default: `false`).

### `pages/GameDetailPage.tsx`

W sekcji gdzie renderowany jest `ScoreSlider` — dodać warunek:

```tsx
const { advancedRatingEnabled, reviewsEnabled } = useFeatureFlags();

// ...

{reviewsEnabled && (
  advancedRatingEnabled
    ? (
      <>
        {/* Przycisk otwierający RankingRatingModal */}
        <button onClick={() => setShowRatingModal(true)} style={{ ... }}>
          {form.score ? `Ocena: ${form.score}/100 — Edytuj ranking` : 'Oceń przez ranking'}
        </button>
        {showRatingModal && (
          <RankingRatingModal
            game={libraryItem}
            onClose={() => setShowRatingModal(false)}
            onSaved={(score) => {
              setForm(f => ({ ...f, score }));
              handleSave(); // lub osobny zapis
            }}
          />
        )}
      </>
    )
    : (
      // Istniejący ScoreSlider — bez zmian
      <ScoreSlider
        value={form.score}
        onChange={v => setForm(f => ({ ...f, score: v }))}
        accentColor={t.accent}
      />
    )
)}
```

Dodać stan:
```ts
const [showRatingModal, setShowRatingModal] = useState(false);
```

### `components/ScoreBadge.tsx`

Bez zmian — wyświetla `score` niezależnie od sposobu jego obliczenia.

---

## Kolejność implementacji (dla Claude Code)

1. **Backend**
   - Dodać `AdvancedRatingEnabled` do `FeatureFlags.cs`
   - Stworzyć `Models/CategoryRanking.cs`
   - Dodać `DbSet` do `AppDbContext.cs`
   - Stworzyć migration `AddCategoryRankings`
   - Stworzyć `Controllers/CategoryRankingsController.cs` z 3 endpointami
   - Zarejestrować kontroler (auto-discovery — brak dodatkowej konfiguracji potrzebnej)

2. **Frontend**
   - Dodać `ADVANCED_RATING_ENABLED` do `.env.example`
   - Zaktualizować `FeatureFlagsContext.tsx`
   - Stworzyć `constants/ratingCategories.ts`
   - Stworzyć `services/rankingService.ts`
   - Stworzyć `components/RankingRatingModal.tsx`
   - Zaktualizować `pages/GameDetailPage.tsx`
   - Zaktualizować `types/index.ts`

---

## Czego NIE implementować

- Edytowalnych kategorii lub wag — stałe wartości w `ratingCategories.ts`
- Radar chart — poza zakresem tej funkcji
- Porównania z innymi użytkownikami — poza zakresem
- Zewnętrznych bibliotek drag & drop — tylko natywne HTML5 DnD API
- Osobnego endpointu do obliczania wyniku — frontend oblicza, backend tylko persystuje rankingi i `Score`
