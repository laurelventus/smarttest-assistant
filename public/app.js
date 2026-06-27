/**
 * 智测助手 SmartTest Assistant — Frontend Logic
 */

// === CDN Availability Check ===
const CDN_OK = {
  get marked() { return typeof marked !== "undefined" && typeof marked.parse === "function"; },
  get hljs() { return typeof hljs !== "undefined" && typeof hljs.highlight === "function"; },
  get purify() { return typeof DOMPurify !== "undefined" && typeof DOMPurify.sanitize === "function"; },
};
if (!CDN_OK.marked) console.warn("[SmartTest] marked.js not loaded — Markdown rendering will fall back to plain text");
if (!CDN_OK.hljs) console.warn("[SmartTest] highlight.js not loaded — Code syntax highlighting will be plain text");
if (!CDN_OK.purify) console.warn("[SmartTest] DOMPurify not loaded — Markdown XSS protection limited");

// === State ===
const state = {
  currentTab: "comments",
  results: {
    comments: null,
    tests: null,
    explain: null,
    translate: null,
    refactor: null,
    commit: null,
    quality: null,
    security: null,
  },
  isLoading: false,
  errorTimeoutId: null,
};

// === DOM Elements ===
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const codeInput = $("#codeInput");
const charCount = $("#charCount");
const statusDot = $("#statusDot");
const statusText = $("#statusText");
const loadingOverlay = $("#loadingOverlay");
const loadingText = $("#loadingText");
const loadingHint = $("#loadingHint");
const copyBtn = $("#copyBtn");
const downloadBtn = $("#downloadBtn");
const themeToggle = $("#themeToggle");
const statTotal = $("#statTotal");
const statChars = $("#statChars");
const statAvgTime = $("#statAvgTime");
const statLangs = $("#statLangs");
const languageSelect = $("#languageSelect");
const commentDensity = $("#commentDensity");
const commentLanguage = $("#commentLanguage");
const testFramework = $("#testFramework");
const targetLanguage = $("#targetLanguage");
const errorBanner = $("#errorBanner");
const errorText = $("#errorText");
const uploadBtn = $("#uploadBtn");
const fileInput = $("#fileInput");
const fileName = $("#fileName");
const dropZone = $("#dropZone");
const dropOverlay = $("#dropOverlay");
const historyToggle = $("#historyToggle");
const historyList = $("#historyList");
const historyCount = $("#historyCount");
const historyClearBtn = $("#historyClearBtn");
const historyPanel = $("#historyPanel");

const tabButtons = $$(".tab");
const actionButtons = $$(".action-btn"); // cached for disableButtons
const outputPanes = {
  comments: $("#outputComments"),
  tests: $("#outputTests"),
  explain: $("#outputExplain"),
  translate: $("#outputTranslate"),
  refactor: $("#outputRefactor"),
  commit: $("#outputCommit"),
  quality: $("#outputQuality"),
  security: $("#outputSecurity"),
};

