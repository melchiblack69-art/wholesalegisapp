export default function RatingStars({ rating, reviews, size = "0.85rem" }) {
  const numericRating = Number(rating);
  const hasRating = Number.isFinite(numericRating);

  return (
    <span className="d-inline-flex align-items-center gap-1" style={{ fontSize: size }}>
      {hasRating && <i className="bi bi-star-fill" style={{ color: "#f5a623" }} />}
      {hasRating && <span className="fw-semibold">{numericRating.toFixed(1)}</span>}
      {hasRating && typeof reviews === "number" && (
        <span className="text-muted-brand">({reviews} Reviews)</span>
      )}
    </span>
  );
}
