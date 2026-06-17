import { highlightSyntax } from '../utils/syntaxHighlight';

describe('syntaxHighlight - JSON 多层级嵌套颜色交替', () => {
  it('一层嵌套的 key 和 bracket 使用 tok-depth-0', () => {
    const html = highlightSyntax('{"name": "张三"}', 'json');
    expect(html).toContain('tok-depth-0');
    expect(html).toContain('tok-key');
    expect(html).toContain('tok-str');
  });

  it('多层级嵌套 key 的 depth 交替递增', () => {
    const deepJson = JSON.stringify({
      level0: {
        level1: {
          level2: {
            level3: 'deep',
          },
        },
      },
    });
    const html = highlightSyntax(deepJson, 'json');

    expect(html).toContain('tok-depth-0');
    expect(html).toContain('tok-depth-1');
    expect(html).toContain('tok-depth-2');
    expect(html).toContain('tok-depth-3');
  });

  it('超过 6 层后 depth 循环回到 0', () => {
    const veryDeep = '{"a":{"b":{"c":{"d":{"e":{"f":{"g":"deep"}}}}}}';
    const html = highlightSyntax(veryDeep, 'json');
    // depth-0 应该至少出现两次（第 0 层和第 6 层）
    const depth0Matches = html.match(/tok-depth-0/g);
    expect(depth0Matches!.length).toBeGreaterThanOrEqual(2);
  });

  it('数组和对象的 bracket 都带 depth 颜色', () => {
    const json = '[{"a": [1, 2, 3]}, {"b": {"c": 4}}]';
    const html = highlightSyntax(json, 'json');
    expect(html).toContain('tok-bracket');
    expect(html).toContain('tok-depth-0');
    expect(html).toContain('tok-depth-1');
  });

  it('区分 key 字符串和 value 字符串（tok-key vs tok-str）', () => {
    const html = highlightSyntax('{"key": "value"}', 'json');
    const keyMatches = html.match(/tok-key/g);
    const strMatches = html.match(/tok-str/g);
    expect(keyMatches!.length).toBe(1);
    expect(strMatches!.length).toBe(1);
  });

  it('布尔和数字有各自的 token class', () => {
    const html = highlightSyntax(
      '{"active": true, "count": 42, "price": 3.14, "none": null}',
      'json'
    );
    expect(html).toContain('tok-bool');
    expect(html).toContain('tok-num');
    // tok-bool: true + null = 2 个
    expect((html.match(/tok-bool/g) || []).length).toBe(2);
  });

  it('空对象和空数组正确处理，不报错', () => {
    const html1 = highlightSyntax('{}', 'json');
    const html2 = highlightSyntax('[]', 'json');
    expect(html1).toContain('tok-bracket');
    expect(html2).toContain('tok-bracket');
  });

  it('转义字符串正确处理', () => {
    const json = JSON.stringify({ text: 'he say "hello"' });
    const html = highlightSyntax(json, 'json');
    // 引号转义后不应导致语法错误
    expect(html).toContain('tok-str');
  });
});

describe('syntaxHighlight - XML 标签配对高亮', () => {
  it('开标签和闭标签都有 tok-xml-tag class（不含括号）', () => {
    const html = highlightSyntax('<root></root>', 'xml');
    const xmlTags = html.match(/tok-xml-tag/g);
    // 开标签<root + 闭标签</root = 2个 tok-xml-tag（括号是单独的 tok-xml-bracket）
    expect(xmlTags!.length).toBe(2);
  });

  it('同名标签开和闭都有 data-tag 属性，标签名和标签都带', () => {
    const html = highlightSyntax('<user><name>张三</name></user>', 'xml');
    // 开标签<user + user 标签名 + 闭标签</user + user 标签名 = 4 个 data-tag="user"
    const userTags = html.match(/data-tag="user"/g);
    // 同理 name 也是 4 个
    const nameTags = html.match(/data-tag="name"/g);
    expect(userTags!.length).toBe(4);
    expect(nameTags!.length).toBe(4);
  });

  it('不同标签使用不同的颜色，有多种 data-tag', () => {
    const xml = `<?xml version="1.0"?>
<root>
  <user>
    <name>张三</name>
    <age>28</age>
    <email>test@example.com</email>
  </user>
</root>`;
    const html = highlightSyntax(xml, 'xml');
    const tagNames = new Set<string>();
    const regex = /data-tag="([^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      tagNames.add(match[1]);
    }
    expect(tagNames.size).toBeGreaterThanOrEqual(4); // root, user, name, age, email
  });

  it('XML 声明有 tok-decl class', () => {
    const html = highlightSyntax(
      '<?xml version="1.0" encoding="UTF-8"?><root></root>',
      'xml'
    );
    expect(html).toContain('tok-decl');
  });

  it('属性名 tok-attr，属性值 tok-str', () => {
    const html = highlightSyntax('<img src="a.png" width="100"/>', 'xml');
    expect(html).toContain('tok-attr');
    expect(html).toContain('tok-str');
  });

  it('自闭合标签有 tok-xml-tag class 和 data-tag 属性', () => {
    const html = highlightSyntax('<br/>', 'xml');
    expect(html).toContain('tok-xml-tag');
    expect(html).toContain('data-tag="br"');
  });

  it('XML 注释有 tok-comment class', () => {
    const html = highlightSyntax('<root><!-- comment --><a>1</a></root>', 'xml');
    expect(html).toContain('tok-comment');
  });

  it('带命名空间的标签（如 ns:tag）能配对', () => {
    const html = highlightSyntax('<ns:root><ns:child>text</ns:child></ns:root>', 'xml');
    // 开标签 + 标签名 + 闭标签 + 标签名 = 4 个
    const rootMatches = html.match(/data-tag="ns:root"/g);
    const childMatches = html.match(/data-tag="ns:child"/g);
    expect(rootMatches!.length).toBe(4);
    expect(childMatches!.length).toBe(4);
  });
});

describe('syntaxHighlight - 其他格式', () => {
  it('YAML key 有 tok-key class，布尔 tok-bool，数字 tok-num', () => {
    const yaml = `- name: 张三
  active: true
  age: 28`;
    const html = highlightSyntax(yaml, 'yaml');
    expect(html).toContain('tok-key');
    expect(html).toContain('tok-bool');
    expect(html).toContain('tok-num');
  });

  it('YAML 注释有 tok-comment class', () => {
    const html = highlightSyntax('# comment\nname: 张三', 'yaml');
    expect(html).toContain('tok-comment');
  });

  it('CSV 首行有 tok-key class', () => {
    const csv = `name,age,city
张三,28,北京`;
    const html = highlightSyntax(csv, 'csv');
    expect(html).toContain('tok-key');
  });
});
