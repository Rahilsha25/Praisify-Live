import { Star } from "lucide-react";

export const Stars = ({ rating = 5, size = 16, testId, emptyClassName = "fill-slate-200 text-slate-200" }) => (
  <div className="flex items-center gap-0.5" data-testid={testId} aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        style={{ width: size, height: size }}
        className={i <= rating ? "fill-amber-400 text-amber-400" : emptyClassName}
      />
    ))}
  </div>
);
