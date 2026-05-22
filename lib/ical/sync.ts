import { createHash } from "node:crypto";
import ical, { type EventInstance, type ParameterValue, type VEvent } from "node-ical";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SyncRoom = {
  id: string;
  name: string;
  external_ical_urls: string[];
};

type ImportedIcalEvent = {
  uid: string;
  startDate: string;
  endDate: string;
  summary: string;
  sourceHash: string;
};

export type IcalSyncResult = {
  roomsProcessed: number;
  feedsProcessed: number;
  eventsImported: number;
  eventsUpdated: number;
  eventsRemoved: number;
  errors: Array<{
    roomId: string;
    sourceUrl: string;
    message: string;
  }>;
};

const ICAL_SOURCE = "ical";
const ICAL_REASON = "ical_import";
const UNIQUE_VIOLATION_CODE = "23505";
const RECURRENCE_WINDOW_PAST_DAYS = 365;
const RECURRENCE_WINDOW_FUTURE_DAYS = 730;

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateToIsoDate(date: Date & { dateOnly?: true }): string {
  if (date.dateOnly) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return date.toISOString().slice(0, 10);
}

function textValue(value: ParameterValue | undefined): string {
  if (!value) {
    return "External reservation";
  }

  return typeof value === "string" ? value : value.val;
}

function eventSourceHash({
  endDate,
  sourceUrl,
  startDate,
  uid
}: {
  endDate: string;
  sourceUrl: string;
  startDate: string;
  uid: string;
}): string {
  return createHash("sha256")
    .update([sourceUrl, uid, startDate, endDate].join("|"))
    .digest("hex");
}

function isBlockingEvent(event: VEvent): boolean {
  return event.status !== "CANCELLED" && event.transparency !== "TRANSPARENT";
}

function eventDates(start: Date, end?: Date): {
  startDate: string;
  endDate: string;
} | null {
  const startDate = dateToIsoDate(start);
  let endDate = end ? dateToIsoDate(end) : addDays(startDate, 1);

  if (endDate <= startDate) {
    endDate = addDays(startDate, 1);
  }

  return {
    startDate,
    endDate
  };
}

function importedEventFromDates({
  endDate,
  sourceUrl,
  startDate,
  summary,
  uid
}: {
  endDate: string;
  sourceUrl: string;
  startDate: string;
  summary: string;
  uid: string;
}): ImportedIcalEvent {
  return {
    uid,
    startDate,
    endDate,
    summary,
    sourceHash: eventSourceHash({
      endDate,
      sourceUrl,
      startDate,
      uid
    })
  };
}

function importedEventFromVEvent(
  event: VEvent,
  sourceUrl: string
): ImportedIcalEvent | null {
  if (!isBlockingEvent(event)) {
    return null;
  }

  const dates = eventDates(event.start, event.end);

  if (!dates) {
    return null;
  }

  return importedEventFromDates({
    ...dates,
    sourceUrl,
    summary: textValue(event.summary),
    uid: event.uid
  });
}

function importedEventFromInstance(
  instance: EventInstance,
  sourceUrl: string,
  index: number
): ImportedIcalEvent | null {
  if (!isBlockingEvent(instance.event)) {
    return null;
  }

  const dates = eventDates(instance.start, instance.end);

  if (!dates) {
    return null;
  }

  return importedEventFromDates({
    ...dates,
    sourceUrl,
    summary: textValue(instance.summary),
    uid: `${instance.event.uid}:${dates.startDate}:${index}`
  });
}

function recurrenceWindow(): {
  from: Date;
  to: Date;
} {
  const today = new Date();
  const from = new Date(today);
  const to = new Date(today);
  from.setDate(today.getDate() - RECURRENCE_WINDOW_PAST_DAYS);
  to.setDate(today.getDate() + RECURRENCE_WINDOW_FUTURE_DAYS);

  return {
    from,
    to
  };
}

function parseImportedEvents(
  body: string,
  sourceUrl: string
): ImportedIcalEvent[] {
  const parsed = ical.sync.parseICS(body);
  const events: ImportedIcalEvent[] = [];
  const { from, to } = recurrenceWindow();

  for (const component of Object.values(parsed)) {
    if (!component || component.type !== "VEVENT") {
      continue;
    }

    if (component.rrule) {
      const instances = ical.expandRecurringEvent(component, {
        excludeExdates: true,
        from,
        includeOverrides: true,
        to
      });

      instances.forEach((instance, index) => {
        const importedEvent = importedEventFromInstance(
          instance,
          sourceUrl,
          index
        );

        if (importedEvent) {
          events.push(importedEvent);
        }
      });

      continue;
    }

    const importedEvent = importedEventFromVEvent(component, sourceUrl);

    if (importedEvent) {
      events.push(importedEvent);
    }
  }

  return events;
}

