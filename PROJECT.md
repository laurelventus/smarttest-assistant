# 智测助手 SmartTest Assistant — 项目文档

> AI 代码注释与单元测试智能生成工具  
> 2026 届校招新员工 AI 创投马拉松大赛  
> 开发者：冯贤桂（研发岗位）

---

## 一、项目概述

智测助手是一款面向研发人员的 AI 代码辅助工具，通过集成 DeepSeek 大语言模型，为开发者提供五大智能功能：

| # | 模块 | 说明 |
|---|------|------|
| 1 | 💬 智能注释生成 | 自动生成 Javadoc/PythonDoc/JSDoc 等规范化注释，支持简略/详细两种密度、中文/英文双语 |
| 2 | 🧪 单元测试生成 | 自动生成完整测试文件（JUnit/pytest/Jest/GTest），覆盖正常/边界/异常三类场景 |
| 3 | 🔍 代码解读 | 自然语言详细解释代码逻辑、算法、设计模式，适合新人学习或代码评审 |
| 4 | 📊 代码质量扫描 | 识别圈复杂度、魔法数字、深层嵌套等代码坏味，分级输出重构建议 |
| 5 | 🔒 安全漏洞检测 | 静态扫描 SQL 注入、资源泄露、空指针等安全隐患，提供分级报告与修复代码 |

### 核心特性

- 🖥️ 现代化暗色主题单页应用，适配桌面端
- 📁 文件拖拽上传 + 点击上传，自动识别 16 种编程语言
- 📋 一键复制结果 / 💾 导出下载为源代码文件或 Markdown
- ⚡ 示例代码快速填入，Ctrl+Enter 快捷键
- 🌐 Railway 云平台永久部署，公网可直接访问

### Demo 地址

| 类型 | 链接 |
|------|------|
| 永久部署 | `https://smarttest-assistant-production.up.railway.app/` |
| 源代码 | `https://github.com/laurelventus/smarttest-assistant` |
| 本地启动 | `cd smarttest-assistant && npm start` → `http://localhost:3000` |

---

## 二、技术架构

```
┌──────────────────────────────────────────────────┐
│                    客户端                          │
│  index.html → styles.css → app.js                 │
│  (暗色主题 / 5 Tab / 拖拽上传 / 导出下载)         │
└──────────────────┬───────────────────────────────┘
                   │ HTTP POST
┌──────────────────▼───────────────────────────────┐
│               Express 服务端                       │
│  server.js                                        │
│  ┌─────────────────────────────────────────────┐ │
│  │ /api/generate-comments    → handleAIModule  │ │
│  │ /api/generate-tests       → handleAIModule  │ │
│  │ /api/explain-code         → handleAIModule  │ │
│  │ /api/scan-quality         → handleAIModule  │ │
│  │ /api/scan-security        → handleAIModule  │ │
│  │ /api/health               → 健康检查        │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────┬───────────────────────────────┘
                   │ HTTP POST
┌──────────────────▼───────────────────────────────┐
│           LLM API (DeepSeek / 千帆 / OpenAI)      │
│  prompts.js (5组 System Prompt + User Prompt)     │
│  temperature: 0.3  /  max_tokens: 4096            │
└──────────────────────────────────────────────────┘
```

### 技术栈

| 层 | 技术 |
|----|------|
| 前端 | 原生 HTML/CSS/JS，highlight.js（代码高亮），marked.js（Markdown 渲染） |
| 后端 | Node.js + Express |
| AI | DeepSeek API（主）/ 百度千帆 ERNIE（备）/ OpenAI 兼容（备） |
| 部署 | Railway 云平台（自动 CI/CD 联动 GitHub） |

### 代码统计

| 文件 | 行数 | 职责 |
|------|------|------|
| `server.js` | ~300 | Express 路由 + LLM 调用 + fallback |
| `prompts.js` | ~200 | 5 组 System/User Prompt 模板 |
| `public/index.html` | ~200 | 页面结构 |
| `public/styles.css` | ~300 | 暗色主题 + 响应式 |
| `public/app.js` | ~400 | 交互逻辑 + 文件上传 + 导出 |

