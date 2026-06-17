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
      const obj: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        const raw = row[index] || '';
        obj[header] = tryParseValue(raw);
      });
      return obj;
    });
    return { success: true, data: JSON.stringify(result, null, 2) };
  } catch (e) {
    return { success: false, error: `CSV 解析失败: ${(e as Error).message}` };
  }
}

function tryParseValue(val: string): unknown {
  if (val === '') return '';
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null') return null;
  const num = Number(val);
  if (!isNaN(num) && val.trim() !== '') return num;
  return val;
}

export function jsonToCsv(jsonStr: string): ConversionResult {
  try {
    const data = JSON.parse(jsonStr);
    const rows = normalizeToRows(data);
    if (!rows) {
      return { success: false, error: 'JSON 数据无法转换为表格格式（需要数组或可展平的对象）' };
    }
    if (rows.length === 0) {
      return { success: true, data: '' };
    }

    const flatRows = rows.map((row) => flattenObject(row));
    const headerSet = new Set<string>();
    flatRows.forEach((row) => Object.keys(row).forEach((k) => headerSet.add(k)));
    const headers = Array.from(headerSet);

    const csvLines = [headers.join(',')];
    flatRows.forEach((row) => {
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
    return { success: false, error: `JSON 转 CSV 失败: ${(e as Error).message}` };
  }
}

function normalizeToRows(data: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    return data.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return cleanSpecialKeys(item as Record<string, unknown>);
      }
      return { value: item };
    });
  }
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    const allValuesAreObjects = Object.values(obj).every(
      (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
    );
    if (allValuesAreObjects && Object.keys(obj).length > 0) {
      return Object.entries(obj).map(([key, value]) => ({
        _key: key,
        ...cleanSpecialKeys(value as Record<string, unknown>),
      }));
    }
    return [cleanSpecialKeys(obj)];
  }
  return null;
}

function cleanSpecialKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '@attributes') {
      if (typeof value === 'object' && value !== null) {
        Object.entries(value as Record<string, unknown>).forEach(([ak, av]) => {
          result[`@${ak}`] = av;
        });
      }
    } else if (key === '#text') {
      result['text'] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value === null || value === undefined) {
      result[fullKey] = '';
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
    } else if (Array.isArray(value)) {
      result[fullKey] = JSON.stringify(value);
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
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
  return (
    firstLine.includes(',') &&
    !trimmed.startsWith('{') &&
    !trimmed.startsWith('[') &&
    !trimmed.startsWith('<') &&
    !/^[\w-]+:/.test(trimmed)
  );
}
