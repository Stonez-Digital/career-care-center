interface PageHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHero({ eyebrow, title, description, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-secondary-500/15 blur-3xl" />
      <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-accent-400/10 blur-3xl" />

      <div className="container-page relative py-16 text-center sm:py-20 lg:py-24">
        <span className="eyebrow text-secondary-300 animate-fade-in animate-fill-back">{eyebrow}</span>
        <h1 className="mx-auto mt-4 max-w-3xl heading-1 text-white animate-fade-in-up animate-fill-back">{title}</h1>
        {description && (
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100 text-pretty animate-fade-in-up animate-fill-back animate-delay-100">
            {description}
          </p>
        )}
        {children && (
          <div className="mt-8 animate-fade-in-up animate-fill-back animate-delay-200">{children}</div>
        )}
      </div>
    </section>
  );
}
