CREATE TABLE "space_sidebar_pin" (
	"user_id" uuid NOT NULL,
	"root_space_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"pinned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "space_sidebar_pin_user_id_root_space_id_space_id_pk" PRIMARY KEY("user_id","root_space_id","space_id")
);
--> statement-breakpoint
ALTER TABLE "space_sidebar_pin" ADD CONSTRAINT "space_sidebar_pin_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_sidebar_pin" ADD CONSTRAINT "space_sidebar_pin_root_space_id_space_id_fk" FOREIGN KEY ("root_space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "space_sidebar_pin" ADD CONSTRAINT "space_sidebar_pin_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "sidebar_section_preference" (
	"user_id" uuid NOT NULL,
	"root_space_id" uuid NOT NULL,
	"space_id" uuid NOT NULL,
	"item_limit" integer DEFAULT 7 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sidebar_section_preference_user_id_root_space_id_space_id_pk" PRIMARY KEY("user_id","root_space_id","space_id"),
	CONSTRAINT "sidebar_section_preference_item_limit_check" CHECK ("item_limit" IN (5, 7, 15, 30, 50))
);
--> statement-breakpoint
ALTER TABLE "sidebar_section_preference" ADD CONSTRAINT "sidebar_section_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidebar_section_preference" ADD CONSTRAINT "sidebar_section_preference_root_space_id_space_id_fk" FOREIGN KEY ("root_space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidebar_section_preference" ADD CONSTRAINT "sidebar_section_preference_space_id_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."space"("id") ON DELETE cascade ON UPDATE no action;
