# 随手记 - 轻量级个人记账工具

基于 Electron + Vue3 + TypeScript 开发的桌面记账应用。

## 功能特性

### 核心功能
- ✅ 手动记录收入和支出
- ✅ 支持多种分类（餐饮、交通、购物、工资、奖金等）
- ✅ 每日收支统计和分析
- ✅ 每月自动生成 Markdown 格式总结报告
- ✅ 7天支出趋势图表

### 数据管理
- ✅ 本地 JSON 数据存储
- ✅ 数据导出（JSON/CSV 格式）
- ✅ 数据导入（JSON/CSV 格式）

### 其他
- ✅ 浅色/深色主题切换
- ✅ 预算设置和超支提醒
- ✅ 快捷键支持（Ctrl+N 新建记账）

## 项目结构

```
accounting-tool/
├── src/
│   ├── main/           # Electron 主进程
│   ├── preload/        # 预加载脚本
│   └── renderer/       # Vue3 渲染进程
│       └── src/
│           ├── views/      # 页面组件
│           ├── components/ # 公共组件
│           ├── stores/    # Pinia 状态管理
│           └── router/    # Vue Router
├── dist/               # 构建输出
│   ├── win-unpacked/   # 未打包的应用
│   └── 随手记-1.0.0-Setup.exe  # 安装包
└── package.json
```

## 快速开始

### 开发模式

```bash
cd E:\projects\accounting-tool
npm run dev
```

### 构建安装包

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 使用说明

### 记账
1. 点击「记一笔」按钮或使用快捷键 Ctrl+N
2. 选择收入/支出类型
3. 输入金额和选择分类
4. 点击确认保存

### 查看分析
- 切换到「分析」页面
- 可选择日期查看历史数据
- 查看分类占比和7天趋势

### 月度报告
- 切换到「月报」页面
- 点击「生成本月报告」生成当月总结
- 支持查看历史月份报告
- 报告自动保存为 Markdown 文件

### 数据导出/导入
- 在「设置」页面中进行
- 支持 JSON 和 CSV 格式

## 安装

运行 `dist\随手记-1.0.0-Setup.exe` 完成安装。

或者直接运行 `dist\win-unpacked\随手记.exe` 免安装版本。
