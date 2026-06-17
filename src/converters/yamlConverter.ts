import type { ConversionResult, JsonData } from '../types';

export function yamlToJson(yaml: string): ConversionResult {
  try {
    const lines = yaml.split('\n');
    const result = parseYamlLines(lines, 0, 0);
    return { success: true, data: JSON.stringify(result.value, null, 2) };
  } catch (e) {
    return { success: false, error: `YAML 解析失败: ${(e as Error).message}` };
  }
}

function parseYamlLines(lines: string[], startIndex: number, indent: number): { value: unknown; nextIndex: number } {
  let i = startIndex;

  while (i < lines.length && (lines[i].trim() === '' || lines[i].trim().startsWith('#'))) {
    i++;
  }

  if (i >= lines.length) {
    return { value: null, nextIndex: i };
  }

  const firstLine = lines[i];
  const firstIndent = getIndent(firstLine);

  if (firstIndent < indent) {
    return { value: null, nextIndex: i };
  }

  const trimmed = firstLine.trim();

  if (trimmed.startsWith('- ')) {
    const arr: unknown[] = [];
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === '' || line.trim().startsWith('#')) {
        i++;
        continue;
      }
      const lineIndent = getIndent(line);
      if (lineIndent < indent || !line.trim().startsWith('- ')) {
        break;
      }

      const itemContent = line.trim().slice(2);
      if (itemContent.includes(': ') && !itemContent.startsWith('"')) {
        const itemLines: string[] = [line.replace(/^\s*-\s/, '  ')];
        i++;
        while (i < lines.length) {
          const nextLine = lines[i];
          if (nextLine.trim() === '' || nextLine.trim().startsWith('#')) {
            i++;
            continue;
          }
          const nextIndent = getIndent(nextLine);
          if (nextIndent <= indent) {
            break;
          }
          itemLines.push(nextLine);
          i++;
        }
        const result = parseYamlLines(itemLines, 0, 2);
        arr.push(result.value);
      } else {
        arr.push(parseScalar(itemContent));
        i++;
      }
    }
    return { value: arr, nextIndex: i };
  }

  if (trimmed.includes(': ') || trimmed.endsWith(':')) {
    const obj: Record<string, unknown> = {};
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === '' || line.trim().startsWith('#')) {
        i++;
        continue;
      }
      const lineIndent = getIndent(line);
      if (lineIndent < indent) {
        break;
      }
      if (lineIndent > indent) {
        i++;
        continue;
      }

      const trimmedLine = line.trim();
      const colonIndex = findKeyColon(trimmedLine);

      if (colonIndex === -1) {
        i++;
        continue;
      }

      const key = trimmedLine.slice(0, colonIndex);
      const value = trimmedLine.slice(colonIndex + 1).trim();

      if (value === '') {
        i++;
        let childIndent = -1;
        while (i < lines.length) {
          const nextLine = lines[i];
          if (nextLine.trim() === '' || nextLine.trim().startsWith('#')) {
            i++;
            continue;
          }
          childIndent = getIndent(nextLine);
          break;
        }
        if (childIndent > indent) {
          const result = parseYamlLines(lines, i, childIndent);
          obj[key] = result.value;
          i = result.nextIndex;
        } else {
          obj[key] = null;
        }
      } else {
        obj[key] = parseScalar(value);
        i++;
      }
    }
    return { value: obj, nextIndex: i };
  }

  return { value: parseScalar(trimmed), nextIndex: i + 1 };
}

function getIndent(line: string): number {
  let count = 0;
  for (const char of line) {
    if (char === ' ') count++;
    else if (char === '\t') count += 2;
    else break;
  }
  return count;
}

function findKeyColon(line: string): number {
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ':' && !inQuotes) {
      if (i + 1 < line.length && line[i + 1] === ' ') {
        return i;
      }
      if (i === line.length - 1) {
        return i;
      }
    }
  }
  return -1;
}

function parseScalar(value: string): unknown {
  if (value === 'true' || value === 'True') return true;
  if (value === 'false' || value === 'False') return false;
  if (value === 'null' || value === '~' || value === '') return null;

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }

  return value;
}

export function jsonToYaml(jsonStr: string): ConversionResult {
  try {
    const data = JSON.parse(jsonStr) as JsonData;
    const yaml = toYaml(data, 0);
    return { success: true, data: yaml };
  } catch (e) {
    return { success: false, error: `JSON 解析失败: ${(e as Error).message}` };
  }
}

function toYaml(data: unknown, indent: number): string {
  const pad = '  '.repeat(indent);

  if (data === null || data === undefined) {
    return 'null';
  }

  if (typeof data === 'boolean') {
    return data ? 'true' : 'false';
  }

  if (typeof data === 'number') {
    return String(data);
  }

  if (typeof data === 'string') {
    if (data.includes('\n') || data.startsWith(' ') || data.endsWith(' ')) {
      return `|2-\n${pad}  ${data.split('\n').join('\n' + pad + '  ')}`;
    }
    if (
      data.includes(':') ||
      data.includes('#') ||
      data === 'true' ||
      data === 'false' ||
      data === 'null' ||
      /^\d/.test(data) ||
      data === ''
    ) {
      return `"${data.replace(/"/g, '\\"')}"`;
    }
    return data;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return '[]';
    return data
      .map((item) => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          const objStr = toYaml(item, indent + 1);
          const lines = objStr.split('\n');
          lines[0] = pad + '- ' + lines[0].trimStart();
          for (let i = 1; i < lines.length; i++) {
            lines[i] = pad + '  ' + lines[i].trimStart();
          }
          return lines.join('\n');
        }
        return `${pad}- ${toYaml(item, indent + 1)}`;
      })
      .join('\n');
  }

  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    return keys
      .map((key) => {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value) && value.length > 0) {
            return `${pad}${key}:\n${toYaml(value, indent + 1)}`;
          }
          if (!Array.isArray(value) && Object.keys(value as Record<string, unknown>).length > 0) {
            return `${pad}${key}:\n${toYaml(value, indent + 1)}`;
          }
        }
        return `${pad}${key}: ${toYaml(value, indent + 1)}`;
      })
      .join('\n');
  }

  return String(data);
}

export function detectYaml(data: string): boolean {
  const trimmed = data.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('---')) return true;
  if (trimmed.startsWith('<')) return false;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return false;
  if (trimmed.includes(',') && !trimmed.includes('\n')) return false;

  const firstLine = trimmed.split('\n')[0];
  if (/^[\w-]+\s*:/.test(firstLine)) return true;
  if (/^-\s/.test(firstLine)) return true;

  try {
    JSON.parse(trimmed);
    return false;
  } catch {}

  const validYamlPattern = /(:\s|^\s*-\s|:\s*$)/m;
  return validYamlPattern.test(trimmed);
}
