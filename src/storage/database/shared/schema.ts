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
export const roleEnum = pgEnum("role_type", [
  "illustration",
  "product_design",
  "detail_design",
  "copywriting",
  "procurement",
  "packaging_design",
  "finance",
  "customer_service",
  "warehouse",
]);

// 品牌枚举
export const brandEnum = pgEnum("brand_type", [
  "he_zhe",
  "baobao",
  "ai_he",
  "bao_deng_yuan",
  "all", // 全部/集团
]);

// ========== 项目表 ==========

export const projects = pgTable(
	"projects",
	{
		id: varchar("id", { length: 36 })
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		name: varchar("name", { length: 255 }).notNull(),
		brand: brandEnum("brand").notNull(), // 品牌：禾哲、BAOBAO、爱禾、宝登源
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
		index("projects_brand_idx").on(table.brand),
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
		imageUrl: text("image_url"), // 任务图片URL 1
		imageUrl2: text("image_url_2"), // 任务图片URL 2
		imageUrl3: text("image_url_3"), // 任务图片URL 3
		customProgressLabels: jsonb("custom_progress_labels"), // 自定义进度标签 {"0": "待开始", "50": "进行中", "100": "已完成"}
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

// ========== 反馈需求表 ==========

export const feedbackEnum = pgEnum("feedback_type", ["suggestion", "issue", "question", "other"]);

export const feedback = pgTable(
	"feedback",
	{
		id: varchar("id", { length: 36 })
			.primaryKey()
			.default(sql`gen_random_uuid()`),
		type: feedbackEnum("type").notNull(), // 反馈类型
		brand: brandEnum("brand").notNull(), // 关联品牌
		role: roleEnum("role"), // 关联岗位
		projectId: varchar("project_id", { length: 36 }).references(() => projects.id, { onDelete: 'set null' }), // 关联项目
		title: varchar("title", { length: 255 }).notNull(), // 标题
		content: text("content").notNull(), // 内容
		status: varchar("status", { length: 20 }).default("pending").notNull(), // 状态 pending, in_review, resolved
		priority: varchar("priority", { length: 20 }).default("medium"), // 优先级 low, medium, high
		createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
		resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: 'string' }), // 解决时间
	},
	(table) => [
		index("feedback_type_idx").on(table.type),
		index("feedback_status_idx").on(table.status),
		index("feedback_role_idx").on(table.role),
		index("feedback_project_idx").on(table.projectId),
		index("feedback_brand_idx").on(table.brand),
	]
);

// ========== Zod Schemas for Validation ==========

const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

// Project schemas
export const insertProjectSchema = createCoercedInsertSchema(projects).pick({
  name: true,
  brand: true,
  salesDate: true,
  projectConfirmDate: true,
  description: true,
});

export const updateProjectSchema = createCoercedInsertSchema(projects)
  .pick({
    name: true,
    brand: true,
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
  imageUrl: true,
  imageUrl2: true,
  imageUrl3: true,
  customProgressLabels: true,
  estimatedCompletionDate: true,
  actualCompletionDate: true,
  status: true,
});

export const updateTaskSchema = createCoercedInsertSchema(tasks)
  .pick({
    taskName: true,
    description: true,
    progress: true,
    imageUrl: true,
    imageUrl2: true,
    imageUrl3: true,
    customProgressLabels: true,
    estimatedCompletionDate: true,
    actualCompletionDate: true,
    status: true,
  })
  .partial();

// Feedback schemas
export const insertFeedbackSchema = createCoercedInsertSchema(feedback).pick({
  type: true,
  brand: true,
  role: true,
  projectId: true,
  title: true,
  content: true,
  priority: true,
});

export const updateFeedbackSchema = createCoercedInsertSchema(feedback)
  .pick({
    status: true,
    priority: true,
  })
  .partial();

// TypeScript types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type UpdateFeedback = z.infer<typeof updateFeedbackSchema>;
