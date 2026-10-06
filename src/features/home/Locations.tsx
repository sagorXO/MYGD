import { Clock, MapPin, Phone } from "lucide-react";
import { Card, CardHeader, buttonClasses } from "@/ui";
import { StoreStatus } from "./StoreStatus";
import { LOCATIONS } from "./storeLocations";

export function Locations() {
  return (
    <section id="locations" aria-labelledby="locations-title" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 md:px-6">
      <h2 id="locations-title" className="mb-6 font-display text-4xl uppercase tracking-tight text-text">
        Find us
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {LOCATIONS.map((l) => (
          <Card key={l.slug} as="article">
            <div className="mb-3"><StoreStatus store={l} size="sm" /></div>
            <CardHeader title={l.name} description={l.area} />
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex gap-2">
                <MapPin aria-hidden width={16} height={16} className="mt-0.5 shrink-0" />
                {l.address}
              </li>
              <li className="flex gap-2">
                <Clock aria-hidden width={16} height={16} className="mt-0.5 shrink-0" />
                {l.hours}
              </li>
              <li className="flex gap-2">
                <Phone aria-hidden width={16} height={16} className="mt-0.5 shrink-0" />
                <a href={l.phoneHref} className="text-accent-text hover:underline">
                  {l.phone}
                </a>
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={l.delivery.href} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "primary", size: "md" })}>
                {l.delivery.label}
              </a>
              <a href={l.mapsHref} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "secondary", size: "md" })}>
                Get directions
              </a>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
