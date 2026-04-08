export const SEARCH_QUERIES = [
  '"teacher" "sexual abuse" "accused" OR "charged" OR "arrested" OR "lawsuit"',
  '"doctor" OR "physician" "sexual abuse" "accused" OR "charged" OR "arrested"',
  '"priest" OR "pastor" OR "rabbi" OR "religious" "sexual abuse" "accused" OR "charged"',
  '"school district" "sexual abuse" "lawsuit" OR "charged"',
  '"diocese" "sexual abuse" "accused" OR "lawsuit"',
  '"hospital" "sexual abuse" "accused" OR "charged"',
];

// NewsAPI /v2/everything has no country param — "United States" in the query is the best filter available.
// The proxy already sets language=en.
export const NEWSAPI_QUERIES = [
  'teacher sexual abuse accused lawsuit "United States"',
  'doctor sexual abuse accused charged "United States"',
  'priest OR pastor OR rabbi sexual abuse accused "United States"',
];

// SerpAPI proxy already sets gl=us (country) and hl=en (language), so no need to repeat in the query.
export const SERPAPI_QUERIES = [
  'teacher sexual abuse accused lawsuit',
  'doctor sexual abuse accused charged',
  'priest OR pastor sexual abuse accused',
];

// GDELT proxy already sets sourcecountry=US and sourcelang=English, so no need to repeat in the query.
export const GDELT_QUERIES = [
  'teacher sexual abuse accused lawsuit',
  'doctor sexual abuse accused',
  'priest OR pastor sexual abuse accused',
];

import { Category } from '@/types/incident';

export function inferCategory(title: string, description: string | null): Category {
  const text = `${title} ${description || ''}`.toLowerCase();
  if (/teacher|professor|coach|instructor|school|student|classroom/i.test(text)) return 'Teacher';
  if (/doctor|physician|surgeon|nurse|hospital|clinic|medical|patient/i.test(text)) return 'Doctor';
  if (/priest|pastor|rabbi|imam|minister|church|diocese|parish|religious|bishop|deacon|reverend|seminary|congregation/i.test(text)) return 'Religious';
  return 'Other';
}
