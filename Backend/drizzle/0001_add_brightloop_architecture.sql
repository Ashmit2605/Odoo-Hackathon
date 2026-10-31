CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_id" integer,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	CONSTRAINT "staff_customer_unique" UNIQUE("staff_id","customer_id")
);
--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE IF NOT EXISTS 'PAST_DUE';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE IF NOT EXISTS 'CANCEL_SCHEDULED';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE IF NOT EXISTS 'CANCELED';--> statement-breakpoint
ALTER TYPE "public"."subscription_status" ADD VALUE IF NOT EXISTS 'EXPIRED';--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "source" varchar(20) DEFAULT 'SELF_SERVICE' NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_assignments" ADD CONSTRAINT "staff_assignments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;