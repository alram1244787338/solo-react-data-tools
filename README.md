# Data Converter — 数据格式转换工具

基于 React + TypeScript + Webpack 的数据格式转换工具，支持 CSV、JSON、XML、YAML 四种格式之间的双向互转。

## 功能概览

| 功能 | 说明 |
|------|------|
| 格式互转 | CSV ↔ JSON ↔ XML ↔ YAML，12 条转换路径全覆盖 |
| 自动检测 | 粘贴文本时自动识别源格式，拖拽文件时按扩展名识别 |
| 语法高亮 | JSON 按嵌套层级着色，XML 标签同名配对同色 |
| 表格视图 | CSV / JSON 数组数据可切换为可编辑表格，支持增删行列、修改单元格 |
| 文件操作 | 输入支持拖拽导入和粘贴文本，输出支持一键复制和下载文件 |
| 历史记录 | 侧边栏保存转换历史，可回看完整输入/输出，一键恢复到编辑器 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm start

# 生产构建
npm run build

# TypeScript 类型检查
npm run type-check

# 运行测试
npm test

# 测试监听模式
npm run test:watch
```

## 目录结构

```
├── public/
│   └── index.html                  # HTML 入口模板
├── src/
│   ├── index.tsx                    # 应用入口，挂载 React 根组件
│   ├── App.tsx                      # 主应用组件，状态管理与转换流程编排
│   │
│   ├── types/
│   │   └── index.ts                 # 全局类型定义（DataFormat, ConversionResult, TableData 等）
│   │
│   ├── converters/                  # 数据转换核心模块
│   │   ├── index.ts                 # 统一转换入口：convertData() + detectFormat()
│   │   ├── csvConverter.ts          # CSV 解析/生成、检测、表格互转
│   │   ├── jsonConverter.ts         # JSON 验证/格式化/压缩、表格互转、检测
│   │   ├── xmlConverter.ts          # XML ↔ JSON 转换、自闭合标签处理、检测
│   │   └── yamlConverter.ts         # YAML ↔ JSON 转换（纯手工解析，零依赖）、检测
│   │
│   ├── components/                  # React UI 组件
│   │   ├── FormatSelector.tsx       # 格式选择器（源格式/目标格式按钮组）
│   │   ├── Toolbar.tsx              # 工具栏（转换、交换、清空、复制、下载、表格视图、历史）
│   │   ├── InputPanel.tsx           # 左侧输入面板（文本编辑、拖拽导入、文件导入）
│   │   ├── OutputPanel.tsx          # 右侧输出面板（语法高亮显示、字符计数）
│   │   ├── TableView.tsx            # 表格视图（可编辑单元格、增删行列、修改表头）
│   │   └── HistorySidebar.tsx       # 历史记录侧边栏（列表态 + 详情回看态）
│   │
│   ├── hooks/
│   │   └── useConversionHistory.ts  # 转换历史管理 Hook（localStorage 持久化，最多 50 条）
│   │
│   ├── utils/
│   │   ├── helpers.ts               # 通用工具（ID 生成、剪贴板复制、文件下载、MIME 映射）
│   │   └── syntaxHighlight.ts       # 语法高亮引擎（JSON 层级着色、XML 标签配对、YAML/CSV 着色）
│   │
│   ├── styles/
│   │   └── global.css               # 全局样式（布局、组件、高亮 token、响应式）
│   │
│   └── __tests__/                   # 测试文件
│       ├── csvConverter.test.ts      # CSV 检测与转换测试
│       ├── formatConverters.test.ts  # JSON/XML/YAML 互转 + 12 路径全覆盖测试
│       └── syntaxHighlight.test.ts   # 语法高亮测试
│
├── jest.config.js                   # Jest 配置（ts-jest + jsdom 环境）
├── tsconfig.json                    # TypeScript 配置（strict 模式、路径别名 @/）
├── webpack.config.js                # Webpack 配置（ts-loader + 类型检查插件 + source map）
└── package.json
```

## 转换器详细说明

所有转换以 JSON 为中间格式，走「源格式 → JSON → 目标格式」的两步流程。同格式转换时 JSON 做格式化美化，XML 做缩进格式化，CSV/YAML 原样返回。

### CSV 转换器 (`csvConverter.ts`)

| 方向 | 函数 | 说明 |
|------|------|------|
| CSV → JSON | `csvToJson()` | 首行作为表头，后续行映射为对象数组。所有值保持字符串类型，不自动推断数字/布尔 |
| JSON → CSV | `jsonToCsv()` | 支持：扁平对象数组、嵌套对象展平为 `parent.child` 点号路径、`@attributes`/`#text` 清理、单对象包装为数组 |
| CSV → TableData | `csvToTable()` | 解析为 `{ headers, rows }` 结构供表格视图使用 |
| TableData → CSV | `tableToCsv()` | 表格数据还原为 CSV 字符串 |

