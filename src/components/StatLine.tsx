export default function StatLine({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="d-flex justify-content-between border-bottom py-2">
      <div className="text-muted">{label}</div>
      <div className="fw-semibold">{value}</div>
    </div>
  );
}
