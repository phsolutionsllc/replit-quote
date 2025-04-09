"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var db_1 = require("./db");
var drizzle_orm_1 = require("drizzle-orm");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var testResult, tables, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Pushing schema to database...');
                    console.log('Database URL:', process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 11, , 12]);
                    // Test connection first
                    console.log('Testing database connection...');
                    return [4 /*yield*/, db_1.db.execute((0, drizzle_orm_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1 as test"], ["SELECT 1 as test"]))))];
                case 2:
                    testResult = _a.sent();
                    console.log('Connection test result:', testResult);
                    // Create each table from the schema
                    return [4 /*yield*/, db_1.db.execute((0, drizzle_orm_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["CREATE SCHEMA IF NOT EXISTS public"], ["CREATE SCHEMA IF NOT EXISTS public"]))))];
                case 3:
                    // Create each table from the schema
                    _a.sent();
                    // Create users table
                    return [4 /*yield*/, db_1.db.execute((0, drizzle_orm_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      CREATE TABLE IF NOT EXISTS users (\n        id SERIAL PRIMARY KEY,\n        username TEXT NOT NULL UNIQUE,\n        password TEXT NOT NULL,\n        created_at TIMESTAMP NOT NULL DEFAULT NOW()\n      )\n    "], ["\n      CREATE TABLE IF NOT EXISTS users (\n        id SERIAL PRIMARY KEY,\n        username TEXT NOT NULL UNIQUE,\n        password TEXT NOT NULL,\n        created_at TIMESTAMP NOT NULL DEFAULT NOW()\n      )\n    "]))))];
                case 4:
                    // Create users table
                    _a.sent();
                    // Create quotes table
                    return [4 /*yield*/, db_1.db.execute((0, drizzle_orm_1.sql)(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n      CREATE TABLE IF NOT EXISTS quotes (\n        id SERIAL PRIMARY KEY,\n        user_id INTEGER REFERENCES users(id),\n        quote_type TEXT NOT NULL,\n        face_amount INTEGER NOT NULL,\n        birthday TEXT NOT NULL,\n        gender TEXT NOT NULL,\n        tobacco TEXT NOT NULL,\n        term_length TEXT,\n        underwriting_class TEXT,\n        state TEXT NOT NULL,\n        health_conditions JSONB,\n        created_at TIMESTAMP NOT NULL DEFAULT NOW()\n      )\n    "], ["\n      CREATE TABLE IF NOT EXISTS quotes (\n        id SERIAL PRIMARY KEY,\n        user_id INTEGER REFERENCES users(id),\n        quote_type TEXT NOT NULL,\n        face_amount INTEGER NOT NULL,\n        birthday TEXT NOT NULL,\n        gender TEXT NOT NULL,\n        tobacco TEXT NOT NULL,\n        term_length TEXT,\n        underwriting_class TEXT,\n        state TEXT NOT NULL,\n        health_conditions JSONB,\n        created_at TIMESTAMP NOT NULL DEFAULT NOW()\n      )\n    "]))))];
                case 5:
                    // Create quotes table
                    _a.sent();
                    // Create carriers table
                    return [4 /*yield*/, db_1.db.execute((0, drizzle_orm_1.sql)(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n      CREATE TABLE IF NOT EXISTS carriers (\n        id SERIAL PRIMARY KEY,\n        name TEXT NOT NULL,\n        type TEXT NOT NULL,\n        is_active BOOLEAN NOT NULL DEFAULT TRUE\n      )\n    "], ["\n      CREATE TABLE IF NOT EXISTS carriers (\n        id SERIAL PRIMARY KEY,\n        name TEXT NOT NULL,\n        type TEXT NOT NULL,\n        is_active BOOLEAN NOT NULL DEFAULT TRUE\n      )\n    "]))))];
                case 6:
                    // Create carriers table
                    _a.sent();
                    // Create carrier_preferences table
                    return [4 /*yield*/, db_1.db.execute((0, drizzle_orm_1.sql)(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n      CREATE TABLE IF NOT EXISTS carrier_preferences (\n        id SERIAL PRIMARY KEY,\n        user_id INTEGER NOT NULL REFERENCES users(id),\n        carrier_id INTEGER NOT NULL REFERENCES carriers(id),\n        is_preferred BOOLEAN NOT NULL DEFAULT TRUE\n      )\n    "], ["\n      CREATE TABLE IF NOT EXISTS carrier_preferences (\n        id SERIAL PRIMARY KEY,\n        user_id INTEGER NOT NULL REFERENCES users(id),\n        carrier_id INTEGER NOT NULL REFERENCES carriers(id),\n        is_preferred BOOLEAN NOT NULL DEFAULT TRUE\n      )\n    "]))))];
                case 7:
                    // Create carrier_preferences table
                    _a.sent();
                    // Create term table
                    return [4 /*yield*/, db_1.db.execute((0, drizzle_orm_1.sql)(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n      CREATE TABLE IF NOT EXISTS term (\n        id SERIAL PRIMARY KEY,\n        face_amount INTEGER NOT NULL,\n        sex TEXT NOT NULL,\n        term_length TEXT NOT NULL,\n        state TEXT NOT NULL,\n        age INTEGER NOT NULL,\n        tobacco TEXT NOT NULL,\n        company TEXT NOT NULL,\n        plan_name TEXT NOT NULL,\n        tier_name TEXT NOT NULL,\n        monthly_rate DECIMAL NOT NULL,\n        annual_rate DECIMAL NOT NULL,\n        warnings TEXT,\n        logo_url TEXT,\n        eapp TEXT\n      )\n    "], ["\n      CREATE TABLE IF NOT EXISTS term (\n        id SERIAL PRIMARY KEY,\n        face_amount INTEGER NOT NULL,\n        sex TEXT NOT NULL,\n        term_length TEXT NOT NULL,\n        state TEXT NOT NULL,\n        age INTEGER NOT NULL,\n        tobacco TEXT NOT NULL,\n        company TEXT NOT NULL,\n        plan_name TEXT NOT NULL,\n        tier_name TEXT NOT NULL,\n        monthly_rate DECIMAL NOT NULL,\n        annual_rate DECIMAL NOT NULL,\n        warnings TEXT,\n        logo_url TEXT,\n        eapp TEXT\n      )\n    "]))))];
                case 8:
                    // Create term table
                    _a.sent();
                    // Create fex table
                    return [4 /*yield*/, db_1.db.execute((0, drizzle_orm_1.sql)(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n      CREATE TABLE IF NOT EXISTS fex (\n        id SERIAL PRIMARY KEY,\n        face_amount INTEGER NOT NULL,\n        sex TEXT NOT NULL,\n        state TEXT NOT NULL,\n        age INTEGER NOT NULL,\n        tobacco TEXT NOT NULL,\n        underwriting_class TEXT NOT NULL,\n        company TEXT NOT NULL,\n        plan_name TEXT NOT NULL,\n        tier_name TEXT NOT NULL,\n        monthly_rate DECIMAL NOT NULL,\n        annual_rate DECIMAL NOT NULL,\n        warnings TEXT,\n        logo_url TEXT,\n        eapp TEXT\n      )\n    "], ["\n      CREATE TABLE IF NOT EXISTS fex (\n        id SERIAL PRIMARY KEY,\n        face_amount INTEGER NOT NULL,\n        sex TEXT NOT NULL,\n        state TEXT NOT NULL,\n        age INTEGER NOT NULL,\n        tobacco TEXT NOT NULL,\n        underwriting_class TEXT NOT NULL,\n        company TEXT NOT NULL,\n        plan_name TEXT NOT NULL,\n        tier_name TEXT NOT NULL,\n        monthly_rate DECIMAL NOT NULL,\n        annual_rate DECIMAL NOT NULL,\n        warnings TEXT,\n        logo_url TEXT,\n        eapp TEXT\n      )\n    "]))))];
                case 9:
                    // Create fex table
                    _a.sent();
                    return [4 /*yield*/, db_1.db.execute((0, drizzle_orm_1.sql)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\n      SELECT table_name \n      FROM information_schema.tables \n      WHERE table_schema = 'public'\n    "], ["\n      SELECT table_name \n      FROM information_schema.tables \n      WHERE table_schema = 'public'\n    "]))))];
                case 10:
                    tables = _a.sent();
                    console.log('Tables created:', tables);
                    console.log('Schema push complete!');
                    process.exit(0);
                    return [3 /*break*/, 12];
                case 11:
                    error_1 = _a.sent();
                    console.error('Schema push failed:', error_1);
                    console.error('Error details:', JSON.stringify(error_1, null, 2));
                    process.exit(1);
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    });
}
main();
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9;
