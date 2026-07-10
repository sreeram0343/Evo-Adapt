import React from 'react';
import { mockExperiments } from '@/lib/mock-data';
import { SectionLabel } from './section-label';

export function ExperimentsView() {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-5xl mx-auto w-full select-none">
      {/* Editorial Accent Heading */}
      <h1 className="font-serif text-3xl text-foreground mb-2 font-normal">
        Research Insights & Run Logs
      </h1>
      <p className="font-sans text-xs text-muted-text mb-8 max-w-2xl leading-relaxed">
        Performance tracking of repair strategies across models. Real-time cost reduction metrics are benchmarked against execution-guided context structures.
      </p>

      <div className="flex flex-col gap-6">
        <SectionLabel>Active Experiments</SectionLabel>
        
        <div className="border border-border-custom rounded overflow-hidden bg-surface">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-custom bg-secondary-surface/40 font-semibold text-muted-text select-none">
                <th className="py-2.5 px-4">Experiment Name</th>
                <th className="py-2.5 px-4 font-mono text-[10px] w-24">Date</th>
                <th className="py-2.5 px-4 font-mono text-[10px] text-center w-32">Success Rate</th>
                <th className="py-2.5 px-4 font-mono text-[10px] text-center w-28">Avg. Latency</th>
                <th className="py-2.5 px-4 font-mono text-[10px] text-right w-32">Cost Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom/50">
              {mockExperiments.map((exp) => (
                <tr key={exp.id} className="hover:bg-secondary-surface/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground">{exp.name}</div>
                    <div className="text-[11px] text-muted-text mt-0.5">{exp.description}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-muted-text">{exp.date}</td>
                  <td className="py-3 px-4 text-center font-mono text-[11px] text-foreground font-bold">{exp.successRate}</td>
                  <td className="py-3 px-4 text-center font-mono text-[11px] text-muted-text">{exp.avgLatency}</td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-signal font-bold">{exp.costReduction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