// === Sample Code Templates ===
const SAMPLES = {
  java: {
    code: `public class Calculator {
    public double divide(double a, double b) {
        if (b == 0) {
            throw new IllegalArgumentException("除数不能为零");
        }
        return a / b;
    }
}`,
    language: "Java",
  },
  python: {
    code: `class Calculator:
    def divide(self, a, b):
        if b == 0:
            raise ValueError("除数不能为零")
        return a / b`,
    language: "Python",
  },
  "python-security": {
    code: `import os

class FileManager:
    def read_file(self, path):
        f = open(path, "r")
        content = f.read()
        return content

    def delete_file(self, filename):
        cmd = "rm -rf /data/" + filename
        os.system(cmd)

    def save_user(self, user_id, name):
        query = "INSERT INTO users VALUES (" + user_id + ", '" + name + "')"
        return query`,
    language: "Python",
  },
  cpp: {
    code: `#include <vector>
#include <string>

class DataProcessor {
private:
    int MAGIC_NUMBER = 42;
    int MAGIC_NUMBER2 = 137;

public:
    std::vector<int> process(std::vector<int> data) {
        std::vector<int> result;
        for (int i = 0; i < data.size(); i++) {
            int val = data[i];
            if (val > 100) {
                if (val > 200) {
                    if (val > 300) {
                        result.push_back(val * 3 + MAGIC_NUMBER);
                    } else {
                        result.push_back(val * 2 + MAGIC_NUMBER);
                    }
                } else {
                    result.push_back(val + MAGIC_NUMBER);
                }
            } else {
                result.push_back(val + MAGIC_NUMBER2);
            }
        }
        return result;
    }
};`,
    language: "C++",
  },
  javascript: {
    code: `async function fetchUserOrders(userId, apiBase) {
    const res = await fetch(apiBase + "/users/" + userId + "/orders");
    if (!res.ok) {
        throw new Error("请求失败: " + res.status);
    }
    const data = await res.json();
    return data.orders.filter(function(o) {
        return o.status !== "cancelled";
    });
}`,
    language: "JavaScript",
  },
  diff: {
    code: `diff --git a/src/auth/login.js b/src/auth/login.js
index 83db4e2..a1b2c3d 100644
--- a/src/auth/login.js
+++ b/src/auth/login.js
@@ -12,6 +12,10 @@
     const user = await db.findUser(username);
     if (!user) {
-        return { code: 404, msg: "用户不存在" };
+        throw new AuthError("USER_NOT_FOUND", "用户不存在", 404);
     }
+    // 新增：检查账号是否被锁定
+    if (user.lockedUntil && user.lockedUntil > Date.now()) {
+        throw new AuthError("ACCOUNT_LOCKED", "账号已被锁定，请稍后重试", 423);
+    }
     const valid = await bcrypt.compare(password, user.passwordHash);
     if (!valid) {
-        return { code: 401, msg: "密码错误" };
+        throw new AuthError("INVALID_PASSWORD", "密码错误", 401);`,
    language: "Plain Text",
  },
};

// === Initialize ===
document.addEventListener("DOMContentLoaded", () => {
  checkHealth();
  setupEventListeners();
  updateCharCount();
  renderStats();
});

function setupEventListeners() {
  // Tab switching
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Sample code buttons
  $$(".btn-sample").forEach((btn) => {
    btn.addEventListener("click", () => loadSample(btn.dataset.sample));
  });

  // File upload
  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);

  // Drag & drop
  dropZone.addEventListener("dragover", handleDragOver);
  dropZone.addEventListener("dragleave", handleDragLeave);
  dropZone.addEventListener("drop", handleDrop);
  // Scope drag events to drop zone only
  document.addEventListener("dragover", (e) => {
    if (e.target.closest("#dropZone")) return;
    // Don't preventDefault globally — let browser drag work elsewhere
  });
  document.addEventListener("drop", (e) => {
    if (!e.target.closest("#dropZone")) return;
    e.preventDefault();
  });

  // Action buttons
  $("#genCommentsBtn").addEventListener("click", () =>
    handleAction("generate-comments", "comments", "AI 正在生成注释...")
  );
  $("#genTestsBtn").addEventListener("click", () =>
    handleAction("generate-tests", "tests", "AI 正在生成单元测试...")
  );
  $("#explainCodeBtn").addEventListener("click", () =>
    handleAction("explain-code", "explain", "AI 正在解读代码...")
  );
  $("#translateCodeBtn").addEventListener("click", () =>
    handleAction("translate-code", "translate", "AI 正在翻译代码...")
  );
  $("#refactorCodeBtn").addEventListener("click", () =>
    handleAction("refactor-code", "refactor", "AI 正在重构代码...")
  );
  $("#commitBtn").addEventListener("click", () =>
    handleAction("generate-commit", "commit", "AI 正在生成提交信息...")
  );
  $("#scanQualityBtn").addEventListener("click", () =>
    handleAction("scan-quality", "quality", "AI 正在扫描代码质量...")
  );
  $("#scanSecurityBtn").addEventListener("click", () =>
    handleAction("scan-security", "security", "AI 正在检测安全漏洞...")
  );

  // Utility buttons
  $("#clearBtn").addEventListener("click", clearInput);
  copyBtn.addEventListener("click", copyResult);
  downloadBtn.addEventListener("click", downloadResult);
  themeToggle.addEventListener("click", toggleTheme);
  codeInput.addEventListener("input", updateCharCount);
  $("#errorDismiss").addEventListener("click", () => errorBanner.classList.add("hidden"));

  // Keyboard shortcut: Ctrl+Enter to generate comments
  codeInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleAction("generate-comments", "comments", "AI 正在生成注释...");
    }
  });

  // History panel
  historyToggle.addEventListener("click", () => {
    historyPanel.classList.toggle("collapsed");
  });
  historyClearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    clearHistory();
  });
  loadHistory();
  renderHistory();

  // Language change: update test framework hint
  languageSelect.addEventListener("change", () => {
    if (testFramework.value === "auto") {
      // Server picks default per language
    }
  });
}

