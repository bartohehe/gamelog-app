import type { MediaCatalogItem } from '../types';

export const POPULAR_MEDIA: MediaCatalogItem[] = [
  // ── Filmy ────────────────────────────────────────────────────────────────
  { id: 501, title: 'Dune: Part Two',       type: 'Film',   year: 2024, genres: ['Sci-Fi', 'Drama'],             creator: 'Denis Villeneuve',          runtime: '2h 46m', criticScore: 92, popularity: 98 },
  { id: 502, title: 'Oppenheimer',           type: 'Film',   year: 2023, genres: ['Biography', 'Drama'],          creator: 'Christopher Nolan',         runtime: '3h 0m',  criticScore: 93, popularity: 95 },
  { id: 503, title: 'Poor Things',           type: 'Film',   year: 2023, genres: ['Drama', 'Comedy'],             creator: 'Yorgos Lanthimos',          runtime: '2h 21m', criticScore: 88, popularity: 78 },
  { id: 504, title: 'The Substance',         type: 'Film',   year: 2024, genres: ['Horror', 'Drama'],             creator: 'Coralie Fargeat',           runtime: '2h 21m', criticScore: 85, popularity: 82 },
  { id: 505, title: 'Anatomy of a Fall',     type: 'Film',   year: 2023, genres: ['Drama', 'Thriller'],           creator: 'Justine Triet',             runtime: '2h 31m', criticScore: 91, popularity: 71 },
  { id: 506, title: 'Past Lives',            type: 'Film',   year: 2023, genres: ['Drama', 'Romance'],            creator: 'Celine Song',               runtime: '1h 46m', criticScore: 96, popularity: 74 },
  { id: 507, title: 'The Brutalist',         type: 'Film',   year: 2024, genres: ['Drama', 'History'],            creator: 'Brady Corbet',              runtime: '3h 35m', criticScore: 90, popularity: 68 },
  { id: 508, title: 'Mickey 17',             type: 'Film',   year: 2025, genres: ['Sci-Fi', 'Comedy'],            creator: 'Bong Joon-ho',              runtime: '2h 17m', criticScore: 82, popularity: 88 },
  { id: 509, title: 'Conclave',             type: 'Film',   year: 2024, genres: ['Thriller', 'Drama'],           creator: 'Edward Berger',             runtime: '2h 0m',  criticScore: 90, popularity: 76 },
  { id: 510, title: 'Emilia Pérez',          type: 'Film',   year: 2024, genres: ['Drama', 'Musical'],            creator: 'Jacques Audiard',           runtime: '2h 12m', criticScore: 87, popularity: 80 },

  // ── Seriale ──────────────────────────────────────────────────────────────
  { id: 511, title: 'Shōgun',               type: 'Serial', year: 2024, genres: ['Drama', 'Historical'],         creator: 'Justin Marks',              episodes: 10,      criticScore: 95, popularity: 97 },
  { id: 512, title: 'Severance',             type: 'Serial', year: 2022, genres: ['Sci-Fi', 'Thriller'],          creator: 'Dan Erickson',              episodes: 20,      criticScore: 94, popularity: 92 },
  { id: 513, title: 'The Bear',              type: 'Serial', year: 2022, genres: ['Drama', 'Comedy'],             creator: 'Christopher Storer',        episodes: 28,      criticScore: 89, popularity: 86 },
  { id: 514, title: 'Arcane',               type: 'Serial', year: 2021, genres: ['Animation', 'Action'],         creator: 'Fortiche',                  episodes: 18,      criticScore: 94, popularity: 91 },
  { id: 515, title: 'True Detective: Night Country', type: 'Serial', year: 2024, genres: ['Crime', 'Mystery'],  creator: 'Issa López',                episodes: 6,       criticScore: 82, popularity: 79 },
  { id: 516, title: 'Fallout',              type: 'Serial', year: 2024, genres: ['Sci-Fi', 'Action'],            creator: 'Geneva Robertson-Dworet',   episodes: 8,       criticScore: 87, popularity: 90 },
  { id: 517, title: 'Andor',               type: 'Serial', year: 2022, genres: ['Sci-Fi', 'Drama'],             creator: 'Tony Gilroy',               episodes: 24,      criticScore: 96, popularity: 84 },
  { id: 518, title: 'The White Lotus',      type: 'Serial', year: 2021, genres: ['Drama', 'Satire'],             creator: 'Mike White',                episodes: 18,      criticScore: 92, popularity: 88 },
  { id: 519, title: 'House of the Dragon',  type: 'Serial', year: 2022, genres: ['Fantasy', 'Drama'],            creator: 'Ryan Condal',               episodes: 18,      criticScore: 85, popularity: 93 },

  // ── Anime ────────────────────────────────────────────────────────────────
  { id: 521, title: 'Frieren: Beyond Journey\'s End', type: 'Anime', year: 2023, genres: ['Fantasy', 'Slice of Life'], creator: 'Madhouse',      episodes: 28, criticScore: 96, popularity: 94 },
  { id: 522, title: 'Vinland Saga',          type: 'Anime',  year: 2019, genres: ['Action', 'Historical'],       creator: 'Wit Studio / MAPPA',        episodes: 48, criticScore: 93, popularity: 85 },
  { id: 523, title: 'Chainsaw Man',          type: 'Anime',  year: 2022, genres: ['Action', 'Horror'],           creator: 'MAPPA',                     episodes: 12, criticScore: 88, popularity: 91 },
  { id: 524, title: 'Jujutsu Kaisen',        type: 'Anime',  year: 2020, genres: ['Action', 'Supernatural'],     creator: 'MAPPA',                     episodes: 47, criticScore: 90, popularity: 96 },
  { id: 525, title: 'Dandadan',              type: 'Anime',  year: 2024, genres: ['Action', 'Comedy'],           creator: 'Science SARU',              episodes: 12, criticScore: 91, popularity: 89 },
  { id: 526, title: 'Delicious in Dungeon',  type: 'Anime',  year: 2024, genres: ['Fantasy', 'Comedy'],          creator: 'Trigger',                   episodes: 24, criticScore: 89, popularity: 78 },
  { id: 527, title: 'Look Back',             type: 'Anime',  year: 2024, genres: ['Drama', 'Slice of Life'],     creator: 'Studio Durian',             episodes: 1,  criticScore: 94, popularity: 72 },
  { id: 528, title: 'Spy x Family',          type: 'Anime',  year: 2022, genres: ['Comedy', 'Action'],           creator: 'Wit Studio',                episodes: 37, criticScore: 85, popularity: 83 },
  { id: 529, title: 'Blue Lock',             type: 'Anime',  year: 2022, genres: ['Sports', 'Action'],           creator: '8bit',                      episodes: 24, criticScore: 84, popularity: 80 },
];

