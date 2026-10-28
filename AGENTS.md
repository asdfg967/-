# AGENTS.md

## 项目概览

学生生活管理台 H5 应用（由「班级通知时间管理」扩展而来），移动端优先，面向中学生在微信内置浏览器/iOS Safari 中使用。底部 4 Tab：①待办（通知 AI 提取 + 时间管理表）②周历（周视图 + 每日时间轴 + 内嵌记账）③习惯（打卡 + 连胜统计）④日记（朋友圈式图文流）。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL, Drizzle schema)
- **对象存储**: coze-coding-dev-sdk S3 兼容存储（日记图片）
- **AI**: coze-coding-dev-sdk (LLM doubao-pro + Vision，密钥仅在服务端)

## 目录结构

```
src/
├── app/
│   ├── page.tsx              # 主页（4 Tab 容器，Tab 组件懒渲染）
│   ├── add/page.tsx          # 录入通知页（文字粘贴 + 截图上传）
│   ├── layout.tsx            # 根布局（移动端居中 480px）
│   ├── globals.css           # 全局样式 + 类型色 + 紧急度色 + 动画
│   └── api/
│       ├── tasks/route.ts        # 待办 GET/POST(单个)/PUT(批量)
│       ├── tasks/[id]/route.ts   # 待办 PUT/DELETE（含日期范围筛选）
│       ├── extract/route.ts      # AI 提取（文字 + 图片 OCR）
│       ├── ledger/route.ts       # 记账 GET(日期范围)/POST
│       ├── ledger/[id]/route.ts  # 记账 PUT/DELETE
│       ├── settings/route.ts     # 初始余额等 GET/PUT（upsert）
│       ├── diaries/route.ts      # 日记 GET(列表)/POST(upsert 按日期)
│       ├── diaries/[id]/route.ts # 日记 PUT/DELETE
│       ├── diaries/upload/route.ts # 图片上传 form-data，返回 key+url
│       ├── habits/route.ts       # 习惯 GET(含今日/近7天状态)/POST
│       ├── habits/[id]/route.ts  # 习惯 PUT/DELETE
│       └── habits/[id]/checkin/route.ts # POST 打卡/取消，GET 月历+累计
├── components/
│   ├── bottom-nav.tsx        # 底部 4 Tab 导航（hash 路由 #todo/#week/#habit/#diary）
│   ├── todo-tab.tsx          # Tab① 待办时间管理表
│   ├── week-tab.tsx          # Tab② 周视图 + 每日时间轴
│   ├── ledger-panel.tsx      # 周历内嵌记账面板
│   ├── ledger-sheet.tsx      # 记一笔弹层
│   ├── habit-tab.tsx         # Tab③ 习惯卡片列表
│   ├── habit-edit-sheet.tsx  # 新建/编辑习惯
│   ├── habit-stats-sheet.tsx # 习惯月历热力 + 连胜统计
│   ├── diary-tab.tsx         # Tab④ 朋友圈式日记流 + 顶部月历
│   ├── diary-edit-sheet.tsx  # 写日记（多图上传/心情/天气/位置）
│   ├── plan-edit-sheet.tsx   # 时间轴手动计划编辑
│   ├── task-card.tsx / task-edit-sheet.tsx / confirm-sheet.tsx
├── hooks/
│   ├── use-tasks.ts          # 待办数据 hook + 紧急度/时间格式化
│   └── use-ledger.ts         # 记账数据 hook（日/周汇总、累计余额）
├── lib/
│   ├── date-utils.ts         # 本地时区日期/周工具
│   ├── habit-types.ts        # 习惯频率/连胜计算
│   └── diary-types.ts        # 日记类型
└── storage/
    ├── database/supabase-client.ts + shared/schema.ts
    └── s3.ts                 # 对象存储客户端
```

## 数据库表

| 表 | 说明 |
|---|---|
| `tasks` | 待办/计划。新增 start_time、end_time、is_manual、create_type、color（兼容通知提取） |
| `ledger_records` | 记账流水（kind=income/expense, category, amount, record_date） |
| `app_settings` | 键值设置（initial_balance 初始余额） |
| `diaries` | 日记（diary_date 唯一，content, image_keys[], mood, tags 存 weather:emoji, location） |
| `habit_defs` | 习惯定义（freq_type=daily/weekly_count/weekly_days, weekly_target, weekly_days[], reminder_time） |
| `habit_checkins` | 习惯打卡（habit_id + checkin_date 唯一） |

**RLS**：单用户 MVP，所有表均 DISABLE ROW LEVEL SECURITY（service 侧统一访问），不要对新表只 ENABLE 不建 policy——anon key 会被静默过滤导致 SELECT 空结果。

## API 关键约定

- 日期筛选：tasks/ledger 的 GET 支持 `start_date`/`end_date`（YYYY-MM-DD，本地日期）。
- 习惯字段：DB 列名为 `freq_type`、`reminder_time`（勿写成 frequency_type）。
- 打卡：`POST /api/habits/:id/checkin?date=YYYY-MM-DD`（toggle）；`GET ...?month=YYYY-MM` 返回 month_dates/all_dates/total。
- 日记图片：先 POST multipart 到 `/api/diaries/upload` 拿 key+url，保存时提交 image_keys；天气以 `weather:emoji` 存入 tags。

## 开发命令

```bash
pnpm dev        # 开发模式
pnpm build      # 生产构建
pnpm start      # 生产启动
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
