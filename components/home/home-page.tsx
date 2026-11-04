import { RoomBathroom } from "@/components/content/room-bathroom";
import { CmsPhoto } from "@/components/content/cms-photo";
import Link from "next/link";
import { Container } from "@/components/primitives/container";
import { getActiveRooms } from "@/lib/rooms";
import { getActiveGalleryImages } from "@/lib/gallery";
import { getActiveSurfPackages } from "@/lib/surf-packages";
import { publishedContent } from "@/lib/content/public";
import { getWebsiteSettings, getWhatsappHref } from "@/lib/settings";
import { localizedPath, type Locale } from "@/lib/i18n";
import {
  homePrice,
  homeRoomCategories,
  homeRoomName,
  homeRoomSlugs,
  homeSection,
  packageRequestPath,
  roomRequestPath,
  surfEnquiryPath,
} from "@/lib/homepage";
import {
  getPrimaryRoomHomeImage,
  getTaggedGalleryHomeImage,
  type HomeImage,
} from "@/lib/home-media";
import { focalPositionToCss } from "@/lib/image-position";
import { HeroSection } from "./hero-section";
import { ReviewsSection } from "./reviews-section";
import { FinalCta } from "./final-cta";
import { HomeTracking } from "./home-tracking";
import "./home-conversion.css";

function Photo({
  image,
  label,
  className = "",
}: {
  image: HomeImage | null;
  label: string;
  className?: string;
}) {
  return (
    <div className={`hc-photo ${className}`}>
      {image ? (
        <CmsPhoto
          key={image.imageUrl}
          src={image.imageUrl}
          alt={image.altText || label}
          position={focalPositionToCss(image.focalPosition)}
        />
      ) : (
        <div className="hc-photo-fallback">
          <span>Tifawave.</span>
          <small>{label}</small>
        </div>
      )}
    </div>
  );
}

