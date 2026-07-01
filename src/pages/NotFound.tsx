import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="text-center">
        <p className="font-heading text-8xl font-bold text-primary-700">404</p>
        <h1 className="mt-4 heading-3">Page Not Found</h1>
        <p className="mt-3 text-ink-600">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary mt-8">
          <Home className="h-4 w-4" /> Back Home
        </Link>
      </div>
    </div>
  );
}