**CSV 解析特性：**
- 支持引号内逗号（`"a,b"` 整体作为一个字段）
- 支持引号内换行
- 支持双引号转义（`""` 表示一个 `"`）
- 值保持原始字符串，前导零等特殊格式不丢失

### JSON 转换器 (`jsonConverter.ts`)

| 方向 | 函数 | 说明 |
|------|------|------|
| 格式验证 | `jsonValidate()` | 解析并格式化 JSON，失败返回错误信息 |
| 格式化 | `formatJson()` | 美化输出（2 空格缩进） |
| 压缩 | `minifyJson()` | 去除所有空白，输出单行 |
| JSON → TableData | `jsonToTable()` | 对象数组转为 `{ headers, rows }` |
| TableData → JSON | `tableToJson()` | 表格数据还原为对象数组 JSON |

### XML 转换器 (`xmlConverter.ts`)

| 方向 | 函数 | 说明 |
|------|------|------|
| XML → JSON | `xmlToJson()` | 使用浏览器 DOMParser 解析。属性存入 `@attributes`，混合内容存入 `#children` |
| JSON → XML | `jsonToXml()` | `@attributes` 渲染为标签属性，`null`/`undefined` 渲染为自闭合标签，数组用 `<items>` 包裹 |
| 格式化 | `formatXml()` | 缩进美化 XML，空元素输出自闭合标签 |

**XML 特殊处理：**
- 自闭合空标签（如 `<empty/>`）转 JSON 为 `null`
- 带属性的自闭合标签（如 `<img src="a.png"/>`）保留 `@attributes` 对象
- 多个同名子元素自动归并为数组
- 混合内容（元素内同时有文本和子元素）用 `#children` 数组保持顺序
- 特殊字符（`& < > " '`）正确转义

### YAML 转换器 (`yamlConverter.ts`)

| 方向 | 函数 | 说明 |
|------|------|------|
| YAML → JSON | `yamlToJson()` | 纯手工递归下降解析器，零外部依赖 |
| JSON → YAML | `jsonToYaml()` | 缩进输出，自动处理特殊字符加引号、多行文本用 `|` 块标量 |

**YAML 解析特性：**
- 支持对象（`key: value`）、数组（`- item`）、嵌套
- 支持布尔值（`true`/`false`）、null（`null`/`~`/空值）、数字、引号字符串
- 支持注释行（`#` 开头）

## 格式自动检测规则

当用户粘贴文本或导入文件时，系统按以下优先级和规则自动检测数据格式：

```
检测优先级：JSON > XML > YAML > CSV
```

### JSON 检测 (`detectJson`)

1. 首字符必须是 `{` 或 `[`
2. 对整个文本执行 `JSON.parse()`，成功才认定为 JSON
3. 任何语法错误立即排除

### XML 检测 (`detectXml`)

1. 首字符必须是 `<`
2. 使用 `DOMParser` 实际解析，无 `parsererror` 才认定为 XML
3. 无 XML 声明时自动包裹 `<root>` 再验证

### YAML 检测 (`detectYaml`)

1. 排除以 `<`、`{`、`[` 开头的内容
2. 排除无换行且含逗号的内容（可能是 CSV）
3. 首行匹配 `key: value` 模式（`/^[\w-]+\s*:/`）
4. 首行以 `- ` 开头（数组格式）
5. 以 `---` 开头
6. 排除能被 `JSON.parse` 成功的内容

