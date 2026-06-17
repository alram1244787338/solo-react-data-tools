import React, { useMemo } from 'react';
import type { DataFormat } from '../types';
import { highlightSyntax } from '../utils/syntaxHighlight';

interface OutputPanelProps {
  value: string;
  format: DataFormat;
  error?: string;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ value, format, error }) => {
  const highlightedHtml = useMemo(() => {
    if (!value) return '';
    return highlightSyntax(value, format);
  }, [value, format]);

  return (
    <div className="panel output-panel">
      <div className="panel-header">
        <span className="panel-title">输出 - {format.toUpperCase()}</span>
        {value && <span className="char-count">{value.length} 字符</span>}
      </div>
      <div className="panel-body">
        {error ? (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        ) : (
          <pre className="code-output">
            <code dangerouslySetInnerHTML={{ __html: highlightedHtml || '' }} />
          </pre>
        )}
      </div>
    </div>
  );
};
