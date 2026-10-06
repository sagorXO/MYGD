"use client";

import { buttonClasses } from "@/ui";
import { StoreStatus } from "./StoreStatus";
import { useStore } from "./StoreContext";

export function Hero() {
  const { store } = useStore();
  return (
    <section id="top" className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-14 md:px-8 md:pb-24 md:pt-16">
      <div>
        <StoreStatus store={store} />
        <p className="mt-4 text-sm font-medium text-text-secondary">The first real German döner in Cyprus</p>
        <h1 className="mt-4 font-display text-[clamp(3.25rem,8vw,6.5rem)] font-bold uppercase leading-[0.9] text-[#E5067E]">
          Bite the hype.
        </h1>
        <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-text-secondary">
          Veal, beef and chicken carved straight off the spit into toasted flatbread, with crisp red cabbage, fresh herbs and sauces we make
          ourselves.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#menu" className={buttonClasses({ variant: "primary", size: "lg" })}>
            See the menu
          </a>
          <a href={store.delivery.href} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: "secondary", size: "lg" })}>
            {store.delivery.label}
          </a>
        </div>
        <dl className="mt-10 grid max-w-lg grid-cols-1 gap-5 border-t border-border-subtle pt-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-subtle">Opening hours</dt>
            <dd className="mt-1 font-medium text-text">{store.hours}</dd>
          </div>
          <div>
            <dt className="text-text-subtle">{store.name}</dt>
            <dd className="mt-1 font-medium text-text">{store.address}</dd>
          </div>
        </dl>
      </div>
      <div className="overflow-hidden rounded-lg bg-[var(--brand-black)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- local static photo; next/image lands with the image pipeline */}
        <img
          src="/assets/menu/products/hamburg-doener.jpg"
          alt="A döner in toasted flatbread with cabbage and sauce"
          fetchPriority="high"
          className="aspect-[4/5] w-full object-cover md:aspect-[5/6]"
        />
      </div>
    </section>
  );
}
