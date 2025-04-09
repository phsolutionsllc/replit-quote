"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertCarrierPreferenceSchema = exports.insertCarrierSchema = exports.insertQuoteSchema = exports.insertUserSchema = exports.fexQuotes = exports.termQuotes = exports.carrierPreferences = exports.carriers = exports.quotes = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
// Users table
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Quotes table
exports.quotes = (0, pg_core_1.pgTable)("quotes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(function () { return exports.users.id; }),
    quoteType: (0, pg_core_1.text)("quote_type").notNull(), // "term" or "fex"
    faceAmount: (0, pg_core_1.integer)("face_amount").notNull(),
    birthday: (0, pg_core_1.text)("birthday").notNull(),
    gender: (0, pg_core_1.text)("gender").notNull(),
    tobacco: (0, pg_core_1.text)("tobacco").notNull(),
    termLength: (0, pg_core_1.text)("term_length"),
    underwritingClass: (0, pg_core_1.text)("underwriting_class"),
    state: (0, pg_core_1.text)("state").notNull(),
    healthConditions: (0, pg_core_1.json)("health_conditions").$type(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
// Carriers table
exports.carriers = (0, pg_core_1.pgTable)("carriers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    type: (0, pg_core_1.text)("type").notNull(), // "term", "fex", or "both"
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
});
// CarrierPreferences table
exports.carrierPreferences = (0, pg_core_1.pgTable)("carrier_preferences", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(function () { return exports.users.id; }).notNull(),
    carrierId: (0, pg_core_1.integer)("carrier_id").references(function () { return exports.carriers.id; }).notNull(),
    isPreferred: (0, pg_core_1.boolean)("is_preferred").default(true).notNull(),
});
// Term Quotes table
exports.termQuotes = (0, pg_core_1.pgTable)("term", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    faceAmount: (0, pg_core_1.integer)("face_amount").notNull(),
    sex: (0, pg_core_1.text)("sex").notNull(),
    termLength: (0, pg_core_1.text)("term_length").notNull(),
    state: (0, pg_core_1.text)("state").notNull(),
    age: (0, pg_core_1.integer)("age").notNull(),
    tobacco: (0, pg_core_1.text)("tobacco").notNull(),
    company: (0, pg_core_1.text)("company").notNull(),
    planName: (0, pg_core_1.text)("plan_name").notNull(),
    tierName: (0, pg_core_1.text)("tier_name").notNull(),
    monthlyRate: (0, pg_core_1.decimal)("monthly_rate").notNull(),
    annualRate: (0, pg_core_1.decimal)("annual_rate").notNull(),
    warnings: (0, pg_core_1.text)("warnings"),
    logoUrl: (0, pg_core_1.text)("logo_url"),
    eapp: (0, pg_core_1.text)("eapp"),
});
// FEX Quotes table
exports.fexQuotes = (0, pg_core_1.pgTable)("fex", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    faceAmount: (0, pg_core_1.integer)("face_amount").notNull(),
    sex: (0, pg_core_1.text)("sex").notNull(),
    state: (0, pg_core_1.text)("state").notNull(),
    age: (0, pg_core_1.integer)("age").notNull(),
    tobacco: (0, pg_core_1.text)("tobacco").notNull(),
    underwritingClass: (0, pg_core_1.text)("underwriting_class").notNull(),
    company: (0, pg_core_1.text)("company").notNull(),
    planName: (0, pg_core_1.text)("plan_name").notNull(),
    tierName: (0, pg_core_1.text)("tier_name").notNull(),
    monthlyRate: (0, pg_core_1.decimal)("monthly_rate").notNull(),
    annualRate: (0, pg_core_1.decimal)("annual_rate").notNull(),
    warnings: (0, pg_core_1.text)("warnings"),
    logoUrl: (0, pg_core_1.text)("logo_url"),
    eapp: (0, pg_core_1.text)("eapp"),
});
// Schemas for insert operations
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).omit({
    id: true,
    createdAt: true,
});
exports.insertQuoteSchema = (0, drizzle_zod_1.createInsertSchema)(exports.quotes).omit({
    id: true,
    createdAt: true,
});
exports.insertCarrierSchema = (0, drizzle_zod_1.createInsertSchema)(exports.carriers).omit({
    id: true,
});
exports.insertCarrierPreferenceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.carrierPreferences).omit({
    id: true,
});
