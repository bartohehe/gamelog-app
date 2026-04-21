import api from './api';
import type { UserGameDto, AddToLibraryDto, UpdateLibraryItemDto } from '../types';

export const getLibrary = () =>
  api.get<UserGameDto[]>('/api/library').then(r => r.data);

export const addToLibrary = (dto: AddToLibraryDto) =>
  api.post<UserGameDto>('/api/library', dto).then(r => r.data);

export const updateLibraryItem = (id: number, dto: UpdateLibraryItemDto) =>
  api.put<UserGameDto>(`/api/library/${id}`, dto).then(r => r.data);

export const removeFromLibrary = (id: number) =>
  api.delete(`/api/library/${id}`);
