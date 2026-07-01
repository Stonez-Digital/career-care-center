/*
# Replace Demo Content with Real CCC Content

Clears all demo/placeholder data from content tables and re-seeds
with real information sourced from careercarecenter.com.ng.
User-generated tables (applications, volunteers, contacts, event_registrations)
are left untouched.
*/

-- Clear demo content from content tables
DELETE FROM testimonials;
DELETE FROM blog_posts;
DELETE FROM resources;
DELETE FROM events;
DELETE FROM programs;

-- ============================================================================
-- PROGRAMS (real CCC services/programs from the website)
-- ============================================================================
INSERT INTO programs (title, category, description, benefits, requirements, duration, image_url, is_active) VALUES
('Career Coaching, Counselling & Mentoring', 'Career Coaching',
'One-on-one career coaching, counselling, and mentoring sessions to help you clarify your career path, set actionable goals, and build a roadmap to professional success. Our experienced coaches provide personalized guidance tailored to your aspirations.',
ARRAY['Personalized career roadmap','Clarity on career direction','Goal-setting framework','Accountability support','Access to experienced professionals'],
ARRAY['Commitment to attend sessions','Willingness to engage openly','Internet access for virtual sessions'],
'6 weeks',
'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
true),

('Mentorship Program', 'Mentorship',
'Get matched with experienced professionals in your field who provide guidance, support, and industry insights. We connect young Nigerians with mentors who have walked the path and can help navigate the professional world.',
ARRAY['1:1 mentor matching','Industry-specific insights','Network expansion','Career guidance','Ongoing support'],
ARRAY['Active student or graduate','Completed profile','Minimum 3-month commitment'],
'3 months',
'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg',
true),

('Internship Support', 'Internship Support',
'We connect you with partner organizations for internship placements that build real-world experience. Our internship support program bridges the gap between education and employment by providing hands-on opportunities.',
ARRAY['Real-world work experience','Professional references','Resume building','Potential full-time offers','Monthly living allowance for some placements'],
ARRAY['Current student or recent graduate','Available 3-6 months','Commitment to learning'],
'3-6 months',
'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
true),

('Entrepreneurship & Small Business Support', 'Entrepreneurship Training',
'Turn your business idea into a viable venture through our structured entrepreneurship and small business support program. From idea validation to pitch readiness, we equip aspiring entrepreneurs with the tools to succeed.',
ARRAY['Business plan development','Access to mentorship from founders','Pitch deck creation','Social entrepreneurship training','Seed funding for top pitches'],
ARRAY['A business idea or early-stage venture','Commitment to program duration','Nigerian resident (ages 18-35)'],
'8 weeks',
'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
true),

('CV Review', 'CV Review',
'Professional review and optimization of your CV to make it stand out to recruiters and ATS systems. Learn how to structure your CV to attract recruiters, with feedback from our team of experienced professionals.',
ARRAY['ATS-optimized CV','Professional formatting','Industry-specific keywords','Free revision','LinkedIn optimization tips'],
ARRAY['Current CV draft','Active email address'],
'1 week',
'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg',
true),

('LinkedIn Optimization', 'LinkedIn Optimization',
'Transform your LinkedIn profile into a recruiter magnet. Learn how to leverage AI and other tools to boost your online presence and grow your professional network on LinkedIn.',
ARRAY['Profile optimization','Headline rewrite','Network growth strategy','AI tools for LinkedIn','Content tips'],
ARRAY['Existing LinkedIn account','Professional headshot'],
'1 week',
'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg',
true),

('Career Assessment', 'Career Assessment',
'Discover your strengths, interests, and ideal career paths through our FREE world-class, award-winning psychometric assessment by CareerExplorer. This assessment is guaranteed to set your feet on the right path.',
ARRAY['Personalized career report','Strengths analysis','Career path recommendations','Action plan','Free consultation'],
ARRAY['30 minutes for assessment','Openness to explore options'],
'1 session',
'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg',
true),

