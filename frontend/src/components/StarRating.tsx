import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;     // 1-5
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: number;
}

export default function StarRating({ value, onChange, readonly = false, size = 20 }: StarRatingProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'hover:scale-110 transition-transform'}`}
        >
          <Star
            width={size}
            height={size}
            className={star <= value ? 'text-[#E65252] fill-[#E65252]' : 'text-slate-600'}
          />
        </button>
      ))}
    </div>
  );
}
