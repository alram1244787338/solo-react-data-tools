import type { DataFormat, ConversionResult } from '../types';
import { csvToJson, jsonToCsv, detectCsv } from './csvConverter';
import { detectJson, formatJson } from './jsonConverter';
import { xmlToJson, jsonToXml, detectXml, formatXml } from './xmlConverter';
import { yamlToJson, jsonToYaml, detectYaml } from './yamlConverter';

export function convertData(input: string, sourceFormat: DataFormat, targetFormat: DataFormat): ConversionResult {
  if (sourceFormat === targetFormat) {
    if (sourceFormat === 'json') return formatJson(input);
    if (sourceFormat === 'xml') return formatXml(input);
    return { success: true, data: input };
  }

  let jsonData: string | undefined;

  try {
    switch (sourceFormat) {
      case 'json':
        jsonData = input;
        break;
      case 'csv': {
        const result = csvToJson(input);
        if (!result.success) return result;
        jsonData = result.data;
        break;
      }
      case 'xml': {
        const result = xmlToJson(input);
        if (!result.success) return result;
        jsonData = result.data;
        break;
      }
      case 'yaml': {
        const result = yamlToJson(input);
        if (!result.success) return result;
        jsonData = result.data;
        break;
      }
    }

    if (!jsonData) {
      return { success: false, error: '转换失败' };
    }

    switch (targetFormat) {
      case 'json':
        return formatJson(jsonData);
      case 'csv':
        return jsonToCsv(jsonData);
      case 'xml':
        return jsonToXml(jsonData);
      case 'yaml':
        return jsonToYaml(jsonData);
      default:
        return { success: false, error: `不支持的目标格式: ${targetFormat}` };
    }
  } catch (e) {
    return { success: false, error: `转换失败: ${(e as Error).message}` };
  }
}

export function detectFormat(data: string): DataFormat | null {
  const trimmed = data.trim();
  if (!trimmed) return null;

  if (detectJson(trimmed)) return 'json';
  if (detectXml(trimmed)) return 'xml';
  if (detectYaml(trimmed)) return 'yaml';
  if (detectCsv(trimmed)) return 'csv';

  return null;
}

export function getFileExtensionToFormat(ext: string): DataFormat | null {
  const lower = ext.toLowerCase().replace('.', '');
  switch (lower) {
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    case 'xml':
      return 'xml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      return null;
  }
}

export { csvToJson, jsonToCsv, detectCsv, csvToTable, tableToCsv } from './csvConverter';
export { jsonValidate, jsonToTable, tableToJson, detectJson, formatJson, minifyJson } from './jsonConverter';
export { xmlToJson, jsonToXml, detectXml, formatXml } from './xmlConverter';
export { yamlToJson, jsonToYaml, detectYaml } from './yamlConverter';
