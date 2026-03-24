interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ember-400">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl font-semibold tracking-tight text-mist-50 sm:text-4xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-mist-50/72 sm:text-lg">{description}</p>
    </div>
  );
}
