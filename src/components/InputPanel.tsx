import React, { useRef, useCallback } from 'react';
import type { DataFormat } from '../types';
import { getFileExtensionToFormat } from '../converters';

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  format: DataFormat;
  onFormatChange: (format: DataFormat) => void;
  onFileLoaded: (content: string, format: DataFormat | null) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ value, onChange, format, onFormatChange, onFileLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        const ext = file.name.split('.').pop() || '';
        const detectedFormat = getFileExtensionToFormat(ext);

        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          onFileLoaded(content, detectedFormat);
        };
        reader.readAsText(file);
      }
    },
    [onFileLoaded]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop() || '';
      const detectedFormat = getFileExtensionToFormat(ext);

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onFileLoaded(content, detectedFormat);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      setTimeout(() => {
        const pastedText = e.clipboardData.getData('text');
        if (pastedText && value === '') {
          // 自动检测格式在 App 层处理
        }
      }, 0);
    },
    [value]
  );

  return (
    <div className="panel input-panel">
      <div className="panel-header">
        <span className="panel-title">输入 - {format.toUpperCase()}</span>
        <button className="panel-btn" onClick={handleFileClick}>
          📁 导入文件
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,.xml,.yaml,.yml,.txt"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      <div
        className={`panel-body drop-zone ${isDragging ? 'dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {value === '' && (
          <div className="drop-hint">
            <p>拖拽文件到此处</p>
            <p className="hint-sub">或粘贴文本 / 点击上方导入文件</p>
          </div>
        )}
        <textarea
          className="code-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={`在此粘贴 ${format.toUpperCase()} 数据...`}
          spellCheck={false}
        />
      </div>
    </div>
  );
};
