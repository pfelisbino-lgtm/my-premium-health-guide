import { useLanguage } from '@/i18n/LanguageContext';
import { languageNames, type Language } from '@/i18n/translations';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
          <Globe className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.entries(languageNames) as [Language, string][]).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code)}
            className={language === code ? 'bg-accent font-semibold' : ''}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