async function fetchIcal(url: string): Promise<string> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      accept: "text/calendar, text/plain;q=0.9, */*;q=0.1"
    }
  });

  if (!response.ok) {
    throw new Error(`iCal feed returned HTTP ${response.status}.`);
  }

  return response.text();
}

async function upsertImportedBlockedDate({
  event,
  roomId,
  seenAt,
  sourceUrl
}: {
  event: ImportedIcalEvent;
  roomId: string;
  seenAt: string;
  sourceUrl: string;
}): Promise<"created" | "updated"> {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("blocked_dates")
    .select("id, source_hash")
    .eq("room_id", roomId)
    .eq("source", ICAL_SOURCE)
    .eq("source_url", sourceUrl)
    .eq("source_uid", event.uid)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const payload = {
    end_date: event.endDate,
    imported_at: seenAt,
    last_seen_at: seenAt,
    note: event.summary.slice(0, 500),
    reason: ICAL_REASON,
    room_id: roomId,
    source: ICAL_SOURCE as "ical",
    source_hash: event.sourceHash,
    source_uid: event.uid,
    source_url: sourceUrl,
    start_date: event.startDate,
    updated_at: seenAt
  };

  if (!existing) {
    const { error } = await supabase.from("blocked_dates").insert(payload);

    if (error) {
      if (error.code === UNIQUE_VIOLATION_CODE) {
        const retry = await supabase
          .from("blocked_dates")
          .update(payload)
          .eq("room_id", roomId)
          .eq("source", ICAL_SOURCE)
          .eq("source_url", sourceUrl)
          .eq("source_uid", event.uid);

        if (retry.error) {
          throw new Error(retry.error.message);
        }

        return "updated";
      }

      throw new Error(error.message);
    }

    return "created";
  }

  const { error } = await supabase
    .from("blocked_dates")
    .update(payload)
    .eq("id", existing.id);

  if (error) {
    throw new Error(error.message);
  }

  return existing.source_hash === event.sourceHash ? "updated" : "updated";
}

async function removeDisappearedImportedBlocks({
  roomId,
  seenAt,
  sourceUrl
}: {
  roomId: string;
  seenAt: string;
  sourceUrl: string;
}): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("blocked_dates")
    .delete()
    .eq("room_id", roomId)
    .eq("source", ICAL_SOURCE)
    .eq("source_url", sourceUrl)
    .lt("last_seen_at", seenAt)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  return data.length;
}

async function getSyncRooms(roomId?: string): Promise<SyncRoom[]> {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("rooms")
    .select("id, name, external_ical_urls")
    .order("name", { ascending: true });

  if (roomId) {
    query = query.eq("id", roomId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data.filter((room) => room.external_ical_urls.length > 0);
}

export async function syncExternalIcalFeeds(
  roomId?: string
): Promise<IcalSyncResult> {
  const result: IcalSyncResult = {
    errors: [],
    eventsImported: 0,
    eventsRemoved: 0,
    eventsUpdated: 0,
    feedsProcessed: 0,
    roomsProcessed: 0
  };
  const rooms = await getSyncRooms(roomId);

  for (const room of rooms) {
    result.roomsProcessed += 1;

    for (const sourceUrl of room.external_ical_urls) {
      const seenAt = new Date().toISOString();

      try {
        const body = await fetchIcal(sourceUrl);
        const events = parseImportedEvents(body, sourceUrl);

        for (const event of events) {
          const outcome = await upsertImportedBlockedDate({
            event,
            roomId: room.id,
            seenAt,
            sourceUrl
          });

          if (outcome === "created") {
            result.eventsImported += 1;
          } else {
            result.eventsUpdated += 1;
          }
        }

        result.eventsRemoved += await removeDisappearedImportedBlocks({
          roomId: room.id,
          seenAt,
          sourceUrl
        });
        result.feedsProcessed += 1;
      } catch (error) {
        result.errors.push({
          roomId: room.id,
          sourceUrl,
          message:
            error instanceof Error
              ? error.message
              : "Unknown iCal sync error."
        });
      }
    }
  }

  return result;
}
