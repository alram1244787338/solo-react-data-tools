import { convertData } from '../converters/index';
import type { DataFormat } from '../types';
import { detectJson, jsonToTable, tableToJson, formatJson, minifyJson } from '../converters/jsonConverter';
import { xmlToJson, jsonToXml, detectXml, formatXml } from '../converters/xmlConverter';
import { yamlToJson, jsonToYaml, detectYaml } from '../converters/yamlConverter';

const NORMAL_JSON = [
  { name: '张三', age: 28, city: '北京' },
  { name: '李四', age: 32, city: '上海' },
];

const NORMAL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <item1>
    <name>张三</name>
    <age>28</age>
    <city>北京</city>
  </item1>
  <item2>
    <name>李四</name>
    <age>32</age>
    <city>上海</city>
  </item2>
</root>`;

const NORMAL_YAML = `- name: 张三
  age: 28
  city: 北京
- name: 李四
  age: 32
  city: 上海`;

describe('JSON 格式处理', () => {
  describe('detectJson', () => {
    it('能 parse 的对象数组是 JSON', () => {
      expect(detectJson(JSON.stringify(NORMAL_JSON))).toBe(true);
    });

    it('空对象是 JSON', () => {
      expect(detectJson('{}')).toBe(true);
      expect(detectJson('[]')).toBe(true);
    });

    it('只有开头的 { 但语法错的不是 JSON', () => {
      expect(detectJson('{"a":1, "b":')).toBe(false);
      expect(detectJson('{a:1}')).toBe(false);
    });

    it('含逗号但不是 JSON 的内容不被误判', () => {
      expect(detectJson('a,b,c\n1,2,3')).toBe(false);
    });
  });

  describe('formatJson / minifyJson', () => {
    it('formatJson 美化输出有缩进', () => {
      const result = formatJson('{"a":1,"b":[1,2]}');
      expect(result.success).toBe(true);
      expect(result.data).toContain('\n');
      expect(result.data).toContain('  ');
    });

    it('minifyJson 压缩输出无空格无换行', () => {
      const result = minifyJson('{  "a":  1 ,\n  "b": 2  }');
      expect(result.success).toBe(true);
      expect(result.data).toBe('{"a":1,"b":2}');
      expect(result.data).not.toContain('\n');
    });

    it('非法 JSON 返回失败', () => {
      const result = formatJson('{invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('jsonToTable / tableToJson', () => {
    it('对象数组转表格正确', () => {
      const result = jsonToTable(JSON.stringify(NORMAL_JSON));
      expect(result.success).toBe(true);
      expect(result.table!.headers).toEqual(['name', 'age', 'city']);
      expect(result.table!.rows).toHaveLength(2);
      expect(result.table!.rows[0][0]).toBe('张三');
    });

    it('表格对象往返还原', () => {
      const table = { headers: ['a', 'b'], rows: [['1', '2'], ['3', '4']] };
      const json = tableToJson(table);
      const arr = JSON.parse(json);
      expect(arr).toEqual([
        { a: '1', b: '2' },
        { a: '3', b: '4' },
      ]);
    });

    it('空对象数组转空表格', () => {
      const result = jsonToTable('[]');
      expect(result.success).toBe(true);
      expect(result.table!.headers).toEqual([]);
      expect(result.table!.rows).toEqual([]);
    });
  });
});

describe('XML 格式处理', () => {
  describe('detectXml', () => {
    it('带 XML 声明的是 XML', () => {
      expect(detectXml(NORMAL_XML)).toBe(true);
    });

    it('不带声明但有标签的是 XML', () => {
      expect(detectXml('<root><a>1</a></root>')).toBe(true);
    });

    it('非法 XML 返回 false', () => {
      expect(detectXml('<root><a></root>')).toBe(false);
    });

    it('非 XML 内容返回 false', () => {
      expect(detectXml('{"a":1}')).toBe(false);
      expect(detectXml('a: 1')).toBe(false);
    });
  });

  describe('xmlToJson', () => {
    it('正常数据转换成功', () => {
      const result = xmlToJson(NORMAL_XML);
      expect(result.success).toBe(true);
      const data = JSON.parse(result.data!);
      expect(data.item1).toBeDefined();
      expect(data.item1.name).toBe('张三');
    });

    it('空对象元素返回 null', () => {
      const xml = `<root><empty/><other>text</other></root>`;
      const result = xmlToJson(xml);
      expect(result.success).toBe(true);
      const data = JSON.parse(result.data!);
      expect(data.empty).toBeNull();
      expect(data.other).toBe('text');
    });

    it('自闭合带属性的元素保留属性', () => {
      const xml = `<root><img src="a.png" width="100"/></root>`;
      const result = xmlToJson(xml);
      expect(result.success).toBe(true);
      const data = JSON.parse(result.data!);
      expect(data.img['@attributes'].src).toBe('a.png');
      expect(data.img['@attributes'].width).toBe('100');
    });

    it('特殊字符正确转义', () => {
      const xml = `<root><content>A &amp; B &lt; C</content></root>`;
      const result = xmlToJson(xml);
      expect(result.success).toBe(true);
      const data = JSON.parse(result.data!);
      expect(data.content).toContain('&');
      expect(data.content).toContain('<');
    });

    it('多个同名子元素归并为数组', () => {
      const xml = `<root><item>A</item><item>B</item><item>C</item></root>`;
      const result = xmlToJson(xml);
      expect(result.success).toBe(true);
      const data = JSON.parse(result.data!);
      expect(Array.isArray(data.item)).toBe(true);
      expect(data.item).toEqual(['A', 'B', 'C']);
    });
  });

  describe('jsonToXml', () => {
    it('对象数组转 XML 用 items 包裹', () => {
      const result = jsonToXml(JSON.stringify(NORMAL_JSON));
      expect(result.success).toBe(true);
      expect(result.data).toContain('<items>');
      expect(result.data).toContain('</items>');
      expect(result.data).toContain('<item1>');
      expect(result.data).toContain('<name>张三</name>');
    });

    it('空值输出自闭合标签', () => {
      const result = jsonToXml(JSON.stringify({ a: null, b: 'text' }));
      expect(result.success).toBe(true);
      expect(result.data).toContain('<a/>');
      expect(result.data).toContain('<b>text</b>');
    });

    it('@attributes 输出为标签属性', () => {
      const obj = { img: { '@attributes': { src: 'a.png' } } };
      const result = jsonToXml(JSON.stringify(obj));
      expect(result.success).toBe(true);
      expect(result.data).toContain('<img src="a.png"/>');
    });

    it('特殊字符正确转义', () => {
      const result = jsonToXml(JSON.stringify({ content: 'A & B < "C"' }));
      expect(result.success).toBe(true);
      expect(result.data).toContain('A &amp; B &lt; &quot;C&quot;');
    });
  });

  describe('formatXml', () => {
    it('美化输出带缩进', () => {
      const result = formatXml('<root><a><b>1</b></a></root>');
      expect(result.success).toBe(true);
      expect(result.data).toContain('\n');
      expect(result.data).toContain('  ');
    });

    it('空元素输出自闭合', () => {
      const result = formatXml('<root><a></a></root>');
      expect(result.success).toBe(true);
      expect(result.data).toContain('<a/>');
    });
  });
});

describe('YAML 格式处理', () => {
  describe('detectYaml', () => {
    it('YAML key: value 格式正确识别', () => {
      expect(detectYaml(NORMAL_YAML)).toBe(true);
    });

    it('开头 --- 正确识别', () => {
      expect(detectYaml('---\nname: 张三')).toBe(true);
    });

    it('不是 YAML 的不被误判', () => {
      expect(detectYaml('{"a":1}')).toBe(false);
      expect(detectYaml('<a>1</a>')).toBe(false);
      expect(detectYaml('a,b,c\n1,2,3')).toBe(false);
    });
  });

  describe('yamlToJson', () => {
    it('正常数组转 JSON 数组', () => {
      const result = yamlToJson(NORMAL_YAML);
      expect(result.success).toBe(true);
      const data = JSON.parse(result.data!);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe('张三');
      expect(data[0].age).toBe(28);
    });

    it('空值解析为 null', () => {
      const result = yamlToJson(`a: null
