import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { PageLoader } from './components/Spinner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Maintenance from './pages/Maintenance';

// ── Public Website ──
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Programs = lazy(() => import('./pages/Programs'));
const Events = lazy(() => import('./pages/Events'));
const SuccessStories = lazy(() => import('./pages/SuccessStories'));
const Volunteer = lazy(() => import('./pages/Volunteer'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Contact = lazy(() => import('./pages/Contact'));
const Donate = lazy(() => import('./pages/Donate'));
const Apply = lazy(() => import('./pages/Apply'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const NotFound = lazy(() => import('./pages/NotFound'));

// ── User Portal (Student / Mentor / Volunteer) ──
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const MyApplications = lazy(() => import('./pages/dashboard/MyApplications'));
const MyEvents = lazy(() => import('./pages/dashboard/MyEvents'));
const Resources = lazy(() => import('./pages/dashboard/Resources'));
const Mentorship = lazy(() => import('./pages/dashboard/Mentorship'));
const Notifications = lazy(() => import('./pages/dashboard/Notifications'));
const VolunteerOpportunities = lazy(() => import('./pages/dashboard/VolunteerOpportunities'));
const AssignedActivities = lazy(() => import('./pages/dashboard/AssignedActivities'));
const VolunteerSchedule = lazy(() => import('./pages/dashboard/VolunteerSchedule'));
const Availability = lazy(() => import('./pages/dashboard/Availability'));
const VolunteerHistory = lazy(() => import('./pages/dashboard/VolunteerHistory'));
const Mentees = lazy(() => import('./pages/dashboard/Mentees'));
const MentorSessions = lazy(() => import('./pages/dashboard/MentorSessions'));
const MentorSchedule = lazy(() => import('./pages/dashboard/MentorSchedule'));
const TeamMeetings = lazy(() => import('./pages/dashboard/TeamMeetings'));

// ── Admin Portal ──
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminPrograms = lazy(() => import('./pages/admin/AdminPrograms'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminVolunteers = lazy(() => import('./pages/admin/AdminVolunteers'));
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications'));
const AdminBlog = lazy(() => import('./pages/admin/AdminBlog'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));
const AdminDonations = lazy(() => import('./pages/admin/AdminDonations'));
const AdminPartners = lazy(() => import('./pages/admin/AdminPartners'));
const AdminResources = lazy(() => import('./pages/admin/AdminResources'));
const AdminContactMessages = lazy(() => import('./pages/admin/AdminContactMessages'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminMentors = lazy(() => import('./pages/admin/AdminMentors'));
const AdminMentees = lazy(() => import('./pages/admin/AdminMentees'));
const AdminSessions = lazy(() => import('./pages/admin/AdminSessions'));
const AdminNewsletter = lazy(() => import('./pages/admin/AdminNewsletter'));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs'));

export default function App() {
  const { pathname } = useLocation();
  const isPortal = pathname === '/dashboard' || pathname.startsWith('/dashboard/') || pathname === '/admin' || pathname.startsWith('/admin/');
  const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');

  if (maintenanceMode && !isAdminPath) return <Maintenance />;

  return (
    <div className="flex min-h-screen flex-col">
      {!isPortal && <Navbar />}
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ════════════════════════════════════════════
                1. PUBLIC WEBSITE — no auth required
            ════════════════════════════════════════════ */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/events" element={<Events />} />
            <Route path="/success-stories" element={<SuccessStories />} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* ════════════════════════════════════════════
                2. USER PORTAL — authenticated users only
                (Student / Mentor / Volunteer)
            ════════════════════════════════════════════ */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['intern', 'mentor', 'volunteer']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="applications" element={<MyApplications />} />
              <Route path="events" element={<MyEvents />} />
              <Route path="resources" element={<Resources />} />
              <Route path="mentorship" element={<Mentorship />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="volunteer-opportunities" element={<VolunteerOpportunities />} />
              <Route path="assigned-activities" element={<AssignedActivities />} />
              <Route path="volunteer-schedule" element={<VolunteerSchedule />} />
              <Route path="availability" element={<Availability />} />
              <Route path="volunteer-history" element={<VolunteerHistory />} />
              <Route path="mentees" element={<Mentees />} />
              <Route path="mentor-sessions" element={<MentorSessions />} />
              <Route path="schedule" element={<MentorSchedule />} />
              <Route path="meetings" element={<TeamMeetings />} />
            </Route>

            {/* ════════════════════════════════════════════
                3. ADMIN PORTAL — separate, admin-only
            ════════════════════════════════════════════ */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="programs" element={<AdminPrograms />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="volunteers" element={<AdminVolunteers />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="donations" element={<AdminDonations />} />
              <Route path="partners" element={<AdminPartners />} />
              <Route path="resources" element={<AdminResources />} />
              <Route path="messages" element={<AdminContactMessages />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="mentors" element={<AdminMentors />} />
              <Route path="mentees" element={<AdminMentees />} />
              <Route path="sessions" element={<AdminSessions />} />
              <Route path="newsletter" element={<AdminNewsletter />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!isPortal && <Footer />}
    </div>
  );
}
