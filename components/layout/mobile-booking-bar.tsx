export function MobileBookingBar() {
  return (
    <aside className="mobile-booking-bar" aria-label="Quick booking actions">
      <a className="btn btn-primary" href="/book">
        Book
      </a>
      <a className="btn btn-whatsapp" href="#whatsapp">
        WhatsApp
      </a>
    </aside>
  );
}
