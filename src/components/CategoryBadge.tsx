import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/incident';

const categoryVariant: Record<Category, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Teacher: 'secondary',
  Doctor: 'outline',
  Religious: 'default',
  Other: 'secondary',
};

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <Badge variant={categoryVariant[category]} className="text-[10px]">
      {category}
    </Badge>
  );
}