b: ~
c:`);
      expect(result.success).toBe(true);
      const data = JSON.parse(result.data!);
      expect(data.a).toBeNull();
      expect(data.b).toBeNull();
      expect(data.c).toBeNull();
    });

    it('嵌套对象正确解析', () => {
      const yaml = `user:
  name: 张三
  profile:
    age: 28
    city: 北京`;
      const result = yamlToJson(yaml);
      expect(result.success).toBe(true);
      const data = JSON.parse(result.data!);
      expect(data.user.profile.age).toBe(28);
      expect(data.user.profile.city).toBe('北京');
    });

    it('布尔值和数字解析正确', () => {
      const yaml = `active: true
count: 42
price: 3.14`;
      const result = yamlToJson(yaml);
      expect(result.success).toBe(true);
      const data = JSON.parse(result.data!);
      expect(data.active).toBe(true);
      expect(data.count).toBe(42);
      expect(data.price).toBe(3.14);
    });

    it('空对象', () => {
      const result = yamlToJson('');
      expect(result.success).toBe(true);
      expect(JSON.parse(result.data!)).toBeNull();
    });
  });

  describe('jsonToYaml', () => {
    it('对象数组输出 YAML 列表', () => {
      const result = jsonToYaml(JSON.stringify(NORMAL_JSON));
      expect(result.success).toBe(true);
      expect(result.data).toContain('- name: 张三');
      expect(result.data).toContain('  age: 28');
    });

    it('空值输出 null', () => {
      const result = jsonToYaml(JSON.stringify({ a: null, b: '' }));
      expect(result.success).toBe(true);
      expect(result.data).toContain('a: null');
    });

    it('深层嵌套有正确缩进', () => {
      const obj = { a: { b: { c: { d: 1 } } } };
      const result = jsonToYaml(JSON.stringify(obj));
      expect(result.success).toBe(true);
      expect(result.data).toContain('    c:');
      expect(result.data).toContain('      d: 1');
    });

    it('特殊字符加引号包裹', () => {
      const result = jsonToYaml(JSON.stringify({ key: '带: 冒号和#号' }));
      expect(result.success).toBe(true);
      expect(result.data).toContain('"带: 冒号和#号"');
    });
  });
});

describe('四种格式双向互转（12 条路径）', () => {
  const paths: Array<[string, string, string]> = [];
  const formats = ['json', 'csv', 'xml', 'yaml'] as const;
  for (const src of formats) {
    for (const tgt of formats) {
      if (src !== tgt) paths.push([src, tgt, JSON.stringify(NORMAL_JSON)]);
    }
  }

  test.each(paths)('%s → %s 转换成功', (srcRaw, tgtRaw, input) => {
    const src = srcRaw as DataFormat;
    const tgt = tgtRaw as DataFormat;
    // 对于非 JSON 的源，先把测试数据转成源格式
    let sourceData = input;
    if (src !== 'json') {
      const toSrc = convertData(input, 'json', src);
      expect(toSrc.success).toBe(true);
      sourceData = toSrc.data!;
    }
    const result = convertData(sourceData, src, tgt);
    expect(result.success).toBe(true);
    expect(result.data!.length).toBeGreaterThan(0);
  });

  it('JSON → XML → JSON 往返保持属性', () => {
    const original = JSON.stringify({ img: { '@attributes': { src: 'a.png' } } });
    const toXml = convertData(original, 'json', 'xml');
    expect(toXml.success).toBe(true);
    const back = convertData(toXml.data!, 'xml', 'json');
    expect(back.success).toBe(true);
    const data = JSON.parse(back.data!);
    expect(data.img['@attributes'].src).toBe('a.png');
  });

  it('JSON → YAML → JSON 往返保持嵌套', () => {
    const original = JSON.stringify({ a: { b: { c: [1, 2, 3] } } });
    const toYaml = convertData(original, 'json', 'yaml');
    expect(toYaml.success).toBe(true);
    const back = convertData(toYaml.data!, 'yaml', 'json');
    expect(back.success).toBe(true);
    expect(JSON.parse(back.data!)).toEqual({ a: { b: { c: [1, 2, 3] } } });
  });
});
