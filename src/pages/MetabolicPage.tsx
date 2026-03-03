import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import BMRCalculator from '@/components/metabolic/BMRCalculator';
import WeightProjection from '@/components/metabolic/WeightProjection';
import BodyCompositionTracker from '@/components/metabolic/BodyCompositionTracker';
import HungerAssessment from '@/components/metabolic/HungerAssessment';
import DailyCheckin from '@/components/metabolic/DailyCheckin';
import PointsLevel from '@/components/metabolic/PointsLevel';
import PlateauMode from '@/components/metabolic/PlateauMode';
import MedicalDashboard from '@/components/metabolic/MedicalDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Brain, TrendingUp, ClipboardList } from 'lucide-react';

const MetabolicPage = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <AppLayout>
      <div className="space-y-4 animate-fade-in pb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Metabolic Intelligence</h1>
          <p className="text-muted-foreground">Your personalized health & metabolism dashboard</p>
        </div>

        <PointsLevel userId={user.id} />

        <Tabs defaultValue="metabolic" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="metabolic" className="flex flex-col gap-1 py-2 text-xs">
              <Activity className="h-4 w-4" />
              Metabolic
            </TabsTrigger>
            <TabsTrigger value="body" className="flex flex-col gap-1 py-2 text-xs">
              <TrendingUp className="h-4 w-4" />
              Body
            </TabsTrigger>
            <TabsTrigger value="mind" className="flex flex-col gap-1 py-2 text-xs">
              <Brain className="h-4 w-4" />
              Mind
            </TabsTrigger>
            <TabsTrigger value="medical" className="flex flex-col gap-1 py-2 text-xs">
              <ClipboardList className="h-4 w-4" />
              Medical
            </TabsTrigger>
          </TabsList>

          <TabsContent value="metabolic" className="space-y-4 mt-4">
            <BMRCalculator userId={user.id} />
            <WeightProjection userId={user.id} />
            <PlateauMode userId={user.id} />
          </TabsContent>

          <TabsContent value="body" className="space-y-4 mt-4">
            <BodyCompositionTracker userId={user.id} />
          </TabsContent>

          <TabsContent value="mind" className="space-y-4 mt-4">
            <DailyCheckin userId={user.id} />
            <HungerAssessment userId={user.id} />
          </TabsContent>

          <TabsContent value="medical" className="space-y-4 mt-4">
            <MedicalDashboard userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default MetabolicPage;
