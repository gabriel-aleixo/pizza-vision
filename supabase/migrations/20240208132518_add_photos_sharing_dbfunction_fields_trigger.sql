alter table "public"."photos" add column "access_granted_to" uuid[];

alter table "public"."photos" alter column "created_at" drop default;

alter table "public"."profiles" add column "photos_access_granted_by" uuid[];

alter table "public"."profiles" add column "sharing_on" boolean default false;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_photos_access_granted_by
() RETURNS trigger 
LANGUAGE plpgsql AS 
$function$
DECLARE
	uid uuid;
	-- uids in the new field
	removed_uid uuid;
	-- uids in the old field
BEGIN
	 
	-- Loop through each uid in NEW.access_granted_to[]
	 FOR uid IN SELECT unnest ( NEW . access_granted_to ) LOOP
	-- Update the profiles table
	 BEGIN
	-- Check if uid already in, add if not
	 UPDATE public . profiles SET photos_access_granted_by = ARRAY_APPEND ( COALESCE ( photos_access_granted_by , ARRAY[] : :uuid[] ) , NEW . user_id ) WHERE NOT ( uid = ANY ( SELECT UNNEST ( photos_access_granted_by ) FROM public . profiles ) ) AND id = uid;
	IF NOT FOUND THEN
	-- Debugging: check if the update statement did not update any rows
	RAISE NOTICE 'No rows updated for uid: %',
	uid;
END
	IF;
	EXCEPTION WHEN OTHERS THEN
	-- Exception handling
	RAISE NOTICE 'Error occurred for uid: %, error: %',
	uid,
	SQLERRM;
END;
END
	LOOP;
	-- Iterate over the old access_granted_to array
	FOREACH removed_uid IN ARRAY OLD.access_granted_to
	LOOP
	-- Check if the removed_uid is not in the new access_granted_to array
	IF removed_uid <> ALL (NEW.access_granted_to) THEN
	-- Update the profile to remove NEW.user_id from photos_access_granted_by
	UPDATE public.profiles
	SET
	    photos_access_granted_by = array_remove (
	        photos_access_granted_by, NEW.user_id
	    )
	WHERE
	    id = removed_uid;
	IF NOT FOUND THEN RAISE NOTICE 'No rows updated for uid: %',
	removed_uid;
END
	IF;
END
	IF;
END
	LOOP;
	RETURN NULL;
END;
$function$
; 

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql SECURITY DEFINER AS 
	$function$declare email
TEXT; 

username TEXT;

begin email := new.email;

username := split_part (email, '@', 1);

insert into
    public.profiles (id, username)
values (new.id, username);

return new;

end;

$function$;

create policy "Public profiles are viewable by authenticated users"
on "public"."profiles"
as permissive
for select
to authenticated
using (true);

CREATE TRIGGER on_photos_access_granted_to_update AFTER
UPDATE OF access_granted_to ON public.photos FOR EACH ROW WHEN (
    (
        old.access_granted_to IS DISTINCT
        FROM new.access_granted_to
    )
)
EXECUTE FUNCTION update_photos_access_granted_by ();