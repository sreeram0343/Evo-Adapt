import React from 'react';
import { TraceEvent } from '@/lib/types';

interface TimelineEventProps {
  event: TraceEvent;
  isLast?: boolean;
}

export function TimelineEvent({ event, isLast = false }: TimelineEventProps) {
  // Determine dot color & glow based on event type
  let markerStyle = 'border-border-custom bg-surface';
  let lineStyle = 'bg-border-custom/50';

  if (event.type === 'active') {
    markerStyle = 'border-signal bg-signal animate-pulse';
    lineStyle = 'bg-signal/40';
  } else if (event.type === 'success') {
    markerStyle = 'border-foreground bg-foreground dark:border-foreground dark:bg-foreground';
  } else if (event.type === 'failure') {
    markerStyle = 'border-signal bg-surface dark:bg-sidebar';
  }

  return (
    <div className="flex gap-3 min-h-[50px] relative select-text">
      {/* Timeline line column */}
      <div className="flex flex-col items-center">
        <div className={`w-2.5 h-2.5 rounded-full border-2 ${markerStyle} z-10`} />
        {!isLast && <div className={`w-0.5 flex-1 my-1 ${lineStyle}`} />}
      </div>

      {/* Timeline content column */}
      <div className="flex-1 flex flex-col gap-1 pb-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`font-sans text-xs font-semibold ${event.type === 'active' ? 'text-signal' : 'text-foreground'}`}>
            {event.label}
          </span>
          <span className="font-mono text-[10px] text-muted-text/80 tracking-tight font-medium">
            {event.timestamp}
          </span>
        </div>

        {event.description && (
          <p className="font-sans text-[11px] leading-normal text-muted-text">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
}
