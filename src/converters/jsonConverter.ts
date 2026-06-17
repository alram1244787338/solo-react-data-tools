import type { ConversionResult, TableData, JsonData } from '../types';

export function jsonValidate(jsonStr: string): ConversionResult {
  try {
    const data = JSON.parse(jsonStr);
    return { success: true, data: JSON.stringify(data, null, 2) };
  } catch (e) {
    return { success: false, error: `JSON 解析失败: ${(e as Error).message}` };
  }
}

export function jsonToTable(jsonStr: string): ConversionResult & { table?: TableData } {
  try {
    const data = JSON.parse(jsonStr) as JsonData;
    let rows: Record<string, unknown>[] = [];

    if (Array.isArray(data)) {
      rows = data as Record<string, unknown>[];
    } else if (typeof data === 'object' && data !== null) {
      rows = [data as Record<string, unknown>];
    } else {
      return { success: false, error: 'JSON 数据必须是数组或对象才能转换为表格' };
    }

    if (rows.length === 0) {
      return { success: true, table: { headers: [], rows: [] } };
    }

    const headers = Object.keys(rows[0]);
    const tableRows = rows.map((row) =>
      headers.map((header) => {
        const val = row[header];
        return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
      })
    );

    return { success: true, table: { headers, rows: tableRows } };
  } catch (e) {
    return { success: false, error: `JSON 解析失败: ${(e as Error).message}` };
  }
}

export function tableToJson(table: TableData): string {
  const { headers, rows } = table;
  const result = rows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
  return JSON.stringify(result, null, 2);
}

export function detectJson(data: string): boolean {
  const trimmed = data.trim();
  if (!trimmed) return false;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return false;

  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function formatJson(jsonStr: string): ConversionResult {
  try {
    const obj = JSON.parse(jsonStr);
    return { success: true, data: JSON.stringify(obj, null, 2) };
  } catch (e) {
    return { success: false, error: `JSON 格式化失败: ${(e as Error).message}` };
  }
}

export function minifyJson(jsonStr: string): ConversionResult {
  try {
    const obj = JSON.parse(jsonStr);
    return { success: true, data: JSON.stringify(obj) };
  } catch (e) {
    return { success: false, error: `JSON 压缩失败: ${(e as Error).message}` };
  }
}
