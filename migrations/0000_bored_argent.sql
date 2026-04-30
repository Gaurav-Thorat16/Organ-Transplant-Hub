CREATE TYPE "public"."availability_status" AS ENUM('AVAILABLE', 'UNAVAILABLE');--> statement-breakpoint
CREATE TYPE "public"."blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."organ_type" AS ENUM('Kidney', 'Liver', 'Heart', 'Lungs', 'Pancreas', 'Cornea');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."urgency_level" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('hospital', 'patient');--> statement-breakpoint
CREATE TABLE "hospitals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organ_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"hospital_id" text NOT NULL,
	"organ_type" "organ_type" NOT NULL,
	"blood_group" "blood_group" NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"status" "availability_status" NOT NULL,
	"city" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transplant_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"hospital_id" text NOT NULL,
	"organ_type" "organ_type" NOT NULL,
	"blood_group" "blood_group" NOT NULL,
	"status" "request_status" DEFAULT 'PENDING' NOT NULL,
	"urgency_level" "urgency_level" DEFAULT 'MEDIUM' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" NOT NULL,
	"city" text NOT NULL,
	"phone" text,
	"password_salt" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hospitals" ADD CONSTRAINT "hospitals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organ_availability" ADD CONSTRAINT "organ_availability_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transplant_requests" ADD CONSTRAINT "transplant_requests_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transplant_requests" ADD CONSTRAINT "transplant_requests_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hospitals_user_id_unique" ON "hospitals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organ_availability_hospital_idx" ON "organ_availability" USING btree ("hospital_id");--> statement-breakpoint
CREATE INDEX "organ_availability_lookup_idx" ON "organ_availability" USING btree ("city","organ_type","blood_group","status");--> statement-breakpoint
CREATE INDEX "transplant_requests_patient_idx" ON "transplant_requests" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "transplant_requests_hospital_idx" ON "transplant_requests" USING btree ("hospital_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");