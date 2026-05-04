import { useState } from 'react';
import Cover from './Cover';
import ScoreBadge from './ScoreBadge';
import StatusBadge from './StatusBadge';
import { useTheme } from '../contexts/ThemeContext';
import type { GameDto, UserGameDto, TopGameDto } from '../types';

interface Props {
  game: GameDto | UserGameDto | TopGameDto;
  onClick: () => void;
  cardHeight?: number;
}

function isUserGame(g: GameDto | UserGameDto | TopGameDto): g is UserGameDto {
  return 'status' in g;
}

function isTopGame(g: GameDto | UserGameDto | TopGameDto): g is TopGameDto {
  return 'averageScore' in g;
}

export default function GameRowCard({ game, onClick, cardHeight = 210 }: Props) {
  const { t } = useTheme();
  const [hovered, setHovered] = useState(false);

  const score = isUserGame(game)
    ? game.score
    : isTopGame(game)
    ? Math.round(game.averageScore)
    : undefined;

  const status = isUserGame(game) ? game.status : undefined;
  const year = 'releaseYear' in game ? game.releaseYear : undefined;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 160,
        flexShrink: 0,
        background: t.bgCard,
        border: `1px solid ${hovered ? t.borderHover : t.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? `0 10px 30px ${t.accentGlow}` : 'none',
      }}
    >
      <div style={{ height: cardHeight, position: 'relative' }}>
        <Cover title={game.title} coverImageUrl={game.coverImageUrl} year={year} />
        {score != null && (
          <div style={{ position: 'absolute', bottom: 6, left: 6 }}>
            <ScoreBadge score={score} size="sm" />
          </div>
        )}
        {status && (
          <div style={{ position: 'absolute', top: 6, right: 6 }}>
            <StatusBadge status={status} small />
          </div>
        )}
      </div>
      <div style={{ padding: '9px 11px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: t.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {game.title}
        </div>
        {year && (
          <div style={{ fontSize: 11, color: t.textFaint, marginTop: 2 }}>{year}</div>
        )}
      </div>
    </div>
  );
}
