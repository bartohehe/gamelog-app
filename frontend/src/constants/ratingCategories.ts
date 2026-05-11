export interface RatingCategory {
  id: string;
  label: string;   // po polsku
  weight: number;  // suma = 100
}

export const RATING_CATEGORIES: RatingCategory[] = [
  { id: 'gameplay',      label: 'Gameplay',      weight: 35 },
  { id: 'story',         label: 'Fabuła',         weight: 25 },
  { id: 'graphics',      label: 'Grafika',        weight: 15 },
  { id: 'audio',         label: 'Audio',          weight: 10 },
  { id: 'replayability', label: 'Replayability',  weight: 10 },
  { id: 'difficulty',    label: 'Trudność',       weight:  5 },
];