export async function HomePage({ locale }: { locale: Locale }) {
  const fr = locale === "fr";
  const t = (en: string, french: string) => (fr ? french : en);
  const path = (p: string) => localizedPath(locale, p);
  const [
    rooms,
    gallery,
    packages,
    content,
    settings,
    packageContent,
    faqContent,
    roomDocs,
  ] = await Promise.all([
    getActiveRooms(),
    getActiveGalleryImages(),
    getActiveSurfPackages(locale),
    publishedContent("page", "home", locale),
    getWebsiteSettings(),
    publishedContent("page", "packages", locale),
    publishedContent("page", "faq", locale),
    Promise.all(
      homeRoomSlugs.map((slug) => publishedContent("room", slug, locale)),
    ),
  ]);
  const roomContent = new Map(
    homeRoomSlugs.map((slug, i) => [slug, roomDocs[i]]),
  );
  const sectionImage = (
    key: (typeof import("@/lib/homepage").homeSectionOrder)[number],
  ) => {
    const keys = [
      "experiences",
      "rooms",
      "surf",
      "excursions",
      "yoga",
      "breakfast",
      "meals",
      "rooftop",
      "packages",
      "day",
      "groups",
      "location",
    ];
    const s = content?.sections[keys.indexOf(key)];
    return s?.imageUrl
      ? {
          imageUrl: s.imageUrl,
          altText: s.imageAlt || "",
          focalPosition: s.focalPosition || ("center" as const),
        }
      : null;
  };
  const heroImage =
    getTaggedGalleryHomeImage(gallery, ["view", "sunset"]) ||
    getPrimaryRoomHomeImage(rooms);
  const breakfast =
    sectionImage("breakfast") ||
    getTaggedGalleryHomeImage(gallery, ["food", "breakfast"]);
  const sunset = gallery.filter((g) => g.category === "view").at(-1);
  const rooftop =
    sectionImage("rooftop") ||
    (sunset
      ? {
          imageUrl: sunset.imageUrl,
          altText: sunset.altText,
          focalPosition: sunset.focalPosition,
        }
      : heroImage);
  const section = (
    key: Parameters<typeof homeSection>[1],
    enTitle: string,
    frTitle: string,
    enBody: string,
    frBody: string,
  ) => homeSection(content, key, t(enTitle, frTitle), t(enBody, frBody));
  const experience = section(
    "experiences",
    "Your stay. Your kind of rhythm.",
    "Votre séjour. Votre rythme.",
    "A room, a surf trip, or everyone together. Start with what brings you here.",
    "Une chambre, un séjour surf ou un voyage ensemble. Choisissez ce qui vous ressemble.",
  );
  const stay = section(
    "rooms",
    "Find your place to unwind.",
    "Trouvez votre refuge.",
    "Five room categories. Nine real rooms. A little space to make your own.",
    "Cinq catégories. Neuf chambres. Un espace pour vous sentir bien.",
  );
  const surf = section(
    "surf",
    "Make room for the ocean.",
    "Faites une place à l’océan.",
    "Curious about your first wave or looking to progress? Enquire about surf lessons. Availability, coaching, equipment and prices are confirmed personally.",
    "Premières vagues ou envie de progresser ? Parlez-nous de cours de surf. Disponibilités, encadrement, matériel et tarifs sont confirmés personnellement.",
  );
  const excursions = section(
    "excursions",
    "A little further afield.",
    "Explorez les alentours.",
    "Ask about optional local excursions. Routes, arrangements and any extra cost depend on availability.",
    "Renseignez-vous sur les excursions locales en option. Parcours, organisation et éventuels suppléments dépendent des disponibilités.",
  );
  const yoga = section(
    "yoga",
    "Slow down, stretch out.",
    "Ralentissez, respirez.",
    "Yoga is optional and on request. Ask what can be arranged for your dates; daily sessions are not guaranteed.",
    "Le yoga est proposé en option, sur demande. Vérifiez les possibilités pour vos dates ; les séances quotidiennes ne sont pas garanties.",
  );
  const food = section(
    "breakfast",
    "Good mornings start here.",
    "Les belles journées commencent ici.",
    "Breakfast is included with accommodation. An easy start before the day takes you wherever you want to go.",
    "Le petit-déjeuner est inclus avec l’hébergement. Prenez le temps de bien commencer la journée, puis suivez vos envies.",
  );
  const meals = section(
    "meals",
    "A taste of Morocco.",
    "Les saveurs du Maroc.",
    "Ask about Moroccan meals and dinner. These are optional, subject to confirmation and not included in the room rate.",
    "Renseignez-vous sur les repas marocains et le dîner. Ils sont en option, sous réserve de confirmation, et ne sont pas inclus dans le tarif de la chambre.",
  );
  const roof = section(
    "rooftop",
    "Less rush. More rooftop.",
    "Moins de hâte. Plus de terrasse.",
    "A relaxing, social space to pause, share a conversation and enjoy the atmosphere. No fixed programme, no promise of organized dining every night.",
    "Un espace convivial pour se détendre, discuter et profiter de l’ambiance. Sans programme imposé ni repas organisé promis chaque soir.",
  );
  const offers = section(
    "packages",
    "Build a stay around the waves.",
    "Composez votre séjour autour des vagues.",
    "Tell us your dates and your surf experience. We’ll discuss the options and confirm the details before you commit.",
    "Indiquez vos dates et votre expérience du surf. Nous discutons des possibilités et confirmons les détails avant votre engagement.",
  );
  const day = section(
    "day",
    "A day, the Tifawave way.",
    "Une journée à votre rythme.",
    "A little inspiration, never a timetable. Surf conditions, your plans and the experiences you arrange shape each day.",
    "Un peu d’inspiration, jamais un emploi du temps. Les conditions de surf, vos envies et les activités convenues donnent le rythme.",
  );
  const groups = section(
    "groups",
    "Bring your people.",
    "Venez avec votre tribu.",
    "University friends, surf clubs, retreat organizers and travel agencies: let’s shape a stay around your group.",
    "Groupes universitaires, clubs de surf, organisateurs de retraites et agences de voyages : imaginons un séjour pour votre groupe.",
  );
  const location = section(
    "location",
    "Meet us in Tamraght.",
    "Retrouvez-nous à Tamraght.",
    "Your base in Tamraght, Morocco. Ask us for practical arrival directions and any transfer options before making arrangements.",
    "Votre point de départ à Tamraght, au Maroc. Contactez-nous pour les indications d’arrivée et les possibilités de transfert avant de vous organiser.",
  );
  const defaultFaqs = [
    {
      question: t(
        "Is my request a confirmed booking?",
        "Ma demande confirme-t-elle la réservation ?",
      ),
      answer: t(
        "No. Every request stays Pending until the Owner checks Booking.com, Airbnb and the separately managed reservation list, allocates a room or bed and confirms personally. There is no live availability guarantee or online payment.",
        "Non. Chaque demande reste en attente : le propriétaire vérifie Booking.com, Airbnb et les réservations gérées séparément, attribue une chambre ou un lit et confirme personnellement. Aucune disponibilité en temps réel ni aucun paiement en ligne.",
      ),
    },
    {
      question: t(
        "What does the room rate include?",
        "Que comprend le tarif de l’hébergement ?",
      ),
      answer: settings.breakfastIncluded
        ? t(
            "Breakfast is included. Dorm prices are per person/bed/night; private-room prices are per room/night. Surf lessons, excursions, yoga and additional meals are optional and confirmed separately.",
            "Le petit-déjeuner est inclus. Le dortoir est facturé par personne/lit/nuit ; les chambres privées, par chambre/nuit. Cours de surf, excursions, yoga et repas supplémentaires sont en option et confirmés séparément.",
          )
        : t(
            "See the current room details. Optional experiences and additional meals are confirmed separately.",
            "Consultez les informations actuelles des chambres. Les activités et repas supplémentaires sont confirmés séparément.",
          ),
    },
    {
      question: t("Can we stay as a group?", "Pouvons-nous venir en groupe ?"),
      answer: t(
        "Yes, enquire for up to 23 guests across nine physical rooms, subject to room arrangements and manual availability checks. The family suite is one unit; the four dorm beds are allocated individually.",
        "Oui, faites une demande pour jusqu’à 23 voyageurs répartis dans neuf chambres, selon la configuration et après vérification manuelle. La suite familiale est une unité entière ; les quatre lits du dortoir sont attribués individuellement.",
      ),
    },
    {
      question: t(
        "What about arrival and cancellation terms?",
        "Quelles sont les conditions d’arrivée et d’annulation ?",
      ),
      answer: t(
        "Ask us for the current arrival and cancellation terms before confirming. Transfers are optional; availability and any cost are confirmed separately.",
        "Demandez les conditions actuelles d’arrivée et d’annulation avant confirmation. Les transferts sont en option ; disponibilités et éventuels frais sont confirmés séparément.",
      ),
    },
  ];
  const faqs = content?.faqs.length
    ? content.faqs
    : faqContent?.faqs.length
      ? faqContent.faqs.slice(0, 6)
      : defaultFaqs;
  return (
    <main className="conversion-home" data-homepage={locale}>
      <HomeTracking />
      <HeroSection
        locale={locale}
        image={heroImage}
        breakfastIncluded={settings.breakfastIncluded}
      />
      <div className="hc-assurance">
        <Container>
          <span>
            {settings.breakfastIncluded
              ? t("Breakfast included", "Petit-déjeuner inclus")
              : t("Personal stay planning", "Un séjour préparé ensemble")}
          </span>
          <span>
            {t(
              "9 rooms · up to 23 guests",
              "9 chambres · jusqu’à 23 voyageurs",
            )}
          </span>
          <span>
            {t(
              "Request first. Personal confirmation.",
              "Une demande. Une confirmation personnelle.",
            )}
          </span>
        </Container>
      </div>

      <section
        className="hc-section hc-experiences"
        id="experiences"
        aria-labelledby="hc-experience-title"
      >
        <Container>
          <div className="hc-heading">
            <p className="eyebrow">
              {t("Choose your experience", "Choisissez votre expérience")}
            </p>
            <h2 id="hc-experience-title">{experience.heading}</h2>
            <p>{experience.body}</p>
            {content?.body && <p className="hc-editorial">{content.body}</p>}
          </div>
          <div className="hc-experience-grid">
            {[
              [
                "01",
                t("Room Only", "Hébergement seul"),
                t(
                  "A private room or a dorm bed, with breakfast included.",
                  "Une chambre privée ou un lit en dortoir, avec petit-déjeuner inclus.",
                ),
                "#rooms",
                t("Find your room", "Trouvez votre chambre"),
                "room",
              ],
              [
                "02",
                t("Surf & Stay", "Surf & séjour"),
                t(
                  "Start with your dates, your level and your idea of a surf trip.",
                  "Commencez par vos dates, votre niveau et vos envies de surf.",
                ),
                "#surf-packages",
                t("Plan your surf stay", "Préparez votre séjour surf"),
                "surf",
              ],
              [
                "03",
                t("Groups & Retreats", "Groupes & retraites"),
                t(
                  "A shared adventure for friends, clubs and organized groups.",
                  "Une aventure à partager entre amis, clubs et groupes organisés.",
                ),
                path("/groups"),
                t("Request a group quote", "Demander un devis groupe"),
                "group",
              ],
            ].map(([n, title, body, href, label, intent]) => (
              <Link
                className="hc-experience"
                href={href}
                key={n}
                data-home-cta="experience"
                data-intent={intent}
              >
                <span className="hc-index">
                  {n} <span aria-hidden="true">↗</span>
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
                <span className="hc-text-link">
                  {label} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section
        className="hc-section hc-rooms"
        id="rooms"
        aria-labelledby="hc-room-title"
      >
        <Container>
          <div className="hc-heading hc-heading-row">
            <div>
              <p className="eyebrow">{t("Our rooms", "Nos chambres")}</p>
              <h2 id="hc-room-title">{stay.heading}</h2>
              <p>{stay.body}</p>
            </div>
            <Link className="hc-text-link" href={path("/stay")}>
              {t("All rooms & details", "Toutes les chambres")} →
            </Link>
          </div>
          <div className="hc-room-grid">
            {homeRoomCategories(rooms).map(({ room, balcony }) => {
              const doc = roomContent.get(room.slug);
              const img =
                room.images.find((i) => i.isPrimary) || room.images[0];
              const dorm = room.slug === "4-bed-dorm-room";
              return (
                <article
                  className={`hc-room-card${balcony ? " hc-room-wide" : ""}`}
                  key={room.id}
                >
                  <div className="hc-room-photo">
                    {img ? (
                      <CmsPhoto
                        src={doc?.heroImage || img.imageUrl}
                        alt={
                          doc?.heroAlt ||
                          img.altText ||
                          homeRoomName(room.slug, room.name, locale)
                        }
                        position={
                          doc?.heroImage
                            ? doc.heroFocal
                            : focalPositionToCss(img.focalPosition)
                        }
                        mobilePosition={
                          doc?.heroImage
                            ? doc.heroMobileFocal
                            : focalPositionToCss(img.focalPosition)
                        }
                      />
                    ) : (
                      <span>
                        {t(
                          "Ask us for room photos",
                          "Demandez les photos de la chambre",
                        )}
                      </span>
                    )}
                    <span className="hc-room-capacity">
                      {dorm
                        ? t("4-bed shared dorm", "Dortoir partagé de 4 lits")
                        : t(
                            `Up to ${room.maxGuests} guests`,
                            `Jusqu’à ${room.maxGuests} voyageurs`,
                          )}
                    </span>
                  </div>
                  <div className="hc-room-body">
                    <div className="hc-room-top">
                      <h3>
                        {doc?.title ||
                          homeRoomName(room.slug, room.name, locale)}
                      </h3>
                      <p className="hc-room-price">
                        {balcony && <small>{t("From ", "Dès ")}</small>}
                        <strong>
                          {homePrice(
                            room.basePriceCents,
                            settings.defaultCurrency,
                            locale,
                          )}
                        </strong>
                        <small>
                          {dorm
                            ? t("/ person / night", "/ personne / nuit")
                            : t("/ room / night", "/ chambre / nuit")}
                        </small>
                      </p>
                    </div>
                    <p>
                      {doc?.summary ||
                        (dorm
                          ? t(
                              "Your own bed in our four-bed dorm.",
                              "Votre lit individuel dans notre dortoir de quatre lits.",
                            )
                          : room.slug === "family-room-4p"
                            ? t(
                                "One double bed + two singles. One whole suite.",
                                "Un lit double et deux lits simples. Une suite entière.",
                              )
                            : room.slug === "twin-room"
                              ? t(
                                  "Two single beds. A room to share your way.",
                                  "Deux lits simples. Une chambre à partager à votre façon.",
                                )
                              : room.slug === "triple-room"
                                ? t(
                                    "A private room for up to three.",
                                    "Une chambre privée pour trois personnes maximum.",
                                  )
                                : t(
                                    "Standard doubles, plus two balcony doubles.",
                                    "Des doubles standard et deux doubles avec balcon.",
                                  ))}
                    </p>
                    <div className="hc-room-tags">
                      {settings.breakfastIncluded && (
                        <span>
                          {t("Breakfast included", "Petit-déjeuner inclus")}
                        </span>
                      )}
                      <span>
                        {t("Manual confirmation", "Confirmation manuelle")}
                      </span>
                    </div>
                    {balcony && (
                      <Link
                        className="hc-balcony"
                        href={roomRequestPath(locale, balcony.id)}
                        data-home-cta="balcony_request"
                        data-intent="room"
                      >
                        {t("Prefer a balcony?", "Envie d’un balcon ?")}{" "}
                        {homePrice(
                          balcony.basePriceCents,
                          settings.defaultCurrency,
                          locale,
                        )}{" "}
                        {t("/ room / night", "/ chambre / nuit")} →
                      </Link>
                    )}
                    <div className="hc-card-actions">
                      <Link
                        className="hc-text-link"
                        href={path("/stay/" + room.slug)}
                        data-home-cta="view_room"
                        data-intent="room"
                      >
                        {t("View room", "Voir la chambre")} →
                      </Link>
                      <RoomBathroom type={room.bathroomType} locale={locale} />
                      <Link
                        className="btn btn-primary"
                        href={roomRequestPath(locale, room.id)}
                        data-home-cta="room_request"
                        data-intent="room"
                      >
                        {t("Request This Room", "Demander cette chambre")}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {!rooms.length && (
            <p>
              {t(
                "Contact us to choose a room for your dates.",
                "Contactez-nous pour choisir une chambre pour vos dates.",
              )}
            </p>
          )}
          <p className="hc-footnote">
            {t(
              "Guide rates, not a live availability offer. Every request stays Pending until the Owner’s manual confirmation.",
              "Tarifs indicatifs, sans garantie de disponibilité en temps réel. Chaque demande reste en attente jusqu’à la confirmation manuelle du propriétaire.",
            )}
          </p>
        </Container>
      </section>

      <section
        className="hc-section hc-activities"
        id="surfing"
        aria-labelledby="hc-surf-title"
      >
        <Container>
          <div className="hc-surf-lead">
            <div>
              <p className="eyebrow">
                {t("Surfing & activities", "Surf & activités")}
              </p>
              {sectionImage("surf") && (
                <Photo
                  image={sectionImage("surf")}
                  label={sectionImage("surf")!.altText}
                />
              )}
              <h2 id="hc-surf-title">{surf.heading}</h2>
              <p>{surf.body}</p>
              <span className="hc-pill">
                {t(
                  "On enquiry · confirmed separately",
                  "Sur demande · confirmation séparée",
                )}
              </span>
              <Link
                className="btn btn-primary"
                href={surfEnquiryPath(locale, "lessons")}
                data-home-cta="surf_lessons"
                data-intent="surf"
              >
                {t("Ask about surf lessons", "Se renseigner sur les cours")} →
              </Link>
            </div>
            <div className="hc-ocean-art" aria-hidden="true">
              <span>
                {t("the ocean", "l’océan")}
                <br />
                {t("sets the pace.", "donne le rythme.")}
              </span>
              <svg viewBox="0 0 520 210" fill="none">
                <path
                  d="M0 140Q70 40 160 140T340 140T520 140M0 170Q70 70 160 170T340 170T520 170M0 200Q70 100 160 200T340 200T520 200"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </div>
          </div>
          <div className="hc-optional-grid">
            {[
              [
                excursions,
                t(
                  "Optional local experiences",
                  "Expériences locales en option",
                ),
              ],
              [yoga, t("Optional · on request", "En option · sur demande")],
            ].map(([s, badge]) => {
              const c = s as { heading: string; body: string };
              return (
                <article key={c.heading}>
                  <span className="hc-pill">{badge as string}</span>
                  <h3>{c.heading}</h3>
                  <p>{c.body}</p>
                  <Link
                    className="hc-text-link"
                    href={surfEnquiryPath(locale, "activities")}
                    data-home-cta="activity_enquiry"
                    data-intent="surf"
                  >
                    {t("Tell us your plans", "Parlez-nous de vos envies")} →
                  </Link>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      <section
        className="hc-section hc-lifestyle"
        id="life"
        aria-labelledby="hc-breakfast-title"
      >
        <Container>
          <div className="hc-split">
            <Photo
              image={breakfast}
              label={t("Breakfast at Tifawave", "Petit-déjeuner chez Tifawave")}
            />
            <div className="hc-split-copy">
              <p className="eyebrow">
                {t("Food & easy mornings", "À table, tout simplement")}
              </p>
              <span className="hc-pill">
                {settings.breakfastIncluded
                  ? t("Breakfast included", "Petit-déjeuner inclus")
                  : t(
                      "Ask about breakfast",
                      "Renseignez-vous sur le petit-déjeuner",
                    )}
              </span>
              <h2 id="hc-breakfast-title">{food.heading}</h2>
              <p>
                {settings.breakfastIncluded
                  ? food.body
                  : t(
                      "Ask us about breakfast for your stay.",
                      "Renseignez-vous sur le petit-déjeuner pour votre séjour.",
                    )}
              </p>
              <div className="hc-meals">
                <span className="hc-pill">
                  {t(
                    "Optional · subject to confirmation",
                    "En option · sous réserve de confirmation",
                  )}
                </span>
                {sectionImage("meals") && (
                  <Photo
                    image={sectionImage("meals")}
                    label={sectionImage("meals")!.altText}
                  />
                )}
                <h3>{meals.heading}</h3>
                <p>{meals.body}</p>
              </div>
            </div>
          </div>
          <div className="hc-split hc-split-reverse">
            <div className="hc-split-copy">
              <p className="eyebrow">
                {t("Rooftop & together time", "Terrasse & moments partagés")}
              </p>
              <h2>{roof.heading}</h2>
              <p>{roof.body}</p>
              <Link className="hc-text-link" href={path("/gallery")}>
                {t("A look around Tifawave", "Un aperçu de Tifawave")} →
              </Link>
            </div>
            <Photo
              image={rooftop}
              label={t(
                "A sunset moment at Tifawave",
                "Un coucher de soleil chez Tifawave",
              )}
            />
          </div>
        </Container>
      </section>

      <section
        className="hc-section hc-packages"
        id="surf-packages"
        aria-labelledby="hc-packages-title"
      >
        <Container>
          <div className="hc-heading">
            <p className="eyebrow">{t("Surf packages", "Séjours surf")}</p>
            <h2 id="hc-packages-title">{offers.heading}</h2>
            <p>{offers.body}</p>
          </div>
          {packages.some((p) => p.featured) ? (
            <div className="hc-offer-grid">
              {packages
                .filter((p) => p.featured)
                .slice(0, 3)
                .map((pkg) => (
                  <article className="hc-offer" key={pkg.id}>
                    {pkg.cover && (
                      <CmsPhoto
                        src={pkg.cover.url}
                        alt={pkg.cover.alt}
                        position={pkg.cover.position}
                        mobilePosition={pkg.cover.mobilePosition}
                      />
                    )}
                    <span className="hc-pill">{pkg.unitLabel}</span>
                    <h3>{pkg.name}</h3>
                    <p>{pkg.shortDescription}</p>
                    <ul>
                      {pkg.inclusions.slice(0, 5).map((v) => (
                        <li key={v}>{v}</li>
                      ))}
                    </ul>
                    <p className="hc-offer-price">
                      {pkg.priceLabel}
                      <small>{pkg.pricingLabel}</small>
                    </p>
                    <Link
                      href={path("/surf/packages/" + pkg.slug)}
                      className="hc-text-link"
                    >
                      {t(
                        "Full inclusions & accommodation",
                        "Prestations & hébergement",
                      )}{" "}
                      →
                    </Link>
                    <Link
                      className="btn btn-primary"
                      href={packageRequestPath(locale, pkg.id)}
                      data-home-cta="package_request"
                      data-intent="surf"
                    >
                      {t("Request This Package", "Demander ce séjour")}
                    </Link>
                  </article>
                ))}
            </div>
          ) : (
            <>
              <p className="hc-offer-note">
                {t(
                  "Three ways to start a conversation — custom enquiries, not fixed or priced package offers.",
                  "Trois façons de préparer votre projet : des demandes personnalisées, pas des forfaits fixes ou tarifés.",
                )}
              </p>
              <div className="hc-offer-grid">
                {[
                  [
                    "surf-stay",
                    t("Surf & Stay", "Surf & hébergement"),
                    t(
                      "Your room. Your dates. Your surf plans.",
                      "Votre chambre. Vos dates. Vos envies de surf.",
                    ),
                    t(
                      "Choose your preferred room and length of stay. Ask which surf options can be arranged.",
                      "Choisissez votre chambre et la durée du séjour. Renseignez-vous sur les possibilités de surf.",
                    ),
                  ],
                  [
                    "lessons",
                    t("Find your surf rhythm", "Trouvez votre rythme de surf"),
                    t(
                      "Start learning or work on your progress.",
                      "Découvrez le surf ou poursuivez vos progrès.",
                    ),
                    t(
                      "Tell us your level. We’ll confirm coaching, session options, equipment and costs.",
                      "Indiquez votre niveau. Encadrement, séances, matériel et coûts seront confirmés personnellement.",
                    ),
                  ],
                  [
                    "activities",
                    t(
                      "Stay a little differently",
                      "Vivez un séjour à votre image",
                    ),
                    t(
                      "Room for experiences beyond the waves.",
                      "Des expériences au-delà des vagues.",
                    ),
                    t(
                      "Ask about excursions, yoga or additional meals. All are optional and confirmed separately.",
                      "Parlez-nous d’excursions, de yoga ou de repas supplémentaires. Tout reste en option et à confirmer.",
                    ),
                  ],
                ].map(([topic, title, strap, body], i) => {
                  const c = packageContent?.sections[i];
                  return (
                    <article className="hc-offer" key={topic}>
                      <span className="hc-pill">
                        {t("Custom enquiry", "Demande personnalisée")}
                      </span>
                      <span className="hc-offer-number">0{i + 1}</span>
                      <h3>{c?.heading || title}</h3>
                      <p className="hc-offer-strap">{strap}</p>
                      <p>{c?.body || body}</p>
                      <dl>
                        <div>
                          <dt>{t("Duration", "Durée")}</dt>
                          <dd>{t("Your dates", "Selon vos dates")}</dd>
                        </div>
                        <div>
                          <dt>{t("Accommodation", "Hébergement")}</dt>
                          <dd>
                            {t("Chosen separately", "À choisir ensemble")}
                          </dd>
                        </div>
                        <div>
                          <dt>
                            {t("Price & inclusions", "Tarif & prestations")}
                          </dt>
                          <dd>{t("Personal quote", "Devis personnalisé")}</dd>
                        </div>
                      </dl>
                      <Link
                        className="btn btn-primary"
                        href={surfEnquiryPath(
                          locale,
                          topic as "surf-stay" | "lessons" | "activities",
                        )}
                        data-home-cta="custom_surf_enquiry"
                        data-intent="surf"
                      >
                        {t(
                          "Enquire about this stay",
                          "Parlons de votre séjour",
                        )}{" "}
                        →
                      </Link>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </Container>
      </section>

      <section className="hc-section hc-day" aria-labelledby="hc-day-title">
        <Container>
          <div className="hc-heading">
            <p className="eyebrow">
              {t("A day at Tifawave", "Une journée chez Tifawave")}
            </p>
            <h2 id="hc-day-title">{day.heading}</h2>
            <p>{day.body}</p>
          </div>
          <div className="hc-day-grid">
            {[
              [
                t("Morning", "Le matin"),
                t("Breakfast. No rush.", "Un petit-déjeuner. Sans se presser."),
                t(
                  "Start with the breakfast included in your stay.",
                  "Commencez par le petit-déjeuner inclus dans votre séjour.",
                ),
              ],
              [
                t("Ocean time", "Côté océan"),
                t("Follow the conditions.", "Suivez les conditions."),
                t(
                  "Make space for surfing, with any lessons arranged and confirmed for you.",
                  "Laissez une place au surf, avec des cours organisés et confirmés selon vos besoins.",
                ),
              ],
              [
                t("Your own pace", "À votre rythme"),
                t(
                  "Explore. Rest. Repeat.",
                  "Explorer. Se reposer. Recommencer.",
                ),
                t(
                  "Take a quiet moment or ask about an optional local outing.",
                  "Prenez un moment pour vous ou renseignez-vous sur une sortie locale en option.",
                ),
              ],
              [
                t("Back at Tifawave", "De retour à Tifawave"),
                t("A little together time.", "Un moment à partager."),
                t(
                  "Unwind on the rooftop and let the day settle.",
                  "Détendez-vous sur la terrasse et profitez de la fin de journée.",
                ),
              ],
            ].map(([time, title, body], i) => (
              <article key={time}>
                <div className={`hc-day-visual hc-day-visual-${i}`}>
                  {i === 0 || i === 3 ? (
                    <Photo
                      image={i === 0 ? breakfast : rooftop}
                      label={
                        i === 0
                          ? t(
                              "Breakfast at Tifawave",
                              "Petit-déjeuner chez Tifawave",
                            )
                          : t(
                              "A Tifawave sunset",
                              "Un coucher de soleil chez Tifawave",
                            )
                      }
                    />
                  ) : i === 1 ? (
                    <svg aria-hidden="true" viewBox="0 0 300 150" fill="none">
                      <path
                        d="M-20 80Q30 10 90 80T210 80T330 80M-20 110Q30 40 90 110T210 110T330 110M-20 140Q30 70 90 140T210 140T330 140"
                        stroke="currentColor"
                      />
                    </svg>
                  ) : (
                    <span>{t("take it slow.", "tout doucement.")}</span>
                  )}
                </div>
                <span className="hc-day-step">0{i + 1}</span>
                <small>{time}</small>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <ReviewsSection locale={locale} />
      <section
        className="hc-section hc-groups"
        id="groups"
        aria-labelledby="hc-groups-title"
      >
        <Container>
          <div>
            <p className="eyebrow">
              {t("Groups & retreats", "Groupes & retraites")}
            </p>
            {sectionImage("groups") && (
              <Photo
                image={sectionImage("groups")}
                label={sectionImage("groups")!.altText}
              />
            )}
            <h2 id="hc-groups-title">{groups.heading}</h2>
            <p>{groups.body}</p>
            <p className="hc-group-capacity">
              {t(
                "Up to 23 guests · 9 physical rooms",
                "Jusqu’à 23 voyageurs · 9 chambres",
              )}
            </p>
            <p className="hc-footnote">
              {t(
                "Subject to room arrangements and manual availability checks. Your group enquiry does not hold rooms.",
                "Selon la configuration des chambres et après vérification manuelle des disponibilités. Une demande de groupe ne bloque pas de chambres.",
              )}
            </p>
            <Link
              className="btn btn-primary"
              href={path("/groups")}
              data-home-cta="group_quote"
              data-intent="group"
            >
              {t("Request Group Quote", "Demander un devis groupe")} →
            </Link>
          </div>
          <div
            className="hc-group-layout"
            aria-label={t(
              "Property room arrangement",
              "Configuration de l’établissement",
            )}
          >
            <span>
              4 <small>{t("double rooms", "chambres doubles")}</small>
            </span>
            <span>
              2 <small>{t("twin rooms", "chambres twin")}</small>
            </span>
            <span>
              1 <small>{t("triple room", "chambre triple")}</small>
            </span>
            <span>
              1 <small>{t("family suite", "suite familiale")}</small>
            </span>
            <span>
              4{" "}
              <small>
                {t("individual dorm beds", "lits individuels en dortoir")}
              </small>
            </span>
          </div>
        </Container>
      </section>

      <section
        className="hc-section hc-location"
        aria-labelledby="hc-location-title"
      >
        <Container>
          <div className="hc-location-grid">
            <div>
              <p className="eyebrow">Tamraght · {t("Morocco", "Maroc")}</p>
              <h2 id="hc-location-title">{location.heading}</h2>
              <p>{location.body}</p>
              <div className="hc-map-card">
                <span>Tamraght</span>
                <small>{t("Atlantic Morocco", "Maroc atlantique")}</small>
                <div className="hc-map-line" aria-hidden="true" />
                <strong>Tifawave.</strong>
              </div>
              <div className="hc-location-links">
                {settings.googleMapsUrl && (
                  <a
                    className="hc-text-link"
                    href={settings.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t(
                      "Open map & directions",
                      "Ouvrir la carte & l’itinéraire",
                    )}{" "}
                    ↗
                  </a>
                )}
                <a
                  className="hc-text-link"
                  href={getWhatsappHref(settings)}
                  data-home-cta="whatsapp"
                  data-intent="contact"
                >
                  {t("Ask us on WhatsApp", "Écrivez-nous sur WhatsApp")} ↗
                </a>
              </div>
            </div>
            <div className="hc-faqs">
              <p className="eyebrow">{t("Good to know", "Bon à savoir")}</p>
              {faqs.map((f) => (
                <details key={f.question}>
                  <summary>
                    {f.question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{f.answer}</p>
                </details>
              ))}
              <Link className="hc-text-link" href={path("/faq")}>
                {t("More practical questions", "D’autres questions pratiques")}{" "}
                →
              </Link>
            </div>
          </div>
        </Container>
      </section>
      <FinalCta locale={locale} />
    </main>
  );
}
