import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { SettingsModal } from '@/components/SettingsModal';
import { FiltersBar } from '@/components/FiltersBar';
import { IncidentCard } from '@/components/IncidentCard';
import { supabase } from '@/integrations/supabase/client';
import { Incident, FetchState, Category, DataSource } from '@/types/incident';

const Index = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>({
    newsapi: 'idle', gdelt: 'idle', serpapi: 'idle', errors: {},
  });

  // Filters
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [source, setSource] = useState<DataSource | 'All'>('All');
  const [dateRange, setDateRange] = useState(60);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  // Fetch on mount
  useEffect(() => {
    fetchAll();
  }, []);

  // 1. Read current incidents from DB (fast)
  // 2. Trigger background fetch to refresh DB
  // 3. Re-read DB when fetch completes
  const fetchAll = useCallback(async () => {
    const newErrors: Record<string, string> = {};

    // Read from DB immediately so the page isn't blank
    setFetchState((s) => ({ ...s, newsapi: 'loading', gdelt: 'loading', serpapi: 'loading' }));
    await loadFromDB();

    // Trigger the background fetch-incidents Edge Function
    const { error } = await supabase.functions.invoke('fetch-incidents');
    if (error) {
      newErrors.fetch = error.message;
      setFetchState((s) => ({ ...s, newsapi: 'error', gdelt: 'error', serpapi: 'error', errors: newErrors }));
      return;
    }

    // Re-read DB now that fresh data has been upserted
    await loadFromDB();
    setFetchState((s) => ({ ...s, newsapi: 'success', gdelt: 'success', serpapi: 'success', errors: {} }));
  }, []);

  const loadFromDB = async () => {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('date', { ascending: false })
      .limit(500);

    if (error) {
      console.error('DB read failed:', error);
      return;
    }

    const incidents: Incident[] = (data ?? []).map((row) => ({
      id: row.url,  // url is now the primary key
      title: row.title,
      description: row.description,
      url: row.url,
      date: new Date(row.date),
      sourceName: row.source_name,
      dataSource: row.data_source as DataSource,
      category: row.category as Category,
      perpetratorName: row.perpetrator_name,
      institutionName: row.institution_name,
      perpetratorRole: row.perpetrator_role,
      summary: row.summary ?? null,
      location: row.location ?? null,
      aiEnriched: row.ai_enriched ?? false,
    }));

    setIncidents(incidents);
  };

  const isRefreshing = fetchState.newsapi === 'loading' || fetchState.gdelt === 'loading' || fetchState.serpapi === 'loading';

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - dateRange);
    const search = debouncedSearch.toLowerCase();

    return incidents
      .filter((inc) => {
        if (category !== 'All' && inc.category !== category) return false;
        if (source !== 'All' && inc.dataSource !== source) return false;
        if (inc.date < cutoff) return false;
        if (search) {
          const haystack = `${inc.title} ${inc.description || ''} ${inc.perpetratorName || ''} ${inc.institutionName || ''}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [incidents, category, source, dateRange, debouncedSearch]);

  const handleSettingsClose = (saved: boolean) => {
    setSettingsOpen(false);
    if (saved) fetchAll();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        totalCount={filtered.length}
        fetchState={fetchState}
        onRefresh={fetchAll}
        onOpenSettings={() => setSettingsOpen(true)}
        isRefreshing={isRefreshing}
      />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <FiltersBar
          category={category} setCategory={setCategory}
          source={source} setSource={setSource}
          dateRange={dateRange} setDateRange={setDateRange}
          searchText={searchText} setSearchText={setSearchText}
        />
        {filtered.length === 0 && !isRefreshing && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No incidents found. Try adjusting filters or adding API keys.</p>
          </div>
        )}
        {isRefreshing && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Fetching articles...</p>
          </div>
        )}
        <div className="space-y-3">
          {filtered.map((inc) => (
            <IncidentCard key={inc.id} incident={inc} />
          ))}
        </div>
      </main>
      <SettingsModal open={settingsOpen} onClose={handleSettingsClose} />
    </div>
  );
};

export default Index;
