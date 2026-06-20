# 智测助手 SmartTest Assistant

AI 代码注释与单元测试智能生成工具 — 2026届校招新员工 AI 创投马拉松大赛

## 快速启动

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key（二选一）
# 方式A: DeepSeek（推荐，国内可用）
cp .env.example .env
# 编辑 .env，填写 DEEPSEEK_API_KEY=sk-xxxxxxxx

# 方式B: 百度千帆
# 编辑 .env，设置 LLM_PROVIDER=baidu 并填写 BAIDU_API_KEY / BAIDU_SECRET_KEY

# 3. 启动
npm start

# 4. 打开浏览器 http://localhost:3000
```

## 项目结构

```
smarttest-assistant/
├── server.js          # Express 后端 (4个AI API端点 + LLM集成)
├── prompts.js         # Prompt工程模板 (System + User Prompt)
├── package.json
├── .env.example       # API Key 配置模板
├── .env               # 实际配置 (gitignore)
├── README.md
└── public/
    ├── index.html     # 主界面 (单页应用)
    ├── styles.css     # 暗色主题样式
    └── app.js         # 前端交互逻辑
```

## 四大功能模块

| 模块 | API端点 | 说明 |
|------|---------|------|
| 💬 智能注释生成 | `/api/generate-comments` | 自动生成文件头/函数级/行内注释 |
| 🧪 单元测试生成 | `/api/generate-tests` | 生成完整测试文件（正常/边界/异常） |
| 📊 代码质量扫描 | `/api/scan-quality` | 识别代码坏味、圈复杂度、重构建议 |
| 🔒 安全漏洞检测 | `/api/scan-security` | 空指针/SQL注入/资源泄露等静态分析 |

## 支持的编程语言

Java / Python / C++ / C / JavaScript / TypeScript / Go

## 部署到公网

### 方式1: 秒哒平台
将 `public/` 目录下的前端文件上传至秒哒，配置API连接器指向LLM API。

### 方式2: Railway / Render (免费)
```bash
# 直接部署，设置环境变量即可
# Start command: npm start
```

### 方式3: Vercel + 独立后端
前端部署到 Vercel，后端部署到 Railway。

## API Key 获取

- **DeepSeek**: https://platform.deepseek.com/ → API Keys
- **百度千帆**: https://console.bce.baidu.com/qianfan/ → 应用接入

## License

MIT — 2026 AI 创投马拉松
