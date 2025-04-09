CREATE TABLE "carrier_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"carrier_id" integer NOT NULL,
	"is_preferred" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carriers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fex" (
	"id" serial PRIMARY KEY NOT NULL,
	"face_amount" integer NOT NULL,
	"sex" text NOT NULL,
	"state" text NOT NULL,
	"age" integer NOT NULL,
	"tobacco" text NOT NULL,
	"underwriting_class" text NOT NULL,
	"company" text NOT NULL,
	"plan_name" text NOT NULL,
	"tier_name" text NOT NULL,
	"monthly_rate" numeric NOT NULL,
	"annual_rate" numeric NOT NULL,
	"warnings" text,
	"logo_url" text,
	"eapp" text
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"quote_type" text NOT NULL,
	"face_amount" integer NOT NULL,
	"birthday" text NOT NULL,
	"gender" text NOT NULL,
	"tobacco" text NOT NULL,
	"term_length" text,
	"underwriting_class" text,
	"state" text NOT NULL,
	"health_conditions" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "term" (
	"id" serial PRIMARY KEY NOT NULL,
	"face_amount" integer NOT NULL,
	"sex" text NOT NULL,
	"term_length" text NOT NULL,
	"state" text NOT NULL,
	"age" integer NOT NULL,
	"tobacco" text NOT NULL,
	"company" text NOT NULL,
	"plan_name" text NOT NULL,
	"tier_name" text NOT NULL,
	"monthly_rate" numeric NOT NULL,
	"annual_rate" numeric NOT NULL,
	"warnings" text,
	"logo_url" text,
	"eapp" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "carrier_preferences" ADD CONSTRAINT "carrier_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carrier_preferences" ADD CONSTRAINT "carrier_preferences_carrier_id_carriers_id_fk" FOREIGN KEY ("carrier_id") REFERENCES "public"."carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;