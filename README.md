# AV Benchmark Pro (杀软能力对比平台)

这是一个基于 React 的杀毒软件能力对比工具，支持雷达图可视化、动态评分和 AI 分析。

## 🚀 快速开始 (Windows)

1. **前提条件**: 确保您的电脑上安装了 [Node.js](https://nodejs.org/)。
2. **运行**: 直接双击项目根目录下的 `start_app.bat` 文件。
   - 脚本会自动安装依赖（如果是第一次运行）。
   - 启动后会自动打开默认浏览器访问网站。

## 🌐 Web 服务器部署 (生产环境)

如果您想将其部署到互联网上（例如 GitHub Pages, Vercel, 或 Nginx）：

1. **构建**:
   打开终端运行以下命令：
   ```bash
   npm install
   npm run build
   ```
2. **部署**:
   构建完成后，会生成一个 `dist` 目录。该目录包含所有静态文件（HTML, CSS, JS）。您可以将 `dist` 目录中的内容上传到任何静态网站托管服务。

## 🔑 API Key 配置

要使用 AI 分析功能（Gemini），您需要在运行环境中配置 `API_KEY`。
- **本地开发**: 在根目录创建 `.env` 文件，添加 `API_KEY=your_key_here`。
- **生产环境**: 在您的托管平台（如 Vercel）的环境变量设置中添加 `API_KEY`。

## 🛠️ 技术栈

- React 18
- Vite
- Tailwind CSS
- Recharts (图表)
- Google Gemini API (AI 分析)
