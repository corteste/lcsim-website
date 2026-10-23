import { Star } from "lucide-react";

export interface StarRatingProps {
  count: number | null | undefined;
  size?: string;
  className?: string;
}

export const StarRating = ({
  count,
  size = "h-3.5 w-3.5",
  className = "",
}: StarRatingProps) => {
  const stars = Math.max(1, Math.min(5, Number(count) || 3));
  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      title={`Valutazione iniziale: ${stars}/5 stelle`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${
            i <= stars
              ? "text-amber-400 fill-amber-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
};

export const renderStars = (
  count: number | null | undefined,
  size = "h-3.5 w-3.5"
) => <StarRating count={count} size={size} />;
