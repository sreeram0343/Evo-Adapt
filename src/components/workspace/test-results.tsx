import React from 'react';
import { ExecutionResult } from '@/lib/types';

interface TestResultsProps {
  results: ExecutionResult[];
}

export function TestResults({ results }: TestResultsProps) {
  return (
    <div className="w-full overflow-x-auto select-text">
      <table className="w-full text-left font-mono text-[11px] border-collapse">
        <thead>
          <tr className="border-b border-border-custom text-muted-text select-none">
            <th className="py-1 px-3 font-semibold text-[10px] tracking-wider uppercase">Test</th>
            <th className="py-1 px-3 font-semibold text-[10px] tracking-wider uppercase text-center w-24">Status</th>
            <th className="py-1 px-3 font-semibold text-[10px] tracking-wider uppercase text-right w-24">Duration</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 text-center text-muted-text/80 select-none">
                No test results recorded.
              </td>
            </tr>
          ) : (
            results.map((result, idx) => {
              let statusStyle = 'text-muted-text';
              let statusBg = 'bg-secondary-surface';
              
              if (result.status === 'PASS') {
                statusStyle = 'text-foreground dark:text-[#E9E4D8] font-bold';
                statusBg = 'bg-foreground/5 dark:bg-foreground/10';
              } else if (result.status === 'FAIL') {
                statusStyle = 'text-signal font-bold';
                statusBg = 'bg-signal/10';
              }

              return (
                <tr
                  key={idx}
                  className="border-b border-border-custom/50 hover:bg-secondary-surface/30 transition-colors"
                >
                  <td className="py-1.5 px-3 font-medium text-foreground">{result.testName}</td>
                  <td className="py-1.5 px-3 text-center">
                    <span className={`inline-block px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${statusBg} ${statusStyle}`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-right text-muted-text">
                    {result.duration || '—'}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
