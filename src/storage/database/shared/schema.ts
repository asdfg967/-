import { sql } from "drizzle-orm";
import { pgTable, serial, timestamp, date, text, varchar, boolean, numeric, jsonb, integer, uniqueIndex, index } from "drizzle-orm/pg-core";

export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const tasks = pgTable(
  "tasks",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    title: varchar("title", { length: 255 }).notNull(),
    type: varchar("type", { length: 20 }).notNull().default("other"),
    due_date: timestamp("due_date", { withTimezone: true }),
    // 手动计划：起始时间（与 due_date 作为结束时间配合）
    start_time: timestamp("start_time", { withTimezone: true }),
    // 是否手动安排的计划（区别于通知提取的待办）
    is_manual: boolean("is_manual").default(false).notNull(),
    // 手动计划自定义颜色
    color: varchar("color", { length: 20 }),
    location: varchar("location", { length: 255 }),
    notes: text("notes"),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    source_text: text("source_text"),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("tasks_status_idx").on(table.status),
    index("tasks_due_date_idx").on(table.due_date),
    index("tasks_type_idx").on(table.type),
    index("tasks_created_at_idx").on(table.created_at),
    index("tasks_is_manual_idx").on(table.is_manual),
  ]
);

// 记账流水
export const ledgerRecords = pgTable(
  "ledger_records",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    // income / expense
    kind: varchar("kind", { length: 10 }).notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    category: varchar("category", { length: 30 }).notNull(),
    record_date: date("record_date").notNull(),
    notes: text("notes"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("ledger_records_date_idx").on(table.record_date),
    index("ledger_records_kind_idx").on(table.kind),
    index("ledger_records_created_idx").on(table.created_at),
  ]
);

// 应用设置（键值对，如初始余额）
export const appSettings = pgTable("app_settings", {
  key: varchar("key", { length: 50 }).primaryKey(),
  value: text("value"),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 日记（每天一篇）
export const diaries = pgTable(
  "diaries",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    diary_date: date("diary_date").notNull(),
    content: text("content").notNull().default(""),
    // 图片对象 key 数组（读取时动态生成签名 URL）
    imageKeys: jsonb("image_keys").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
    location: varchar("location", { length: 255 }),
    mood: varchar("mood", { length: 10 }),
    tags: varchar("tags", { length: 255 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("diaries_date_unique_idx").on(table.diary_date),
  ]
);

// 习惯定义
export const habitDefs = pgTable(
  "habit_defs",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 50 }).notNull(),
    icon: varchar("icon", { length: 10 }).notNull().default("⭐"),
    color: varchar("color", { length: 20 }).notNull().default("#10B981"),
    // daily / weekly_count / weekly_days
    freqType: varchar("freq_type", { length: 20 }).notNull().default("daily"),
    weeklyTarget: integer("weekly_target").default(7),
    // 每周几打卡：0=周日...6=周六
    weeklyDays: jsonb("weekly_days").$type<number[]>().default(sql`'[]'::jsonb`).notNull(),
    reminderTime: varchar("reminder_time", { length: 5 }),
    start_date: date("start_date").notNull(),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("habit_defs_active_idx").on(table.is_active),
  ]
);

// 习惯打卡记录
export const habitCheckins = pgTable(
  "habit_checkins",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    habit_id: varchar("habit_id", { length: 36 }).notNull().references(() => habitDefs.id, { onDelete: "cascade" }),
    checkin_date: date("checkin_date").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("habit_checkins_habit_date_unique_idx").on(table.habit_id, table.checkin_date),
    index("habit_checkins_date_idx").on(table.checkin_date),
  ]
);
