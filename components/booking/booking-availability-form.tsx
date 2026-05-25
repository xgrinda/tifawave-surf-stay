"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  trackAvailabilityCheck,
  trackHoldCreated,
  trackPendingBookingCreated,
  trackStripeCheckoutStart,
  trackStripePaymentSuccessReturn
} from "@/lib/analytics/events";
import { DEFAULT_LOCALE, localizedPath, type Locale } from "@/lib/i18n";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Row } from "@/lib/supabase/types";

type RoomOption = Pick<
  Row<"rooms">,
  "id" | "slug" | "name" | "description" | "max_guests" | "base_price_cents"
>;

type AvailabilityResponse = {
  available: boolean;
  reason: string | null;
  message: string | null;
};

type HoldResponse =
  | {
      holdId: string;
      expiresAt: string;
    }
  | {
      available: false;
      reason: string;
      message: string;
    };

type AvailabilityState =
  | {
      status: "idle";
      message: string;
    }
  | {
      status: "available" | "unavailable" | "error";
      message: string;
    };

type HoldState =
  | {
      status: "idle";
    }
  | {
      status: "confirmed";
      holdId: string;
      expiresAt: string;
    }
  | {
      status: "error";
      message: string;
    };

type PendingBookingResponse =
  | {
      bookingId: string;
      status: string;
    }
  | {
      created: false;
      reason: string;
      message: string;
    };

type CheckoutResponse =
  | {
      checkoutUrl: string;
    }
  | {
      created: false;
      reason: string;
      message: string;
    };

type BookingState =
  | {
      status: "idle";
    }
  | {
      status: "confirmed";
      bookingId: string;
      bookingStatus: string;
    }
  | {
      status: "error";
      message: string;
    };

type PaymentState =
  | {
      status: "idle";
    }
  | {
      status: "error";
      message: string;
    };

export type BookingPaymentReturn =
  | {
      status: "success";
      bookingId: string;
    }
  | {
      status: "cancelled";
      bookingId?: string;
    };

export type BookingInitialParams = {
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  roomId?: string;
};

export type BookingContactSettings = {
  businessName: string;
  contactEmail: string;
  depositsEnabled: boolean;
  whatsappHref: string;
  supportPhone: string;
  bookingNoticeText: string;
  stripeDepositAmountDisplay: string;
};

type FieldErrors = {
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
};

type GuestFieldErrors = {
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  message?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\-\s\d]{6,40}$/;

