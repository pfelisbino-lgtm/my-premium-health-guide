import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Recipes from '@/pages/Recipes';

const RecipesPage = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <AppLayout><Recipes /></AppLayout>;
};

export default RecipesPage;