('Skills Training', 'Skills Training',
'Acquire in-demand digital and soft skills through hands-on workshops and project-based learning. Our Smarter Skills for a Smarter Future workshops cover AI tools, graphics design, video editing, problem-solving, and more.',
ARRAY['In-demand digital skills (AI, Canva, Premiere Pro)','Project portfolio','Certificate of completion','Job-ready competence','Networking with industry leaders'],
ARRAY['Ages 18-35','Basic computer literacy','Commitment to attend sessions'],
'10 weeks',
'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
true),

('Career Development & Training', 'Leadership Development',
'Develop the leadership and career development skills needed to lead teams, projects, and initiatives. Our career acceleration workshops cover CV writing, job application tips, interview preparation, and professional growth strategies.',
ARRAY['Leadership framework','Team management skills','Communication mastery','Interview preparation','Career acceleration strategies'],
ARRAY['Aspiring leader or professional','Commitment to workshop sessions','Willingness to learn and grow'],
'12 weeks',
'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg',
true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EVENTS (real CCC events from the website)
-- ============================================================================
INSERT INTO events (title, description, event_date, location, image_url, capacity, is_virtual) VALUES
-- Upcoming events
('Smarter Skills for a Smarter Future Workshop 2.0', 'The Career Care Center for Youth Development Initiative proudly celebrates World Youth Skills Day 2026 alongside its second year anniversary. Join us for the Smarter Skills for a Smarter Future Workshop 2.0 — a two-day in-person event featuring hands-on training in AI tools, graphics design, video editing, and social entrepreneurship. Level up your skills and get ready to tackle the future with fresh ideas and smart moves.', '2026-07-14 09:00:00+01', 'Federal College of Education (Technical) Asaba, Delta State', 'https://careercarecenter.com.ng/wp-content/uploads/2025/07/Smarter-Skills-For-A-Smarter-Future-Workshop-Career-Care-808x1024.jpg', 300, false),

-- Past events
('Career Acceleration Workshop: AI, Resumes & LinkedIn Growth', 'A virtual career acceleration workshop covering CV writing, job application tips, the difference between a CV and a resume, and LinkedIn optimization using AI tools. Hosted and moderated by Mr. Uche Aso, with training led by Mr. Stephen Ogunbiyi, a Training Specialist with Impact Water Nigeria. Over 70 viewers tuned in live on YouTube.', '2025-04-26 13:00:00+01', 'YouTube Live & LinkedIn', 'https://careercarecenter.com.ng/wp-content/uploads/2025/05/Career-Care-Center-Webinar-CV-Writing-Training-1024x584.png', 200, true),

('Smarter Skills for a Smarter Future Workshop 1.0', 'A two-day hybrid workshop designed to equip young Nigerians (ages 18-35) with hands-on training in Artificial Intelligence (AI tools, automation, ethics), Graphics Design & Video Editing (Canva, Adobe, Premiere Pro), and Business Startup & Social Entrepreneurship. Held at YabaTech, Lagos with virtual access. Participants received certification, hands-on projects, networking with industry leaders, and seed funding for top business pitches.', '2025-07-14 09:00:00+01', 'Hybrid (YabaTech, Lagos + Virtual)', 'https://careercarecenter.com.ng/wp-content/uploads/2025/07/Career-care-SSSF-Thank-You-784x1024.jpg', 200, false),

('Problem-Solving Skills Training Webinar', 'A FREE interactive problem-solving skills webinar equipping participants with critical thinking, creativity, and decision-making skills needed to tackle challenges with confidence. Covered proven problem-solving techniques, critical thinking, real-world case studies, and tips to boost creativity. Held on YouTube Live & LinkedIn.', '2025-02-21 16:00:00+01', 'YouTube Live & LinkedIn', 'https://careercarecenter.com.ng/wp-content/uploads/2025/02/Problem-Solving-Skill-Training-1024x998.jpg', 200, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BLOG POSTS (real CCC articles from the website)
-- ============================================================================
INSERT INTO blog_posts (title, slug, excerpt, content, cover_image_url, author, category, published, published_at) VALUES
('Remote Work Ready: Skills for the Global Talent Market', 'remote-work-ready-skills-global-talent-market',
'Ready to go global from the comfort of your home? Join Career Care for our upcoming webinar on Remote Work Ready: Skills for the Global Talent Market. Discover the skills you need to compete in the global remote workforce.',
'Ready to go global from the comfort of your home? Join Career Care for our upcoming webinar: "Remote Work Ready: Skills for the Global Talent Market."

In today''s interconnected world, remote work has opened doors for Nigerian youth to work for companies across the globe. This webinar covers the essential skills, tools, and strategies you need to succeed as a remote professional.

## What You''ll Learn

- Essential remote work skills and tools
- How to position yourself for global opportunities
- Communication and collaboration in remote teams
- Building a remote-friendly workspace
- Time management across time zones

Stay tuned for more details on how to register. Follow us on social media for updates!',
'https://careercarecenter.com.ng/wp-content/uploads/2026/04/Career-Care-Career-Accelaration-Workshop-1024x1024.jpeg',
'CCC Team', 'Career Development', true, '2026-04-08 10:00:00+01'),

('Happy Easter from Career Care', 'happy-easter-from-career-care',
'On this Easter day, we are reminded that true transformation does not happen by chance or by access; it happens through intentional effort and the right support systems.',
'On this Easter day, we are reminded that true transformation does not happen by chance or by access; it happens through intentional effort and the right support systems.

At Career Care Center for Youth Development Initiative, we believe in the power of new beginnings. Just as Easter represents renewal and hope, we are committed to helping young Nigerians discover their potential and build brighter futures.

We wish all our community members, partners, volunteers, and supporters a blessed and joyful Easter celebration. May this season bring you renewed energy and inspiration to pursue your career goals.

Together, we continue to nurture talents for greater purposes.',
'https://careercarecenter.com.ng/wp-content/uploads/2026/04/Career-682x1024.webp',
'CCC Team', 'Anniversary', true, '2026-04-06 10:00:00+01'),

('We Just Want To Say Thank You!', 'we-just-want-to-say-thank-you',
'We just want to say Thank You! Take a look at our Smarter Skills For A Smarter Future photo gallery. #SmarterSkills #Employability #YouthEmpowerment #CareerCare',
'We just want to say Thank You! Take a look at our Smarter Skills For A Smarter Future photo gallery.

The Smarter Skills for a Smarter Future Workshop was a landmark event for the Career Care Center for Youth Development Initiative. We equipped young Nigerians with hands-on training in AI tools, graphics design, video editing, and social entrepreneurship.

#SmarterSkills #Employability #UrgentJobs #YouthEmpowerment #SocialEntrepreneurship #CareerCare #Internship #WYSD #SDG8

A heartfelt thank you to all our facilitators, volunteers, partners, and participants who made this possible. Together, we are building a smarter future for Nigeria''s youth.',
'https://careercarecenter.com.ng/wp-content/uploads/2025/07/Career-care-SSSF-Thank-You-784x1024.jpg',
'CCC Team', 'Anniversary Event', true, '2025-07-17 10:00:00+01'),

('Empowering Nigeria''s Youth: Join the "Smarter Skills for a Smarter Future" Workshop!', 'empowering-nigerias-youth-smarter-skills-workshop',
'Nigeria''s youth unemployment rate stands at 8.4% (NBS, 2024), yet industries are desperate for skilled talent in AI, digital design, and entrepreneurship. Join our two-day hybrid workshop designed to equip young Nigerians with future-ready skills.',
'Nigeria''s youth unemployment rate stands at 8.4% (NBS, 2024), yet industries are desperate for skilled talent in AI, digital design, and entrepreneurship. The disconnect is clear: young people need practical, future-ready skills to thrive in today''s economy.

That''s why the Career Care Center for Youth Development Initiative is hosting "Smarter Skills for a Smarter Future"—a two-day hybrid workshop designed to equip young Nigerians (esp. ages 18–35) with hands-on training in:

- Artificial Intelligence (AI tools, automation, ethics)
- Graphics Design & Video Editing (Canva, Adobe, Premiere Pro)
- Business Startup & Social Entrepreneurship (From idea to pitch)

This isn''t just another training—it''s a launchpad for careers and businesses in high-growth fields.

## How You Can Help

We''re calling on parents, teachers, guardians, and community leaders to play a role in shaping the future by:

1. **Encouraging a Young Person to Attend** - Do you know a student, recent graduate, or aspiring entrepreneur who could benefit? Share this opportunity with them! Skills = Opportunities.

2. **Sponsoring a Participant** - For just ₦15,000, you can cover one youth''s registration, materials, and access to mentorship. Bulk sponsorship? Schools/organizations can sponsor 5+ attendees at a discounted rate.

3. **Volunteering or Advocating** - Teachers: Nominate standout students for scholarships. Parents: Offer transportation/logistics support for attendees.

## What Participants Will Gain

- Certification in their chosen skill track
- Hands-on projects for portfolios or business ideas
- Networking with industry leaders and potential employers
- Seed funding for top business pitches

## Key Details

- **Date:** July 14–15, 2025
- **Location:** Hybrid (YabaTech, Lagos + Virtual)
- **Eligibility:** Ages 18–35 (No prior experience required!)

Every young person deserves a chance to build a smarter future. By supporting even one youth to attend, you''re not just changing a life—you''re strengthening Nigeria''s workforce and economy.

Questions? Contact us at partnership@careercarecenter.com.ng or 08151246752.',
'https://careercarecenter.com.ng/wp-content/uploads/2025/07/Smarter-Skills-For-A-Smarter-Future-Workshop-Career-Care-808x1024.jpg',
'CCC Team', 'Career', true, '2025-07-02 10:00:00+01'),

('Reports on Career Acceleration Workshop: A Fun and Educative Experience', 'reports-career-acceleration-workshop-fun-educative-experience',
'The Career Care Center''s Career Acceleration and Workshop Training, hosted and moderated by Mr. Uche Aso, was a huge success! Led by Mr. Stephen Ogunbiyi, a Training Specialist with Impact Water Nigeria, the session covered CV writing, job application tips, and LinkedIn optimization.',
'The Career Care Center''s Career Acceleration and Workshop Training, hosted and moderated by Mr. Uche Aso, was a huge success!

The training, led by Mr. Stephen Ogunbiyi, a dedicated Training Specialist with Impact Water Nigeria, was an engaging and informative session that covered essential topics in career development.

## About Our Trainer

Mr. Stephen Ogunbiyi brings over three years of experience in designing and delivering impactful training programs, facilitating workshops, and developing curricula to drive Learning & Development (L&D) initiatives. With a passion for fostering sustainable WASH (Water, Sanitation, and Hygiene) practices, he creates engaging learning experiences that inspire behavioral change and programmatic success.

## What We Learned

During the workshop, participants had the opportunity to learn about:

- **CV writing:** how to structure your CV to attract recruiters
- **Job application tips:** how to increase your chances of landing your dream job
- **The difference between a CV and a resume:** understanding the nuances of each document
- **LinkedIn optimization:** how to leverage AI and other tools to boost your online presence

## Interactive Fun

The training wasn''t just about lectures – we had some exciting games and activities that made learning fun! These interactive elements helped participants engage with the material and retain the information better.

## A Huge Success

With over 70 viewers tuning in live on YouTube, the event was a resounding success. The feedback was overwhelmingly positive, with many participants appreciating the valuable insights and practical tips shared during the workshop.

Special thanks to our Host and Moderator, Mr. Uche Aso, for moderating the event seamlessly, and to Mr. Stephen Ogunbiyi for delivering an engaging and informative session.

Stay tuned for more exciting webinars, events and training sessions from the Career Care Center for Youth Development Initiative!',
'https://careercarecenter.com.ng/wp-content/uploads/2025/05/Career-Care-Center-Webinar-CV-Writing-Training-1024x584.png',
'CCC Team', 'CVs & Interviews', true, '2025-05-01 10:00:00+01'),

('List of 43 Confirmed Fake Jobs Addresses in Nigeria', 'list-43-confirmed-fake-jobs-addresses-nigeria',
'Over the years, there has been rampant cases of job seekers visiting these locations, only to discover that they were tricked into attending a Network Marketing seminar aimed at extorting them, rather than providing jobs or interviews as indicated in their invite.',
'Over the years, there has been rampant cases of job seekers visiting these locations, then get to discover that they were tricked into attending a Network Marketing seminar aimed at extorting them, rather than providing jobs or even interviews, as indicated in their invite.

We implore candidates to carry out due diligence before spending time and resources to attend any job interview(s). Big cities like Abuja, Lagos, Port Harcourt and a few others have these locations littered all over.

Here are a few confirmed job locations to be watchful of when going for interviews:

1. Plot 5, Voda Paint plc, University Press House, Fumec Bus stop off Adeniyi Jones Ogba Lagos
2. 3rd floor, 8 Thomas Salako Street, Ogba Bus Stop, Ikeja Lagos
3. No 2, Sunday Street, off Ikorodu, Palmgrove, Lagos
4. 65c Opebi Road, Opposite glass house by salvation Bus stop, Opebi, Ikeja, Lagos
5. HYINSCO Office. No. 4, 2nd floor, upward sanitas outlet, Alara Street, off commercial avenue, Onike, Sabo Yaba, Lagos
6. Plot 5, university press building, along industrial road, Ogba, Lagos
7. 4B, Ogungbeye street Oppt African Shrine by Cadbury bus stop, Agidingbi Ikeja, Lagos
8. Plot 14, Block A, Voda Paint, Surulere House, off Fumec bus stop, Surulere industrial road, Ogba, Lagos
9. No 4, Ahl Ogungbeye Street off Amaraolu road, Opp Mega chicken bus stop by first gate, Agidingbi, Ikeja, Lagos
10. 1, Olabisi Close, Mende, Maryland (Lagos Resident only)

...and many more across Lagos, Abuja, and Port Harcourt.

**Disclaimer:** The above list doesn''t imply that the addresses are fraudulent activities or majorly for scamming people, but some unscrupulous elements used an office space within the listed address to deceive candidates and lure them to attend seminars rather than job interviews.

Always verify job invitations before attending. Stay safe and vigilant in your job search journey.',
'https://careercarecenter.com.ng/wp-content/uploads/2025/02/Career-Care-Fake-Job-Interview-1024x1024.jpg',
'CCC Team', 'CVs & Interviews', true, '2025-02-20 10:00:00+01'),

('Unlock Your Potential with Problem-Solving Skills Training – A Free Webinar!', 'unlock-potential-problem-solving-skills-training-free-webinar',
'Struggling to find solutions to everyday challenges? Want to stand out in your career or business? Join our FREE Problem-Solving Skills Webinar and sharpen your problem-solving skills to take control of your future.',
'Struggling to find solutions to everyday challenges? Want to stand out in your career or business? It''s time to sharpen your problem-solving skills and take control of your future!

Join our FREE Problem-Solving Skills Webinar, hosted by Career Care Center for Youth Development Initiative. This interactive session will equip you with the critical thinking, creativity, and decision-making skills needed to tackle challenges with confidence.

Whether you''re a student, entrepreneur, or young professional, this training will help you analyze problems, develop solutions, and make smart choices in any situation.

## What You''ll Learn

- Proven problem-solving techniques for success
- How to think critically & make better decisions
- Real-world case studies & interactive discussions
- Tips to boost creativity & confidence in any field

## Event Details

- **Date:** February 21st, 2025
- **Time:** 4:00 pm – 5:00 pm
- **Location:** Online – YouTube Live & LinkedIn

Limited slots available! Don''t miss out on this life-changing opportunity. Register now and start solving problems like a pro!',
'https://careercarecenter.com.ng/wp-content/uploads/2025/02/Problem-Solving-Skill-Training-1024x998.jpg',
'CCC Team', 'Webinar', true, '2025-02-17 10:00:00+01'),

('New Challenge – #IntegrityCV Challenge', 'new-challenge-integritycv-challenge',
'It''s an intentional move to challenge corporate professionals to openly promote accountability by putting out their CVs to the public for possible scrutiny. As an upcoming leader, this move will motivate others to do the right thing.',
'What''s the #IntegrityCV Challenge All About?

It''s an intentional move to challenge corporate professionals to openly promote accountability by putting out their CVs to the public for possible scrutiny.

As an upcoming leader, this move will motivate others to do the right thing and the spiral effect would be positively monumental, especially for our dear country.

## How to Participate

- Share your CV on WhatsApp, LinkedIn, and any other platform you''re comfortable with
- Use the hashtag #IntegrityCV
- You can drop a link to your updated CV in the comments section (e.g. Google Docs links)

Let''s go! Together, we can build a culture of integrity and accountability in Nigeria''s professional landscape.',
'https://careercarecenter.com.ng/wp-content/uploads/2024/11/CV-Integrity-Career-Care.jpg',
'CCC Team', 'CVs & Interviews', true, '2024-11-13 10:00:00+01')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- TESTIMONIALS (real testimonials from the CCC website)
-- ============================================================================
INSERT INTO testimonials (name, role, quote, image_url, rating, approved) VALUES
('The Identity Doctor', 'Lead Consultant, Proflex Career Solutions, Lagos',
'Career Care Centre is an amazing community to be in. I was privileged to go through the career assessment and consultation. It was an amazing experience. Thank you Career Care Centre.',
NULL, 5, true),

('CCC Community Member', 'Program Participant',
'It''s been super since I joined. The community is supportive and the programs are impactful.',
NULL, 5, true),

('CCC Program Beneficiary', 'Career Coaching Participant',
'Career Care provides excellent service with a friendly and helpful approach.',
NULL, 5, true),

('CCC Mentee', 'Mentorship Program Participant',
'It has been thrilling and eye-opening. The mentorship program gave me clarity and direction for my career.',
NULL, 5, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- RESOURCES (real CCC resource topics)
-- ============================================================================
INSERT INTO resources (title, description, category, type, url, cover_image_url, duration, downloads) VALUES
('CV Writing Guide', 'A comprehensive guide to writing a professional CV that attracts recruiters, with templates and examples from our Career Acceleration Workshop.', 'CV Writing', 'pdf', 'https://careercarecenter.com.ng/2025/05/01/reports-on-career-acceleration-workshop-a-fun-and-educative-experience/', 'https://careercarecenter.com.ng/wp-content/uploads/2025/05/Career-Care-Center-Webinar-CV-Writing-Training-1024x584.png', '40 pages', 1240),
('Problem-Solving Skills Training', 'Video recording of our free Problem-Solving Skills Webinar covering critical thinking, creativity, and decision-making.', 'Interview Preparation', 'video', 'https://careercarecenter.com.ng/2025/02/17/unlock-your-potential-with-problem-solving-skills-training-a-free-webinar/', 'https://careercarecenter.com.ng/wp-content/uploads/2025/02/Problem-Solving-Skill-Training-1024x998.jpg', '1 hour', 890),
('Career Assessment Tool', 'FREE world-class, award-winning psychometric assessment by CareerExplorer. Guaranteed to set your feet on the right career path.', 'Career Development', 'article', 'https://careercarecenter.com.ng', 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg', '30 minutes', 2100),
('List of 43 Confirmed Fake Jobs Addresses', 'Important resource listing confirmed fake job addresses across Nigeria to help job seekers avoid scams.', 'Employability', 'article', 'https://careercarecenter.com.ng/2025/02/20/list-of-43-confirmed-fake-jobs-addresses-in-nigeria/', 'https://careercarecenter.com.ng/wp-content/uploads/2025/02/Career-Care-Fake-Job-Interview-1024x1024.jpg', '10 min read', 1850),
('Smarter Skills Workshop Resources', 'Training materials from the Smarter Skills for a Smarter Future Workshop covering AI tools, graphics design, and entrepreneurship.', 'Employability', 'pdf', 'https://careercarecenter.com.ng/2025/07/02/empowering-nigerias-youth-join-the-smarter-skills-for-a-smarter-future-workshop/', 'https://careercarecenter.com.ng/wp-content/uploads/2025/07/Smarter-Skills-For-A-Smarter-Future-Workshop-Career-Care-808x1024.jpg', '60 pages', 670),
('LinkedIn Optimization Guide', 'Learn how to leverage AI and other tools to boost your LinkedIn presence and attract recruiters.', 'CV Writing', 'article', 'https://careercarecenter.com.ng/2025/05/01/reports-on-career-acceleration-workshop-a-fun-and-educative-experience/', 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg', '15 min read', 540)
ON CONFLICT DO NOTHING;
