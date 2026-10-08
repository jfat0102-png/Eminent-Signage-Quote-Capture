import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const quoteRequestsTable = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  service: text("service").notNull(),
  budget: text("budget"),
  description: text("description").notNull(),
  contact: text("contact").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
