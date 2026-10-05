export interface StoreLocation {
  slug: "EMBA" | "LIMASSOL";
  name: string;
  area: string;
  address: string;
  hours: string;
  phone: string;
  phoneHref: string;
  mapsHref: string;
  delivery: { partner: string; label: string; href: string };
}

// [ADR] Context: the Limassol phone (+357 99 654321) and the Wolt link were placeholders in the old page.
// Decision: keep them until Rico confirms the real values; they are the only unverified store data.
// Consequence: confirm before the public site goes live.
export const LOCATIONS: StoreLocation[] = [
  {
    slug: "EMBA",
    name: "Emba",
    area: "Paphos",
    address: "Pavlides Court, Agíou Stefánou Street 134, 8260 Emba",
    hours: "Daily 11:00 – 22:00",
    phone: "+357 99 531198",
    phoneHref: "tel:+35799531198",
    mapsHref: "https://maps.google.com/?q=Pavlides+Court+Agiou+Stefanou+134+Emba+Paphos",
    delivery: { partner: "Foody", label: "Order on Foody", href: "https://foody.com.cy" },
  },
  {
    slug: "LIMASSOL",
    name: "Limassol Marina",
    area: "Limassol",
    address: "Limassol Marina, Commercial Promenade, 3042 Limassol",
    hours: "Daily 11:00 – 22:00",
    phone: "+357 99 654321",
    phoneHref: "tel:+35799654321",
    mapsHref: "https://maps.google.com/?q=Limassol+Marina+Commercial+Promenade",
    delivery: { partner: "Wolt", label: "Order on Wolt", href: "https://wolt.com" },
  },
];
