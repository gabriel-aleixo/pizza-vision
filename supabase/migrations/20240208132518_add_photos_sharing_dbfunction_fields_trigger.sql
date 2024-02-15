ALTER TABLE "public"."photos"
    ADD COLUMN "access_granted_to" uuid[];

ALTER TABLE "public"."photos"
    ALTER COLUMN "created_at" DROP DEFAULT;

ALTER TABLE "public"."profiles"
    ADD COLUMN "photos_access_granted_by" uuid[];

ALTER TABLE "public"."profiles"
    ADD COLUMN "sharing_on" boolean DEFAULT FALSE;

SET check_function_bodies = OFF;

CREATE OR REPLACE FUNCTION public.update_photos_access_granted_by()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $function$
DECLARE
    uid uuid;
    -- uids in the new field
    removed_uid uuid;
    -- uids in the old field
BEGIN
    -- Loop through each uid in NEW.access_granted_to[]
    FOR uid IN
    SELECT
        unnest(NEW.access_granted_to)
        LOOP
            -- Update the profiles table
            BEGIN
                -- Check if uid already in, add if not
                UPDATE
                    public.profiles
                SET
                    photos_access_granted_by = ARRAY_APPEND(COALESCE(photos_access_granted_by, ARRAY[] : :uuid[]), NEW.user_id)
                WHERE
                    NOT (uid = ANY (
                            SELECT
                                UNNEST(photos_access_granted_by)
                            FROM
                                public.profiles))
                    AND id = uid;
                IF NOT FOUND THEN
                    -- Debugging: check if the update statement did not update any rows
                    RAISE NOTICE 'No rows updated for uid: %', uid;
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    -- Exception handling
                    RAISE NOTICE 'Error occurred for uid: %, error: %', uid, SQLERRM;
            END;
    END LOOP;
    -- Iterate over the old access_granted_to array
    FOREACH removed_uid IN ARRAY OLD.access_granted_to LOOP
        -- Check if the removed_uid is not in the new access_granted_to array
        IF removed_uid <> ALL (NEW.access_granted_to) THEN
            -- Update the profile to remove NEW.user_id from photos_access_granted_by
            UPDATE
                public.profiles
            SET
                photos_access_granted_by = array_remove(photos_access_granted_by, NEW.user_id)
            WHERE
                id = removed_uid;
            IF NOT FOUND THEN
                RAISE NOTICE 'No rows updated for uid: %', removed_uid;
                END IF;
            END IF;
        END LOOP;
    RETURN NULL;
END;

$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
DECLARE
    email text;
    username text;
BEGIN
    email := NEW.email;
    username := split_part(email, '@', 1);
    INSERT INTO public.profiles(id, username)
        VALUES (NEW.id, username);
    RETURN new;
END;
$function$;

CREATE POLICY "Public profiles are viewable by authenticated users" ON "public"."profiles" AS permissive
    FOR SELECT TO authenticated
        USING (TRUE);

CREATE TRIGGER on_photos_access_granted_to_update
    AFTER UPDATE OF access_granted_to ON public.photos
    FOR EACH ROW
    WHEN((old.access_granted_to IS DISTINCT FROM new.access_granted_to))
    EXECUTE FUNCTION update_photos_access_granted_by();

