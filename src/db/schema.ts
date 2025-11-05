import { pgTable, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
})

export const measurementTypes = pgTable("measurement_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const measurementEntries = pgTable(
  "measurement_entries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userDateUnique: uniqueIndex("user_date_unique").on(table.userId, table.date),
  })
)

export const measurementValues = pgTable(
  "measurement_values",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    entryId: integer("entry_id")
      .notNull()
      .references(() => measurementEntries.id, { onDelete: "cascade" }),
    measureTypeId: integer("measure_type_id")
      .notNull()
      .references(() => measurementTypes.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    entryMeasureUnique: uniqueIndex("entry_measure_unique").on(
      table.entryId,
      table.measureTypeId
    ),
  })
)

export const goals = pgTable(
  "goals",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    measureTypeId: integer("measure_type_id")
      .notNull()
      .references(() => measurementTypes.id, { onDelete: "cascade" }),
    targetValue: integer("target_value").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userMeasureGoalUnique: uniqueIndex("user_measure_goal_unique").on(
      table.userId,
      table.measureTypeId
    ),
  })
)

