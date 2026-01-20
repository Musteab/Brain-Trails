import { Navigate, Outlet, useLocation } from 'react-router-dom';

import LoadingState from '../common/LoadingState';
import { useAuth } from '../../context/AuthContext';

const RequireAuth = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState label="Preparing your workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