// === Sample Code Loading ===
function loadSample(name) {
  const sample = SAMPLES[name];
  if (!sample) return;

  codeInput.value = sample.code;
  if (sample.language && sample.language !== "Plain Text") {
    languageSelect.value = sample.language;
  }
  updateCharCount();

  // Flash the code input to indicate change
  codeInput.style.boxShadow = "inset 0 0 0 1px var(--accent)";
  setTimeout(() => {
    codeInput.style.boxShadow = "";
    codeInput.style.transition = "";
  }, 600);

  // Suggest which module to use
  const hints = {
    java: "适合测试：注释生成 + 单元测试",
    python: "适合测试：注释生成 + 单元测试",
    "python-security": "适合测试：安全漏洞检测（含SQL注入等隐患）",
    cpp: "适合测试：代码质量扫描（含魔法数字、深层嵌套）",
    javascript: "适合测试：注释生成 + 单元测试",
    diff: "适合测试：提交信息生成（粘贴 git diff 或变更描述）",
  };
  if (hints[name]) {
    showToast(hints[name]);
  }
}

// === File Extension → Language Mapping ===
const EXT_TO_LANG = {
  java: "Java",
  py: "Python",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  c: "C",
  h: "C",
  js: "JavaScript",
  mjs: "JavaScript",
  ts: "TypeScript",
  tsx: "TypeScript",
  jsx: "JavaScript",
  go: "Go",
  rs: "Rust",
  cs: "C#",
  rb: "Ruby",
  php: "PHP",
  swift: "Swift",
  kt: "Kotlin",
  scala: "Scala",
};

const ALLOWED_EXTENSIONS = Object.keys(EXT_TO_LANG).join(",");

function detectLanguage(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  return EXT_TO_LANG[ext] || null;
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    if (file.size > 2 * 1024 * 1024) {
      reject(new Error("文件大小超过 2MB 限制"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsText(file);
  });
}

async function handleFile(file) {
  try {
    const content = await readFile(file);
    codeInput.value = content;
    updateCharCount();

    // Auto-detect language
    const lang = detectLanguage(file.name);
    if (lang) {
      languageSelect.value = lang;
      showToast("已加载 " + file.name + "，自动识别为 " + lang);
    } else {
      showToast("已加载 " + file.name + "，请手动选择语言", "error");
    }

    fileName.textContent = file.name;
    fileName.title = file.name;
    // Flash the code input
    codeInput.style.transition = "box-shadow 0.3s ease";
    codeInput.style.boxShadow = "inset 0 0 0 1px var(--green)";
    setTimeout(() => {
      codeInput.style.boxShadow = "";
    }, 800);
  } catch (err) {
    showError(err.message);
    fileName.textContent = "";
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) handleFile(file);
  fileInput.value = ""; // Reset so the same file can be re-selected
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  // Only show overlay for file drags (not text/link drags)
  if (e.dataTransfer.types && e.dataTransfer.types.includes("Files")) {
    dropZone.classList.add("drag-over");
    dropOverlay.classList.remove("hidden");
  }
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove("drag-over");
  dropOverlay.classList.add("hidden");
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove("drag-over");
  dropOverlay.classList.add("hidden");

  const file = e.dataTransfer.files[0];
  if (file) {
    // Check extension
    const ext = file.name.split(".").pop().toLowerCase();
    if (!EXT_TO_LANG[ext]) {
      showError("不支持的文件类型：" + ext + "。支持的类型：" + ALLOWED_EXTENSIONS);
      return;
    }
    handleFile(file);
  }
}

// === API Health Check ===
async function checkHealth() {
  statusDot.className = "status-dot checking";
  statusText.textContent = "检查中...";
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.status === "ok") {
      statusDot.className = "status-dot connected";
      statusText.textContent = data.provider + "/" + data.model;
    } else {
      throw new Error("Unhealthy");
    }
  } catch {
    statusDot.className = "status-dot disconnected";
    statusText.textContent = "离线模式";
  }
}