const bookingCopy = {
  en: {
    paymentReturn: {
      successEyebrow: "Deposit received",
      successTitle: "Your booking request is confirmed.",
      successCopy:
        "Thank you. The deposit has been received, and the Tifawave team will review the details and follow up with arrival notes.",
      bookingId: "Booking ID",
      nextSteps: "Next steps",
      nextStepsCopy: "Watch your email for the booking confirmation and trip details.",
      needHelp: "Need a hand?",
      needHelpCopy: (businessName: string, contactEmail: string) =>
        `Message ${businessName} on WhatsApp or email ${contactEmail}.`,
      backHome: "Back home",
      contact: "Contact",
      cancelledEyebrow: "Payment cancelled",
      cancelledTitle: "No deposit was collected.",
      cancelledCopy:
        "That is okay. You can retry the booking flow when ready, or contact Tifawave if you need help completing the deposit.",
      status: "Status",
      cancelledStatusCopy: "Your booking is not confirmed until the deposit succeeds.",
      support: "Support",
      supportCopy: (contactEmail: string) =>
        `WhatsApp or email ${contactEmail} and we will help.`,
      tryAgain: "Try again"
    },
    availability: {
      initial: "Select a room and dates to check availability.",
      fixFields: "Please fix the highlighted fields.",
      checking: "Checking these dates...",
      available: "These dates are available. You can place a short hold now.",
      notAvailable: "These dates are not available.",
      requestFailed: "Availability could not be checked right now.",
      holdSuccess: "Your dates are temporarily held. Add guest details next."
    },
    status: {
      checking: "Checking dates",
      available: "Dates available",
      unavailable: "Dates unavailable",
      error: "Check details",
      ready: "Ready to check"
    },
    validation: {
      chooseRoom: "Choose a room.",
      chooseCheckIn: "Choose a check-in date.",
      checkInPast: "Check-in cannot be before today.",
      chooseCheckOut: "Choose a check-out date.",
      checkOutAfter: "Check-out must be after check-in.",
      guestsPositive: "Choose at least 1 guest.",
      guestsCapacity: "Guest count is above this room's capacity.",
      guestName: "Enter a guest name between 2 and 120 characters.",
      guestEmail: "Enter a valid email address.",
      guestPhone: "Enter a valid phone or WhatsApp number.",
      guestMessage: "Message must be 1000 characters or fewer."
    },
    roomLoad: {
      noActiveRooms:
        "No rooms are available for online date checks right now. Contact Tifawave for current options.",
      envMissing:
        "Room options could not load right now. Contact Tifawave if you need help checking dates."
    },
    flow: {
      eyebrow: "Direct booking",
      title: "Check your Tifawave stay dates.",
      copy:
        "Start with a room and travel window. If the dates are free, Tifawave can place a short temporary hold for your stay.",
      roomPreviewAria: "Room options preview",
      room: "Room",
      loadingRooms: "Loading rooms...",
      noActiveRooms: "No active rooms",
      checkIn: "Check-in",
      checkOut: "Check-out",
      guestCount: "Guests",
      loadingRoomOptions: "Loading room options...",
      checkAvailability: "Check availability",
      checking: "Checking...",
      manualConfirmationBadge: "Manual confirmation",
      manualConfirmationNotice:
        "Your reservation request stays pending until the Tifawave team confirms it by email or WhatsApp.",
      night: "night",
      guests: (count: number) => `Up to ${count} guests`
    },
    hold: {
      checkBeforeHold: "Check the room and dates before holding them.",
      checkAvailabilityFirst: "Check availability before holding dates.",
      couldNotHold: "These dates could not be held.",
      noLongerAvailable: "These dates are no longer available.",
      requestFailed: "The hold could not be created right now.",
      holdDates: "Hold these dates",
      holdingDates: "Holding dates...",
      eyebrow: "Temporary hold confirmed",
      title: "Your dates are held.",
      copy:
        "Add your contact details next so Tifawave can create a pending booking request. No payment is collected yet.",
      room: "Room",
      dates: "Dates",
      to: "to",
      nightlyRate: "Nightly rate",
      selectedRoom: "Selected room",
      pending: "Pending",
      holdId: "Hold ID",
      expires: "Expires"
    },
    guest: {
      fixFields: "Please fix the highlighted guest details.",
      pendingCouldNotCreate: "The pending booking could not be created.",
      pendingCouldNotCreateNow: "The pending booking could not be created right now.",
      eyebrow: "Guest details",
      title: "Create a pending booking.",
      name: "Name",
      namePlaceholder: "Your full name",
      email: "Email",
      phone: "Phone / WhatsApp",
      message: "Message",
      messagePlaceholder: "Optional note for the Tifawave team",
      create: "Create pending booking",
      creating: "Creating pending booking..."
    },
    pending: {
      depositEyebrow: "Pending booking created",
      depositTitle: "Your request is pending.",
      depositBody:
        "Tifawave has your booking request. Pay the deposit next to confirm the stay securely through Stripe.",
      manualEyebrow: "Reservation request received",
      manualTitle: "Reservation request received",
      manualCopy:
        "Tifawave has your request. It stays pending until the team reviews it and confirms by email or WhatsApp.",
      bookingId: "Booking ID",
      status: "Status",
      manualStatusNote:
        "No payment is due now. Admin can confirm or cancel this request from the dashboard.",
      payDeposit: "Pay deposit",
      openingStripe: "Opening Stripe...",
      depositPaymentNote: (depositText: string) =>
        `${depositText}. The booking confirms after payment succeeds.`
    },
    errors: {
      checkoutCouldNotStart: "Stripe checkout could not be started.",
      checkoutCouldNotStartNow: "Stripe checkout could not be started right now.",
      checkoutNotStarted: "Checkout not started",
      pendingNotCreated: "Pending booking not created",
      holdNotCreated: "Hold not created"
    }
  },
  fr: {
    paymentReturn: {
      successEyebrow: "Acompte reçu",
      successTitle: "Votre demande de réservation est confirmée.",
      successCopy:
        "Merci. L'acompte a bien été reçu et l'équipe Tifawave vérifiera les détails avant de vous envoyer les notes d'arrivée.",
      bookingId: "ID de réservation",
      nextSteps: "Prochaines étapes",
      nextStepsCopy: "Surveillez votre email pour la confirmation et les détails du voyage.",
      needHelp: "Besoin d'aide?",
      needHelpCopy: (businessName: string, contactEmail: string) =>
        `Contactez ${businessName} sur WhatsApp ou par email à ${contactEmail}.`,
      backHome: "Accueil",
      contact: "Contact",
      cancelledEyebrow: "Paiement annulé",
      cancelledTitle: "Aucun acompte n'a été prélevé.",
      cancelledCopy:
        "Pas de souci. Vous pouvez relancer le parcours quand vous êtes prêt ou contacter Tifawave si vous avez besoin d'aide pour finaliser l'acompte.",
      status: "Statut",
      cancelledStatusCopy: "Votre réservation n'est confirmée qu'après paiement de l'acompte.",
      support: "Aide",
      supportCopy: (contactEmail: string) =>
        `WhatsApp ou email ${contactEmail}: nous vous aiderons.`,
      tryAgain: "Réessayer"
    },
    availability: {
      initial: "Choisissez une chambre et des dates pour vérifier les disponibilités.",
      fixFields: "Corrigez les champs indiqués.",
      checking: "Vérification des dates...",
      available: "Ces dates sont disponibles. Vous pouvez poser une courte option.",
      notAvailable: "Ces dates ne sont pas disponibles.",
      requestFailed: "Impossible de vérifier les disponibilités pour le moment.",
      holdSuccess: "Vos dates sont temporairement bloquées. Ajoutez vos coordonnées."
    },
    status: {
      checking: "Vérification des dates",
      available: "Dates disponibles",
      unavailable: "Dates indisponibles",
      error: "Vérifier les détails",
      ready: "Prêt à vérifier"
    },
    validation: {
      chooseRoom: "Choisissez une chambre.",
      chooseCheckIn: "Choisissez une date d'arrivée.",
      checkInPast: "L'arrivée ne peut pas être avant aujourd'hui.",
      chooseCheckOut: "Choisissez une date de départ.",
      checkOutAfter: "Le départ doit être après l'arrivée.",
      guestsPositive: "Choisissez au moins 1 personne.",
      guestsCapacity: "Le nombre de personnes dépasse la capacité de cette chambre.",
      guestName: "Indiquez un nom entre 2 et 120 caractères.",
      guestEmail: "Indiquez une adresse email valide.",
      guestPhone: "Indiquez un téléphone ou WhatsApp valide.",
      guestMessage: "Le message doit contenir 1000 caractères maximum."
    },
    roomLoad: {
      noActiveRooms:
        "Aucune chambre n'est disponible pour la vérification en ligne pour le moment. Contactez Tifawave pour les options actuelles.",
      envMissing:
        "Les chambres n'ont pas pu charger pour le moment. Contactez Tifawave si vous avez besoin d'aide pour vérifier les dates."
    },
    flow: {
      eyebrow: "Réservation directe",
      title: "Vérifiez vos dates de séjour Tifawave.",
      copy:
        "Commencez par une chambre et une fenêtre de voyage. Si les dates sont libres, Tifawave peut poser une courte option temporaire.",
      roomPreviewAria: "Aperçu des chambres",
      room: "Chambre",
      loadingRooms: "Chargement des chambres...",
      noActiveRooms: "Aucune chambre active",
      checkIn: "Arrivée",
      checkOut: "Départ",
      guestCount: "Voyageurs",
      loadingRoomOptions: "Chargement des options de chambre...",
      checkAvailability: "Vérifier les disponibilités",
      checking: "Vérification...",
      manualConfirmationBadge: "Confirmation manuelle",
      manualConfirmationNotice:
        "Votre demande reste en attente jusqu'à confirmation par l'équipe Tifawave par email ou WhatsApp.",
      night: "nuit",
      guests: (count: number) => `Jusqu'à ${count} personnes`
    },
    hold: {
      checkBeforeHold: "Vérifiez la chambre et les dates avant de les bloquer.",
      checkAvailabilityFirst: "Vérifiez les disponibilités avant de bloquer les dates.",
      couldNotHold: "Ces dates n'ont pas pu être bloquées.",
      noLongerAvailable: "Ces dates ne sont plus disponibles.",
      requestFailed: "Impossible de créer l'option pour le moment.",
      holdDates: "Bloquer ces dates",
      holdingDates: "Blocage des dates...",
      eyebrow: "Option temporaire confirmée",
      title: "Vos dates sont bloquées.",
      copy:
        "Ajoutez vos coordonnées pour que Tifawave crée une demande de réservation en attente. Aucun paiement n'est encore prélevé.",
      room: "Chambre",
      dates: "Dates",
      to: "au",
      nightlyRate: "Tarif par nuit",
      selectedRoom: "Chambre sélectionnée",
      pending: "En attente",
      holdId: "ID d'option",
      expires: "Expire"
    },
    guest: {
      fixFields: "Corrigez les coordonnées indiquées.",
      pendingCouldNotCreate: "La réservation en attente n'a pas pu être créée.",
      pendingCouldNotCreateNow:
        "La réservation en attente n'a pas pu être créée pour le moment.",
      eyebrow: "Coordonnées",
      title: "Créer une réservation en attente.",
      name: "Nom",
      namePlaceholder: "Votre nom complet",
      email: "Email",
      phone: "Téléphone / WhatsApp",
      message: "Message",
      messagePlaceholder: "Note optionnelle pour l'équipe Tifawave",
      create: "Créer la réservation en attente",
      creating: "Création de la réservation..."
    },
    pending: {
      depositEyebrow: "Réservation en attente créée",
      depositTitle: "Votre demande est en attente.",
      depositBody:
        "Tifawave a reçu votre demande. Réglez l'acompte pour confirmer le séjour en toute sécurité via Stripe.",
      manualEyebrow: "Demande de réservation reçue",
      manualTitle: "Demande de réservation reçue",
      manualCopy:
        "Tifawave a reçu votre demande. Elle reste en attente jusqu'à vérification et confirmation par email ou WhatsApp.",
      bookingId: "ID de réservation",
      status: "Statut",
      manualStatusNote:
        "Aucun paiement n'est dû maintenant. L'admin peut confirmer ou annuler cette demande depuis le tableau de bord.",
      payDeposit: "Payer l'acompte",
      openingStripe: "Ouverture de Stripe...",
      depositPaymentNote: (depositText: string) =>
        `${depositText}. La réservation est confirmée après paiement.`
    },
    errors: {
      checkoutCouldNotStart: "Le paiement Stripe n'a pas pu démarrer.",
      checkoutCouldNotStartNow: "Le paiement Stripe n'a pas pu démarrer pour le moment.",
      checkoutNotStarted: "Paiement non démarré",
      pendingNotCreated: "Réservation en attente non créée",
      holdNotCreated: "Option non créée"
    }
  }
} as const;

