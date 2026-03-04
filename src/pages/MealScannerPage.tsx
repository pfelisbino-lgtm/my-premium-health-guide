import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import MealScanner from '@/components/meal/MealScanner';
import MealHistory from '@/components/meal/MealHistory';

const MealScannerPage = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in pb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meal Scanner</h1>
          <p className="text-muted-foreground">AI-powered nutrition analysis from a photo</p>
        </div>
        <MealScanner userId={user.id} />
        <MealHistory userId={user.id} />
      </div>
    </AppLayout>
  );
};

export default MealScannerPage;
