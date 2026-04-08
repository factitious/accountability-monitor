import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Incident } from '@/types/incident';
import { SourceBadge } from './SourceBadge';
import { CategoryBadge } from './CategoryBadge';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Loader2, MapPin } from 'lucide-react';

export function IncidentCard({ incident }: { incident: Incident }) {
  const [expanded, setExpanded] = useState(false);
  const [summarising, setSummarising] = useState(false);
  const [summary, setSummary] = useState<string | null>(incident.summary);
  const [location, setLocation] = useState<string | null>(incident.location);
  const [enrichedName, setEnrichedName] = useState<string | null>(incident.perpetratorName);
  const [enrichedRole, setEnrichedRole] = useState<string | null>(incident.perpetratorRole);
  const [enrichedInstitution, setEnrichedInstitution] = useState<string | null>(incident.institutionName);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSummarise = async () => {
    setSummarising(true);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('summarise-incident', {
        body: { url: incident.url, title: incident.title },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setSummary(data.summary ?? null);
      setLocation(data.location ?? null);
      if (data.perpetrator_name) setEnrichedName(data.perpetrator_name);
      if (data.perpetrator_role) setEnrichedRole(data.perpetrator_role);
      if (data.institution_name) setEnrichedInstitution(data.institution_name);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to summarise');
    } finally {
      setSummarising(false);
    }
  };

  const perpetratorName = enrichedName;
  const perpetratorRole = enrichedRole;
  const institutionName = enrichedInstitution;

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

        {perpetratorName && (
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Accused:</span>{' '}
            {perpetratorName}
            {perpetratorRole && ` (${perpetratorRole})`}
          </p>
        )}

        {institutionName && (
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Institution:</span>{' '}
            {institutionName}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{incident.sourceName}</span>
          <span>·</span>
          <span>{incident.date instanceof Date && !isNaN(incident.date.getTime()) ? formatDistanceToNow(incident.date, { addSuffix: true }) : 'Unknown date'}</span>
          {location && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            </>
          )}
        </div>

        {summary ? (
          <div className="rounded-md bg-muted/50 border border-border px-3 py-2 text-xs text-foreground leading-relaxed">
            <span className="inline-flex items-center gap-1 font-semibold text-primary mb-1">
              <Sparkles className="h-3 w-3" /> AI Summary
            </span>
            <p>{summary}</p>
          </div>
        ) : (
          incident.description && (
            <p
              className={`text-xs text-muted-foreground cursor-pointer ${!expanded ? 'line-clamp-2' : ''}`}
              onClick={() => setExpanded(!expanded)}
            >
              {incident.description}
            </p>
          )
        )}

        {aiError && (
          <p className="text-xs text-destructive">{aiError}</p>
        )}

        {!summary && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleSummarise}
            disabled={summarising}
          >
            {summarising ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Summarising...</>
            ) : (
              <><Sparkles className="h-3 w-3" /> AI Summary</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
