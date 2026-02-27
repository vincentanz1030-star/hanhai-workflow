import { pgTable, serial, timestamp, varchar, text, integer, boolean, jsonb, index, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

// 系统表 - 保留
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ========== 枚举定义 ==========

// 项目状态枚举
export const projectStatusEnum = pgEnum("project_status", ["pending", "in_progress", "completed", "delayed"]);

// 任务状态枚举
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "completed", "delayed"]);

// 岗位枚举
export const roleEnum = pgEnum("role_type", ["illustration", "product_design", "detail_design", "copywriting", "procurement"]);

// ========== 项目表 ==========

export const projects = pgTable(
	"projects",
	{
		id: varchar("id", { length: 36 })
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 255 }).notNull(),
		salesDate: timestamp("sales_date", { withTimezone: true, mode: 'string' }).notNull(), // 销售日期
		projectConfirmDate: timestamp("project_confirm_date", { withTimezone: true, mode: 'string' }).notNull(), // 项目确认日期
		status: projectStatusEnum("status").default("pending").notNull(),
		description: text("description"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	},
	(table) => [
		index("projects_sales_date_idx").on(table.salesDate),
		index("projects_status_idx").on(table.status),
	]
);

// ========== 任务表 ==========

export const tasks = pgTable(
	"tasks",
	{
		id: varchar("id", { length: 36 })
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		projectId: varchar("project_id", { length: 36 }).notNull().references(() => projects.id, { onDelete: 'cascade' }),
		role: roleEnum("role").notNull(), // 岗位
		taskName: varchar("task_name", { length: 255 }).notNull(), // 任务名称
		taskOrder: integer("task_order").notNull(), // 任务序号 1-5
		description: text("description"), // 任务描述
		progress: integer("progress").default(0).notNull(), // 完成进度 0-100
		estimatedCompletionDate: timestamp("estimated_completion_date", { withTimezone: true, mode: 'string' }), // 预计完成时间
		actualCompletionDate: timestamp("actual_completion_date", { withTimezone: true, mode: 'string' }), // 实际完成时间
		status: taskStatusEnum("status").default("pending").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	},
	(table) => [
		index("tasks_project_id_idx").on(table.projectId),
		index("tasks_role_idx").on(table.role),
		index("tasks_status_idx").on(table.status),
	]
);

// ========== Zod Schemas for Validation ==========

const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Project schemas
export const insertProjectSchema = createCoercedInsertSchema(projects).pick({
  name: true,
  salesDate: true,
  projectConfirmDate: true,
  description: true,
});

export const updateProjectSchema = createCoercedInsertSchema(projects)
  .pick({
    name: true,
    salesDate: true,
    projectConfirmDate: true,
    status: true,
    description: true,
  })
  .partial();

// Task schemas
export const insertTaskSchema = createCoercedInsertSchema(tasks).pick({
  projectId: true,
  role: true,
  taskName: true,
  taskOrder: true,
  description: true,
  progress: true,
  estimatedCompletionDate: true,
  actualCompletionDate: true,
  status: true,
});

export const updateTaskSchema = createCoercedInsertSchema(tasks)
  .pick({
    taskName: true,
    description: true,
    progress: true,
    estimatedCompletionDate: true,
    actualCompletionDate: true,
    status: true,
  })
  .partial();

// TypeScript types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
