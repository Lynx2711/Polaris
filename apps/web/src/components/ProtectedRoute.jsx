import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Loader from './Loader';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullPage={true} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
