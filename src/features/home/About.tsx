const POINTS = [
  { title: "Carved to order", body: "Every döner comes straight off the vertical spit. Nothing sits waiting in a tray." },
  { title: "Toasted bread", body: "The flatbread is toasted on the plate so it stays crisp around the meat and salad." },
  { title: "Our own sauces", body: "Garlic, herb, hot and the rest are mixed in our kitchen, the way they are in Berlin." },
];

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-16 bg-[var(--brand-black)] text-[var(--mygd-gray-0)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-[1fr_1.1fr] md:gap-16 md:px-8 md:py-28">
        <h2 id="about-title" className="font-display text-4xl font-semibold uppercase leading-[0.95] md:text-6xl">
          Berlin döner, done properly.
        </h2>
        <div>
          <p className="text-lg leading-relaxed text-[var(--mygd-gray-400)]">
            Döner as Germany knows it started in Berlin. We brought the same recipe, the same spit and the same bread to Cyprus.
          </p>
          <dl className="mt-10 grid gap-8 border-t border-[var(--mygd-gray-750)] pt-8 sm:grid-cols-3">
            {POINTS.map((p) => (
              <div key={p.title}>
                <dt className="font-semibold">{p.title}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-[var(--mygd-gray-400)]">{p.body}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
