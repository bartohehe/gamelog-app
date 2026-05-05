import api from './api';

export interface MultiplayerEntryDto {
  id: number;
  gameTitle: string;
  mode?: string;
  tier?: string;
  rank?: string;
  rankPoints?: number;
  rankPointsMax?: number;
  winRate?: number;
  kdRatio?: number;
  hoursPlayed?: number;
  platform?: string;
  inGameUsername?: string;
  updatedAt: string;
}

export interface UpsertMultiplayerEntryDto {
  gameTitle: string;
  mode?: string;
  tier?: string;
  rank?: string;
  rankPoints?: number;
  rankPointsMax?: number;
  winRate?: number;
  kdRatio?: number;
  hoursPlayed?: number;
  platform?: string;
  inGameUsername?: string;
}

export const getMultiplayerEntries = () =>
  api.get<MultiplayerEntryDto[]>('/api/multiplayer').then(r => r.data);

export const createMultiplayerEntry = (dto: UpsertMultiplayerEntryDto) =>
  api.post<MultiplayerEntryDto>('/api/multiplayer', dto).then(r => r.data);

export const updateMultiplayerEntry = (id: number, dto: UpsertMultiplayerEntryDto) =>
  api.put<MultiplayerEntryDto>(`/api/multiplayer/${id}`, dto).then(r => r.data);

export const deleteMultiplayerEntry = (id: number) =>
  api.delete(`/api/multiplayer/${id}`);

export const syncLolRank = (summonerName: string, platform = 'eun1') =>
  api.post<UpsertMultiplayerEntryDto>('/api/multiplayer/sync/lol', { summonerName, platform }).then(r => r.data);

export const syncCs2Stats = (steamId: string) =>
  api.post<UpsertMultiplayerEntryDto>('/api/multiplayer/sync/cs2', { steamId }).then(r => r.data);
