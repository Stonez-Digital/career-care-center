/*
# Replace programmes with the 16 CCC programmes specified in the V2 requirements.
# Also updates the ProgramCategory type to accept any string (since we now have 16 categories).
# Old programmes are deleted; applications with program_id references are SET NULL by the FK.
*/

-- Clear existing programmes
DELETE FROM programs;

-- Insert the 16 CCC programmes
INSERT INTO programs (title, category, description, benefits, requirements, duration, image_url, is_active) VALUES
('Career Coaching', 'Career Coaching',
'One-on-one career coaching sessions to help you clarify your career path, set actionable goals, and build a roadmap to professional success.',
ARRAY['Personalized career roadmap','Clarity on career direction','Goal-setting framework','Accountability support'],
ARRAY['Commitment to attend sessions','Willingness to engage openly'],
'6 weeks',
'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
true),

('Career Mentorship', 'Career Mentorship',
'Get matched with experienced professionals in your field who provide guidance, support, and industry insights to accelerate your career.',
ARRAY['1:1 mentor matching','Industry-specific insights','Network expansion','Ongoing career guidance'],
ARRAY['Active student or graduate','Minimum 3-month commitment'],
'3 months',
'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg',
true),

('Internship Support Programme', 'Internship Support',
'We connect you with partner organizations for internship placements that build real-world experience and bridge the gap between education and employment.',
ARRAY['Real-world work experience','Professional references','Resume building','Potential full-time offers'],
ARRAY['Current student or recent graduate','Available 3-6 months'],
'3-6 months',
'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
true),

('CV Review & Optimization', 'CV Review',
'Professional review and optimization of your CV to make it stand out to recruiters and ATS systems. Learn how to structure your CV to attract recruiters.',
ARRAY['ATS-optimized CV','Professional formatting','Industry-specific keywords','Free revision'],
ARRAY['Current CV draft','Active email address'],
'1 week',
'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg',
true),

('LinkedIn Profile Optimization', 'LinkedIn Optimization',
'Transform your LinkedIn profile into a recruiter magnet. Learn how to leverage AI and other tools to boost your online presence and grow your professional network.',
ARRAY['Profile optimization','Headline rewrite','Network growth strategy','AI tools for LinkedIn'],
ARRAY['Existing LinkedIn account','Professional headshot'],
'1 week',
'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg',
true),

('Entrepreneurship Development', 'Entrepreneurship Development',
'Turn your business idea into a viable venture through our structured entrepreneurship curriculum. From idea validation to pitch readiness.',
ARRAY['Business plan development','Mentorship from founders','Pitch deck creation','Seed funding for top pitches'],
ARRAY['A business idea or early-stage venture','Commitment to program duration'],
'8 weeks',
'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
true),

('Skills Development Programme', 'Skills Development',
'Acquire in-demand digital and soft skills through hands-on workshops and project-based learning. Covers AI tools, graphics design, video editing, and more.',
ARRAY['In-demand digital skills','Project portfolio','Certificate of completion','Job-ready competence'],
ARRAY['Ages 18-35','Basic computer literacy','Commitment to attend sessions'],
'10 weeks',
'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
true),

('Career Assessment', 'Career Assessment',
'Discover your strengths, interests, and ideal career paths through our FREE world-class, award-winning psychometric assessment by CareerExplorer.',
ARRAY['Personalized career report','Strengths analysis','Career path recommendations','Action plan'],
ARRAY['30 minutes for assessment','Openness to explore options'],
'1 session',
'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg',
true),

('Employability Skills Training', 'Employability Skills Training',
'Develop the critical employability skills that employers look for: communication, teamwork, problem-solving, and professional etiquette.',
ARRAY['Communication skills','Teamwork and collaboration','Problem-solving skills','Professional etiquette'],
ARRAY['Commitment to attend training','Willingness to learn'],
'4 weeks',
'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
true),

('Leadership Development Programme', 'Leadership Development',
'Develop the leadership skills needed to lead teams, projects, and initiatives in any organization. Practical frameworks for aspiring leaders.',
ARRAY['Leadership framework','Team management skills','Communication mastery','Project leadership'],
ARRAY['Aspiring leader','Commitment to program duration'],
'12 weeks',
'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg',
true),

('Graduate Employability Programme', 'Graduate Employability',
'A comprehensive programme designed to equip recent graduates with the skills, tools, and confidence needed to secure employment quickly.',
ARRAY['Job search strategies','Interview preparation','CV and LinkedIn optimization','Networking skills'],
ARRAY['Recent graduate','Commitment to program duration'],
'6 weeks',
'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
true),

('Job Readiness Bootcamp', 'Job Readiness',
'An intensive bootcamp preparing you for the job market. Covers CV writing, interview skills, job search strategies, and workplace expectations.',
ARRAY['CV writing mastery','Interview skills','Job search strategies','Workplace readiness'],
ARRAY['Commitment to attend all sessions','Active job seeker'],
'2 weeks',
'https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg',
true),

('Digital Skills Training', 'Digital Skills Training',
'Learn essential digital skills for the modern workplace: from basic computer literacy to advanced tools like AI, Canva, and Premiere Pro.',
ARRAY['Digital literacy','AI tools proficiency','Graphics design basics','Video editing fundamentals'],
ARRAY['Basic computer literacy','Commitment to attend sessions'],
'8 weeks',
'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
true),

('Youth Empowerment Programme', 'Youth Empowerment',
'A holistic programme empowering young Nigerians with the skills, mindset, and network to build successful careers and businesses.',
ARRAY['Skills development','Mindset coaching','Network building','Career guidance'],
ARRAY['Ages 18-35','Commitment to program duration'],
'12 weeks',
'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
true),

('Internship Placement Programme', 'Internship Placement',
'We place you in internship roles with our partner organizations, giving you hands-on experience and a foot in the door of your chosen industry.',
ARRAY['Guaranteed internship placement','Hands-on work experience','Professional references','Monthly living allowance'],
ARRAY['Current student or recent graduate','Available 3-6 months','Completed CV review'],
'3-6 months',
'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
true),

('Professional Development Programme', 'Professional Development',
'Advance your career with our professional development programme. Build advanced skills in communication, leadership, and career strategy.',
ARRAY['Advanced communication skills','Leadership development','Career strategy','Professional network expansion'],
ARRAY['2+ years experience','Commitment to program duration'],
'8 weeks',
'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg',
true)
ON CONFLICT DO NOTHING;
