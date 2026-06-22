/**
 * 智测助手 (SmartTest Assistant) - Backend Server
 *
 * AI-powered code comment generation, unit test generation,
 * code quality scanning, and security vulnerability detection.
 *
 * Supports: DeepSeek API / OpenAI-compatible / Baidu Qianfan ERNIE
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const { SYSTEM_PROMPTS, buildUserPrompt } = require("./prompts");

const app = express();
const PORT = process.env.PORT || 3000;

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

// === LLM API Client ===
const LLM_PROVIDER = process.env.LLM_PROVIDER || "deepseek";
const LLM_MODEL = process.env.LLM_MODEL || "deepseek-chat";

async function callLLM(systemPrompt, userPrompt) {
  let endpoint, headers, body;

  if (LLM_PROVIDER === "deepseek" || LLM_PROVIDER === "openai") {
    const baseUrl =
      process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error(
        `Missing API key for ${LLM_PROVIDER}. Set DEEPSEEK_API_KEY in .env`
      );
    }

    endpoint = `${baseUrl}/chat/completions`;
    headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    body = {
      model: LLM_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    };
  } else if (LLM_PROVIDER === "baidu") {
    // Baidu Qianfan ERNIE Bot
    const apiKey = process.env.BAIDU_API_KEY;
    const secretKey = process.env.BAIDU_SECRET_KEY;

    if (!apiKey || !secretKey) {
      throw new Error(
        "Missing Baidu API credentials. Set BAIDU_API_KEY and BAIDU_SECRET_KEY in .env"
      );
    }

    // First get access token
    const tokenRes = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
      { method: "POST" }
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error(
        `Failed to get Baidu access token: ${JSON.stringify(tokenData)}`
      );
    }

    endpoint = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${tokenData.access_token}`;
    headers = { "Content-Type": "application/json" };
    body = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      top_p: 0.9,
      penalty_score: 1.0,
    };
  } else {
    throw new Error(`Unsupported LLM provider: ${LLM_PROVIDER}`);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errText}`);
  }

  const data = await response.json();

  // Handle different response formats
  if (data.choices && data.choices[0]) {
    return data.choices[0].message.content;
  }
  if (data.result) {
    return data.result;
  }

  throw new Error(`Unexpected API response format: ${JSON.stringify(data)}`);
}

// === API Routes ===

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    provider: LLM_PROVIDER,
    model: LLM_MODEL,
    time: new Date().toISOString(),
  });
});

// Generic AI module handler
async function handleAIModule(req, res, module) {
  try {
    const { code, language, ...options } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: "请输入代码内容" });
    }
    if (code.length > 50000) {
      return res
        .status(400)
        .json({ error: "代码长度超过限制（最大50000字符）" });
    }

    const systemPrompt = SYSTEM_PROMPTS[module];
    const userPrompt = buildUserPrompt(module, language || "Java", code, options);

    console.log(
      `[${module}] Processing ${language || "Java"} code (${code.length} chars)...`
    );
    const result = await callLLM(systemPrompt, userPrompt);
    console.log(`[${module}] Response: ${result.length} chars`);

    res.json({ success: true, result });
  } catch (err) {
    console.error(`[${module}] Error:`, err.message);
    res.status(500).json({
      error: `AI处理失败：${err.message}`,
      fallback: getFallbackResponse(module, req.body.language, req.body.code),
    });
  }
}

app.post("/api/generate-comments", (req, res) =>
  handleAIModule(req, res, "comments")
);
app.post("/api/generate-tests", (req, res) =>
  handleAIModule(req, res, "tests")
);
app.post("/api/scan-quality", (req, res) =>
  handleAIModule(req, res, "quality")
);
app.post("/api/scan-security", (req, res) =>
  handleAIModule(req, res, "security")
);
app.post("/api/explain-code", (req, res) =>
  handleAIModule(req, res, "explain")
);

// Fallback responses when API is unavailable (for demo purposes)
function getFallbackResponse(module, language, code) {
  const lang = language || "Java";
  switch (module) {
    case "comments":
      return `// ============================================================
// 文件说明：[自动生成] 此文件包含核心业务逻辑实现
// 作者：智测助手 AI
// 生成时间：${new Date().toLocaleString("zh-CN")}
// ============================================================

/**
 * 处理用户请求的主要函数
 * （AI API 暂不可用，此为示例输出。请配置 API Key 获取智能结果。）
 */
