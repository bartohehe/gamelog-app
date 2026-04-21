import api from './api';
import type { GameDto } from '../types';

export const searchGames = (q: string) =>
  api.get<GameDto[]>(`/api/games/search?q=${encodeURIComponent(q)}`).then(r => r.data);

export const getPopularGames = () =>
  api.get<GameDto[]>('/api/games/popular').then(r => r.data);

export const getGameById = (igdbId: number) =>
  api.get<GameDto>(`/api/games/${igdbId}`).then(r => r.data);