### CSV 检测 (`detectCsv`)

1. 排除以 `{`、`[`、`<` 开头的内容
2. 排除首行匹配 YAML `key: value` 模式的内容
3. 必须至少 2 行数据
4. 每行至少 2 列
5. 前 10 行的列数必须一致（逐行校验）

### 文件扩展名映射

| 扩展名 | 格式 |
|--------|------|
| `.json` | JSON |
| `.csv` | CSV |
| `.xml` | XML |
| `.yaml` / `.yml` | YAML |

拖拽文件导入时优先按扩展名判断，扩展名无法识别时回退到内容检测。

## 测试

### 运行方式

```bash
# 运行全部测试
npm test

# 监听模式（文件变动自动重跑）
npm run test:watch
```

### 测试覆盖

共 **3 个测试套件，94 个用例**。

#### `csvConverter.test.ts` — CSV 检测与转换（30 个用例）

| 模块 | 场景 |
|------|------|
| `detectCsv` 边界 | 空字符串、只有表头（< 2 行不通过）、单列（< 2 列不通过）、正常多行多列、引号内逗号、引号内换行、行列数不一致、JSON/XML/YAML 开头拦截、多余空行列数不一致、大量行（>10）一致性验证、空行穿透 |
| `csvToJson` | 正常对象数组、前导零保持字符串、引号内逗号解析、双引号转义、空 CSV、布尔/null 保持字符串 |
| `jsonToCsv` | 扁平数组、含逗号加引号、空数组、嵌套对象展平点号路径 |
| 表格往返 | `csvToTable` + `tableToCsv` 往返一致性 |

#### `formatConverters.test.ts` — JSON/XML/YAML 互转（~50 个用例）

| 模块 | 场景 |
|------|------|
| JSON detect | 合法/非法 JSON、空对象、有开头但语法错、含逗号非 JSON |
| JSON 格式化 | formatJson 缩进输出、minifyJson 压缩、非法 JSON 返回失败 |
| JSON 表格 | jsonToTable 对象数组、tableToJson 往返、空数组 |
| XML detect | 带声明/不带声明、非法 XML、非 XML 内容 |
| xmlToJson | 正常转换、空元素返回 null、自闭合带属性、特殊字符转义、同名子元素数组归并 |
| jsonToXml | 数组 items 包裹、空值自闭合、@attributes 渲染属性、特殊字符转义 |
| formatXml | 缩进美化、空元素自闭合 |
| YAML detect | key: value 格式、`---` 开头、非 YAML 拦截 |
| yamlToJson | 数组、空值（null/~）、嵌套对象、布尔/数字、空输入 |
| jsonToYaml | 列表输出、空值输出 null、深层缩进、特殊字符加引号 |
| 12 条互转路径 | `test.each` 遍历所有格式对（JSON→CSV、JSON→XML、CSV→JSON...） |
| 往返一致性 | JSON→XML→JSON 属性保持、JSON→YAML→JSON 嵌套保持 |

#### `syntaxHighlight.test.ts` — 语法高亮（14 个用例）

| 模块 | 场景 |
|------|------|
| JSON 层级 | tok-depth-0 存在、多层 depth 递增、超 6 层回绕、bracket 带 depth、key vs str 区分、bool/num 计数、空对象数组、转义字符串 |
| XML 配对 | tok-xml-tag 数量、data-tag 同名配对、多标签多颜色、XML 声明 tok-decl、属性+属性值着色、自闭合标签、注释、命名空间标签 |
| YAML/CSV | YAML key/bool/num class、YAML 注释、CSV 首行 tok-key |

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI 组件化 |
| TypeScript 5 | 类型安全（strict 模式） |
| Webpack 5 | 构建打包（ts-loader + fork-ts-checker-webpack-plugin） |
| Jest + ts-jest | 单元测试（jsdom 环境，覆盖 XML DOMParser） |
| 零运行时依赖 | CSV/YAML 解析器纯手工实现，不依赖第三方库 |
