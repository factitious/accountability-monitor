import { Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FetchState } from '@/types/incident';

interface AppHeaderProps {
  totalCount: number;
  fetchState: FetchState;
  onRefresh: () => void;
  onOpenSettings: () => void;
  isRefreshing: boolean;
}

const statusIcon: Record<string, string> = {
  idle: '○',
  loading: '⟳',
  success: '✓',
  error: '✗',
};

const statusColor: Record<string, string> = {
  idle: 'bg-muted text-muted-foreground',
  loading: 'bg-[hsl(45,80%,50%)] text-[hsl(0,0%,100%)]',
  success: 'bg-[hsl(150,60%,40%)] text-[hsl(0,0%,100%)]',
  error: 'bg-destructive text-destructive-foreground',
};

export function AppHeader({ totalCount, fetchState, onRefresh, onOpenSettings, isRefreshing }: AppHeaderProps) {
  return (
    <header className="bg-primary text-primary-foreground px-4 py-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Accountability Monitor</h1>
            <p className="text-xs opacity-80 mt-0.5">
              New sexual abuse accusations — US only — last 60 days
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onOpenSettings}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs font-medium">{totalCount} results</span>
          <span className="text-xs opacity-50">|</span>
          {(['newsapi', 'gdelt', 'serpapi'] as const).map((src) => (
            <Badge
              key={src}
              className={`text-[10px] border-none ${statusColor[fetchState[src]]}`}
            >
              {src === 'newsapi' ? 'NewsAPI' : src === 'gdelt' ? 'GDELT' : 'SerpAPI'}{' '}
              {statusIcon[fetchState[src]]}
            </Badge>
          ))}
        </div>
        {Object.entries(fetchState.errors).map(([src, msg]) => (
          <div key={src} className="mt-2 text-xs bg-destructive/20 text-destructive-foreground rounded px-2 py-1">
            ⚠ {src}: {msg}
          </div>
        ))}
      </div>
    </header>
  );
}