// === Tab Switching ===
function switchTab(tabName) {
  state.currentTab = tabName;
  tabButtons.forEach((b) =>
    b.classList.toggle("active", b.dataset.tab === tabName)
  );
  Object.entries(outputPanes).forEach(([name, pane]) =>
    pane.classList.toggle("active", name === tabName)
  );
  updateCopyButton();
}

// === Actions ===
async function handleAction(endpoint, resultKey, loadingMsg) {
  const code = codeInput.value.trim();
  if (!code) {
    showError("请先输入代码，或点击上方「快速示例」按钮加载示例代码");
    codeInput.focus();
    return;
  }

  // Switch to the relevant output tab
  switchTab(resultKey);

  // Show loading
  state.isLoading = true;
  loadingText.textContent = loadingMsg;
  loadingHint.textContent =
    code.length > 2000
      ? "代码较长，预计需要 15-30 秒，请耐心等待"
      : "预计 5-15 秒完成";
  loadingOverlay.classList.remove("hidden");
  errorBanner.classList.add("hidden");
  disableButtons(true);

  const startTime = Date.now();

  try {
    const options = {
      density: commentDensity.value,
      commentLanguage: commentLanguage.value,
      framework: testFramework.value === "auto" ? undefined : testFramework.value,
      targetLanguage: targetLanguage.value,
    };

    const res = await fetch("/api/" + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        language: languageSelect.value,
        ...options,
      }),
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const data = await res.json();

    if (data.success) {
      state.results[resultKey] = data.result;
      renderResult(resultKey, data.result, elapsed);
      saveHistory(resultKey, data.result, code, languageSelect.value);
      updateStats(code.length, parseFloat(elapsed), languageSelect.value);
    } else {
      // Fallback or error
      if (data.fallback) {
        state.results[resultKey] = data.fallback;
        renderResult(resultKey, data.fallback, elapsed);
        showError("AI API 暂不可用，已展示示例输出。请配置 API Key 获取智能结果。");
      } else {
        state.results[resultKey] = "处理失败：" + (data.error || "未知错误");
        renderResult(resultKey, state.results[resultKey], elapsed);
        showError(data.error || "处理失败，请稍后重试");
      }
    }
  } catch (err) {
    const msg = "请求失败：" + err.message;
    state.results[resultKey] = msg;
    renderResult(resultKey, msg, null);
    showError("网络连接异常，请检查服务器状态后重试");
  } finally {
    state.isLoading = false;
    loadingOverlay.classList.add("hidden");
    disableButtons(false);
    updateCopyButton();
  }
}

