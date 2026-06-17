import type { ConversionResult, JsonData } from '../types';

export function xmlToJson(xml: string): ConversionResult {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      return { success: false, error: 'XML 解析失败: 格式错误' };
    }
    const result = xmlNodeToJson(doc.documentElement);
    return { success: true, data: JSON.stringify(result, null, 2) };
  } catch (e) {
    return { success: false, error: `XML 解析失败: ${(e as Error).message}` };
  }
}

function xmlNodeToJson(node: Element): JsonData {
  const result: Record<string, unknown> = {};

  if (node.attributes.length > 0) {
    const attrs: Record<string, string> = {};
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      attrs[attr.nodeName] = attr.nodeValue || '';
    }
    result['@attributes'] = attrs;
  }

  const children = Array.from(node.children);
  if (children.length > 0) {
    const childMap: Record<string, unknown[]> = {};
    children.forEach((child) => {
      const name = child.nodeName;
      if (!childMap[name]) {
        childMap[name] = [];
      }
      childMap[name].push(xmlNodeToJson(child));
    });

    Object.keys(childMap).forEach((key) => {
      if (childMap[key].length === 1) {
        result[key] = childMap[key][0];
      } else {
        result[key] = childMap[key];
      }
    });
  } else {
    const text = node.textContent?.trim() || '';
    if (text) {
      if (Object.keys(result).length === 0) {
        return text as unknown as JsonData;
      }
      result['#text'] = text;
    }
  }

  return result;
}

export function jsonToXml(jsonStr: string): ConversionResult {
  try {
    const data = JSON.parse(jsonStr);
    let xmlBody: string;

    if (Array.isArray(data)) {
      xmlBody = data
        .map((item, index) => jsonToXmlNode(item, `item${index + 1}`, 1))
        .join('\n');
      xmlBody = `  <items>\n${xmlBody}\n  </items>`;
    } else if (typeof data === 'object' && data !== null) {
      xmlBody = jsonToXmlNode(data, 'root', 1);
    } else {
      return { success: false, error: 'JSON 数据必须是数组或对象才能转换为 XML' };
    }

    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlBody;
    return { success: true, data: xml };
  } catch (e) {
    return { success: false, error: `JSON 转 XML 失败: ${(e as Error).message}` };
  }
}

function jsonToXmlNode(data: unknown, tagName: string, indent: number): string {
  const pad = '  '.repeat(indent);

  if (data === null || data === undefined) {
    return `${pad}<${tagName}/>`;
  }

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data
        .map((item, index) => jsonToXmlNode(item, tagName, indent))
        .join('\n');
    }

    const obj = data as Record<string, unknown>;
    let attrs = '';
    const children: string[] = [];
    let textContent = '';

    Object.keys(obj).forEach((key) => {
      if (key === '@attributes' && typeof obj[key] === 'object') {
        const attrObj = obj[key] as Record<string, string>;
        attrs = Object.keys(attrObj)
          .map((k) => ` ${k}="${escapeXml(attrObj[k])}"`)
          .join('');
      } else if (key === '#text') {
        textContent = String(obj[key]);
      } else {
        children.push(jsonToXmlNode(obj[key], key, indent + 1));
      }
    });

    if (children.length === 0 && textContent) {
      return `${pad}<${tagName}${attrs}>${escapeXml(textContent)}</${tagName}>`;
    }

    if (children.length === 0 && !textContent) {
      return `${pad}<${tagName}${attrs}/>`;
    }

    const opening = `${pad}<${tagName}${attrs}>`;
    const closing = `${pad}</${tagName}>`;
    const content =
      children.length > 0
        ? '\n' + children.join('\n') + '\n' + pad
        : escapeXml(textContent);
    return opening + content + closing;
  }

  return `${pad}<${tagName}>${escapeXml(String(data))}</${tagName}>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function detectXml(data: string): boolean {
  const trimmed = data.trim();
  return (
    trimmed.startsWith('<') &&
    (trimmed.startsWith('<?xml') || /^<\w/.test(trimmed))
  );
}

export function formatXml(xml: string): ConversionResult {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      return { success: false, error: 'XML 格式化失败: 格式错误' };
    }
    const result = formatXmlNode(doc.documentElement, 0);
    const declaration = xml.startsWith('<?xml')
      ? xml.match(/<\?xml[^?]*\?>/)?.[0] + '\n'
      : '';
    return { success: true, data: (declaration || '') + result };
  } catch (e) {
    return { success: false, error: `XML 格式化失败: ${(e as Error).message}` };
  }
}

function formatXmlNode(node: Element, indent: number): string {
  const pad = '  '.repeat(indent);
  const tagName = node.nodeName;

  let attrs = '';
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    attrs += ` ${attr.nodeName}="${attr.nodeValue || ''}"`;
  }

  const children = Array.from(node.children);
  const text = node.textContent?.trim() || '';

  if (children.length === 0) {
    if (text) {
      return `${pad}<${tagName}${attrs}>${text}</${tagName}>`;
    }
    return `${pad}<${tagName}${attrs}/>`;
  }

  const childXml = children
    .map((child) => formatXmlNode(child, indent + 1))
    .join('\n');
  return `${pad}<${tagName}${attrs}>\n${childXml}\n${pad}</${tagName}>`;
}
