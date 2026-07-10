import React from 'react';
import { TimelineEvent } from './timeline-event';
import { TraceEvent } from '@/lib/types';

interface AttemptGroupProps {
  attemptNumber: number;
  events: TraceEvent[];
  isLastAttempt?: boolean;
}

export function AttemptGroup({ attemptNumber, events, isLastAttempt = false }: AttemptGroupProps) {
  if (events.length === 0) return null;

  return (
    <div className="flex flex-col select-none">
      {/* Attempt Group Heading */}
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] font-black tracking-widest text-foreground uppercase">
          Attempt {attemptNumber.toString().padStart(2, '0')}
        </span>
        <div className="flex-1 h-[1px] bg-border-custom/50" />
      </div>

      {/* Events List */}
      <div className="pl-1.5 flex flex-col">
        {events.map((event, idx) => (
          <TimelineEvent
            key={event.id}
            event={event}
            isLast={isLastAttempt && idx === events.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
