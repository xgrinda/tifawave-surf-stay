export type PendingBookingEmailDetails = {
  bookingId: string;
  status: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  message: string | null;
};

export type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function bookingRows(details: PendingBookingEmailDetails): string {
  const rows = [
    ["Booking ID", details.bookingId],
    ["Status", details.status],
    ["Room", details.roomName],
    ["Dates", `${formatDate(details.checkIn)} to ${formatDate(details.checkOut)}`],
    ["Guest", details.guestName],
    ["Email", details.guestEmail],
    ["Phone / WhatsApp", details.guestPhone]
  ];

  if (details.message) {
    rows.push(["Message", details.message]);
  }

  return rows
    .map(
      ([label, value]) => `
        <tr>
          <th align="left" style="padding:8px 14px 8px 0;color:#6b7b82;font-size:13px;font-weight:700;">${escapeHtml(label)}</th>
          <td style="padding:8px 0;color:#0b1f2a;font-size:14px;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join("");
}

function bookingText(details: PendingBookingEmailDetails): string {
  const lines = [
    `Booking ID: ${details.bookingId}`,
    `Status: ${details.status}`,
    `Room: ${details.roomName}`,
    `Dates: ${formatDate(details.checkIn)} to ${formatDate(details.checkOut)}`,
    `Guest: ${details.guestName}`,
    `Email: ${details.guestEmail}`,
    `Phone / WhatsApp: ${details.guestPhone}`
  ];

  if (details.message) {
    lines.push(`Message: ${details.message}`);
  }

  return lines.join("\n");
}

function wrapEmail(title: string, intro: string, details: PendingBookingEmailDetails): string {
  return `
    <div style="margin:0;background:#f6f1e7;padding:28px;font-family:Inter,Arial,sans-serif;color:#0b1f2a;">
      <div style="max-width:640px;margin:0 auto;border-radius:18px;background:#fbf8f2;padding:28px;border:1px solid #e3dbcc;">
        <p style="margin:0 0 10px;color:#2e8b8b;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">Tifawave Surf Stay</p>
        <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:32px;font-weight:400;line-height:1.12;color:#0b1f2a;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 20px;color:#6b7b82;font-size:15px;line-height:1.6;">${escapeHtml(intro)}</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-top:1px solid #e3dbcc;border-bottom:1px solid #e3dbcc;padding:10px 0;">
          <tbody>${bookingRows(details)}</tbody>
        </table>
        <p style="margin:20px 0 0;color:#6b7b82;font-size:13px;line-height:1.5;">This booking is pending confirmation. No payment has been collected.</p>
      </div>
    </div>`;
}

export function pendingBookingInternalEmail(
  details: PendingBookingEmailDetails
): EmailTemplate {
  return {
    subject: `New pending booking: ${details.roomName}`,
    html: wrapEmail(
      "New pending booking request",
      "A guest created a pending booking request through the Tifawave booking flow.",
      details
    ),
    text: [
      "New pending booking request",
      "",
      "A guest created a pending booking request through the Tifawave booking flow.",
      "",
      bookingText(details),
      "",
      "This booking is pending confirmation. No payment has been collected."
    ].join("\n")
  };
}

export function pendingBookingGuestEmail(
  details: PendingBookingEmailDetails
): EmailTemplate {
  return {
    subject: "Tifawave booking request received",
    html: wrapEmail(
      "Your request is pending",
      "Thanks for reaching out to Tifawave. We received your booking request and will confirm availability before anything is final.",
      details
    ),
    text: [
      "Your Tifawave booking request is pending",
      "",
      "Thanks for reaching out to Tifawave. We received your booking request and will confirm availability before anything is final.",
      "",
      bookingText(details),
      "",
      "This booking is pending confirmation. No payment has been collected."
    ].join("\n")
  };
}
