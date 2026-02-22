import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Início' },
    { to: '/recipes', icon: UtensilsCrossed, label: 'Receitas' },
    { to: '/profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
            <span className="text-xl">🌿</span>
            <span>My Glowfit</span>
          </Link>
          <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="container flex-1 py-4 pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/90 backdrop-blur-md">
        <div className="container flex items-center justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors ${
                  active ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
