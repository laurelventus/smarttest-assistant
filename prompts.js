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
