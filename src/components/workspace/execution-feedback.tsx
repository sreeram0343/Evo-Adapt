import React from 'react';
import { SectionLabel } from '../shared/section-label';

interface ExecutionFeedbackProps {
  feedback?: {
    type: string;
    expected: string;
    received: string;
    raw?: string;
  };
}

export function ExecutionFeedback({ feedback }: ExecutionFeedbackProps) {
  if (!feedback) return null;

  return (
    <div className="flex flex-col gap-2 mt-4 select-text">
      <SectionLabel>Execution Feedback</SectionLabel>
      <div className="border-l-2 border-signal bg-secondary-surface/40 p-3 rounded-r font-mono text-[11px] leading-relaxed flex flex-col gap-1.5">
        <div className="font-bold text-signal tracking-wide uppercase text-[9px]">
          {feedback.type}
        </div>
        
        {feedback.raw ? (
          <pre className="whitespace-pre-wrap text-foreground/90 font-mono select-text">
            {feedback.raw}
          </pre>
        ) : (
          <div className="flex flex-col gap-1">
            <div>
              <span className="text-muted-text select-none">Expected:</span>{' '}
              <code className="text-foreground font-semibold font-mono bg-surface border border-border-custom/50 px-1 py-0.5 rounded">
                {feedback.expected}
              </code>
            </div>
            <div>
              <span className="text-muted-text select-none">Received:</span>{' '}
              <code className="text-signal font-semibold font-mono bg-surface border border-border-custom/50 px-1 py-0.5 rounded">
                {feedback.received}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
