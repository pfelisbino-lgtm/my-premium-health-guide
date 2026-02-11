import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Profile from '@/pages/Profile';

const ProfilePage = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout><Profile /></AppLayout>;
};

export default ProfilePage;
