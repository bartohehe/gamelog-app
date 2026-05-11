export type GameStatus = 'Planned' | 'InProgress' | 'Completed' | 'Abandoned' | 'Wishlist' | 'OnHold';

export interface GameDto {
  igdbId: number;
  title: string;
  coverImageUrl: string;
  releaseYear?: number;
  genres: string[];
  summary?: string;
  rating?: number;
  ratingCount?: number;
  developer?: string;
  platforms?: string[];
}

export interface UserGameDto {
  id: number;
  igdbId: number;
  title: string;
  coverImageUrl: string;
  status: GameStatus;
  platform: string;
  score?: number;
  review?: string;
  addedAt: string;
  updatedAt: string;
}

export interface AddToLibraryDto {
  igdbId: number;
  status: GameStatus;
  platform: string;
}

export interface UpdateLibraryItemDto {
  status: GameStatus;
  platform: string;
  score?: number;
  review?: string;
}

export interface AuthResponseDto {
  token: string;
  username: string;
  userId: number;
}

export interface UserStatsDto {
  totalGames: number;
  plannedCount: number;
  inProgressCount: number;
  completedCount: number;
  abandonedCount: number;
  averageScore?: number;
}

export interface TopGameDto {
  igdbId: number;
  title: string;
  coverImageUrl: string;
  averageScore: number;
  reviewCount: number;
}

export interface CategoryRankingItem {
  userGameId: number;
  igdbId: number;
  title: string;
  coverImageUrl: string;
  position: number;
}

// ─── Media ────────────────────────────────────────────────────────────────────

export type MediaType = 'Film' | 'Serial' | 'Anime';
export type MediaWatchStatus = 'Watched' | 'Watching' | 'Backlog';

export interface UserMediaDto {
  id: number;
  title: string;
  type: MediaType;
  year: number;
  genres: string[];
  creator: string;
  status: MediaWatchStatus;
  score?: number;
  runtime?: string;
  episodes?: number;
  watchedEpisodes?: number;
  coverImageUrl?: string;
  review: string;
  addedAt: string;
  updatedAt: string;
}

export interface AddMediaDto {
  title: string;
  type: MediaType;
  year: number;
  genres: string[];
  creator: string;
  status: MediaWatchStatus;
  score?: number;
  runtime?: string;
  episodes?: number;
  watchedEpisodes?: number;
  coverImageUrl?: string;
  review?: string;
}

export interface UpdateMediaDto {
  status: MediaWatchStatus;
  score?: number;
  watchedEpisodes?: number;
  review?: string;
}

/** A title from the static search catalogue (not yet in user's library). */
export interface MediaCatalogItem {
  id: number;
  title: string;
  type: MediaType;
  year: number;
  genres: string[];
  creator: string;
  runtime?: string;        // films
  episodes?: number;       // serial/anime total
  criticScore?: number;
  popularity: number;
}

/** Result from the backend /api/mediasearch (TMDB + Jikan). */
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
