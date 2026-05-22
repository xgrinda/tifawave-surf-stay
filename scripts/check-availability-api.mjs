const baseUrl = process.env.AVAILABILITY_API_BASE_URL ?? "http://localhost:3000";
const testRoomId = process.env.AVAILABILITY_TEST_ROOM_ID;
const validCheckIn = process.env.AVAILABILITY_TEST_CHECK_IN ?? "2027-01-10";
const validCheckOut = process.env.AVAILABILITY_TEST_CHECK_OUT ?? "2027-01-12";
const dummyRoomId = "00000000-0000-0000-0000-000000000000";

const expectedKeys = ["available", "message", "reason"];
const forbiddenDetailKeys = new Set([
  "booking",
  "bookings",
  "guest",
  "guest_email",
  "guest_name",
  "guest_phone",
  "notes",
  "phone",
  "reference"
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function availabilityUrl(params) {
  const url = new URL("/api/availability", baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

async function getJson(url) {
  const response = await fetch(url);
  const bodyText = await response.text();

  try {
    return {
      response,
      json: JSON.parse(bodyText)
    };
  } catch {
    throw new Error(`Expected JSON from ${url}, received: ${bodyText.slice(0, 160)}`);
  }
}

function assertAvailabilityShape(json) {
  const keys = Object.keys(json).sort();

  assert(
    JSON.stringify(keys) === JSON.stringify(expectedKeys),
    `Unexpected response keys: ${keys.join(", ")}`
  );
  assert(typeof json.available === "boolean", "available must be a boolean");
  assert(json.reason === null || typeof json.reason === "string", "reason must be null or a string");
  assert(json.message === null || typeof json.message === "string", "message must be null or a string");
}

function assertNoGuestDetails(value) {
  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    assert(!forbiddenDetailKeys.has(key), `Response exposes forbidden detail key: ${key}`);
    assertNoGuestDetails(nestedValue);
  }
}

async function checkCase(name, url, expectedStatus) {
  const { response, json } = await getJson(url);

  assert(
    response.status === expectedStatus,
    `${name} expected HTTP ${expectedStatus}, received ${response.status}`
  );
  assertAvailabilityShape(json);
  assertNoGuestDetails(json);
  console.log(`ok - ${name}`);
}

await checkCase(
  "missing roomId returns 400",
  availabilityUrl({
    checkIn: validCheckIn,
    checkOut: validCheckOut
  }),
  400
);

await checkCase(
  "invalid date range returns 400",
  availabilityUrl({
    roomId: testRoomId ?? dummyRoomId,
    checkIn: validCheckOut,
    checkOut: validCheckIn
  }),
  400
);

if (!testRoomId) {
  throw new Error(
    "Set AVAILABILITY_TEST_ROOM_ID to a room UUID to verify the valid availability response shape."
  );
}

const { response, json } = await getJson(
  availabilityUrl({
    roomId: testRoomId,
    checkIn: validCheckIn,
    checkOut: validCheckOut
  })
);

assert(
  response.status === 200 || response.status === 400,
  `valid shape check expected HTTP 200 or validation 400, received ${response.status}`
);
assertAvailabilityShape(json);
assertNoGuestDetails(json);
console.log("ok - valid request returns safe availability JSON shape");
