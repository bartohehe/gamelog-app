export type GameStatus = 'Planned' | 'InProgress' | 'Completed' | 'Abandoned';

export interface GameDto {
  rawgId: number;
  title: string;
  coverImageUrl: string;
  releaseYear?: number;
  genres: string[];
}

export interface UserGameDto {
  id: number;
  rawgId: number;
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
  rawgId: number;
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
  rawgId: number;
  title: string;
  coverImageUrl: string;
  averageScore: number;
  reviewCount: number;
}
