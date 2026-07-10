'use client';

import React, { useState, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { EditorHeader } from './editor-header';
import { TestResults } from './test-results';
import { ExecutionFeedback } from './execution-feedback';
import { Attempt, AgentStatus } from '@/lib/types';
import { useTheme } from '../shared/theme-context';

interface CodeWorkspaceProps {
  attempt: Attempt;
  status: AgentStatus;
  totalAttempts: number;
  onSelectAttempt: (idx: number) => void;
  onCodeChange?: (code: string) => void;
}

export function CodeWorkspace({ attempt, status, totalAttempts, onSelectAttempt, onCodeChange }: CodeWorkspaceProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'results' | 'output'>('results');
  const [editorMounted, setEditorMounted] = useState(false);

  // Setup Monaco themes
  const handleEditorWillMount = (monaco: Monaco) => {
    // Custom light warm theme
    monaco.editor.defineTheme('recode-warm-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: '', foreground: '1E1E1E' },
        { token: 'comment', foreground: '8A8273', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'A85C44', fontStyle: 'bold' },
        { token: 'string', foreground: '4E725E' },
        { token: 'number', foreground: 'B85C38' },
        { token: 'type', foreground: '3E6B5C' },
        { token: 'function', foreground: '2E2E2E', fontStyle: 'bold' }
      ],
      colors: {
        'editor.background': '#F4EFE4',
        'editor.foreground': '#1E1E1E',
        'editor.lineHighlightBackground': '#EAE4D7',
        'editorCursor.foreground': '#1E1E1E',
        'editor.selectionBackground': '#E6E4D7',
        'editorLineNumber.foreground': '#A89F8F',
        'editorLineNumber.activeForeground': '#1E1E1E'
      }
    });

    // Custom dark warm theme
    monaco.editor.defineTheme('recode-warm-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'E9E4D8' },
        { token: 'comment', foreground: '8E897C', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'F26A4B', fontStyle: 'bold' },
        { token: 'string', foreground: '8FBC8F' },
        { token: 'number', foreground: 'F4A460' },
        { token: 'type', foreground: '87CEEB' },
        { token: 'function', foreground: 'F4EFE4', fontStyle: 'bold' }
      ],
      colors: {
        'editor.background': '#24221E',
        'editor.foreground': '#E9E4D8',
        'editor.lineHighlightBackground': '#2E2B26',
        'editorCursor.foreground': '#E9E4D8',
        'editor.selectionBackground': '#3A3833',
        'editorLineNumber.foreground': '#6E6A60',
        'editorLineNumber.activeForeground': '#E9E4D8'
      }
    });
  };

  const currentTheme = theme === 'dark' ? 'recode-warm-dark' : 'recode-warm-light';

  return (
    <main className="flex-1 flex flex-col min-h-0 border-b lg:border-b-0 border-border-custom bg-surface relative">
      {/* Editor Header */}
      <EditorHeader
        attemptNumber={attempt.number}
        maxAttempts={attempt.maxAttempts}
        totalAttempts={totalAttempts}
        status={status}
        language="Python"
        onSelectAttempt={onSelectAttempt}
      />

      {/* Editor Body */}
      <div className="flex-1 min-h-0 relative border-b border-border-custom bg-[#F4EFE4] dark:bg-[#24221E]">
        <Editor
          height="100%"
          language="python"
          value={attempt.code}
          onChange={(val) => onCodeChange && onCodeChange(val || '')}
          theme={currentTheme}
          beforeMount={handleEditorWillMount}
          onMount={() => setEditorMounted(true)}
          options={{
            fontSize: 12,
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6
            },
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            cursorBlinking: 'smooth',
            cursorWidth: 2,
            renderLineHighlight: 'all',
            padding: { top: 12, bottom: 12 }
          }}
          loading={
            <div className="absolute inset-0 flex items-center justify-center bg-surface font-mono text-xs text-muted-text select-none">
              Loading editor environment...
            </div>
          }
        />
      </div>

      {/* Tabs Row */}
      <div className="h-28 flex flex-col bg-surface border-t border-border-custom select-none">
        <div className="h-8 border-b border-border-custom px-3 flex items-center gap-4 bg-secondary-surface/40">
          <button
            onClick={() => setActiveTab('results')}
            type="button"
            className={`h-full px-2 text-[10px] font-bold tracking-wider uppercase font-sans border-b-2 transition-all focus:outline-none ${
              activeTab === 'results'
                ? 'border-signal text-foreground'
                : 'border-transparent text-muted-text hover:text-foreground'
            }`}
          >
            Test Results
          </button>
          <button
            onClick={() => setActiveTab('output')}
            type="button"
            className={`h-full px-2 text-[10px] font-bold tracking-wider uppercase font-sans border-b-2 transition-all focus:outline-none ${
              activeTab === 'output'
                ? 'border-signal text-foreground'
                : 'border-transparent text-muted-text hover:text-foreground'
            }`}
          >
            Output
          </button>
        </div>

        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto p-3">
          {activeTab === 'results' ? (
            <div className="flex flex-col gap-2">
              <TestResults results={attempt.testResults} />
              {attempt.feedback && (
                <ExecutionFeedback feedback={attempt.feedback} />
              )}
            </div>
          ) : (
            <div className="font-mono text-[11px] leading-relaxed text-muted-text select-text whitespace-pre-wrap">
              {`[system] sandbox initialized successfully\n[system] python version 3.11.4 found\n[system] running test suite with ${attempt.testResults.length} cases\n`}
              {attempt.testResults.map((r, i) => (
                <div key={i}>
                  {`test_case_${r.testName.slice(-2)} ... ${r.status} (${r.duration || '—'})`}
                </div>
              ))}
              {attempt.feedback && (
                <div className="text-signal mt-2 font-bold">
                  {`Traceback (most recent call last):\n  File "solution_test.py", line 14, in test_case_03\n    self.assertEqual(two_sum([3, 3], 6), [0, 1])\n${attempt.feedback.raw || 'AssertionError'}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
