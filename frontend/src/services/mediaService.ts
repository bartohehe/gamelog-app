import api from './api';
import type { UserMediaDto, AddMediaDto, UpdateMediaDto, MediaSearchResultDto } from '../types';

export const getMedia = () =>
  api.get<UserMediaDto[]>('/api/media').then(r => r.data);

export const addMedia = (dto: AddMediaDto) =>
  api.post<UserMediaDto>('/api/media', dto).then(r => r.data);

export const updateMedia = (id: number, dto: UpdateMediaDto) =>
  api.put<UserMediaDto>(`/api/media/${id}`, dto).then(r => r.data);

export const removeMedia = (id: number) =>
  api.delete(`/api/media/${id}`);

export const searchMedia = (q: string, type = 'all') =>
  api.get<MediaSearchResultDto[]>('/api/mediasearch', { params: { q, type } })
    .then(r => r.data);
