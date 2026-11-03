BEGIN;
-- Owner-confirmed inventory: two standard doubles and two balcony doubles.
-- D01-D04 are the application's logical inventory labels. Preserve every
-- existing mapping, unit, reservation, allocation, capacity and active flag.
-- The table lock makes this metadata initialization atomic. Only the migration
-- owner can disable/re-enable the staff update trigger; API roles cannot do so.
LOCK TABLE public.physical_rooms IN ACCESS EXCLUSIVE MODE;
ALTER TABLE public.physical_rooms DISABLE TRIGGER room_activation_guard;
DO $$
DECLARE r public.physical_rooms; target_listing uuid; listing_slug text; label text;
BEGIN
 FOR r IN SELECT * FROM public.physical_rooms WHERE listing_id IS NULL ORDER BY code LOOP
  listing_slug:=CASE
   WHEN r.code IN ('D01','D02') THEN 'private-double-room'
   WHEN r.code IN ('D03','D04') THEN 'private-double-room-balcony'
   WHEN r.kind='twin' THEN 'twin-room'
   WHEN r.kind='triple' THEN 'triple-room'
   WHEN r.kind='family' THEN 'family-room-4p'
   WHEN r.kind='dorm' THEN '4-bed-dorm-room'
   ELSE NULL END;
  SELECT id INTO target_listing FROM public.rooms WHERE slug=listing_slug;
  IF target_listing IS NOT NULL THEN
   label:=CASE r.code WHEN 'D03' THEN 'Balcony double 1' WHEN 'D04' THEN 'Balcony double 2' ELSE r.name END;
   UPDATE public.physical_rooms SET listing_id=target_listing,name=label WHERE id=r.id;
   INSERT INTO public.workspace_audit(entity,record_id,event,before_data,after_data)
    VALUES('physical_rooms',r.id,'initial_listing_mapping',to_jsonb(r),jsonb_build_object('listing_id',target_listing,'listing_slug',listing_slug,'name',label,'source','Owner-confirmed inventory setup'));
  END IF;
 END LOOP;
END $$;
ALTER TABLE public.physical_rooms ENABLE TRIGGER room_activation_guard;
COMMIT;