function localeTag(locale: Locale): string {
  return locale === "fr" ? "fr-FR" : "en-US";
}

function formatPrice(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTag(locale), {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(cents / 100);
}

function isHoldCreated(response: HoldResponse): response is {
  holdId: string;
  expiresAt: string;
} {
  return "holdId" in response && "expiresAt" in response;
}

function isPendingBookingCreated(response: PendingBookingResponse): response is {
  bookingId: string;
  status: string;
} {
  return "bookingId" in response && "status" in response;
}

function isCheckoutCreated(response: CheckoutResponse): response is {
  checkoutUrl: string;
} {
  return "checkoutUrl" in response;
}

async function readJson<TResponse>(response: Response): Promise<TResponse> {
  const text = await response.text();

  try {
    return JSON.parse(text) as TResponse;
  } catch {
    throw new Error(`Expected JSON response, received: ${text.slice(0, 120)}`);
  }
}

function toDateInputValue(date: Date): string {
  const localDate = new Date(date.getTime());
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function normalizeDateInput(value: string | undefined): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function normalizeGuestCountInput(value: string | undefined): string {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : "1";
}

function parseGuestCount(value: string): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function addDaysToDateInput(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function formatDateInput(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: "medium"
  }).format(new Date(`${value}T00:00:00`));
}

function formatHoldDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTag(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusLabel(
  availability: AvailabilityState,
  isChecking: boolean,
  copy: (typeof bookingCopy)[Locale]["status"]
): string {
  if (isChecking) {
    return copy.checking;
  }

  if (availability.status === "available") {
    return copy.available;
  }

  if (availability.status === "unavailable") {
    return copy.unavailable;
  }

  if (availability.status === "error") {
    return copy.error;
  }

  return copy.ready;
}

export function BookingPaymentReturnPanel({
  locale = DEFAULT_LOCALE,
  paymentReturn,
  settings
}: {
  locale?: Locale;
  paymentReturn: BookingPaymentReturn;
  settings: BookingContactSettings;
}) {
  const copy = bookingCopy[locale].paymentReturn;

  useEffect(() => {
    if (paymentReturn.status === "success") {
      trackStripePaymentSuccessReturn({
        bookingId: paymentReturn.bookingId
      });
    }
  }, [paymentReturn]);

  if (paymentReturn.status === "success") {
    return (
      <section
        className="booking-return-shell booking-return-success"
        aria-labelledby="booking-return-title"
      >
        <p className="eyebrow">{copy.successEyebrow}</p>
        <h1 id="booking-return-title">{copy.successTitle}</h1>
        <p>{copy.successCopy}</p>
        <dl>
          <div>
            <dt>{copy.bookingId}</dt>
            <dd>{paymentReturn.bookingId}</dd>
          </div>
          <div>
            <dt>{copy.nextSteps}</dt>
            <dd>{copy.nextStepsCopy}</dd>
          </div>
          <div>
            <dt>{copy.needHelp}</dt>
            <dd>
              {copy.needHelpCopy(settings.businessName, settings.contactEmail)}
            </dd>
          </div>
        </dl>
        <div className="booking-return-actions">
          <Link className="btn btn-primary" href={localizedPath(locale, "/")}>
            {copy.backHome}
          </Link>
          <a className="btn btn-secondary" href={settings.whatsappHref}>
            {copy.contact}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      className="booking-return-shell booking-return-cancelled"
      aria-labelledby="booking-return-title"
    >
      <p className="eyebrow">{copy.cancelledEyebrow}</p>
      <h1 id="booking-return-title">{copy.cancelledTitle}</h1>
      <p>{copy.cancelledCopy}</p>
      <dl>
        {paymentReturn.bookingId ? (
          <div>
            <dt>{copy.bookingId}</dt>
            <dd>{paymentReturn.bookingId}</dd>
          </div>
        ) : null}
        <div>
          <dt>{copy.status}</dt>
          <dd>{copy.cancelledStatusCopy}</dd>
        </div>
        <div>
          <dt>{copy.support}</dt>
          <dd>{copy.supportCopy(settings.contactEmail)}</dd>
        </div>
      </dl>
      <div className="booking-return-actions">
        <Link className="btn btn-primary" href={localizedPath(locale, "/book")}>
          {copy.tryAgain}
        </Link>
        <a className="btn btn-secondary" href={settings.whatsappHref}>
          {copy.contact}
        </a>
      </div>
    </section>
  );
}

export function BookingAvailabilityForm({
  initialParams = {},
  locale = DEFAULT_LOCALE,
  settings
}: {
  initialParams?: BookingInitialParams;
  locale?: Locale;
  settings: BookingContactSettings;
}) {
  const copy = bookingCopy[locale];
  const initialRoomId = initialParams.roomId?.trim() ?? "";
  const initialCheckIn = normalizeDateInput(initialParams.checkIn);
  const initialCheckOut = normalizeDateInput(initialParams.checkOut);
  const initialGuests = normalizeGuestCountInput(initialParams.guests);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [roomLoadMessage, setRoomLoadMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [guestErrors, setGuestErrors] = useState<GuestFieldErrors>({});
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [message, setMessage] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState>({
    status: "idle",
    message: copy.availability.initial
  });
  const [hold, setHold] = useState<HoldState>({
    status: "idle"
  });
  const [booking, setBooking] = useState<BookingState>({
    status: "idle"
  });
  const [payment, setPayment] = useState<PaymentState>({
    status: "idle"
  });

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === roomId) ?? null,
    [roomId, rooms]
  );
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const isBusy =
    isChecking || isHolding || isCreatingBooking || isStartingCheckout;
  const canUseFields =
    !isLoadingRooms && !isBusy && rooms.length > 0 && booking.status !== "confirmed";
  const checkOutMin = checkIn ? addDaysToDateInput(checkIn, 1) : today;
  const guestCount = parseGuestCount(guests);

  useEffect(() => {
    let isMounted = true;

    async function loadRooms() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("rooms")
          .select("id, slug, name, description, max_guests, base_price_cents")
          .eq("is_active", true)
          .order("base_price_cents", { ascending: true });

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const activeRooms = data ?? [];
        setRooms(activeRooms);
        setRoomId((currentRoomId) => {
          const requestedRoomId = currentRoomId || initialRoomId;

          if (activeRooms.some((room) => room.id === requestedRoomId)) {
            return requestedRoomId;
          }

          return activeRooms[0]?.id ?? "";
        });
        setRoomLoadMessage(
          activeRooms.length > 0 ? "" : copy.roomLoad.noActiveRooms
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setRoomLoadMessage(copy.roomLoad.envMissing);
      } finally {
        if (isMounted) {
          setIsLoadingRooms(false);
        }
      }
    }

    loadRooms();

    return () => {
      isMounted = false;
    };
  }, [copy.roomLoad.envMissing, copy.roomLoad.noActiveRooms, initialRoomId]);

  function resetResultState() {
    setAvailability({
      status: "idle",
      message: copy.availability.initial
    });
    setHold({
      status: "idle"
    });
    setBooking({
      status: "idle"
    });
    setPayment({
      status: "idle"
    });
    setGuestErrors({});
  }

  function validateFields(): FieldErrors {
    const errors: FieldErrors = {};

    if (!roomId) {
      errors.roomId = copy.validation.chooseRoom;
    }

    if (!checkIn) {
      errors.checkIn = copy.validation.chooseCheckIn;
    } else if (today && checkIn < today) {
      errors.checkIn = copy.validation.checkInPast;
    }

    if (!checkOut) {
      errors.checkOut = copy.validation.chooseCheckOut;
    } else if (checkIn && checkOut <= checkIn) {
      errors.checkOut = copy.validation.checkOutAfter;
    }

    if (!Number.isInteger(guestCount) || guestCount < 1) {
      errors.guests = copy.validation.guestsPositive;
    } else if (selectedRoom && guestCount > selectedRoom.max_guests) {
      errors.guests = copy.validation.guestsCapacity;
    }

    return errors;
  }

  function clearFieldError(fieldName: keyof FieldErrors) {
    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];

      if (fieldName === "checkIn") {
        delete nextErrors.checkOut;
      }

      return nextErrors;
    });
  }

  function validateGuestFields(): GuestFieldErrors {
    const errors: GuestFieldErrors = {};
    const normalizedName = guestName.trim().replace(/\s+/g, " ");
    const normalizedEmail = guestEmail.trim().toLowerCase();
    const normalizedPhone = guestPhone.trim().replace(/\s+/g, " ");
    const normalizedMessage = message.trim();

    if (normalizedName.length < 2 || normalizedName.length > 120) {
      errors.guestName = copy.validation.guestName;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
      errors.guestEmail = copy.validation.guestEmail;
    }

    if (!PHONE_PATTERN.test(normalizedPhone)) {
      errors.guestPhone = copy.validation.guestPhone;
    }

    if (normalizedMessage.length > 1000) {
      errors.message = copy.validation.guestMessage;
    }

    return errors;
  }

  function clearGuestError(fieldName: keyof GuestFieldErrors) {
    setGuestErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });
  }

  async function handleAvailabilitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy) {
      return;
    }

    setHold({ status: "idle" });

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setAvailability({
        status: "error",
        message: copy.availability.fixFields
      });
      return;
    }

    setIsChecking(true);
    setAvailability({
      status: "idle",
      message: copy.availability.checking
    });

    try {
      const params = new URLSearchParams({
        roomId,
        checkIn,
        checkOut
      });
      const response = await fetch(`/api/availability?${params.toString()}`);
      const result = await readJson<AvailabilityResponse>(response);

      if (result.available) {
        trackAvailabilityCheck({
          checkIn,
          checkOut,
          roomSlug: selectedRoom?.slug,
          status: "available"
        });
        setAvailability({
          status: "available",
          message: copy.availability.available
        });
        return;
      }

      trackAvailabilityCheck({
        checkIn,
        checkOut,
        reason: result.reason,
        roomSlug: selectedRoom?.slug,
        status: response.status === 400 ? "error" : "unavailable"
      });
      setAvailability({
        status: response.status === 400 ? "error" : "unavailable",
        message: result.message ?? copy.availability.notAvailable
      });
    } catch {
      trackAvailabilityCheck({
        checkIn,
        checkOut,
        reason: "request_failed",
        roomSlug: selectedRoom?.slug,
        status: "error"
      });
      setAvailability({
        status: "error",
        message: copy.availability.requestFailed
      });
    } finally {
      setIsChecking(false);
    }
  }

  async function handleHoldDates() {
    if (isBusy || hold.status === "confirmed") {
      return;
    }

    const errors = validateFields();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setHold({
        status: "error",
        message: copy.hold.checkBeforeHold
      });
      return;
    }

    if (availability.status !== "available") {
      setHold({
        status: "error",
        message: copy.hold.checkAvailabilityFirst
      });
      return;
    }

    setIsHolding(true);
    setHold({ status: "idle" });

    try {
      const response = await fetch("/api/booking/holds", {
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut,
          guests: guestCount
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const result = await readJson<HoldResponse>(response);

      if (response.ok && isHoldCreated(result)) {
        trackHoldCreated({
          checkIn,
          checkOut,
          roomSlug: selectedRoom?.slug
        });
        setHold({
          status: "confirmed",
          holdId: result.holdId,
          expiresAt: result.expiresAt
        });
        setBooking({ status: "idle" });
        setAvailability({
          status: "available",
          message: copy.availability.holdSuccess
        });
        return;
      }

      setHold({
        status: "error",
        message:
          "message" in result
            ? result.message
            : copy.hold.couldNotHold
      });
      setAvailability({
        status: "unavailable",
        message:
          "message" in result
            ? result.message
            : copy.hold.noLongerAvailable
      });
    } catch {
      setHold({
        status: "error",
        message: copy.hold.requestFailed
      });
    } finally {
      setIsHolding(false);
    }
  }

  async function handlePendingBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isBusy || hold.status !== "confirmed" || booking.status === "confirmed") {
      return;
    }

    const errors = validateGuestFields();
    setGuestErrors(errors);

    if (Object.keys(errors).length > 0) {
      setBooking({
        status: "error",
        message: copy.guest.fixFields
      });
      return;
    }

    setIsCreatingBooking(true);
    setBooking({ status: "idle" });

    try {
      const response = await fetch("/api/booking", {
        body: JSON.stringify({
          holdId: hold.holdId,
          guestName,
          guestEmail,
          guestPhone,
          message
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const result = await readJson<PendingBookingResponse>(response);

      if (response.ok && isPendingBookingCreated(result)) {
        trackPendingBookingCreated({
          bookingStatus: result.status,
          roomSlug: selectedRoom?.slug
        });
        setBooking({
          status: "confirmed",
          bookingId: result.bookingId,
          bookingStatus: result.status
        });
        setPayment({
          status: "idle"
        });
        return;
      }

      setBooking({
        status: "error",
        message:
          "message" in result
            ? result.message
            : copy.guest.pendingCouldNotCreate
      });
    } catch {
      setBooking({
        status: "error",
        message: copy.guest.pendingCouldNotCreateNow
      });
    } finally {
      setIsCreatingBooking(false);
    }
  }

  async function handleDepositCheckout() {
    if (
      !settings.depositsEnabled ||
      isStartingCheckout ||
      booking.status !== "confirmed"
    ) {
      return;
    }

    setIsStartingCheckout(true);
    setPayment({ status: "idle" });

    try {
      const response = await fetch("/api/booking/checkout", {
        body: JSON.stringify({
          bookingId: booking.bookingId,
          locale
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });
      const result = await readJson<CheckoutResponse>(response);

      if (response.ok && isCheckoutCreated(result)) {
        trackStripeCheckoutStart({
          roomSlug: selectedRoom?.slug
        });
        window.location.assign(result.checkoutUrl);
        return;
      }

      setPayment({
        status: "error",
        message:
          "message" in result
            ? result.message
            : copy.errors.checkoutCouldNotStart
      });
    } catch {
      setPayment({
        status: "error",
        message: copy.errors.checkoutCouldNotStartNow
      });
    } finally {
      setIsStartingCheckout(false);
    }
  }

  return (
    <section className="booking-flow" aria-labelledby="booking-flow-title">
      <div className="booking-flow-copy">
        <p className="eyebrow">{copy.flow.eyebrow}</p>
        <h1 id="booking-flow-title">{copy.flow.title}</h1>
        <p>{copy.flow.copy}</p>
        {rooms.length > 0 ? (
          <div className="booking-room-preview" aria-label={copy.flow.roomPreviewAria}>
            {rooms.map((room) => (
              <span key={room.id}>{room.name}</span>
            ))}
          </div>
        ) : null}
        <div className="booking-contact-panel">
          <p>
            {settings.depositsEnabled
              ? settings.bookingNoticeText
              : copy.flow.manualConfirmationNotice}
          </p>
          <span>
            {settings.depositsEnabled
              ? settings.stripeDepositAmountDisplay
              : copy.flow.manualConfirmationBadge}
          </span>
          <div>
            <a href={settings.whatsappHref}>WhatsApp</a>
            <a href={`mailto:${settings.contactEmail}`}>
              {settings.contactEmail}
            </a>
            {settings.supportPhone ? (
              <a href={`tel:${settings.supportPhone.replace(/\s+/g, "")}`}>
                {settings.supportPhone}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="booking-panel" aria-busy={isBusy || isLoadingRooms}>
        <form className="booking-form" noValidate onSubmit={handleAvailabilitySubmit}>
          <label className="booking-field" htmlFor="booking-room">
            <span>{copy.flow.room}</span>
            <select
              aria-describedby={
                fieldErrors.roomId ? "booking-room-error" : undefined
              }
              aria-invalid={Boolean(fieldErrors.roomId)}
              disabled={!canUseFields}
              id="booking-room"
              onChange={(event) => {
                setRoomId(event.target.value);
                clearFieldError("roomId");
                resetResultState();
              }}
              required
              value={roomId}
            >
              {isLoadingRooms ? (
                <option value="">{copy.flow.loadingRooms}</option>
              ) : rooms.length > 0 ? (
                rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} - {formatPrice(room.base_price_cents, locale)} /{" "}
                    {copy.flow.night}
                  </option>
                ))
              ) : (
                <option value="">{copy.flow.noActiveRooms}</option>
              )}
            </select>
            {fieldErrors.roomId ? (
              <small className="booking-field-error" id="booking-room-error">
                {fieldErrors.roomId}
              </small>
            ) : null}
          </label>

          <div className="booking-date-grid">
            <label className="booking-field" htmlFor="booking-check-in">
              <span>{copy.flow.checkIn}</span>
              <input
                aria-describedby={
                  fieldErrors.checkIn ? "booking-check-in-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.checkIn)}
                disabled={!canUseFields}
                id="booking-check-in"
                min={today || undefined}
                onChange={(event) => {
                  setCheckIn(event.target.value);
                  clearFieldError("checkIn");
                  resetResultState();
                }}
                required
                type="date"
                value={checkIn}
              />
              {fieldErrors.checkIn ? (
                <small
                  className="booking-field-error"
                  id="booking-check-in-error"
                >
                  {fieldErrors.checkIn}
                </small>
              ) : null}
            </label>

            <label className="booking-field" htmlFor="booking-check-out">
              <span>{copy.flow.checkOut}</span>
              <input
                aria-describedby={
                  fieldErrors.checkOut ? "booking-check-out-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.checkOut)}
                disabled={!canUseFields}
                id="booking-check-out"
                min={checkOutMin || undefined}
                onChange={(event) => {
                  setCheckOut(event.target.value);
                  clearFieldError("checkOut");
                  resetResultState();
                }}
                required
                type="date"
                value={checkOut}
              />
              {fieldErrors.checkOut ? (
                <small
                  className="booking-field-error"
                  id="booking-check-out-error"
                >
                  {fieldErrors.checkOut}
                </small>
              ) : null}
            </label>

            <label className="booking-field" htmlFor="booking-guests">
              <span>{copy.flow.guestCount}</span>
              <input
                aria-describedby={
                  fieldErrors.guests ? "booking-guests-error" : undefined
                }
                aria-invalid={Boolean(fieldErrors.guests)}
                disabled={!canUseFields}
                id="booking-guests"
                max={selectedRoom?.max_guests}
                min="1"
                onChange={(event) => {
                  setGuests(event.target.value);
                  clearFieldError("guests");
                  resetResultState();
                }}
                required
                type="number"
                value={guests}
              />
              {fieldErrors.guests ? (
                <small className="booking-field-error" id="booking-guests-error">
                  {fieldErrors.guests}
                </small>
              ) : null}
            </label>
          </div>

          {selectedRoom ? (
            <div className="booking-room-summary">
              <div className="booking-room-summary-heading">
                <strong>{selectedRoom.name}</strong>
                <span>
                  {formatPrice(selectedRoom.base_price_cents, locale)} /{" "}
                  {copy.flow.night}
                </span>
              </div>
              <p>{selectedRoom.description}</p>
              <span>{copy.flow.guests(selectedRoom.max_guests)}</span>
            </div>
          ) : null}

          {isLoadingRooms ? (
            <p className="booking-muted-note">{copy.flow.loadingRoomOptions}</p>
          ) : null}

          {roomLoadMessage ? (
            <p className="booking-muted-note">{roomLoadMessage}</p>
          ) : null}

          <button
            className="btn btn-primary booking-submit"
            disabled={!canUseFields}
            type="submit"
          >
            {isChecking ? copy.flow.checking : copy.flow.checkAvailability}
          </button>
        </form>

        <div
          className={`booking-status booking-status-${availability.status}${
            isChecking ? " booking-status-loading" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="booking-status-copy">
            <span>{statusLabel(availability, isChecking, copy.status)}</span>
            <p>{availability.message}</p>
          </div>
          {availability.status === "available" && hold.status !== "confirmed" ? (
            <button
              className="btn btn-secondary"
              disabled={isHolding}
              onClick={handleHoldDates}
              type="button"
            >
              {isHolding ? copy.hold.holdingDates : copy.hold.holdDates}
            </button>
          ) : null}
        </div>

        {hold.status === "confirmed" ? (
          <div className="booking-confirmation" aria-live="polite">
            <p className="eyebrow">{copy.hold.eyebrow}</p>
            <h2>{copy.hold.title}</h2>
            <p>{copy.hold.copy}</p>
            <dl>
              <div>
                <dt>{copy.hold.room}</dt>
                <dd>{selectedRoom?.name ?? copy.hold.selectedRoom}</dd>
              </div>
              <div>
                <dt>{copy.hold.dates}</dt>
                <dd>
                  {formatDateInput(checkIn, locale)} {copy.hold.to}{" "}
                  {formatDateInput(checkOut, locale)}
                </dd>
              </div>
              <div>
                <dt>{copy.hold.nightlyRate}</dt>
                <dd>
                  {selectedRoom
                    ? `${formatPrice(selectedRoom.base_price_cents, locale)} / ${
                        copy.flow.night
                      }`
                    : copy.hold.pending}
                </dd>
              </div>
              <div>
                <dt>{copy.hold.holdId}</dt>
                <dd>{hold.holdId}</dd>
              </div>
              <div>
                <dt>{copy.hold.expires}</dt>
                <dd>{formatHoldDate(hold.expiresAt, locale)}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {hold.status === "confirmed" && booking.status !== "confirmed" ? (
          <form
            className="booking-guest-form"
            noValidate
            onSubmit={handlePendingBookingSubmit}
          >
            <div className="booking-guest-heading">
              <p className="eyebrow">{copy.guest.eyebrow}</p>
              <h2>{copy.guest.title}</h2>
            </div>

            <label className="booking-field" htmlFor="booking-guest-name">
              <span>{copy.guest.name}</span>
              <input
                aria-describedby={
                  guestErrors.guestName ? "booking-guest-name-error" : undefined
                }
                aria-invalid={Boolean(guestErrors.guestName)}
                disabled={isCreatingBooking}
                id="booking-guest-name"
                onChange={(event) => {
                  setGuestName(event.target.value);
                  clearGuestError("guestName");
                }}
                placeholder={copy.guest.namePlaceholder}
                required
                type="text"
                value={guestName}
              />
              {guestErrors.guestName ? (
                <small
                  className="booking-field-error"
                  id="booking-guest-name-error"
                >
                  {guestErrors.guestName}
                </small>
              ) : null}
            </label>

            <label className="booking-field" htmlFor="booking-guest-email">
              <span>{copy.guest.email}</span>
              <input
                aria-describedby={
                  guestErrors.guestEmail
                    ? "booking-guest-email-error"
                    : undefined
                }
                aria-invalid={Boolean(guestErrors.guestEmail)}
                disabled={isCreatingBooking}
                id="booking-guest-email"
                onChange={(event) => {
                  setGuestEmail(event.target.value);
                  clearGuestError("guestEmail");
                }}
                placeholder="you@example.com"
                required
                type="email"
                value={guestEmail}
              />
              {guestErrors.guestEmail ? (
                <small
                  className="booking-field-error"
                  id="booking-guest-email-error"
                >
                  {guestErrors.guestEmail}
                </small>
              ) : null}
            </label>

            <label className="booking-field" htmlFor="booking-guest-phone">
              <span>{copy.guest.phone}</span>
              <input
                aria-describedby={
                  guestErrors.guestPhone
                    ? "booking-guest-phone-error"
                    : undefined
                }
                aria-invalid={Boolean(guestErrors.guestPhone)}
                disabled={isCreatingBooking}
                id="booking-guest-phone"
                onChange={(event) => {
                  setGuestPhone(event.target.value);
                  clearGuestError("guestPhone");
                }}
                placeholder="+212 600 000 000"
                required
                type="tel"
                value={guestPhone}
              />
              {guestErrors.guestPhone ? (
                <small
                  className="booking-field-error"
                  id="booking-guest-phone-error"
                >
                  {guestErrors.guestPhone}
                </small>
              ) : null}
            </label>

            <label className="booking-field" htmlFor="booking-guest-message">
              <span>{copy.guest.message}</span>
              <textarea
                aria-describedby={
                  guestErrors.message ? "booking-guest-message-error" : undefined
                }
                aria-invalid={Boolean(guestErrors.message)}
                disabled={isCreatingBooking}
                id="booking-guest-message"
                onChange={(event) => {
                  setMessage(event.target.value);
                  clearGuestError("message");
                }}
                placeholder={copy.guest.messagePlaceholder}
                rows={4}
                value={message}
              />
              {guestErrors.message ? (
                <small
                  className="booking-field-error"
                  id="booking-guest-message-error"
                >
                  {guestErrors.message}
                </small>
              ) : null}
            </label>

            <button
              className="btn btn-primary booking-submit"
              disabled={isCreatingBooking}
              type="submit"
            >
              {isCreatingBooking ? copy.guest.creating : copy.guest.create}
            </button>
          </form>
        ) : null}

        {booking.status === "confirmed" ? (
          <div className="booking-pending-confirmation" aria-live="polite">
            <p className="eyebrow">
              {settings.depositsEnabled
                ? copy.pending.depositEyebrow
                : copy.pending.manualEyebrow}
            </p>
            <h2>
              {settings.depositsEnabled
                ? copy.pending.depositTitle
                : copy.pending.manualTitle}
            </h2>
            <p>
              {settings.depositsEnabled
                ? copy.pending.depositBody
                : copy.pending.manualCopy}
            </p>
            <dl>
              <div>
                <dt>{copy.pending.bookingId}</dt>
                <dd>{booking.bookingId}</dd>
              </div>
              <div>
                <dt>{copy.pending.status}</dt>
                <dd>{booking.bookingStatus}</dd>
              </div>
            </dl>
            {settings.depositsEnabled ? (
              <div className="booking-payment-actions">
                <button
                  className="btn btn-primary"
                  disabled={isStartingCheckout}
                  onClick={handleDepositCheckout}
                  type="button"
                >
                  {isStartingCheckout
                    ? copy.pending.openingStripe
                    : copy.pending.payDeposit}
                </button>
                <p>
                  {copy.pending.depositPaymentNote(
                    settings.stripeDepositAmountDisplay
                  )}
                </p>
              </div>
            ) : (
              <p className="booking-muted-note">{copy.pending.manualStatusNote}</p>
            )}
          </div>
        ) : null}

        {payment.status === "error" ? (
          <div className="booking-status booking-status-error" role="status">
            <div className="booking-status-copy">
              <span>{copy.errors.checkoutNotStarted}</span>
              <p>{payment.message}</p>
            </div>
          </div>
        ) : null}

        {booking.status === "error" ? (
          <div className="booking-status booking-status-error" role="status">
            <div className="booking-status-copy">
              <span>{copy.errors.pendingNotCreated}</span>
              <p>{booking.message}</p>
            </div>
          </div>
        ) : null}

        {hold.status === "error" ? (
          <div className="booking-status booking-status-error" role="status">
            <div className="booking-status-copy">
              <span>{copy.errors.holdNotCreated}</span>
              <p>{hold.message}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
