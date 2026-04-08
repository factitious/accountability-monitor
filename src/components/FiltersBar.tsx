import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Category, DataSource } from '@/types/incident';

interface FiltersBarProps {
  category: Category | 'All';
  setCategory: (c: Category | 'All') => void;
  source: DataSource | 'All';
  setSource: (s: DataSource | 'All') => void;
  dateRange: number;
  setDateRange: (d: number) => void;
  searchText: string;
  setSearchText: (s: string) => void;
}

const categories: (Category | 'All')[] = ['All', 'Teacher', 'Doctor', 'Religious'];
const sources: (DataSource | 'All')[] = ['All', 'NewsAPI', 'GDELT', 'SerpAPI'];
const dateRanges = [7, 14, 30, 60];

export function FiltersBar({
  category, setCategory,
  source, setSource,
  dateRange, setDateRange,
  searchText, setSearchText,
}: FiltersBarProps) {
  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by name, institution, or keyword..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="max-w-md"
      />
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 items-center">
          <span className="text-xs font-medium text-muted-foreground mr-1">Category:</span>
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? 'default' : 'outline'}
              onClick={() => setCategory(c)}
              className="h-7 text-xs"
            >
              {c}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-xs font-medium text-muted-foreground mr-1">Source:</span>
          {sources.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={source === s ? 'default' : 'outline'}
              onClick={() => setSource(s)}
              className="h-7 text-xs"
            >
              {s}
            </Button>
          ))}
        </div>
        <div className="flex gap-1 items-center">
          <span className="text-xs font-medium text-muted-foreground mr-1">Days:</span>
          {dateRanges.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={dateRange === d ? 'default' : 'outline'}
              onClick={() => setDateRange(d)}
              className="h-7 text-xs"
            >
              {d}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
