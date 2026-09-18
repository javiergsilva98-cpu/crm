export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-5 h-6 w-32 rounded-lg bg-card" />
      <div className="h-40 rounded-[26px] bg-card" />
      <div className="mt-7 grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-[18px] bg-card" />
        ))}
      </div>
    </div>
  );
}
