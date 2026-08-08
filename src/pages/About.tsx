import { Link } from 'react-router-dom';
import { Target, Eye, Heart, Shield, Users, Lightbulb, TrendingUp, ArrowRight, HandHeart, Sparkles } from 'lucide-react';
import Counter from '@/components/Counter';
import PageHero from '@/components/PageHero';

const values = [
  { icon: Shield, title: 'Integrity', desc: 'We cannot challenge young people to lead with transparency if we do not first embody it in our words, actions, and decisions.' },
  { icon: Heart, title: 'Compassion', desc: 'We recognize the struggles and challenges young people face, and we respond with genuine concern and a willingness to help.' },
  { icon: Sparkles, title: 'Authenticity', desc: 'Our actions reflect our words, and our programs are not just about appearance—they are rooted in truth, consistency, and a real commitment to the growth of young people.' },
  { icon: Users, title: 'Respect', desc: 'We actively listen and seek to understand the feelings and perspectives of the youth we serve.' },
  { icon: HandHeart, title: 'Empathy', desc: 'We meet young people where they are, with understanding and without judgment, creating a safe space for growth.' },
  { icon: TrendingUp, title: 'Impact', desc: 'We measure success by lives transformed, careers launched, and businesses built—not just by numbers.' },
];

export default function About() {
  return (
    <div>
      <PageHero
        eyebrow="About Us"
        title="Building Futures, One Youth at a Time"
        description="Career Care Center For Youth Development Initiative is a Nigerian nonprofit dedicated to empowering young people with the career guidance, skills, and opportunities they need to thrive."
      />

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="eyebrow">Our Story</span>
            <h2 className="mt-3 heading-2">Who We Are</h2>
            <div className="mt-5 space-y-4 text-ink-600 leading-relaxed">
              <p>
                Career Care Center For Youth Development Initiative is a not-for-profit organization
                that actively seeks to change the fortunes of the Nigerian Youth by providing platforms
                for career improvement. Our founding team is comprised mostly of fresh University
                graduates and mid-level professionals who understand firsthand the challenges young
                Nigerians face in their career journeys.
              </p>
              <p>
                Our overarching goal is to help reduce unemployment in the society by supporting young
                people with critical employability and entrepreneurship skills. We believe the fortunes
                of the Nigerian Youth can take a positive turn if we actively provide free platforms and
                opportunities for career development and skills/talent optimization.
              </p>
              <p>
                Since our founding, we have hosted career acceleration workshops, skills training
                webinars, mentorship sessions, and the Smarter Skills for a Smarter Future Workshop
                series—equipping young Nigerians with hands-on training in AI, graphics design, video
                editing, entrepreneurship, and more.
              </p>
            </div>
          </div>
          <div className="relative">
            <img
              src="/media/events/workshop-2-reminder.jpg"
              alt="CCC Smarter Skills for a Smarter Future Workshop"
              loading="lazy"
              className="rounded-2xl shadow-lift"
            />
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-white p-5 shadow-lift sm:block">
              <p className="font-heading text-3xl font-bold text-primary-700">500+</p>
              <p className="text-sm text-ink-500">Youth Empowered</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section bg-ink-100/50">
        <div className="container-page grid gap-6 md:grid-cols-2">
          <div className="card p-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-700">
              <Target className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-2xl font-semibold text-ink-900">Our Mission</h3>
            <p className="mt-3 text-ink-600 leading-relaxed">
              To equip talents with the skills, networks, knowledge, opportunities and tools needed
              to navigate the professional world and excel in their chosen career. We provide free
              platforms and opportunities for career development and skills optimization to help
              reduce unemployment in the society.
            </p>
          </div>
          <div className="card p-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-secondary-50 text-secondary-600">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-2xl font-semibold text-ink-900">Our Vision</h3>
            <p className="mt-3 text-ink-600 leading-relaxed">
              To uplift talents to make a meaningful impact. We envision a Nigeria where every young
              person, regardless of background, has access to the guidance, networks, and opportunities
              needed to build a prosperous career and contribute meaningfully to their communities and
              the nation's economy.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Our Core Values</span>
            <h2 className="mt-3 heading-2">What Drives Us Forward</h2>
            <p className="mt-4 text-lg text-ink-600 text-pretty">
              These values guide every program, interaction, and decision we make at Career Care Center.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="card-hover group p-6">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary-50 text-primary-700 transition-transform group-hover:scale-110">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-ink-900">{v.title}</h3>
                <p className="mt-2 text-sm text-ink-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-ink-100/50">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Our Leadership</span>
            <h2 className="mt-3 heading-2">Meet the Team Behind CCC</h2>
            <p className="mt-4 text-lg text-ink-600 text-pretty">
              Our founding team is comprised of fresh University graduates and mid-level professionals
              passionate about youth development.
            </p>
          </div>
          <div className="mt-10 rounded-2xl border-2 border-dashed border-ink-200 bg-white/50 p-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-600">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-ink-900">Leadership profiles to be provided by Career Care Center</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
              Detailed profiles of our executive team, board members, and key volunteers will be
              added here once provided by the organization.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-primary-700 to-primary-800 py-16">
        <div className="container-page">
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <Counter end={500} suffix="+" label="Youth Reached" icon={<Users className="h-8 w-8" />} />
            <Counter end={20} suffix="+" label="Workshops & Webinars" icon={<Target className="h-8 w-8" />} />
            <Counter end={50} suffix="+" label="Mentorship Sessions" icon={<TrendingUp className="h-8 w-8" />} />
            <Counter end={30} suffix="+" label="Volunteers & Partners" icon={<Heart className="h-8 w-8" />} />
          </div>
        </div>
      </section>

      <section className="section bg-gradient-to-br from-primary-800 to-primary-900">
        <div className="container-page text-center">
          <h2 className="heading-2 text-white">Join Us in Building Nigeria's Future</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-100">
            Whether you want to learn, volunteer, or support, there's a place for you at CCC.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/apply" className="btn-accent">Apply Now <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/volunteer" className="btn-white">Volunteer</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