---

## 三、已完成功能清单

### v1.0 基础版（6/19 完成）
- [x] 四大 AI 模块：注释、测试、质量、安全
- [x] 7 种编程语言支持（Java/Python/C++/C/JS/TS/Go）
- [x] 暗色主题 UI，三栏布局
- [x] DeepSeek API 集成
- [x] 无 API Key 时的 graceful fallback

### v1.1 部署版（6/20 完成）
- [x] Railway 永久公网部署
- [x] GitHub 仓库 + CI/CD 自动部署
- [x] 示例代码一键填入（5 种语言 + 安全示例）
- [x] 错误提示横幅（8 秒自动消失）
- [x] 生成耗时显示

### v1.2 增强版（6/21-6/22 完成）
- [x] 📁 文件上传（拖拽 + 点击选择）
- [x] 上传后自动识别编程语言（16 种文件后缀）
- [x] 🔍 第 5 个 AI 模块：代码解读
- [x] 💾 结果导出下载（自动匹配文件后缀）
- [x] Ctrl+K 清空 / Ctrl+Enter 生成注释

---

## 四、后续优化与扩展建议

按优先级和价值排列：

### 🥇 P0 — 高价值、低工作量（建议优先实现）

| 优化项 | 说明 | 预计工作量 |
|--------|------|-----------|
| **代码对比视图** | 注释生成后并排展示"原始代码 vs 注释后代码"，用颜色高亮新增的注释行，一目了然 | 1h |
| **代码翻译/转换** | 新增按钮「语言翻译」，Java ↔ Python 互译，或 Python 2 → 3 迁移，极具实用价值 | 30min |
| **Commit Message 生成** | 输入 git diff，AI 自动生成规范的 Conventional Commit 信息（`feat:`/`fix:`/`refactor:`） | 20min |
| **亮色主题切换** | 头部加太阳/月亮图标，支持浅色模式，方便不同环境使用和截图到文档 | 30min |
| **首次使用引导** | 首次打开显示 3 步引导提示："1.粘贴代码 → 2.选语言 → 3.点按钮"，提升新用户体验 | 20min |

### 🥈 P1 — 高价值、中工作量（大赛加分项）

| 优化项 | 说明 | 预计工作量 |
|--------|------|-----------|
| **代码重构建议 + 自动重构** | 在质量扫描基础上，AI 不仅给出建议，还直接输出重构后的代码，用户可一键替换 | 1h |
| **历史记录面板** | 左侧加可折叠历史列表，保存最近 10 次处理结果（存 localStorage），支持点击回看和对比 | 2h |
| **多文件批量处理** | 一次上传整个项目文件夹，逐个处理并在结果区生成文件索引，支持切换查看 | 3h |
| **自定义 Prompt 编辑** | 高级模式：用户可编辑 System Prompt，适配团队内部代码规范，保存为自定义模板 | 2h |
| **响应式移动端适配** | 优化手机/平板布局，方便在移动端演示 | 2h |

### 🥉 P2 — 锦上添花（有时间再做）

| 优化项 | 说明 | 预计工作量 |
|--------|------|-----------|
| **PWA 支持** | 添加 manifest + Service Worker，支持桌面安装和离线访问 | 1h |
| **请求频率限制** | 添加 rate-limit，防止 API 滥用，提升服务稳定性 | 30min |
| **处理统计面板** | 底部显示累计处理次数、总字符数、平均耗时等使用统计 | 30min |
| **多模型切换** | 前端可切换 DeepSeek / 千帆 / OpenAI，方便对比不同模型效果 | 2h |
| **代码片段收藏** | 用户可收藏满意的生成结果，pin 在历史列表顶部 | 1h |
| **深色/浅色代码主题切换** | highlight.js 支持切换多种代码高亮主题（github-dark/monokai/tomorrow 等） | 15min |
| **SEO 优化** | 添加 meta 标签和 Open Graph，分享链接时显示卡片预览 | 15min |
| **国际化 i18n** | 中英文界面切换，面向更广用户群 | 3h |

### 🔮 P3 — 远期设想

