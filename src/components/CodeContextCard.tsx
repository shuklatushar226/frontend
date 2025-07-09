import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeContextCardProps {
  filePath: string;
  lineNumber: number | null;
  diffHunk: string | null;
  side?: 'LEFT' | 'RIGHT' | null;
  originalLine?: number | null;
}

const CodeContextCard: React.FC<CodeContextCardProps> = ({
  filePath,
  lineNumber,
  diffHunk,
  side,
  originalLine
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract file extension for syntax highlighting
  const getLanguageFromPath = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'rs': 'rust',
      'js': 'javascript',
      'jsx': 'jsx',
      'ts': 'typescript',
      'tsx': 'tsx',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'bash',
      'yml': 'yaml',
      'yaml': 'yaml',
      'json': 'json',
      'xml': 'xml',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'sql': 'sql',
      'md': 'markdown',
      'dockerfile': 'dockerfile',
      'toml': 'toml',
    };
    return languageMap[extension || ''] || 'text';
  };

  // Get file icon based on extension
  const getFileIcon = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'rs': 'RS',
      'js': 'JS',
      'jsx': 'JSX',
      'ts': 'TS',
      'tsx': 'TSX',
      'py': 'PY',
      'java': 'JAVA',
      'go': 'GO',
      'cpp': 'CPP',
      'c': 'C',
      'h': 'H',
      'hpp': 'HPP',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'RB',
      'swift': 'SWIFT',
      'kt': 'KT',
      'scala': 'SCALA',
      'sh': 'SH',
      'yml': 'YML',
      'yaml': 'YAML',
      'json': 'JSON',
      'xml': 'XML',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'sass': 'SASS',
      'sql': 'SQL',
      'md': 'MD',
      'dockerfile': 'DOCKER',
      'toml': 'TOML',
    };
    return iconMap[extension || ''] || 'FILE';
  };

  // Parse diff hunk to extract code lines with context
  const parseDiffHunk = (hunk: string) => {
    if (!hunk) return null;

    const lines = hunk.split('\n');
    const codeLines: Array<{
      content: string;
      lineNumber: number | null;
      type: 'context' | 'added' | 'removed' | 'target';
      isTarget: boolean;
    }> = [];

    // Parse the hunk header to get starting line numbers
    const headerMatch = lines[0]?.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
    let oldLineNum = headerMatch ? parseInt(headerMatch[1]) : 1;
    let newLineNum = headerMatch ? parseInt(headerMatch[2]) : 1;

    // Skip the header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const prefix = line[0];
      const content = line.slice(1);
      let type: 'context' | 'added' | 'removed' | 'target' = 'context';
      let currentLineNum: number | null = null;
      let isTarget = false;

      if (prefix === '+') {
        type = 'added';
        currentLineNum = newLineNum;
        // Check if this is the target line
        if (side === 'RIGHT' && newLineNum === lineNumber) {
          isTarget = true;
          type = 'target';
        }
        newLineNum++;
      } else if (prefix === '-') {
        type = 'removed';
        currentLineNum = oldLineNum;
        // Check if this is the target line
        if (side === 'LEFT' && oldLineNum === (originalLine || lineNumber)) {
          isTarget = true;
          type = 'target';
        }
        oldLineNum++;
      } else {
        // Context line
        currentLineNum = side === 'LEFT' ? oldLineNum : newLineNum;
        // Check if this is the target line for context
        if ((side === 'RIGHT' && newLineNum === lineNumber) || 
            (side === 'LEFT' && oldLineNum === (originalLine || lineNumber))) {
          isTarget = true;
          type = 'target';
        }
        oldLineNum++;
        newLineNum++;
      }

      codeLines.push({
        content,
        lineNumber: currentLineNum,
        type,
        isTarget
      });
    }

    return codeLines;
  };

  const codeLines = parseDiffHunk(diffHunk || '');
  const language = getLanguageFromPath(filePath);
  const fileIcon = getFileIcon(filePath);

  // If we don't have a diff hunk, show a simple placeholder
  if (!diffHunk) {
    return (
      <div className="code-context-card border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <div className="code-context-header bg-gray-100 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{fileIcon}</span>
              <span className="font-mono text-sm text-gray-700">{filePath}</span>
              {lineNumber && (
                <span className="text-xs text-gray-500">
                  Line {lineNumber}
                </span>
              )}
            </div>
            <a
              href={`https://github.com/juspay/hyperswitch/blob/main/${filePath}#L${lineNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              View on GitHub →
            </a>
          </div>
        </div>
        <div className="p-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <span>•</span>
            <span>Code context not available - view on GitHub for full context</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="code-context-card border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="code-context-header bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <span className="text-lg">{fileIcon}</span>
            <span className="font-mono text-sm text-gray-700">{filePath}</span>
            {lineNumber && (
              <span className="text-xs text-gray-500">
                Line {lineNumber}
              </span>
            )}
            {side && (
              <span className={`text-xs px-2 py-1 rounded ${
                side === 'LEFT' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {side === 'LEFT' ? 'Old' : 'New'}
              </span>
            )}
          </div>
          <a
            href={`https://github.com/juspay/hyperswitch/blob/main/${filePath}#L${lineNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            View on GitHub →
          </a>
        </div>
      </div>

      {isExpanded && codeLines && (
        <div className="code-context-content">
          <div className="relative">
            <div className="code-lines">
              {codeLines.map((line, index) => (
                <div
                  key={index}
                  className={`flex ${
                    line.isTarget
                      ? 'bg-yellow-50 border-l-4 border-yellow-400'
                      : line.type === 'added'
                      ? 'bg-green-50'
                      : line.type === 'removed'
                      ? 'bg-red-50'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex-shrink-0 w-12 px-2 py-1 text-xs text-gray-500 text-right border-r border-gray-200 bg-gray-50">
                    {line.lineNumber}
                  </div>
                  <div className="flex-shrink-0 w-6 px-1 py-1 text-xs text-center">
                    {line.type === 'added' ? (
                      <span className="text-green-600">+</span>
                    ) : line.type === 'removed' ? (
                      <span className="text-red-600">-</span>
                    ) : line.isTarget ? (
                      <span className="text-yellow-600">→</span>
                    ) : (
                      <span className="text-gray-400"> </span>
                    )}
                  </div>
                  <div className="flex-1 px-2 py-1">
                    <SyntaxHighlighter
                      language={language}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: 0,
                        background: 'transparent',
                        fontSize: '12px',
                        lineHeight: '1.2',
                      }}
                      codeTagProps={{
                        style: {
                          background: 'transparent',
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                        }
                      }}
                    >
                      {line.content || ' '}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeContextCard;
