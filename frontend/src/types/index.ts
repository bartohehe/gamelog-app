export type GameStatus = 'Planned' | 'InProgress' | 'Completed' | 'Abandoned';

export interface GameDto {
  igdbId: number;
  title: string;
  coverImageUrl: string;
  releaseYear?: number;
  genres: string[];
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