| 设想 | 说明 |
|------|------|
| **IDE 插件** | 封装为 VS Code / JetBrains 插件，右键菜单直接调用 |
| **团队协作版** | 多用户 + 共享 Prompt 模板库 + 处理历史云端同步 |
| **代码知识库** | 结合 RAG，将企业历史代码库作为上下文，生成符合团队风格的注释和测试 |
| **CI/CD 集成** | GitHub Action / GitLab CI，PR 提交时自动运行质量扫描和安全检测 |

---

## 五、开发指南

### 本地启动

```bash
cd smarttest-assistant

# 1. 安装依赖
npm install

# 2. 配置 API Key
cp .env.example .env
# 编辑 .env，填写 DEEPSEEK_API_KEY

# 3. 启动
npm start

# 4. 打开 http://localhost:3000
```

### 添加新 AI 模块（模板）

以"代码解读"为例，新增一个模块只需改 3 个文件：

**1. `prompts.js` — 添加 Prompt**

```js
// SYSTEM_PROMPTS 中添加
explain: `你是一名...规则：...`,

// buildUserPrompt 的 switch 中添加
case "explain": { return `...`; }
```

**2. `server.js` — 添加路由**

```js
app.post("/api/explain-code", (req, res) =>
  handleAIModule(req, res, "explain")
);
```

**3. `public/index.html` — 添加按钮 + Tab**

```html
<!-- 操作按钮 -->
<button id="explainCodeBtn" class="btn btn-accent action-btn">...</button>

<!-- 结果 Tab -->
<button class="tab" data-tab="explain">🔍 解读</button>

<!-- 结果面板 -->
<div id="outputExplain" class="output-pane">...</div>
```

**4. `public/app.js` — 绑定事件**

```js
$("#explainCodeBtn").addEventListener("click", () =>
  handleAction("explain-code", "explain", "AI 正在解读...")
);
```

### 部署到 Railway

1. 推送代码到 GitHub
2. Railway 自动检测并部署（`npm start`）
3. 在 Railway Settings → Variables 中添加 `DEEPSEEK_API_KEY`
4. 获取永久域名

---

## 六、API 文档

### 健康检查

```
GET /api/health
→ { "status": "ok", "provider": "deepseek", "model": "deepseek-chat", "time": "..." }
```

### 代码处理（5 个端点，格式相同）

```
POST /api/generate-comments
POST /api/generate-tests
POST /api/explain-code
POST /api/scan-quality
POST /api/scan-security

Request:
{
  "code": "源代码内容",
  "language": "Java",
  "density": "详细版",       // 仅 generate-comments
  "commentLanguage": "中文",  // 仅 generate-comments
  "framework": "auto"         // 仅 generate-tests
}

Response (成功):
{ "success": true, "result": "AI 生成的完整结果" }

Response (API Key 未配置):
{ "error": "...", "fallback": "示例输出" }
```

### 限制

- 单次代码最大 50,000 字符
- 请求超时取决于 AI 响应速度，通常 5-30 秒

---

## 七、项目文件结构

```
smarttest-assistant/
├── server.js              # Express 后端主文件
├── prompts.js             # 5 组 AI Prompt 模板
├── package.json           # 项目配置与依赖
├── .env                   # API Key（不提交到 Git）
├── .env.example           # API Key 模板
├── .gitignore
├── README.md
└── public/                # 前端静态文件
    ├── index.html         # 主界面（5 Tab + 上传 + 导出）
    ├── styles.css         # 暗色主题样式
    └── app.js             # 前端交互逻辑
```

---

## 八、更新日志

| 日期 | 版本 | 内容 |
|------|------|------|
| 6/19 | v1.0 | 四大 AI 模块 + DeepSeek 集成 + 基础 UI |
| 6/20 | v1.1 | Railway 部署 + GitHub CI/CD + 示例代码 + 错误提示 + 耗时显示 |
| 6/21 | v1.2 | 文件拖拽上传 + 自动语言识别 |
| 6/22 | v1.3 | 第 5 模块「代码解读」+ 结果导出下载 |

---

> ⚠️ AI 生成内容仅供参考，请人工审核后使用。
