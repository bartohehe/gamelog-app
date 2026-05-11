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
