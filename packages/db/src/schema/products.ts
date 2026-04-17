import { pgEnum, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";

export const unitEnum = pgEnum("unit", ["Stk", "Std", "Pauschal"]);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  defaultPrice: real("default_price").notNull(),
  unit: unitEnum("unit").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
