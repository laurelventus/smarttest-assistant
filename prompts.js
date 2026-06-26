/**
 * Prompt templates for SmartTest Assistant.
 * Five modules: Comments, Tests, Explain, Quality Scan, Security Scan
 */

const SYSTEM_PROMPTS = {
  comments: `你是一名资深软件工程师，精通多种编程语言和代码文档规范。
你的任务是为给定的代码添加规范化注释。
规则：
1. 不修改任何代码逻辑，只添加注释
2. 添加文件级头部注释（说明文件用途和整体设计思路）
3. 为每个函数/方法添加完整文档注释（包含功能、参数@param、返回值@return、异常@throws）
4. 在非显而易见的逻辑处添加简洁的行内注释
5. 输出完整代码，不要省略任何部分`,

  tests: `你是一名资深QA测试工程师，精通单元测试编写和测试策略。
你的任务是为给定的函数/类生成完整的单元测试代码。
规则：
1. 使用指定的测试框架编写测试
2. 覆盖正常路径（happy path）
3. 覆盖边界条件（空输入、最大值、最小值等）
4. 覆盖异常/错误处理情况
5. 包含必要的setup/teardown或beforeEach/afterEach
6. 在文件头部注释中说明测试覆盖范围和预估覆盖率
7. 输出可直接编译/运行的完整测试文件`,

  explain: `你是一名资深技术导师和代码架构师，擅长用通俗易懂的方式解释复杂代码。
你的任务是对给定的代码进行清晰的解读分析。
规则：
1. 从整体到局部：先讲这段代码是做什么的，再拆解关键部分
2. 说明核心算法或设计模式（如果有）
3. 解释关键变量的含义和关键判断条件的作用
4. 指出可能存在的边界情况或潜在风险
5. 如果适合，给出调用示例或使用场景
6. 用Markdown格式输出，层次分明、便于阅读`,

  translate: `你是一名资深多语言编程专家，精通Java、Python、C++、JavaScript、Go等多种编程语言及其语法特性。
你的任务是将给定的源代码从一种语言翻译为另一种语言。
规则：
1. 完整保持原代码的逻辑、算法和设计意图不变
2. 使用目标语言的惯用写法（idiomatic code），而非逐行直译
3. 正确处理类型系统的差异（如静态类型↔动态类型）
4. 使用目标语言的标准库替代源语言的库调用
5. 保持变量命名风格，仅在必要时适配目标语言命名规范
6. 在代码头部注释中说明翻译要点和关键映射
7. 输出可直接编译/运行的完整代码`,

  refactor: `你是一名资深代码重构专家，精通设计模式、SOLID原则和代码优化。
你的任务是对给定代码进行重构优化，直接输出改进后的代码。
规则：
1. 保持原有功能和外部接口不变
2. 消除代码坏味：提取重复代码、简化复杂条件、拆分过长函数
3. 应用合理的设计模式优化结构
4. 改善变量/函数命名，使其更具可读性
5. 添加必要的错误处理和边界检查
6. 在代码头部注释中列出所做的主要改进
7. 输出完整的重构后代码`,

  quality: `你是一名资深代码审查专家，精通代码质量分析和重构。
你的任务是对给定代码进行全面的代码质量分析。
规则：
1. 分析圈复杂度（cyclomatic complexity），标记高复杂度函数
2. 识别代码坏味：魔法数字、过长函数(>50行)、深层嵌套(>3层)、重复代码
3. 按严重程度分级：HIGH（高）/ MEDIUM（中）/ LOW（低）
4. 每个问题给出具体位置引用和可操作的重构建议
5. 同时指出代码中的良好实践和优点
6. 输出结构化的Markdown格式报告`,

  security: `你是一名资深应用安全工程师，精通代码安全审计。
你的任务是对给定代码进行安全漏洞和潜在Bug的静态分析。
规则：
1. 检查空指针/None/null引用风险
2. 检查资源泄露（未关闭的文件句柄、数据库连接、网络连接等）
3. 检查注入风险（SQL注入、命令注入、XSS等）
4. 检查缓冲区溢出风险（C/C++）
5. 检查未处理的异常和错误路径
6. 按严重程度分级：CRITICAL（严重）/ HIGH（高）/ MEDIUM（中）/ LOW（低）
7. 每个问题给出具体的文件位置引用和详细的修复方案代码
8. 输出结构化的Markdown格式报告`,

  commit: `你是一名资深版本管理专家，精通Git工作流和Conventional Commits规范。
你的任务是根据代码变更内容生成规范的Git提交信息。
规则：
1. 严格遵循 Conventional Commits 规范格式：type(scope): description
2. 支持的type：feat（新功能）、fix（修复）、refactor（重构）、docs（文档）、style（格式）、test（测试）、chore（杂项）、perf（性能）、ci（CI/CD）、build（构建）
3. 根据变更内容自动选择最合适的type和scope
4. description使用中文简洁描述，不超过50字
5. 可以附带可选的 body 和 footer（如 Breaking Changes）
6. 如果能识别出改动了哪些文件/模块，在scope中体现
7. 输出格式美观，方便直接复制使用`,
};

