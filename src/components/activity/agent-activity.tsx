import React from 'react';
import { SectionLabel } from '../shared/section-label';
import { AttemptGroup } from './attempt-group';
import { TraceEvent } from '@/lib/types';

interface AgentActivityProps {
  events: TraceEvent[];
}

export function AgentActivity({ events }: AgentActivityProps) {
  // Group events by attemptNumber
  const groupedEvents: { [key: number]: TraceEvent[] } = {};
  
  events.forEach((evt) => {
    if (!groupedEvents[evt.attemptId]) {
      groupedEvents[evt.attemptId] = [];
    }
    groupedEvents[evt.attemptId].push(evt);
  });

  const attemptIds = Object.keys(groupedEvents)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <aside className="w-full lg:w-[28%] shrink-0 bg-sidebar border-t lg:border-t-0 lg:border-l border-border-custom flex flex-col p-4 overflow-y-auto select-none">
      <SectionLabel className="mb-4">Agent Activity</SectionLabel>

      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="font-serif italic text-xs text-muted-text text-center px-4">
            Initialize an repair trace run to observe agent execution steps.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-1">
          {attemptIds.map((attemptId, idx) => (
            <AttemptGroup
              key={attemptId}
              attemptNumber={attemptId}
              events={groupedEvents[attemptId]}
              isLastAttempt={idx === attemptIds.length - 1}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
