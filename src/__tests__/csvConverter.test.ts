import { detectCsv, csvToJson, jsonToCsv, csvToTable, tableToCsv } from '../converters/csvConverter';

describe('csvConverter - detectCsv', () => {
  it('空字符串不检测为 CSV', () => {
    expect(detectCsv('')).toBe(false);
    expect(detectCsv('   ')).toBe(false);
  });

  it('只有表头没有数据，不检测为 CSV（要求至少 2 行）', () => {
    expect(detectCsv('name,age,city')).toBe(false);
  });

  it('正常两行列数一致，检测为 CSV', () => {
    expect(
      detectCsv(`name,age,city
张三,28,北京
李四,32,上海`)
    ).toBe(true);
  });

  it('只有单列数据，不检测为 CSV（要求至少 2 列）', () => {
    expect(
      detectCsv(`name
张三
李四`)
    ).toBe(false);
  });

  it('含引号内逗号，能正确解析行列数', () => {
    const csv = `name,address,age
"张三,别名小张","北京市,朝阳区",28
"李四","上海市,浦东新区",32`;
    expect(detectCsv(csv)).toBe(true);
  });

  it('引号内换行，能正确解析行列数', () => {
    const csv = `name,note,age
张三,"第一行
第二行
第三行",28
李四,普通备注,32`;
    expect(detectCsv(csv)).toBe(true);
  });

  it('行列数不一致，不检测为 CSV', () => {
    expect(
      detectCsv(`name,age,city
张三,28,北京
李四,32`)
    ).toBe(false);
  });

  it('开头是 { 或 [ 的内容，不检测为 CSV', () => {
    expect(detectCsv('{"a":1, "b":2}')).toBe(false);
    expect(detectCsv('[1,2,3]')).toBe(false);
  });

  it('开头是 < 的内容，不检测为 CSV', () => {
    expect(detectCsv('<root><a>1</a><b>2</b></root>')).toBe(false);
  });

  it('首行是 YAML 格式 key: value，不检测为 CSV', () => {
    expect(
      detectCsv(`name: 张三
age: 28
city: 北京`)
    ).toBe(false);
  });

  it('含多余空格的行，列数不一致会被识别为非 CSV', () => {
    expect(
      detectCsv(`name,age,city
张三,28,北京
李四,32`)
    ).toBe(false);
  });

  it('大量行（超过 10 行）都一致，检测为 CSV', () => {
    const lines = ['name,age'];
    for (let i = 0; i < 20; i++) lines.push(`user${i},${i}`);
    expect(detectCsv(lines.join('\n'))).toBe(true);
  });

  it('中间有空行（过滤掉后行列数仍一致）检测为 CSV', () => {
    expect(
      detectCsv(`name,age,city
张三,28,北京

李四,32,上海

王五,25,广州`)
    ).toBe(true);
  });
});

describe('csvConverter - csvToJson', () => {
  it('正常数据转换为对象数组', () => {
    const result = csvToJson(`name,age,city
张三,28,北京
李四,32,上海`);
    expect(result.success).toBe(true);
    const data = JSON.parse(result.data!);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ name: '张三', age: '28', city: '北京' });
  });

  it('带前导零的数字保持字符串类型', () => {
    const result = csvToJson(`id,name
00123,张三
000456,李四`);
    expect(result.success).toBe(true);
    const data = JSON.parse(result.data!);
    expect(data[0].id).toBe('00123');
    expect(data[1].id).toBe('000456');
    expect(typeof data[0].id).toBe('string');
  });

  it('引号内逗号正确解析', () => {
    const result = csvToJson(`name,address
"张,三","北京,朝阳"
李四,上海浦东`);
    expect(result.success).toBe(true);
    const data = JSON.parse(result.data!);
    expect(data[0].name).toBe('张,三');
    expect(data[0].address).toBe('北京,朝阳');
  });

  it('双引号转义正确解析', () => {
    const result = csvToJson(`name,note
张三,"他说""你好"""`);
    expect(result.success).toBe(true);
    const data = JSON.parse(result.data!);
    expect(data[0].note).toBe('他说"你好"');
  });

  it('空 CSV 返回空数组', () => {
    expect(csvToJson('')).toEqual({ success: true, data: '[]' });
  });

  it('布尔值保持字符串（不自动转类型）', () => {
    const result = csvToJson(`flag,label
true,已激活
false,未激活
null,空值`);
    expect(result.success).toBe(true);
    const data = JSON.parse(result.data!);
    expect(data[0].flag).toBe('true');
    expect(data[1].flag).toBe('false');
    expect(data[2].flag).toBe('null');
  });
});

describe('csvConverter - jsonToCsv', () => {
  it('扁平对象数组转 CSV', () => {
    const json = JSON.stringify([
      { name: '张三', age: 28, city: '北京' },
      { name: '李四', age: 32, city: '上海' },
    ]);
    const result = jsonToCsv(json);
    expect(result.success).toBe(true);
    const lines = result.data!.split('\n');
    expect(lines[0]).toBe('name,age,city');
    expect(lines[1]).toContain('张三');
    expect(lines[1]).toContain('28');
    expect(lines[2]).toContain('李四');
  });

  it('含逗号的数据被自动引号包裹', () => {
    const json = JSON.stringify([{ name: '张,三', address: '北京,朝阳' }]);
    const result = jsonToCsv(json);
    expect(result.success).toBe(true);
    expect(result.data).toContain('"张,三"');
    expect(result.data).toContain('"北京,朝阳"');
  });

  it('空数组返回空字符串', () => {
    expect(jsonToCsv('[]')).toEqual({ success: true, data: '' });
  });

  it('嵌套对象被展平为点号路径', () => {
    const json = JSON.stringify([
      { user: { name: '张三', profile: { age: 28 } }, city: '北京' },
    ]);
    const result = jsonToCsv(json);
    expect(result.success).toBe(true);
    const header = result.data!.split('\n')[0];
    expect(header).toContain('user.name');
    expect(header).toContain('user.profile.age');
  });
});

describe('csvConverter - 表格转换往返', () => {
  it('csvToTable + tableToCsv 往返一致', () => {
    const csv = `name,age,city
张三,28,北京
李四,32,上海`;
    const table = csvToTable(csv);
    expect(table.headers).toEqual(['name', 'age', 'city']);
    expect(table.rows).toHaveLength(2);
    const back = tableToCsv(table);
    expect(back).toBe(csv);
  });
});