// === Render Results ===
function renderResult(key, content, elapsed) {
  const pane = outputPanes[key];
  if (!pane) return;

  const timestamp =
    new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const isMarkdown = key === "quality" || key === "security" || key === "explain" || key === "commit";

  let resultHtml = "";

  if (isMarkdown) {
    let mdHtml = "";
    try { mdHtml = CDN_OK.marked ? marked.parse(content) : escapeHtml(content); } catch { mdHtml = escapeHtml(content); }
    resultHtml =
      '<div class="markdown-output">' + (CDN_OK.purify ? DOMPurify.sanitize(mdHtml) : mdHtml.replace(/<script[\s\S]*?<\/script>/gi, '')) + "</div>";
  } else {
    const lang = languageSelect.value.toLowerCase();
    var hlLang = "plaintext";
    var highlighted;
    if (CDN_OK.hljs) {
      hlLang = hljs.getLanguage(lang) ? lang : "plaintext";
      try { highlighted = hljs.highlight(content, { language: hlLang }).value; } catch { highlighted = escapeHtml(content); }
    } else {
      highlighted = escapeHtml(content);
    }
    resultHtml =
      '<pre><code class="hljs language-' +
      hlLang +
      '">' +
      highlighted +
      "</code></pre>";
  }

  var metaHtml = '<div class="result-meta"><span>生成时间 ' + timestamp;
  if (elapsed !== null) {
    metaHtml += " · 耗时 " + elapsed + "s";
  }
  metaHtml += "</span></div>";
  pane.innerHTML = resultHtml + metaHtml;

  var scrollContainer = pane.closest(".output-content") || pane.parentElement;
  if (scrollContainer) scrollContainer.scrollTop = 0;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// === Copy ===
function copyResult() {
  const content = state.results[state.currentTab];
  if (!content) return;

  navigator.clipboard
    .writeText(content)
    .then(() => showToast("已复制到剪贴板！"))
    .catch(() => showToast("复制失败，请手动复制", "error"));
}

function updateCopyButton() {
  const hasContent = !!state.results[state.currentTab];
  copyBtn.disabled = !hasContent;
  downloadBtn.disabled = !hasContent;
}

// === Download / Export ===
const LANG_EXT = {
  Java: "java", Python: "py", "C++": "cpp", C: "c",
  JavaScript: "js", TypeScript: "ts", Go: "go", Rust: "rs",
  "C#": "cs", Ruby: "rb", PHP: "php", Swift: "swift",
  Kotlin: "kt", Scala: "scala",
};

function getFileExt() {
  // explain/quality/security → .md; comments/tests → language extension
  const mdTabs = ["explain", "quality", "security"];
  if (mdTabs.includes(state.currentTab)) return "md";
  return LANG_EXT[languageSelect.value] || "txt";
}

function getFileName() {
  const prefix = {
    comments: "commented",
    tests: "test",
    explain: "explanation",
    translate: "translated",
    refactor: "refactored",
    commit: "commit-message",
    quality: "quality-report",
    security: "security-report",
  };
  const base = prefix[state.currentTab] || "output";
  return base + "." + getFileExt();
}

function downloadResult() {
  const content = state.results[state.currentTab];
  if (!content) return;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = getFileName();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("已导出 " + a.download);
}

// === Utility ===
function clearInput() {
  codeInput.value = "";
  fileName.textContent = "";
  fileInput.value = "";
  updateCharCount();
  codeInput.focus();
}

function updateCharCount() {
  const len = codeInput.value.length;
  charCount.textContent = len.toLocaleString() + " 字符";
  charCount.style.color = len > 50000 ? "var(--red)" : "var(--text-muted)";
}

function disableButtons(disabled) {
  actionButtons.forEach((btn) => (btn.disabled = disabled));
}

function showToast(message, type) {
  type = type || "success";
  const existing = $(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  if (type === "error") {
    toast.style.background = "var(--red)";
    toast.style.color = "#fff";
  }
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(function () {
    toast.remove();
  }, 2500);
}

function showError(message) {
  if (state.errorTimeoutId) clearTimeout(state.errorTimeoutId);
  errorText.textContent = message;
  errorBanner.classList.remove("hidden");
  // Auto-dismiss after 8 seconds
  state.errorTimeoutId = setTimeout(function () {
    errorBanner.classList.add("hidden");
  }, 8000);
}

// === History ===
const MODULE_NAMES = {
  comments: "💬 注释生成",
  tests: "🧪 测试生成",
  explain: "🔍 代码解读",
  translate: "🔄 代码翻译",
  refactor: "✂️ 代码重构",
  commit: "📝 提交信息",
  quality: "📊 质量扫描",
  security: "🔒 安全检测",
};

const HISTORY_KEY = "smarttest_history";
const MAX_HISTORY = 10;

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(module, result, inputCode, language) {
  const history = getHistory();
  history.unshift({
    module,
    name: MODULE_NAMES[module] || module,
    result: result.substring(0, 500),
    fullResult: result,
    inputCode: inputCode.substring(0, 200),
    fullInput: inputCode,
    language,
    time: new Date().toLocaleString("zh-CN"),
    timestamp: Date.now(),
  });
  if (history.length > MAX_HISTORY) history.pop();
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // storage full, ignore
  }
  renderHistory();
}

function loadHistory() {
  return getHistory();
}

function renderHistory() {
  const history = getHistory();
  historyCount.textContent = history.length;
  historyList.innerHTML = history.length
    ? history
        .map(
          (item, i) => `<div class="history-item" data-index="${i}" title="点击恢复此记录">
    <div class="history-item-top">
      <span class="history-item-module">${item.name || item.module}</span>
      <span class="history-item-time">${item.time}</span>
    </div>
    <div class="history-item-code">${(item.inputCode || "").replace(/</g, "&lt;")}</div>
  </div>`
        )
        .join("")
    : '<div style="padding:12px 16px;font-size:11px;color:var(--text-muted)">暂无记录，处理代码后自动保存</div>';

  // Bind click to restore history items
  historyList.querySelectorAll(".history-item").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.index, 10);
      restoreHistory(idx);
    });
  });
}

