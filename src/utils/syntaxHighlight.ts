import type { DataFormat } from '../types';

export function highlightSyntax(code: string, format: DataFormat): string {
  let escaped = escapeHtml(code);

  switch (format) {
    case 'json':
      return highlightJson(escaped);
    case 'xml':
      return highlightXml(escaped);
    case 'yaml':
      return highlightYaml(escaped);
    case 'csv':
      return highlightCsv(escaped);
    default:
      return escaped;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightJson(code: string): string {
  const regex = /"([^"\\]*(\\.[^"\\]*)*)"(\s*:)?|\b(true|false|null)\b|-?\d+\.?\d*([eE][+-]?\d+)?/g;
  return code.replace(regex, (match) => {
    if (match.startsWith('"')) {
      if (match.endsWith('":') || /"\s*:$/.test(match)) {
        return `<span class="tok-key">${match}</span>`;
      }
      return `<span class="tok-str">${match}</span>`;
    }
    if (match === 'true' || match === 'false' || match === 'null') {
      return `<span class="tok-bool">${match}</span>`;
    }
    return `<span class="tok-num">${match}</span>`;
  });
}

function highlightXml(code: string): string {
  code = code.replace(/(&lt;\?xml[^?]*\?&gt;)/g, '<span class="tok-decl">$1</span>');
  code = code.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="tok-tag">$2</span>');
  code = code.replace(/(\s)([\w-]+)(=)(&quot;[^&]*&quot;)/g, '$1<span class="tok-attr">$2</span>$3<span class="tok-str">$4</span>');
  code = code.replace(/(&gt;)/g, '<span class="tok-tag">$1</span>');
  return code;
}

function highlightYaml(code: string): string {
  const lines = code.split('\n');
  const result = lines.map((line) => {
    if (line.trim().startsWith('#')) {
      return `<span class="tok-comment">${line}</span>`;
    }
    {
      const match = line.match(/^(\s*)([\w-]+)(\s*:\s*)(.*)$/);
      if (match) {
        const [, indent, key, colon, value] = match;
        let valSpan = value;
        if (/^(true|false)$/i.test(value.trim())) {
          valSpan = `<span class="tok-bool">${value}</span>`;
        } else if (/^-?\d+\.?\d*$/.test(value.trim())) {
          valSpan = `<span class="tok-num">${value}</span>`;
        } else if (value.trim().startsWith('"') || value.trim().startsWith("'")) {
          valSpan = `<span class="tok-str">${value}</span>`;
        } else if (value.trim() === 'null' || value.trim() === '~') {
          valSpan = `<span class="tok-bool">${value}</span>`;
        }
        return `${indent}<span class="tok-key">${key}</span>${colon}${valSpan}`;
      }
    }
    return line;
  });
  return result.join('\n');
}

function highlightCsv(code: string): string {
  const lines = code.split('\n');
  const result = lines.map((line, index) => {
    if (index === 0) {
      return line.replace(/([^,]+)/g, '<span class="tok-key">$&</span>');
    }
    return line;
  });
  return result.join('\n');
}
