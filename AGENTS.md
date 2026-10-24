# AGENTS.md

## 项目概览

班级通知时间管理 H5 应用，移动端优先，面向中学生在微信内置浏览器中使用。核心功能：学生粘贴群通知文字或上传截图，AI 自动识别提取待办事项，生成时间管理表。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **AI**: coze-coding-dev-sdk (LLM + Vision)

## 目录结构

```
src/
├── app/
│   ├── page.tsx              # 主页 - 时间管理表（任务列表）
│   ├── add/page.tsx          # 录入通知页（文字粘贴 + 截图上传）
│   ├── layout.tsx            # 根布局（移动端居中 480px）
│   ├── globals.css           # 全局样式 + 类型色 + 紧急度色
│   └── api/
│       ├── tasks/route.ts    # 任务 CRUD（GET/POST/PUT批量）
│       ├── tasks/[id]/route.ts # 单任务更新/删除（PUT/DELETE）
│       └── extract/route.ts  # AI 提取接口（文字+图片 OCR）
├── components/
│   ├── task-card.tsx         # 任务卡片组件（紧急度着色）
│   ├── task-edit-sheet.tsx   # 编辑任务底部弹出层
│   └── confirm-sheet.tsx     # AI 提取结果确认弹出层
├── hooks/
│   └── use-tasks.ts          # 任务数据 hook + 工具函数
├── lib/utils.ts              # cn() 工具
└── storage/database/
    ├── supabase-client.ts    # Supabase 客户端（service_role_key）
    └── shared/schema.ts      # Drizzle schema 定义
```

## 数据库表

- `tasks`: 主表，存储提取的待办事项
  - 字段: id, title, type(homework/exam/meeting/payment/checkin/other), due_date, location, notes, status(pending/completed), source_text, completed_at, created_at, updated_at
  - RLS: 场景 A（service_role_key 绕过，无 policy）

## API 接口

| 路径 | 方法 | 功能 |
|------|------|------|
| /api/tasks | GET | 列表（支持 status/type 筛选） |
| /api/tasks | POST | 创建单个任务 |
| /api/tasks | PUT | 批量创建任务 |
| /api/tasks/[id] | PUT | 更新任务（含状态切换） |
| /api/tasks/[id] | DELETE | 删除任务 |
| /api/extract | POST | AI 提取（text 或 images） |

## 开发命令

```bash
pnpm dev        # 开发模式
pnpm build      # 生产构建
pnpm start      # 生产启动
```

## 设计规范

- 主色: #10B981（薄荷绿）
- 背景: #F8FAFB
- 移动端优先, max-width 480px
- 大按钮 min-height 48px
- 详见 DESIGN.md
