import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getFriendlyError } from '@/lib/error-utils';
import { Leaf, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type AuthMode = 'login' | 'register' | 'forgot';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: t('authLoginError'), description: getFriendlyError(error), variant: 'destructive' });
    } else {
      navigate('/');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: t('authRegisterError'), description: getFriendlyError(error), variant: 'destructive' });
    } else {
      toast({ title: t('authRegisterSuccess'), description: t('authRegisterSuccessDesc') });
      setMode('login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    setLoading(false);
    if (error) {
      toast({ title: t('authError'), description: getFriendlyError(error), variant: 'destructive' });
    } else {
      toast({ title: t('authEmailSent'), description: t('authEmailSentDesc') });
      setMode('login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Leaf className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">My Glowfit</h1>
          <p className="text-sm text-muted-foreground">{t('appTagline')}</p>
          <div className="mt-2 flex justify-center">
            <LanguageSwitcher />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === 'login' && t('authLogin')}
              {mode === 'register' && t('authRegister')}
              {mode === 'forgot' && t('authForgotPassword')}
            </CardTitle>
            <CardDescription>
              {mode === 'login' && t('authLoginDesc')}
              {mode === 'register' && t('authRegisterDesc')}
              {mode === 'forgot' && t('authForgotDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t('authFullName')}</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('authFullNamePlaceholder')} required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('authEmail')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('authEmailPlaceholder')} required />
              </div>
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password">{t('authPassword')}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('authProcessing') : mode === 'login' ? t('authSubmitLogin') : mode === 'register' ? t('authSubmitRegister') : t('authSubmitForgot')}
              </Button>
            </form>

            <div className="mt-4 space-y-2 text-center text-sm">
              {mode === 'login' && (
                <>
                  <button onClick={() => setMode('forgot')} className="text-primary hover:underline block mx-auto">{t('authForgotLink')}</button>
                  <p className="text-muted-foreground">
                    {t('authNoAccount')}{' '}
                    <button onClick={() => setMode('register')} className="text-primary hover:underline">{t('authCreateAccount')}</button>
                  </p>
                </>
              )}
              {mode === 'register' && (
                <p className="text-muted-foreground">
                  {t('authHasAccount')}{' '}
                  <button onClick={() => setMode('login')} className="text-primary hover:underline">{t('authLoginLink')}</button>
                </p>
              )}
              {mode === 'forgot' && (
                <button onClick={() => setMode('login')} className="text-primary hover:underline inline-flex items-center gap-1">
                  <ArrowLeft className="h-3 w-3" /> {t('authBackToLogin')}
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
