const baseUrl = process.env.BOOKING_API_BASE_URL ?? "http://localhost:3000";
const testRoomId = process.env.BOOKING_HOLD_TEST_ROOM_ID;
const validCheckIn = process.env.BOOKING_HOLD_TEST_CHECK_IN ?? "2027-01-10";
const validCheckOut = process.env.BOOKING_HOLD_TEST_CHECK_OUT ?? "2027-01-12";
const dummyRoomId = "00000000-0000-0000-0000-000000000000";

const holdCreateKeys = ["expiresAt", "holdId"];
const holdReleaseKeys = ["holdId", "released", "releasedAt"];
const errorKeys = ["available", "message", "reason"];
const forbiddenDetailKeys = new Set([
  "booking",
  "bookings",
  "checkIn",
  "checkOut",
  "check_in",
  "check_out",
  "guest",
  "guest_email",
  "guest_name",
  "guest_phone",
  "guests",
  "notes",
  "phone",
  "reference",
  "room",
  "roomId",
  "room_id",
  "session",
  "sessionId",
  "session_id"
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function holdsUrl() {
  return new URL("/api/booking/holds", baseUrl);
}

async function requestJson(method, body) {
  const response = await fetch(holdsUrl(), {
    method,
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const bodyText = await response.text();

  try {
    return {
      response,
      json: JSON.parse(bodyText)
    };
  } catch {
    throw new Error(`Expected JSON from ${holdsUrl()}, received: ${bodyText.slice(0, 160)}`);
  }
}

function assertKeys(json, expectedKeys, label) {
  const keys = Object.keys(json).sort();

  assert(
    JSON.stringify(keys) === JSON.stringify(expectedKeys),
    `${label} unexpected response keys: ${keys.join(", ")}`
  );
}

function assertErrorShape(json, label) {
  assertKeys(json, errorKeys, label);
  assert(json.available === false, `${label} available must be false`);
  assert(typeof json.reason === "string", `${label} reason must be a string`);
  assert(typeof json.message === "string", `${label} message must be a string`);
}

function assertHoldCreateShape(json) {
  assertKeys(json, holdCreateKeys, "hold create");
  assert(typeof json.holdId === "string" && json.holdId.length > 0, "holdId must be a string");
  assert(
    typeof json.expiresAt === "string" && !Number.isNaN(Date.parse(json.expiresAt)),
    "expiresAt must be an ISO date string"
  );
}

function assertHoldReleaseShape(json, holdId) {
  assertKeys(json, holdReleaseKeys, "hold release");
  assert(json.released === true, "released must be true");
  assert(json.holdId === holdId, "released holdId must match created holdId");
  assert(
    typeof json.releasedAt === "string" && !Number.isNaN(Date.parse(json.releasedAt)),
    "releasedAt must be an ISO date string"
  );
}

function assertNoGuestOrBookingDetails(value) {
  if (!value || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    assert(!forbiddenDetailKeys.has(key), `Response exposes forbidden detail key: ${key}`);
    assertNoGuestOrBookingDetails(nestedValue);
  }
}

async function checkErrorCase(name, body, expectedStatus) {
  const { response, json } = await requestJson("POST", body);

  assert(
    response.status === expectedStatus,
    `${name} expected HTTP ${expectedStatus}, received ${response.status}`
  );
  assertErrorShape(json, name);
  assertNoGuestOrBookingDetails(json);
  console.log(`ok - ${name}`);
}

await checkErrorCase(
  "missing roomId returns 400",
  {
    checkIn: validCheckIn,
    checkOut: validCheckOut
  },
  400
);

await checkErrorCase(
  "invalid date range returns 400",
  {
    roomId: testRoomId ?? dummyRoomId,
    checkIn: validCheckOut,
    checkOut: validCheckIn
  },
  400
);

if (!testRoomId) {
  throw new Error(
    "Set BOOKING_HOLD_TEST_ROOM_ID to a room UUID to verify hold creation and release."
  );
}

const createResult = await requestJson("POST", {
  roomId: testRoomId,
  checkIn: validCheckIn,
  checkOut: validCheckOut
});

assert(
  createResult.response.status === 201,
  `hold creation expected HTTP 201, received ${createResult.response.status}`
);
assertHoldCreateShape(createResult.json);
assertNoGuestOrBookingDetails(createResult.json);
console.log("ok - valid hold creation returns only holdId and expiresAt");

const releaseResult = await requestJson("DELETE", {
  holdId: createResult.json.holdId
});

assert(
  releaseResult.response.status === 200,
  `hold release expected HTTP 200, received ${releaseResult.response.status}`
);
assertHoldReleaseShape(releaseResult.json, createResult.json.holdId);
assertNoGuestOrBookingDetails(releaseResult.json);
console.log("ok - release hold returns success");
