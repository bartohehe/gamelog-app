import api from './api';
import type { UserStatsDto, TopGameDto } from '../types';

export const getMyStats = () =>
  api.get<UserStatsDto>('/api/stats').then(r => r.data);

export const getTopGames = () =>
  api.get<TopGameDto[]>('/api/stats/top').then(r => r.data);