function restoreHistory(index) {
  const history = getHistory();
  const item = history[index];
  if (!item) return;
  codeInput.value = item.fullInput || item.inputCode || "";
  updateCharCount();
  if (item.language) languageSelect.value = item.language;
  if (item.fullResult) {
    state.results[item.module] = item.fullResult;
    switchTab(item.module);
    renderResult(item.module, item.fullResult, "—");
    updateCopyButton();
  }
  showToast("已恢复 " + (item.name || item.module));
  // Scroll to output
  const pane = outputPanes[item.module];
  if (pane) pane.parentElement.scrollTop = 0;
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast("历史记录已清空");
}

// === Stats ===
const STATS_KEY = "smarttest_stats";

function getStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) || { total: 0, chars: 0, time: 0, langs: {} };
  } catch { return { total: 0, chars: 0, time: 0, langs: {} }; }
}

function updateStats(charCount, elapsed, language) {
  const stats = getStats();
  stats.total += 1;
  stats.chars += charCount;
  stats.time += elapsed;
  if (language) { stats.langs[language] = (stats.langs[language] || 0) + 1; }
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch {}
  renderStats();
}

function renderStats() {
  const stats = getStats();
  statTotal.textContent = stats.total.toLocaleString();
  statChars.textContent = stats.chars.toLocaleString();
  const avg = stats.total > 0 ? (stats.time / stats.total).toFixed(1) : "0";
  statAvgTime.textContent = avg;
  const langKeys = Object.keys(stats.langs);
  statLangs.textContent = langKeys.length > 0 ? langKeys.join("/") : "—";
}

// === Theme Toggle ===
function toggleTheme() {
  const html = document.documentElement;
  const isLight = html.getAttribute("data-theme") === "light";
  html.setAttribute("data-theme", isLight ? "dark" : "light");
  themeToggle.textContent = isLight ? "🌙" : "☀️";
  // Persist preference
  try {
    localStorage.setItem("smarttest_theme", isLight ? "dark" : "light");
  } catch {}
}

// Initialize theme from localStorage
(function initTheme() {
  try {
    const saved = localStorage.getItem("smarttest_theme");
    if (saved === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      themeToggle.textContent = "☀️";
    }
  } catch {}
})();

// === Keyboard Shortcuts ===
document.addEventListener("keydown", function (e) {
  // Ctrl+K only when code input is focused
  if ((e.ctrlKey || e.metaKey) && e.key === "k" && document.activeElement === codeInput) {
    e.preventDefault();
    clearInput();
  }
});
