import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Incident } from '@/types/incident';
import { SourceBadge } from './SourceBadge';
import { CategoryBadge } from './CategoryBadge';
import { formatDistanceToNow } from 'date-fns';

export function IncidentCard({ incident }: { incident: Incident }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <a
            href={incident.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm leading-tight text-foreground hover:text-primary hover:underline flex-1"
          >
            {incident.title}
          </a>
          <div className="flex gap-1 shrink-0">
            <CategoryBadge category={incident.category} />
            <SourceBadge source={incident.dataSource} />
          </div>
        </div>

        {incident.perpetratorName && (
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Accused:</span>{' '}
            {incident.perpetratorName}
            {incident.perpetratorRole && ` (${incident.perpetratorRole})`}
          </p>
        )}

        {incident.institutionName && (
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Institution:</span>{' '}
            {incident.institutionName}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{incident.sourceName}</span>
          <span>·</span>
          <span>{incident.date instanceof Date && !isNaN(incident.date.getTime()) ? formatDistanceToNow(incident.date, { addSuffix: true }) : 'Unknown date'}</span>
        </div>

        {incident.description && (
          <p
            className={`text-xs text-muted-foreground cursor-pointer ${!expanded ? 'line-clamp-2' : ''}`}
            onClick={() => setExpanded(!expanded)}
          >
            {incident.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
