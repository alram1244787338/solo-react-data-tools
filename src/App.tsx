import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { DataFormat, TableData, ConversionHistoryItem } from './types';
import {
  convertData,
  detectFormat,
  csvToTable,
  tableToCsv,
  jsonToTable,
  tableToJson,
} from './converters';
import { FormatSelector } from './components/FormatSelector';
import { Toolbar } from './components/Toolbar';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { TableView } from './components/TableView';
import { HistorySidebar } from './components/HistorySidebar';
import { useConversionHistory } from './hooks/useConversionHistory';
import { copyToClipboard, downloadFile, getMimeType, getFileExtension } from './utils/helpers';

const SAMPLE_JSON = `[
  {
    "name": "张三",
    "age": 28,
    "city": "北京"
  },
  {
    "name": "李四",
    "age": 32,
    "city": "上海"
  },
  {
    "name": "王五",
    "age": 25,
    "city": "广州"
  }
]`;

const App: React.FC = () => {
  const [input, setInput] = useState(SAMPLE_JSON);
  const [output, setOutput] = useState('');
  const [sourceFormat, setSourceFormat] = useState<DataFormat>('json');
  const [targetFormat, setTargetFormat] = useState<DataFormat>('csv');
  const [error, setError] = useState<string | undefined>();
  const [isTableView, setIsTableView] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tableData, setTableData] = useState<TableData>({ headers: [], rows: [] });
  const [tableSide, setTableSide] = useState<'input' | 'output'>('input');

  const { history, addHistory, clearHistory, removeHistory } = useConversionHistory();

  const canShowTable = useMemo(() => {
    return sourceFormat === 'csv' || sourceFormat === 'json';
  }, [sourceFormat]);

  const handleConvert = useCallback(() => {
    if (!input.trim()) {
      setError('请输入要转换的数据');
      setOutput('');
      return;
    }

    const result = convertData(input, sourceFormat, targetFormat);
    if (result.success && result.data !== undefined) {
      setOutput(result.data);
      setError(undefined);
      addHistory(input, result.data, sourceFormat, targetFormat);
    } else {
      setOutput('');
      setError(result.error);
    }
  }, [input, sourceFormat, targetFormat, addHistory]);

  const handleSwap = useCallback(() => {
    setSourceFormat(targetFormat);
    setTargetFormat(sourceFormat);
    if (output) {
      setInput(output);
      setOutput('');
      setError(undefined);
    }
  }, [sourceFormat, targetFormat, output]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(undefined);
  }, []);

  const handleCopy = useCallback(() => {
    if (output) {
      copyToClipboard(output);
    }
  }, [output]);

  const handleDownload = useCallback(() => {
    if (output) {
      const filename = `converted${getFileExtension(targetFormat)}`;
      const mimeType = getMimeType(targetFormat);
      downloadFile(output, filename, mimeType);
    }
  }, [output, targetFormat]);

  const handleFileLoaded = useCallback(
    (content: string, format: DataFormat | null) => {
      setInput(content);
      setOutput('');
      setError(undefined);
      if (format) {
        setSourceFormat(format);
      } else {
        const detected = detectFormat(content);
        if (detected) {
          setSourceFormat(detected);
        }
      }
    },
    []
  );

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setOutput('');
    setError(undefined);
  }, []);

  const handleSourceFormatChange = useCallback((format: DataFormat) => {
    setSourceFormat(format);
    setOutput('');
    setError(undefined);
    setIsTableView(false);
  }, []);

  const handleTargetFormatChange = useCallback((format: DataFormat) => {
    setTargetFormat(format);
    setOutput('');
    setError(undefined);
  }, []);

  const handleToggleTable = useCallback(() => {
    if (!isTableView) {
      let result: { success: boolean; table?: TableData; error?: string };
      if (sourceFormat === 'csv') {
        result = { success: true, table: csvToTable(input) };
      } else if (sourceFormat === 'json') {
        result = jsonToTable(input);
      } else {
        return;
      }
      if (result.success && result.table) {
        setTableData(result.table);
        setTableSide('input');
        setIsTableView(true);
      }
    } else {
      setIsTableView(false);
    }
  }, [isTableView, sourceFormat, input]);

  const handleTableChange = useCallback(
    (newTableData: TableData) => {
      setTableData(newTableData);
      let newContent: string;
      if (sourceFormat === 'csv') {
        newContent = tableToCsv(newTableData);
      } else if (sourceFormat === 'json') {
        newContent = tableToJson(newTableData);
      } else {
        return;
      }
      setInput(newContent);
      setOutput('');
      setError(undefined);
    },
    [sourceFormat]
  );

  const handleRestoreHistory = useCallback((item: ConversionHistoryItem) => {
    setInput(item.input);
    setOutput(item.output);
    setSourceFormat(item.sourceFormat);
    setTargetFormat(item.targetFormat);
    setError(undefined);
    setShowHistory(false);
  }, []);

  useEffect(() => {
    if (input.trim() && !output) {
      const detected = detectFormat(input);
      if (detected && detected !== sourceFormat) {
        // 可以选择自动切换，这里只提示
      }
    }
  }, [input, output, sourceFormat]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>数据转换工具</h1>
        <p className="subtitle">支持 CSV、JSON、XML、YAML 格式互转</p>
      </header>

      <div className="format-selectors">
        <FormatSelector
          value={sourceFormat}
          onChange={handleSourceFormatChange}
          label="源格式"
          excludeFormat={targetFormat}
        />
        <div className="format-arrow">→</div>
        <FormatSelector
          value={targetFormat}
          onChange={handleTargetFormatChange}
          label="目标格式"
          excludeFormat={sourceFormat}
        />
      </div>

      <Toolbar
        sourceFormat={sourceFormat}
        targetFormat={targetFormat}
        onSwap={handleSwap}
        onConvert={handleConvert}
        onClear={handleClear}
        onCopy={handleCopy}
        onDownload={handleDownload}
        onToggleTable={handleToggleTable}
        isTableView={isTableView}
        canShowTable={canShowTable}
        onToggleHistory={() => setShowHistory(!showHistory)}
        showHistory={showHistory}
      />

      <div className="main-content">
        {showHistory && (
          <HistorySidebar
            history={history}
            onRestore={handleRestoreHistory}
            onDelete={removeHistory}
            onClear={clearHistory}
            onClose={() => setShowHistory(false)}
          />
        )}

        <div className={`panels-container ${showHistory ? 'with-sidebar' : ''}`}>
          <div className="panel-wrapper">
            {isTableView && tableSide === 'input' ? (
              <div className="panel input-panel">
                <div className="panel-header">
                  <span className="panel-title">表格视图 - {sourceFormat.toUpperCase()}</span>
                  <button className="panel-btn" onClick={handleToggleTable}>
                    返回代码视图
                  </button>
                </div>
                <div className="panel-body">
                  <TableView data={tableData} onChange={handleTableChange} />
                </div>
              </div>
            ) : (
              <InputPanel
                value={input}
                onChange={handleInputChange}
                format={sourceFormat}
                onFormatChange={handleSourceFormatChange}
                onFileLoaded={handleFileLoaded}
              />
            )}
          </div>

          <div className="panel-wrapper">
            <OutputPanel value={output} format={targetFormat} error={error} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
