import React from 'react';
import { MetricItem } from './metric-item';
import { Metrics } from '@/lib/types';

interface MetricsStripProps {
  metrics: Metrics;
}

export function MetricsStrip({ metrics }: MetricsStripProps) {
  // Format tokens and costs
  const formattedTokens = metrics.tokens.toLocaleString();
  const formattedCost = `$${metrics.cost.toFixed(4)}`;
  const statusUpper = metrics.status.toUpperCase();
  const isStatusRunning = statusUpper === 'RUNNING' || statusUpper === 'EXECUTING';

  return (
    <footer className="h-12 border-t border-border-custom bg-surface flex items-stretch divide-x divide-border-custom overflow-x-auto whitespace-nowrap scrollbar-none">
      <MetricItem label="Attempts" value={metrics.attempts} />
      <MetricItem label="Tests Passed" value={metrics.testsPassed} />
      <MetricItem label="Latency" value={metrics.latency} />
      <MetricItem label="Tokens" value={formattedTokens} />
      <MetricItem label="Cost" value={formattedCost} />
      <MetricItem
        label="Status"
        value={statusUpper}
        highlightValue={isStatusRunning}
      />
    </footer>
  );
}
