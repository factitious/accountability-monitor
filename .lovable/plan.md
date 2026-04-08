

## Accountability Monitor — Updated Plan

### All previous sections remain unchanged, plus:

### NEW: Perpetrator & Institution Extraction

Add a lightweight entity extraction step that runs on each article's title + description after fetching, before deduplication.

**How it works:**

1. **Keyword/pattern matching** on title + description text to extract:
   - **Perpetrator name**: Look for common patterns like "[Name], a [teacher/doctor/priest]", "[Name] accused of", "[Name] charged with", "[Name] faces lawsuit". Extract the proper noun(s) immediately preceding or following these trigger phrases.
   - **Institution name**: Look for patterns like "at [Institution]", "[Institution] [teacher/doctor/priest]", "of [Institution]", "[School/Hospital/Church/Diocese] of [Name]". Also match known institution keywords: school, district, university, hospital, clinic, church, diocese, parish, synagogue, mosque.

2. **Structured fields added to each incident card:**
   - `perpetratorName: string | null` — extracted name or null if not found
   - `institutionName: string | null` — extracted institution or null
   - `perpetratorRole: string | null` — e.g. "teacher", "doctor", "priest" (more specific than category)

3. **UI changes to incident cards:**
   - Show **Accused: [Name]** line below headline (bold, slightly muted) when available
   - Show **Institution: [Name]** line below accused when available
   - Show role detail (e.g. "4th grade teacher" vs just "Teacher") when extractable
   - If neither is found, show nothing extra — no "Unknown" labels

4. **Enhanced search queries** — append additional keyword variants to surface more detail:
   - Add `"identified as"`, `"arrested"`, `"charged"` to existing queries
   - Add institution-type keywords: `"school district"`, `"diocese"`, `"hospital"` as secondary queries

5. **Filter additions:**
   - Add a text search box above the feed to filter by perpetrator name or institution name
   - Results update as user types (debounced)

**Technical approach:** Pure regex/string matching — no AI or NLP library needed. A `extractEntities(title: string, description: string)` utility function returns `{ perpetratorName, institutionName, perpetratorRole }`. This keeps it lightweight and dependency-free, though extraction won't be perfect for every article.

### Summary of all plan sections:
1. Settings Panel & API Key Management
2. Header with status badges
3. Data Fetching Layer (NewsAPI, GDELT via proxy, SerpAPI)
4. Supabase Edge Function — GDELT Proxy
5. Deduplication & Categorization
6. **Perpetrator & Institution Extraction** ← NEW
7. Filters Bar (category, source, date range, **text search** ← NEW)
8. Incident Card Feed (with **accused/institution lines** ← NEW)
9. Error Handling

