import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expires_at: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  address: text("address"),
  description: text("description"),
  price: text("price"),
  lat: decimal("lat"),
  lng: decimal("lng"),
  user_id: text("user_id"),
  images: text("images").array(),
  bedrooms: integer("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  area: integer("area"),
  type: text("type"),
  contact: text("contact"),
  created_at: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  title: true,
  address: true,
  description: true,
  price: true,
  lat: true,
  lng: true,
  user_id: true,
  images: true,
  bedrooms: true,
  bathrooms: true,
  area: true,
  type: true,
  contact: true,
});

export const insertPasswordResetSchema = createInsertSchema(passwordResets).pick({
  email: true,
  token: true,
  expires_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
