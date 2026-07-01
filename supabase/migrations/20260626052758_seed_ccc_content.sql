/*
# Seed CCC Sample Content

Populates programs, events, blog posts, testimonials, and resources with
realistic sample content so the public website and admin dashboard render
with data out of the box. All inserts are idempotent (ON CONFLICT DO NOTHING).
*/

-- Programs
INSERT INTO programs (title, category, description, benefits, requirements, duration, image_url, is_active) VALUES
('Career Coaching', 'Career Coaching', 'One-on-one coaching sessions to help you clarify your career path, set goals, and build a roadmap to professional success.', ARRAY['Personalized career roadmap','Clarity on career direction','Goal-setting framework','Accountability support'], ARRAY['Commitment to 6 sessions','Willingness to engage openly','Internet access for virtual sessions'], '6 weeks', 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg', true),
('Mentorship Program', 'Mentorship', 'Get matched with experienced professionals in your field who provide guidance, support, and industry insights.', ARRAY['1:1 mentor matching','Industry insights','Network expansion','Career guidance'], ARRAY['Active student or graduate','Completed profile','Minimum 3-month commitment'], '3 months', 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg', true),
('Internship Support', 'Internship Support', 'We connect you with partner organizations for internship placements that build real-world experience.', ARRAY['Real-world work experience','Professional references','Resume building','Potential full-time offers'], ARRAY['Current student or recent graduate','Minimum 2.1 CGPA or equivalent','Available 3-6 months'], '3-6 months', 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg', true),
('Entrepreneurship Training', 'Entrepreneurship Training', 'Turn your business idea into a viable venture through our structured entrepreneurship curriculum.', ARRAY['Business plan development','Access to micro-grants','Mentorship from founders','Pitch deck creation'], ARRAY['A business idea or early-stage venture','Commitment to 8-week program','Nigerian resident'], '8 weeks', 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg', true),
('CV Review', 'CV Review', 'Professional review and optimization of your CV to make it stand out to recruiters and ATS systems.', ARRAY['ATS-optimized CV','Professional formatting','Industry-specific keywords','Free revision'], ARRAY['Current CV draft','Active email address'], '1 week', 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg', true),
('LinkedIn Optimization', 'LinkedIn Optimization', 'Transform your LinkedIn profile into a recruiter magnet with our optimization service.', ARRAY['Profile optimization','Headline rewrite','Network growth strategy','Content tips'], ARRAY['Existing LinkedIn account','Professional headshot'], '1 week', 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', true),
('Leadership Development', 'Leadership Development', 'Develop the leadership skills needed to lead teams, projects, and initiatives in any organization.', ARRAY['Leadership framework','Team management skills','Communication mastery','Project leadership'], ARRAY['Aspiring leader','2+ years experience or student leader','12-week commitment'], '12 weeks', 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg', true),
('Skills Training', 'Skills Training', 'Acquire in-demand digital and soft skills through hands-on workshops and project-based learning.', ARRAY['In-demand digital skills','Project portfolio','Certificate of completion','Job-ready competence'], ARRAY['Basic computer literacy','Commitment to attend sessions','Learning materials access'], '10 weeks', 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg', true),
('Career Assessment', 'Career Assessment', 'Discover your strengths, interests, and ideal career paths through our comprehensive assessment tool.', ARRAY['Personalized career report','Strengths analysis','Career path recommendations','Action plan'], ARRAY['30 minutes for assessment','Openness to explore options'], '1 session', 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg', true)
ON CONFLICT DO NOTHING;

-- Events
INSERT INTO events (title, description, event_date, location, image_url, capacity, is_virtual) VALUES
('Career Fair 2026', 'Connect with top employers across Nigeria. Bring your CV and meet recruiters from leading companies hiring for entry-level and graduate roles.', '2026-08-15 10:00:00+01', 'Eko Hotel & Suites, Lagos', 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg', 500, false),
('CV Writing Masterclass', 'Learn how to craft a CV that gets past ATS systems and impresses recruiters. Live workshop with Q&A.', '2026-07-20 14:00:00+01', 'Virtual (Zoom)', 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg', 200, true),
('Entrepreneurship Bootcamp', 'A 3-day intensive bootcamp for aspiring entrepreneurs. Learn business model design, validation, and pitching.', '2026-09-10 09:00:00+01', 'Abuja Trade Center', 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg', 100, false),
('LinkedIn Workshop', 'Optimize your LinkedIn profile to attract recruiters and grow your professional network.', '2026-07-05 15:00:00+01', 'Virtual (Zoom)', 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', 300, true),
('Leadership Summit', 'Annual leadership summit featuring talks from Nigerian leaders across sectors.', '2026-11-01 09:00:00+01', 'Landmark Center, Lagos', 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg', 800, false)
ON CONFLICT DO NOTHING;

-- Blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, cover_image_url, author, category, published, published_at) VALUES
('5 Career Paths in High Demand in Nigeria for 2026', 'career-paths-demand-nigeria-2026', 'Explore the fastest-growing career paths in Nigeria and the skills you need to succeed in each.', 'The Nigerian job market is evolving rapidly. Here are five career paths that are seeing strong demand in 2026 and beyond.

## 1. Data Analytics
Organizations are increasingly data-driven. Skills in Excel, SQL, Python, and tools like Power BI are in high demand.

## 2. Digital Marketing
From social media to SEO, digital marketing skills help businesses grow online. Learn Google Ads, Meta Ads, and content marketing.

## 3. Software Development
Full-stack developers, especially in React and Node.js, remain in high demand across startups and enterprises.

## 4. Product Management
Product managers bridge business and technology. Learn to define roadmaps, conduct user research, and ship products.

## 5. Cybersecurity
As digital infrastructure grows, so does the need for security professionals. Start with network security fundamentals.

Each of these paths offers remote and local opportunities. CCC offers training and mentorship to help you get started.', 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg', 'CCC Team', 'Career Development', true, now()),
('How to Write a CV That Gets Interviews', 'how-to-write-cv-interviews', 'A step-by-step guide to crafting a professional CV that passes ATS systems and impresses recruiters.', 'Your CV is your first impression. Here is how to make it count.

## Start with a Strong Summary
Open with 2-3 lines summarizing your value proposition. Focus on what you offer, not what you want.

## Use Action Verbs
Begin each bullet with action verbs: Led, Built, Designed, Improved, Delivered.

## Quantify Achievements
Instead of "managed social media," write "grew Instagram following by 40% in 6 months."

## Keep It to One Page
For early-career professionals, one page is ideal. Be concise and relevant.

## Tailor for Each Role
Customize your CV for each application. Mirror keywords from the job description.

Need help? Apply for our CV Review program and get professional feedback.', 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg', 'CCC Team', 'CV Writing', true, now()),
('The Power of Mentorship for Young Nigerians', 'power-of-mentorship-young-nigerians', 'Why having a mentor can accelerate your career and how to find the right one.', 'Mentorship is one of the most powerful accelerators for career growth. Here is why it matters.

## Why Mentorship Matters
A mentor provides perspective you cannot get from books. They have walked the path and can help you avoid common pitfalls.

## How to Find a Mentor
1. Identify your goals
2. Look within your network and professional communities
3. Reach out with a specific ask
4. Be respectful of their time

## Making the Most of Mentorship
Come prepared to each session with questions. Follow through on advice. Show progress.

CCC matches young Nigerians with experienced mentors. Apply for our Mentorship Program today.', 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg', 'CCC Team', 'Career Development', true, now())
ON CONFLICT (slug) DO NOTHING;

-- Testimonials
INSERT INTO testimonials (name, role, quote, image_url, rating, approved) VALUES
('Adebayo Johnson', 'Software Engineer at Paystack', 'CCC mentorship program changed my career trajectory. Within 3 months, I landed my dream job. The guidance was invaluable.', 'https://images.pexels.com/photos/220815/pexels-photo-220815.jpeg', 5, true),
('Fatima Mohammed', 'Founder, GreenLeaf Farms', 'The entrepreneurship training gave me the confidence and tools to start my agribusiness. I am now employing 5 people.', 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg', 5, true),
('Chukwuemeka Okafor', 'Data Analyst at Flutterwave', 'From CV review to interview prep, CCC was with me every step. I cannot recommend them enough.', 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg', 5, true),
('Zainab Ibrahim', 'Marketing Associate', 'The skills training program equipped me with digital marketing skills that employers actually want.', 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg', 5, true),
('Tunde Bakare', 'Product Manager', 'CCC leadership development program transformed how I lead teams. The frameworks are practical and effective.', 'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg', 5, true)
ON CONFLICT DO NOTHING;

-- Resources
INSERT INTO resources (title, description, category, type, url, cover_image_url, duration, downloads) VALUES
('Complete CV Writing Guide', 'A comprehensive 40-page guide to writing a professional CV with templates and examples.', 'CV Writing', 'pdf', 'https://example.com/resources/cv-guide.pdf', 'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg', '40 pages', 1240),
('Interview Preparation Masterclass', 'Video series covering common interview questions, STAR method, and mock interviews.', 'Interview Preparation', 'video', 'https://example.com/resources/interview-masterclass', 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg', '2 hours', 890),
('Career Development Roadmap', 'Step-by-step article on building a 5-year career development plan.', 'Career Development', 'article', 'https://example.com/resources/career-roadmap', 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg', '15 min read', 2100),
('Entrepreneurship Starter Kit', 'PDF toolkit with business plan template, financial projections, and pitch deck framework.', 'Entrepreneurship', 'pdf', 'https://example.com/resources/entrepreneurship-kit.pdf', 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg', '60 pages', 670),
('Leadership Principles Video Course', '6-module video course on modern leadership principles for young professionals.', 'Leadership', 'video', 'https://example.com/resources/leadership-course', 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg', '4 hours', 540),
('Employability Skills Checklist', 'Article outlining the top 10 employability skills employers look for in 2026.', 'Employability', 'article', 'https://example.com/resources/employability-checklist', 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg', '10 min read', 1850)
ON CONFLICT DO NOTHING;
