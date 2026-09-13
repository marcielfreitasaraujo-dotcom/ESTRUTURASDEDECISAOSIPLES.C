"use client";

import { useEffect, useState } from "react";
import { formatOccupancyDuration } from "@/domain/floor/occupancy";

export function OccupancyTimer({ openedAt, className }: { openedAt: string; className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [openedAt]);

  return (
    <time dateTime={openedAt} className={className} title="Tempo desde a abertura da mesa">
      {formatOccupancyDuration(openedAt, now)}
    </time>
  );
}
