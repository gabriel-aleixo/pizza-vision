revoke delete on table "public"."profiles" from "postgres";

revoke insert on table "public"."profiles" from "postgres";

revoke references on table "public"."profiles" from "postgres";

revoke select on table "public"."profiles" from "postgres";

revoke trigger on table "public"."profiles" from "postgres";

revoke truncate on table "public"."profiles" from "postgres";

revoke update on table "public"."profiles" from "postgres";

create table "public"."photos" (
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "user_id" uuid not null,
    "photos" jsonb
);


alter table "public"."photos" enable row level security;

CREATE UNIQUE INDEX photos_pkey ON public.photos USING btree (user_id);

alter table "public"."photos" add constraint "photos_pkey" PRIMARY KEY using index "photos_pkey";

alter table "public"."photos" add constraint "photos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."photos" validate constraint "photos_user_id_fkey";

grant delete on table "public"."photos" to "anon";

grant insert on table "public"."photos" to "anon";

grant references on table "public"."photos" to "anon";

grant select on table "public"."photos" to "anon";

grant trigger on table "public"."photos" to "anon";

grant truncate on table "public"."photos" to "anon";

grant update on table "public"."photos" to "anon";

grant delete on table "public"."photos" to "authenticated";

grant insert on table "public"."photos" to "authenticated";

grant references on table "public"."photos" to "authenticated";

grant select on table "public"."photos" to "authenticated";

grant trigger on table "public"."photos" to "authenticated";

grant truncate on table "public"."photos" to "authenticated";

grant update on table "public"."photos" to "authenticated";

grant delete on table "public"."photos" to "service_role";

grant insert on table "public"."photos" to "service_role";

grant references on table "public"."photos" to "service_role";

grant select on table "public"."photos" to "service_role";

grant trigger on table "public"."photos" to "service_role";

grant truncate on table "public"."photos" to "service_role";

grant update on table "public"."photos" to "service_role";

create policy "Enable all operations for users based on user_id"
on "public"."photos"
as permissive
for all
to authenticated
using ((auth.uid() = user_id));



