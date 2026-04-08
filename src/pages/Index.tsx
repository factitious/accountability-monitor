import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { SettingsModal } from '@/components/SettingsModal';
import { FiltersBar } from '@/components/FiltersBar';
import { IncidentCard } from '@/components/IncidentCard';
import { fetchNewsAPI } from '@/services/newsapi';
import { fetchGDELT } from '@/services/gdelt';
import { fetchSerpAPI } from '@/services/serpapi';
import { deduplicateIncidents } from '@/utils/dedup';
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

  // Check if keys exist on mount
  useEffect(() => {
    const hasKeys = localStorage.getItem('newsapi_key') || localStorage.getItem('serpapi_key');
    if (!hasKeys) {
      setSettingsOpen(true);
    } else {
      fetchAll();
    }
  }, []);

  const fetchAll = useCallback(async () => {
    const newsapiKey = localStorage.getItem('newsapi_key');
    const serpapiKey = localStorage.getItem('serpapi_key');
    const newErrors: Record<string, string> = {};
    const allResults: Incident[] = [];

    // Fetch all sources in parallel
    const promises: Promise<void>[] = [];

    if (newsapiKey) {
      setFetchState((s) => ({ ...s, newsapi: 'loading' }));
      promises.push(
        fetchNewsAPI(newsapiKey)
          .then((r) => { allResults.push(...r); setFetchState((s) => ({ ...s, newsapi: 'success' })); })
          .catch((e) => { newErrors.NewsAPI = e.message; setFetchState((s) => ({ ...s, newsapi: 'error' })); })
      );
    } else {
      newErrors.NewsAPI = 'API key not configured';
      setFetchState((s) => ({ ...s, newsapi: 'error' }));
    }

    setFetchState((s) => ({ ...s, gdelt: 'loading' }));
    promises.push(
      fetchGDELT()
        .then((r) => { allResults.push(...r); setFetchState((s) => ({ ...s, gdelt: 'success' })); })
        .catch((e) => { newErrors.GDELT = e.message; setFetchState((s) => ({ ...s, gdelt: 'error' })); })
    );

    if (serpapiKey) {
      setFetchState((s) => ({ ...s, serpapi: 'loading' }));
      promises.push(
        fetchSerpAPI(serpapiKey)
          .then((r) => { allResults.push(...r); setFetchState((s) => ({ ...s, serpapi: 'success' })); })
          .catch((e) => { newErrors.SerpAPI = e.message; setFetchState((s) => ({ ...s, serpapi: 'error' })); })
      );
    } else {
      newErrors.SerpAPI = 'API key not configured';
      setFetchState((s) => ({ ...s, serpapi: 'error' }));
    }

    await Promise.allSettled(promises);
    setFetchState((s) => ({ ...s, errors: newErrors }));
    setIncidents(deduplicateIncidents(allResults));
  }, []);

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
