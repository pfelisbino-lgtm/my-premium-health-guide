import { Lock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const HOTMART_SALES_URL = 'https://pay.hotmart.com/YOUR_PRODUCT_ID';

const SubscriptionRequired = () => {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center animate-fade-in">
        <CardHeader className="space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Subscription Required</CardTitle>
          <CardDescription className="text-base">
            Your subscription is inactive. Please subscribe to unlock the AI Meal Scanner and Metabolic Tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <a href={HOTMART_SALES_URL} target="_blank" rel="noopener noreferrer">
              Subscribe Now <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="ghost" className="w-full" onClick={signOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionRequired;
