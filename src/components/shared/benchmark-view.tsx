import React from 'react';
import { SectionLabel } from './section-label';

export function BenchmarkView() {
  const benchmarks = [
    { name: 'HumanEval (Python)', count: 164, baseline: '72.3%', recode: '92.1%', delta: '+19.8%' },
    { name: 'MBPP (Python)', count: 500, baseline: '81.0%', recode: '94.6%', delta: '+13.6%' },
    { name: 'SWE-bench (Lite)', count: 300, baseline: '14.2%', recode: '31.4%', delta: '+17.2%' },
    { name: 'APPS (Introductory)', count: 1000, baseline: '56.1%', recode: '79.3%', delta: '+23.2%' }
  ];

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto max-w-5xl mx-auto w-full select-none">
      <h1 className="font-serif text-3xl text-foreground mb-2 font-normal">
        Standard Benchmarks
      </h1>
      <p className="font-sans text-xs text-muted-text mb-8 max-w-2xl leading-relaxed">
        Evaluation results against standard agentic benchmarks. Performance comparisons are measured using pass@1 scores.
      </p>

      <div className="flex flex-col gap-6">
        <SectionLabel>Benchmark Datasets</SectionLabel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benchmarks.map((bench) => (
            <div
              key={bench.name}
              className="border border-border-custom bg-surface rounded p-4 flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-sans text-xs font-bold text-foreground">{bench.name}</h3>
                  <span className="font-mono text-[9px] text-muted-text">{bench.count} problems</span>
                </div>
                <span className="font-mono text-[10px] text-signal font-bold bg-signal/5 px-2 py-0.5 rounded border border-signal/15">
                  {bench.delta}
                </span>
              </div>

              {/* Progress bar visual comparison */}
              <div className="flex flex-col gap-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-mono text-muted-text">
                  <span>Baseline Model</span>
                  <span>{bench.baseline}</span>
                </div>
                <div className="w-full h-1.5 bg-secondary-surface rounded overflow-hidden">
                  <div
                    className="h-full bg-muted-text/60 rounded"
                    style={{ width: bench.baseline }}
                  />
                </div>

                <div className="flex justify-between text-[10px] font-mono text-foreground font-semibold mt-1">
                  <span>ReCode Agent</span>
                  <span>{bench.recode}</span>
                </div>
                <div className="w-full h-1.5 bg-secondary-surface rounded overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded"
                    style={{ width: bench.recode }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
