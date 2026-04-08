export type DataSource = 'NewsAPI' | 'GDELT' | 'SerpAPI';
export type Category = 'Teacher' | 'Doctor' | 'Religious' | 'Other';

export interface Incident {
  id: string;
  title: string;
  description: string | null;
  url: string;
  date: Date;
  sourceName: string;
  dataSource: DataSource;
  category: Category;
  perpetratorName: string | null;
  institutionName: string | null;
  perpetratorRole: string | null;
  summary: string | null;
  location: string | null;
  aiEnriched: boolean;
}

export type SourceStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FetchState {
  newsapi: SourceStatus;
  gdelt: SourceStatus;
  serpapi: SourceStatus;
  errors: Record<string, string>;
}
