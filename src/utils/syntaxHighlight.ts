import type { DataFormat } from '../types';

const LEVEL_COLORS = [
  { key: '#c0392b', str: '#27ae60', bracket: '#e74c3c' },
  { key: '#8e44ad', str: '#2ecc71', bracket: '#9b59b6' },
  { key: '#2980b9', str: '#1abc9c', bracket: '#3498db' },
  { key: '#d35400', str: '#f39c12', bracket: '#e67e22' },
  { key: '#16a085', str: '#27ae60', bracket: '#1abc9c' },
  { key: '#c0392b', str: '#27ae60', bracket: '#e74c3c' },
];

export function highlightSyntax(code: string, format: DataFormat): string {
  switch (format) {
    case 'json':
      return highlightJson(code);
    case 'xml':
      return highlightXml(code);
    case 'yaml':
      return highlightYaml(code);
    case 'csv':
      return highlightCsv(code);
    default:
      return escapeHtml(code);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightJson(code: string): string {
  let depth = 0;
  let result = '';
  let i = 0;

  while (i < code.length) {
    const ch = code[i];
    const level = depth % LEVEL_COLORS.length;
    const colors = LEVEL_COLORS[level];

    if (ch === '{' || ch === '[') {
      const escaped = escapeHtml(ch);
      result += `<span class="tok-bracket tok-depth-${depth % 6}" style="color:${colors.bracket};font-weight:bold">${escaped}</span>`;
      depth++;
      i++;
    } else if (ch === '}' || ch === ']') {
      depth = Math.max(0, depth - 1);
      const prevLevel = depth % LEVEL_COLORS.length;
      const prevColors = LEVEL_COLORS[prevLevel];
      const escaped = escapeHtml(ch);
      result += `<span class="tok-bracket tok-depth-${depth % 6}" style="color:${prevColors.bracket};font-weight:bold">${escaped}</span>`;
      i++;
    } else if (ch === '"') {
      let str = '"';
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          str += code[i] + (code[i + 1] || '');
          i += 2;
        } else if (code[i] === '"') {
          str += '"';
          i++;
          break;
        } else {
          str += code[i];
          i++;
        }
      }

      const afterStr = code.slice(i).replace(/^\s*/, '');
      const isKey = afterStr.startsWith(':');

      const escapedStr = escapeHtml(str);
      if (isKey) {
        result += `<span class="tok-key tok-depth-${depth % 6}" style="color:${colors.key}">${escapedStr}</span>`;
      } else {
        result += `<span class="tok-str tok-depth-${depth % 6}" style="color:${colors.str}">${escapedStr}</span>`;
      }
    } else if (ch === ':' || ch === ',') {
      result += `<span class="tok-punct">${escapeHtml(ch)}</span>`;
      i++;
    } else if (/\s/.test(ch)) {
      result += ch;
      i++;
    } else if (ch === 't') {
      if (code.slice(i, i + 4) === 'true') {
        result += `<span class="tok-bool">true</span>`;
        i += 4;
      } else {
        result += escapeHtml(ch);
        i++;
      }
    } else if (ch === 'f') {
      if (code.slice(i, i + 5) === 'false') {
        result += `<span class="tok-bool">false</span>`;
        i += 5;
      } else {
        result += escapeHtml(ch);
        i++;
      }
    } else if (ch === 'n') {
      if (code.slice(i, i + 4) === 'null') {
        result += `<span class="tok-bool">null</span>`;
        i += 4;
      } else {
        result += escapeHtml(ch);
        i++;
      }
    } else if (ch === '-' || (ch >= '0' && ch <= '9')) {
      let num = '';
      while (i < code.length && /[0-9eE.+\-]/.test(code[i])) {
        num += code[i];
        i++;
      }
      result += `<span class="tok-num">${escapeHtml(num)}</span>`;
    } else {
      result += escapeHtml(ch);
      i++;
    }
  }

  return result;
}

const XML_TAG_COLORS = [
  '#c0392b',
  '#8e44ad',
  '#2980b9',
  '#d35400',
  '#16a085',
  '#7d3c98',
];

