export interface StoreLocation {
  slug: "EMBA" | "LIMASSOL";
  name: string;
  area: string;
  address: string;
  hours: string;
  phone: string;
  phoneHref: string;
  mapsHref: string;
  delivery: { label: string; href: string };
}

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
    delivery: { label: "Order on Foody", href: "https://foody.com.cy" },
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
    delivery: { label: "Order on Wolt", href: "https://wolt.com" },
  },
];
