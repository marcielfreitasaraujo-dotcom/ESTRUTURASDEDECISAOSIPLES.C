export default function ProjectMock({ name, accent, tone }) {
  return (
    <div
      className={`relative aspect-[16/10] overflow-hidden border border-white/10 bg-gradient-to-br ${tone}`}
      aria-hidden="true"
    >
      <div className="absolute inset-x-6 top-6 rounded-md border border-white/10 bg-bg/70 p-3 backdrop-blur-sm">
        <div className="mb-3 flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
        </div>
        <div className="h-2 w-1/3 rounded-full" style={{ background: accent, opacity: 0.85 }} />
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="h-10 rounded-sm bg-white/5" />
          <div className="h-10 rounded-sm bg-white/5" />
          <div className="h-10 rounded-sm bg-white/10" />
        </div>
      </div>
      <p className="absolute bottom-4 left-6 font-display text-lg font-bold tracking-tight text-ink/90">{name}</p>
    </div>
  );
}
