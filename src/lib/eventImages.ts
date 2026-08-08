const defaultEventImage = '/media/events/smarter-skills-workshop-2.jpg';

/** Stable local copies of graphics from Career Care Center's official LinkedIn. */
export function getEventFallback(title: string) {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('career acceleration') || normalizedTitle.includes('remote work')) {
    return '/media/events/remote-work-ready-day.jpg';
  }

  return defaultEventImage;
}
