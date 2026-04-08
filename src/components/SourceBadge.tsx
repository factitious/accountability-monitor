import { Badge } from '@/components/ui/badge';
import { DataSource } from '@/types/incident';
import { cn } from '@/lib/utils';

const sourceColors: Record<DataSource, string> = {
  NewsAPI: 'bg-[hsl(210,80%,55%)] text-[hsl(0,0%,100%)]',
  GDELT: 'bg-[hsl(150,60%,40%)] text-[hsl(0,0%,100%)]',
  SerpAPI: 'bg-[hsl(30,80%,55%)] text-[hsl(0,0%,100%)]',
};

export function SourceBadge({ source }: { source: DataSource }) {
  return (
    <Badge className={cn('text-[10px] border-none', sourceColors[source])}>
      {source}
    </Badge>
  );
}
