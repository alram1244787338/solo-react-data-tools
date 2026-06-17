import type { JsonData, ConversionResult, TableData } from '../types';

export function csvToJson(csv: string): ConversionResult {
  try {
    const lines = parseCsvLines(csv);
    if (lines.length === 0) {
      return { success: true, data: '[]' };
    }
    const headers = lines[0];
    const rows = lines.slice(1);
    const result = rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
    return { success: true, data: JSON.stringify(result, null, 2) };
  } catch (e) {
    return { success: false, error: `CSV 解析失败: ${(e as Error).message}` };
  }
}

export function jsonToCsv(jsonStr: string): ConversionResult {
  try {
    const data = JSON.parse(jsonStr) as JsonData;
    let rows: Record<string, unknown>[] = [];

    if (Array.isArray(data)) {
      rows = data as Record<string, unknown>[];
    } else if (typeof data === 'object' && data !== null) {
      rows = [data as Record<string, unknown>];
    } else {
      return { success: false, error: 'JSON 数据必须是数组或对象' };
    }

    if (rows.length === 0) {
      return { success: true, data: '' };
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];

    rows.forEach((row) => {
      const line = headers.map((header) => {
        const value = String(row[header] ?? '');
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvLines.push(line.join(','));
    });

    return { success: true, data: csvLines.join('\n') };
  } catch (e) {
    return { success: false, error: `JSON 解析失败: ${(e as Error).message}` };
  }
}

export function csvToTable(csv: string): TableData {
  const lines = parseCsvLines(csv);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  return {
    headers: lines[0],
    rows: lines.slice(1),
  };
}

export function tableToCsv(table: TableData): string {
  const lines = [table.headers.join(',')];
  table.rows.forEach((row) => {
    const line = row.map((cell) => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    });
    lines.push(line.join(','));
  });
  return lines.join('\n');
}

function parseCsvLines(csv: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentLine.push(currentField);
        if (currentLine.length > 1 || currentLine[0] !== '') {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }

  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField);
    lines.push(currentLine);
  }

  return lines;
}

export function detectCsv(data: string): boolean {
  const trimmed = data.trim();
  if (!trimmed) return false;
  const firstLine = trimmed.split('\n')[0];
  return firstLine.includes(',') && !trimmed.startsWith('{') && !trimmed.startsWith('[') && !trimmed.startsWith('<') && !/^[\w-]+:/.test(trimmed);
}
