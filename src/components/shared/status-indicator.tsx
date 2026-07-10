import React from 'react';
import { AgentStatus } from '@/lib/types';

interface StatusIndicatorProps {
  status: AgentStatus | string;
  className?: string;
  pulse?: boolean;
}

export function StatusIndicator({ status, className = '', pulse = false }: StatusIndicatorProps) {
  const normStatus = (status || '').toLowerCase();
  
  let label = status.toUpperCase();
  let dotColor = 'bg-muted-text';
  let textColor = 'text-muted-text';
  let isCoral = false;

  switch (normStatus) {
    case 'idle':
      label = 'IDLE';
      dotColor = 'bg-muted-text/60';
      textColor = 'text-muted-text';
      break;
    case 'generating':
      label = 'GENERATING';
      dotColor = 'bg-signal';
      textColor = 'text-signal';
      isCoral = true;
      break;
    case 'executing':
    case 'running tests':
      label = 'EXECUTING';
      dotColor = 'bg-signal';
      textColor = 'text-signal';
      isCoral = true;
      break;
    case 'diagnosing':
      label = 'DIAGNOSING';
      dotColor = 'bg-signal';
      textColor = 'text-signal';
      isCoral = true;
      break;
    case 'repairing':
      label = 'REPAIRING';
      dotColor = 'bg-signal';
      textColor = 'text-signal';
      isCoral = true;
      break;
    case 'failed':
      label = 'FAILED';
      dotColor = 'bg-signal';
      textColor = 'text-signal';
      isCoral = true;
      break;
    case 'passed':
    case 'success':
      label = 'PASSED';
      dotColor = 'bg-foreground';
      textColor = 'text-foreground';
      break;
    case 'error':
      label = 'ERROR';
      dotColor = 'bg-signal';
      textColor = 'text-signal';
      isCoral = true;
      break;
    default:
      label = typeof status === 'string' ? status.toUpperCase() : 'UNKNOWN';
  }

  return (
    <div className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wider ${textColor} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${(pulse || isCoral) ? 'animate-pulse' : ''}`} />
      <span>{label}</span>
    </div>
  );
}