export const TRENDING_MEDIA_SEARCHES = [
  'Severance', 'Frieren', 'Dune', 'Shōgun', 'The Substance', 'Andor', 'Dandadan',
];

export const MEDIA_GENRE_QUICK = [
  { label: 'Sci-Fi',    icon: '✦', color: '#06b6d4' },
  { label: 'Drama',     icon: '◆', color: '#a855f7' },
  { label: 'Horror',    icon: '☾', color: '#ef4444' },
  { label: 'Komedia',   icon: '☺', color: '#f59e0b' },
  { label: 'Fantasy',   icon: '❉', color: '#22c55e' },
  { label: 'Animacja',  icon: '✿', color: '#e879f9' },
  { label: 'Thriller',  icon: '▲', color: '#dc2626' },
  { label: 'Akcja',     icon: '⚡', color: '#f97316' },
];

export const MEDIA_TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  Film:   { label: 'Film',    icon: '▶', color: '#ef4444' },
  Serial: { label: 'Serial',  icon: '▭', color: '#3b82f6' },
  Anime:  { label: 'Anime',   icon: '✦', color: '#e879f9' },
};

export const MEDIA_STATUS_META: Record<string, { label: string; color: string }> = {
  Watched:  { label: 'Obejrzane',      color: '#22c55e' },
  Watching: { label: 'W trakcie',      color: '#f59e0b' },
  Backlog:  { label: 'Do obejrzenia',  color: '#94a3b8' },
};
