import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const siteName = 'Career Care Center For Youth Development Initiative';
const origin = 'https://careercarecenter.com.ng';
const socialImage = `${origin}/social-preview.png`;

const pages: Record<string, { title: string; description: string }> = {
  '/': {
    title: `${siteName} | Career Development for Nigerian Youth`,
    description: 'Career coaching, mentorship, employability training, internship support and entrepreneurship opportunities for young Nigerians.',
  },
  '/about': { title: `About Us | ${siteName}`, description: 'Meet the nonprofit helping young Nigerians build skills, confidence and meaningful careers.' },
  '/programs': { title: `Career Development Programs | ${siteName}`, description: 'Explore career coaching, mentorship, CV support, employability and entrepreneurship programs for Nigerian youth.' },
  '/events': { title: `Career Workshops and Events | ${siteName}`, description: 'Join practical workshops, webinars and training events designed to accelerate your career.' },
  '/gallery': { title: `Media Gallery | ${siteName}`, description: 'See highlights from Career Care Center workshops, webinars and youth-development activities.' },
  '/success-stories': { title: `Youth Career Success Stories | ${siteName}`, description: 'Discover how Career Care Center programs are helping young people build stronger careers and futures.' },
  '/volunteer': { title: `Volunteer With Us | ${siteName}`, description: 'Share your time and skills to help empower young Nigerians through career development.' },
  '/blog': { title: `Career Advice and Updates | ${siteName}`, description: 'Practical career advice, workshop reports and opportunities for young Nigerian professionals.' },
  '/contact': { title: `Contact Us | ${siteName}`, description: 'Contact Career Care Center about programs, partnerships, volunteering and youth career development.' },
  '/donate': { title: `Support Youth Career Development | ${siteName}`, description: 'Help more young Nigerians access career skills, mentorship and professional opportunities.' },
  '/apply': { title: `Apply for a Career Program | ${siteName}`, description: 'Apply for Career Care Center coaching, mentorship, employability and skills-development programs.' },
};

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function Seo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isPrivate = pathname.startsWith('/admin') || pathname.startsWith('/dashboard') || ['/login', '/signup', '/reset-password', '/unauthorized'].includes(pathname);
    const pathKey = pathname.startsWith('/blog/') ? '/blog' : pathname;
    const page = pages[pathKey] ?? pages['/'];
    const canonicalPath = pages[pathKey] ? pathKey : '/';
    const canonical = `${origin}${canonicalPath === '/' ? '' : canonicalPath}`;

    document.title = page.title;
    setMeta('meta[name="description"]', 'name', 'description', page.description);
    setMeta('meta[name="robots"]', 'name', 'robots', isPrivate ? 'noindex, nofollow' : 'index, follow');
    setMeta('meta[property="og:title"]', 'property', 'og:title', page.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', page.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMeta('meta[property="og:image"]', 'property', 'og:image', socialImage);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', page.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', page.description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', socialImage);

    const canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    canonicalLink?.setAttribute('href', canonical);
  }, [pathname]);

  return null;
}
