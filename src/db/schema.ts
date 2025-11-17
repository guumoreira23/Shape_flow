import { pgTable, text, integer, timestamp, uniqueIndex, real } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  role: text("role").notNull().default("user"), // 'user' ou 'admin'
  theme: text("theme").default("dark"), // 'light' ou 'dark'
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
    notes: text("notes"), // Campo opcional de observações/notas
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
    deadline: timestamp("deadline"),
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

// Fase 3 - Diário Alimentar
export const foodItems = pgTable("food_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  brand: text("brand"),
  barcode: text("barcode"), // Código de barras
  calories: integer("calories").notNull(), // Por 100g ou porção padrão
  protein: real("protein").notNull(), // Gramas por 100g
  carbs: real("carbs").notNull(), // Gramas por 100g
  fat: real("fat").notNull(), // Gramas por 100g
  fiber: real("fiber").default(0),
  servingSize: integer("serving_size").default(100), // Tamanho da porção padrão em gramas
  unit: text("unit").default("g"), // Unidade da porção (g, ml, unidade)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const mealEntries = pgTable(
  "meal_entries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),
    mealType: text("meal_type").notNull(), // café, almoço, jantar, lanche
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userDateMealUnique: uniqueIndex("user_date_meal_unique").on(
      table.userId,
      table.date,
      table.mealType
    ),
  })
)

export const mealFoods = pgTable("meal_foods", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  mealEntryId: integer("meal_entry_id")
    .notNull()
    .references(() => mealEntries.id, { onDelete: "cascade" }),
  foodItemId: integer("food_item_id")
    .notNull()
    .references(() => foodItems.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull(), // Quantidade em gramas/ml/unidades
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Metas nutricionais diárias
export const nutritionGoals = pgTable(
  "nutrition_goals",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetCalories: integer("target_calories").notNull().default(2000),
    targetProtein: real("target_protein").notNull().default(150), // gramas
    targetCarbs: real("target_carbs").notNull().default(200), // gramas
    targetFat: real("target_fat").notNull().default(65), // gramas
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userNutritionGoalUnique: uniqueIndex("user_nutrition_goal_unique").on(
      table.userId
    ),
  })
)

// Fase 4 - Hidratação e Jejum Intermitente
export const waterIntake = pgTable("water_intake", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // Quantidade em ml
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  date: timestamp("date").notNull(), // Data do registro (sem hora)
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const waterGoals = pgTable(
  "water_goals",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetAmount: integer("target_amount").notNull().default(2000), // Meta diária em ml
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userWaterGoalUnique: uniqueIndex("user_water_goal_unique").on(table.userId),
  })
)

export const fastingSchedules = pgTable(
  "fasting_schedules",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fastingType: text("fasting_type").notNull(), // "16:8", "14:10", "18:6", "20:4", "custom"
    startTime: timestamp("start_time").notNull(), // Início do período de jejum
    endTime: timestamp("end_time").notNull(), // Fim do período de jejum
    isActive: integer("is_active").notNull().default(1), // 1 = ativo, 0 = inativo
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userActiveFastingUnique: uniqueIndex("user_active_fasting_unique").on(
      table.userId,
      table.isActive
    ),
  })
)

