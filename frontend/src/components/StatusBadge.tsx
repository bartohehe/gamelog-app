import type { GameStatus } from '../types';

const STATUS_LABELS: Record<GameStatus, string> = {
  Planned: 'Planowane',
  InProgress: 'W trakcie',
  Completed: 'Ukończone',
  Abandoned: 'Porzucone',
};

const STATUS_CLASSES: Record<GameStatus, string> = {
  Planned: 'bg-status-planned/20 text-status-planned border border-status-planned/40',
  InProgress: 'bg-status-inprogress/20 text-status-inprogress border border-status-inprogress/40',
  Completed: 'bg-status-completed/20 text-status-completed border border-status-completed/40',
  Abandoned: 'bg-status-abandoned/20 text-status-abandoned border border-status-abandoned/40',
};

export default function StatusBadge({ status }: { status: GameStatus }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