function processRequest(input) {
    // 验证输入参数
    if (!input) {
        return null;
    }
    // TODO: 实现业务逻辑
    return input;
}`;

    case "tests":
      return `/**
 * Auto-generated unit tests (Demo Mode)
 * Framework: ${lang === "Python" ? "pytest" : "JUnit 5"}
 * Estimated Coverage: N/A (Demo)
 *
 * Note: AI API unavailable. Configure API key for real test generation.
 */
${lang === "Python"
  ? `import pytest
from mymodule import process_request

class TestProcessRequest:
    def test_normal_input(self):
        result = process_request("test")
        assert result is not None

    def test_empty_input(self):
        result = process_request("")
        assert result is None

    def test_exception_case(self):
        with pytest.raises(TypeError):
            process_request(None)`
  : `import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ProcessRequestTest {
    @Test
    void testNormalInput() {
        String result = processRequest("test");
        assertNotNull(result);
    }

    @Test
    void testEmptyInput() {
        String result = processRequest("");
        assertNull(result);
    }

    @Test
    void testNullInput() {
        assertThrows(NullPointerException.class, () -> {
            processRequest(null);
        });
    }
}`}`;

    case "quality":
      return `## 📊 代码质量扫描报告 (Demo Mode)

### 总体评估
代码结构基本清晰，但存在一些可改进之处。综合评分：6/10。
> ⚠️ AI API 暂不可用，请配置 API Key 获取完整智能分析。

### 🔴 高优先级问题
| # | 位置 | 问题类型 | 描述 | 重构建议 |
|---|------|---------|------|---------|
| 1 | - | API未配置 | 无法进行真实AI分析 | 请在 .env 中配置 DEEPSEEK_API_KEY |

### ✅ 良好实践
- 代码结构清晰，函数职责单一`;

    case "security":
      return `## 🔒 安全漏洞扫描报告 (Demo Mode)

### 总体评估
> ⚠️ AI API 暂不可用。配置 API Key 后获取完整安全分析。

### 🟢 低危问题 (LOW)
| # | 位置 | 问题类型 | 描述 | 修复方案 |
|---|------|---------|------|---------|
| 1 | - | 提示 | 当前为演示模式 | 请在 .env 中配置 DEEPSEEK_API_KEY 启用真实AI安全扫描 |`;

    case "explain":
      return `## 🔍 代码解读 (Demo Mode)

### 整体概述
（AI API 暂不可用，此为示例输出。配置 API Key 后获取智能解读。）

### 核心逻辑拆解
该函数接受输入参数并执行核心计算逻辑，通过条件判断处理不同场景。

### 关键变量与判断
- 参数通过基本校验后进入主处理流程
- 条件分支用于区分正常路径与异常路径

### 边界情况与注意事项
- 注意输入参数的合法性检查
- 建议添加完善的错误处理机制

### 调用示例
\`\`\`
// 正常调用示例
const result = processData(input);
\`\`\``;

    default:
      return "未知模块";
  }
}

// === Start Server ===
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔══════════════════════════════════════════════╗
║       智测助手 SmartTest Assistant           ║
║       AI代码注释与单元测试智能生成工具        ║
╠══════════════════════════════════════════════╣
║  Server:  http://localhost:${PORT}               ║
║  Health:  http://localhost:${PORT}/api/health     ║
║  Provider: ${LLM_PROVIDER.padEnd(33)}║
║  Model:    ${LLM_MODEL.padEnd(33)}║
╚══════════════════════════════════════════════╝
`);
});