function highlightXml(code: string): string {
  const escaped = escapeHtml(code);
  const tagCounter: Record<string, number> = {};
  let colorIdx = 0;

  function getTagColor(tagName: string): string {
    if (!(tagName in tagCounter)) {
      tagCounter[tagName] = colorIdx;
      colorIdx = (colorIdx + 1) % XML_TAG_COLORS.length;
    }
    return XML_TAG_COLORS[tagCounter[tagName]];
  }

  const result = escaped.replace(
    /(&lt;\/?)([\w:-]+)((?:\s+[\w:-]+=(?:&quot;[^&]*?&quot;|&#39;[^&]*?&#39;))*\s*\/?&gt;)/g,
    (_match, open, tagName, rest) => {
      const color = getTagColor(tagName);
      const isClose = open.includes('/');
      const cls = isClose ? 'tok-tag-close' : 'tok-tag-open';
      const tagPart = `<span class="tok-xml-tag ${cls}" style="color:${color};font-weight:600" data-tag="${tagName}">${open}<span class="tok-tagname" data-tag="${tagName}">${tagName}</span></span>`;

      const attrRegex = /([\w:-]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g;
      const restHighlighted = rest.replace(attrRegex, (_m: string, attr: string, eq: string, val: string) => {
        return `<span class="tok-attr">${attr}</span>${eq}<span class="tok-str">${val}</span>`;
      });

      const closingBracket = restHighlighted.match(/(\/?&gt;)$/);
      const attrPart = restHighlighted.replace(/(\/?&gt;)$/, '');
      const bracketPart = closingBracket
        ? `<span class="tok-xml-bracket" style="color:${color};font-weight:600">${closingBracket[1]}</span>`
        : '';

      return tagPart + attrPart + bracketPart;
    }
  );

  const withDecl = result.replace(
    /(&lt;\?xml[^?]*\?&gt;)/g,
    '<span class="tok-decl">$1</span>'
  );

  const withComments = withDecl.replace(
    /(&lt;!--[\s\S]*?--&gt;)/g,
    '<span class="tok-comment">$1</span>'
  );

  return withComments;
}

function highlightYaml(code: string): string {
  const lines = code.split('\n');
  const result = lines.map((line) => {
    if (line.trim().startsWith('#')) {
      return `<span class="tok-comment">${escapeHtml(line)}</span>`;
    }

    const listMatch = line.match(/^(\s*(-\s+))([\w-]+)(\s*:\s*)(.*)$/);
    if (listMatch) {
      const [, indent, dash, key, colon, value] = listMatch;
      return `${escapeHtml(indent)}${dash}<span class="tok-key">${escapeHtml(key)}</span>${colon}${highlightYamlValue(value)}`;
    }

    const match = line.match(/^(\s*)([\w-]+)(\s*:\s*)(.*)$/);
    if (match) {
      const [, indent, key, colon, value] = match;
      return `${escapeHtml(indent)}<span class="tok-key">${escapeHtml(key)}</span>${colon}${highlightYamlValue(value)}`;
    }

    const listItemMatch = line.match(/^(\s*-\s+)(.*)$/);
    if (listItemMatch) {
      const [, indent, value] = listItemMatch;
      return `${escapeHtml(indent)}${highlightYamlValue(value)}`;
    }

    return escapeHtml(line);
  });
  return result.join('\n');
}

function highlightYamlValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (/^(true|false)$/i.test(trimmed)) {
    return value.replace(trimmed, `<span class="tok-bool">${trimmed}</span>`);
  }
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    return value.replace(trimmed, `<span class="tok-num">${trimmed}</span>`);
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return `<span class="tok-str">${escapeHtml(value)}</span>`;
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return `<span class="tok-str">${escapeHtml(value)}</span>`;
  }
  if (trimmed === 'null' || trimmed === '~') {
    return value.replace(trimmed, `<span class="tok-bool">${trimmed}</span>`);
  }
  if (trimmed === '[]' || trimmed === '{}') {
    return `<span class="tok-punct">${escapeHtml(value)}</span>`;
  }

  return escapeHtml(value);
}

function highlightCsv(code: string): string {
  const lines = code.split('\n');
  const result = lines.map((line, index) => {
    const escaped = escapeHtml(line);
    if (index === 0) {
      return escaped.replace(
        /([^,]+)/g,
        '<span class="tok-key">$1</span>'
      );
    }
    return escaped;
  });
  return result.join('\n');
}