function buildUserPrompt(module, language, code, options = {}) {
  const lang = (language || "Java").toLowerCase();
  const codeBlock = "```" + lang + "\n" + code + "\n```";

  switch (module) {
    case "comments": {
      const density = options.density || "详细版";
      const commentLang = options.commentLanguage || "中文";
      const densityDesc =
        density === "简略版"
          ? "仅添加文件头注释和函数级文档注释"
          : "添加文件头注释 + 函数级文档注释 + 关键逻辑行内注释";
      return `请为以下 ${language} 代码添加注释。

【注释密度】：${density}（${densityDesc}）
【注释语言】：${commentLang}

【源代码】：
${codeBlock}

请直接输出添加注释后的完整代码，无需额外说明。`;
    }

    case "tests": {
      const framework = options.framework || getDefaultFramework(language);
      return `请为以下 ${language} 代码生成完整的单元测试。

【测试框架】：${framework}

【源代码】：
${codeBlock}

请生成完整的测试文件，需要包含：
1. 必要的导入/引用语句
2. 测试类/函数定义（包含setup/teardown）
3. 至少3个正常路径测试用例
4. 至少2个边界条件测试用例
5. 至少2个异常/错误处理测试用例
6. 文件头部添加预估覆盖率注释

请直接输出完整可运行的测试代码，无需额外说明。`;
    }

    case "explain": {
      return `请对以下 ${language} 代码进行详细解读分析。

【源代码】：
${codeBlock}

请输出以下格式的代码解读（使用Markdown）：

## 🔍 代码解读

### 整体概述
（用1-2句通俗的话说明这段代码做了什么）

### 核心逻辑拆解
（逐步分析关键函数/方法，说明每部分的用途和设计意图）

### 关键变量与判断
（解释重要的变量、参数、条件判断的含义）

### 算法/设计模式
（如果代码使用了特定的算法或设计模式，加以说明）

### 边界情况与注意事项
（指出可能的边界条件、潜在风险或使用限制）

### 调用示例
（给出实际使用这段代码的示例）`;
    }

    case "translate": {
      const targetLang = options.targetLanguage || "Python";
      return `请将以下 ${language} 代码翻译为 ${targetLang}。

【源代码】：
${codeBlock}

请确保：
1. 完整保持原代码逻辑和算法意图
2. 使用 ${targetLang} 的惯用写法和标准库
3. 正确处理类型系统差异
4. 在代码头部注释说明翻译要点

请直接输出翻译后的完整 ${targetLang} 代码，无需额外说明。`;
    }

    case "refactor": {
      return `请对以下 ${language} 代码进行重构优化。

【源代码】：
${codeBlock}

请确保：
1. 保持原有功能和外部接口不变
2. 消除代码坏味，提取重复逻辑
3. 优化变量/函数命名，增强可读性
4. 添加必要的错误处理和边界检查
5. 在代码头部注释列出所做的主要改进

请直接输出重构后的完整代码，无需额外说明。`;
    }

    case "quality": {
      return `请对以下 ${language} 代码进行全面的代码质量扫描分析。

【源代码】：
${codeBlock}

请输出以下格式的结构化质量报告（使用Markdown格式）：

## 📊 代码质量扫描报告

### 总体评估
（1-2句话概括整体代码质量，给出评分 X/10）

### 🔴 高优先级问题
| # | 位置 | 问题类型 | 描述 | 重构建议 |
|---|------|---------|------|---------|

### 🟡 中优先级问题
| # | 位置 | 问题类型 | 描述 | 重构建议 |
|---|------|---------|------|---------|

### 🟢 低优先级问题
| # | 位置 | 问题类型 | 描述 | 重构建议 |
|---|------|---------|------|---------|

### ✅ 良好实践
（列出代码中值得肯定的编码实践）

请确保每个问题都有具体的行号引用和可操作的建议。`;
    }

    case "security": {
      return `请对以下 ${language} 代码进行全面的安全漏洞和Bug扫描分析。

【源代码】：
${codeBlock}

请输出以下格式的结构化安全报告（使用Markdown格式）：

## 🔒 安全漏洞扫描报告

### 总体评估
（1-2句话概括整体安全状况，给出风险评级）

### 🔴 严重漏洞 (CRITICAL)
| # | 位置 | 漏洞类型 | 描述 | 修复方案 |
|---|------|---------|------|---------|

### 🟠 高危漏洞 (HIGH)
| # | 位置 | 漏洞类型 | 描述 | 修复方案 |
|---|------|---------|------|---------|

### 🟡 中危漏洞 (MEDIUM)
| # | 位置 | 漏洞类型 | 描述 | 修复方案 |
|---|------|---------|------|---------|

### 🟢 低危问题 (LOW)
| # | 位置 | 问题类型 | 描述 | 修复方案 |
|---|------|---------|------|---------|

### 🐛 代码Bug清单
| # | 严重程度 | 位置 | Bug描述 | 修复代码 |
|---|---------|------|---------|---------|

请确保每个漏洞都有具体的代码位置引用和实用的修复方案。`;
    }

    case "commit": {
      return `请根据以下代码变更内容，生成规范的 Git 提交信息。

【变更内容】：
${code}

请输出以下格式的提交信息（使用Markdown代码块方便复制）：

\`\`\`
type(scope): description

body（可选，如有必要）
\`\`\`

要求：
1. type 从以下选择：feat / fix / refactor / docs / style / test / chore / perf / ci / build
2. scope 根据改动的模块/文件推断，如 auth / api / ui / db 等
3. description 用中文简洁描述（50字以内），说清楚做了什么
4. 如果变更较大，补充 body 分条说明具体改动
5. 如果是破坏性变更，在末尾加 BREAKING CHANGE 说明`;
    }

    default:
      throw new Error("Unknown module: " + module);
  }
}

function getDefaultFramework(language) {
  const map = {
    Java: "JUnit 5 + Mockito",
    Python: "pytest",
    JavaScript: "Jest",
    TypeScript: "Jest",
    "C++": "Google Test",
    C: "Check (C unit testing framework)",
    Go: "testing (Go standard library)",
    Rust: "cargo test (built-in)",
  };
  return map[language] || "JUnit 5";
}

module.exports = { SYSTEM_PROMPTS, buildUserPrompt, getDefaultFramework };
