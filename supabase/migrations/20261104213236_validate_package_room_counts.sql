begin;
-- Catalogue-shape validation only. Inventory/allocation/approval commands are unchanged.
-- Preserve the reviewed functions' owners, ACLs and security modes.
do $migration$
declare definition text;needle text;
begin
 definition:=pg_get_functiondef('ops_private.validate_package_catalogue()'::regprocedure);
 needle:=' if new.publication_status=''published'' then'||chr(10)||'  if not exists';
 if strpos(definition,needle)=0 then raise exception 'Expected package publication guard missing';end if;
 definition:=replace(definition,needle,
 ' if new.publication_status=''published'' then'||chr(10)||
 '  if exists(select 1 from jsonb_array_elements(c->''variants'') x where coalesce((x->>''roomCount'')::integer,1)>(select count(*) from public.physical_rooms r where r.listing_id=(x->>''roomId'')::uuid)) then raise exception ''A package arrangement cannot exceed the physical room count for its listing'' using errcode=''23514'';end if;'||chr(10)||'  if not exists');
 execute definition;
 definition:=pg_get_functiondef('ops_private.package_quote(jsonb)'::regprocedure);
 needle:=' rooms:=coalesce((v->>''roomCount'')::integer,1);';
 if strpos(definition,needle)=0 then raise exception 'Expected package room-count guard missing';end if;
 definition:=replace(definition,needle,needle||chr(10)||
 ' if rooms>(select count(*) from public.physical_rooms inventory_room where inventory_room.listing_id=r.id) then raise exception ''Choose a valid physical room arrangement'' using errcode=''22023'';end if;');
 execute definition;
end $migration$;
commit;
