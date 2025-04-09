import { pgTable, text, serial, integer, boolean, timestamp, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quotes table
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  quoteType: text("quote_type").notNull(), // "term" or "fex"
  faceAmount: integer("face_amount").notNull(),
  birthday: text("birthday").notNull(),
  gender: text("gender").notNull(),
  tobacco: text("tobacco").notNull(),
  termLength: text("term_length"),
  underwritingClass: text("underwriting_class"),
  state: text("state").notNull(),
  healthConditions: json("health_conditions").$type<Array<{
    id: string;
    name: string;
    answers: Record<string, string>;
  }>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Carriers table
export const carriers = pgTable("carriers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "term", "fex", or "both"
  isActive: boolean("is_active").default(true).notNull(),
});

// CarrierPreferences table
export const carrierPreferences = pgTable("carrier_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  carrierId: integer("carrier_id").references(() => carriers.id).notNull(),
  isPreferred: boolean("is_preferred").default(true).notNull(),
});

// Term Quotes table
export const termQuotes = pgTable("term", {
  id: serial("id").primaryKey(),
  faceAmount: integer("face_amount").notNull(),
  sex: text("sex").notNull(),
  termLength: text("term_length").notNull(),
  state: text("state").notNull(),
  age: integer("age").notNull(),
  tobacco: text("tobacco").notNull(),
  company: text("company").notNull(),
  planName: text("plan_name").notNull(),
  tierName: text("tier_name").notNull(),
  monthlyRate: decimal("monthly_rate").notNull(),
  annualRate: decimal("annual_rate").notNull(),
  warnings: text("warnings"),
  logoUrl: text("logo_url"),
  eapp: text("eapp"),
});

// FEX Quotes table
export const fexQuotes = pgTable("fex", {
  id: serial("id").primaryKey(),
  faceAmount: integer("face_amount").notNull(),
  sex: text("sex").notNull(),
  state: text("state").notNull(),
  age: integer("age").notNull(),
  tobacco: text("tobacco").notNull(),
  underwritingClass: text("underwriting_class").notNull(),
  company: text("company").notNull(),
  planName: text("plan_name").notNull(),
  tierName: text("tier_name").notNull(),
  monthlyRate: decimal("monthly_rate").notNull(),
  annualRate: decimal("annual_rate").notNull(),
  warnings: text("warnings"),
  logoUrl: text("logo_url"),
  eapp: text("eapp"),
});

// Schemas for insert operations
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
});

export const insertCarrierSchema = createInsertSchema(carriers).omit({
  id: true,
});

export const insertCarrierPreferenceSchema = createInsertSchema(carrierPreferences).omit({
  id: true,
});

// Types for model operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

export type InsertCarrier = z.infer<typeof insertCarrierSchema>;
export type Carrier = typeof carriers.$inferSelect;

export type InsertCarrierPreference = z.infer<typeof insertCarrierPreferenceSchema>;
export type CarrierPreference = typeof carrierPreferences.$inferSelect;
