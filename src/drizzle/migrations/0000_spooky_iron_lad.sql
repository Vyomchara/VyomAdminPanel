CREATE TABLE "client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"address" text NOT NULL,
	"vm_ip" text,
	CONSTRAINT "client_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "client_drone_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quantity" integer,
	"drone_id" serial NOT NULL,
	"client_id" uuid
);
--> statement-breakpoint
CREATE TABLE "drone" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drone_payload_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid,
	"payload_id" integer
);
--> statement-breakpoint
CREATE TABLE "payload" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_drone_assignment" ADD CONSTRAINT "client_drone_assignment_drone_id_drone_id_fk" FOREIGN KEY ("drone_id") REFERENCES "public"."drone"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_drone_assignment" ADD CONSTRAINT "client_drone_assignment_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drone_payload_assignment" ADD CONSTRAINT "drone_payload_assignment_assignment_id_client_drone_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."client_drone_assignment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drone_payload_assignment" ADD CONSTRAINT "drone_payload_assignment_payload_id_payload_id_fk" FOREIGN KEY ("payload_id") REFERENCES "public"."payload"("id") ON DELETE no action ON UPDATE no action;