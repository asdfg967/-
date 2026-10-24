import { sql } from "drizzle-orm";
import { pgTable, serial, timestamp, text, varchar, boolean, index } from "drizzle-orm/pg-core";

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
  ]
);
