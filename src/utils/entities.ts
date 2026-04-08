export function extractEntities(title: string, description: string | null): {
  perpetratorName: string | null;
  institutionName: string | null;
  perpetratorRole: string | null;
} {
  const text = `${title} ${description || ''}`;

  const perpetratorName = extractPerpetratorName(text);
  const institutionName = extractInstitutionName(text);
  const perpetratorRole = extractRole(text);

  return { perpetratorName, institutionName, perpetratorRole };
}

function extractPerpetratorName(text: string): string | null {
  const patterns = [
    /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+)\s*,?\s*(?:a\s+)?(?:former\s+)?(?:teacher|professor|instructor|coach|doctor|physician|surgeon|nurse|priest|pastor|rabbi|imam|minister|deacon|bishop|monsignor|reverend|father)/i,
    /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+)\s+(?:accused|charged|arrested|convicted|indicted|sued|faces|facing|identified)/i,
    /(?:accused|charged|arrested|convicted|indicted|identified)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim();
      if (name.split(/\s+/).length >= 2 && name.length <= 50) {
        return name;
      }
    }
  }
  return null;
}

function extractInstitutionName(text: string): string | null {
  const patterns = [
    /(?:at|from|of)\s+((?:[A-Z][a-zA-Z'.-]*\s+)*(?:School|Academy|University|College|High|Elementary|Middle|District|Hospital|Medical Center|Clinic|Health|Church|Cathedral|Diocese|Parish|Synagogue|Mosque|Temple|Seminary)(?:\s+(?:of|in)\s+[A-Z][a-zA-Z\s]+)?)/i,
    /((?:[A-Z][a-zA-Z'.-]*\s+)+(?:School District|Unified School District|Independent School District|Public Schools|Catholic Diocese|Archdiocese|Medical Center|Health System))/i,
    /((?:[A-Z][a-zA-Z'.-]*\s+)+(?:Church|Cathedral|Diocese|Parish|Synagogue|Mosque|Temple))/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const inst = match[1].trim();
      if (inst.length >= 5 && inst.length <= 100) {
        return inst;
      }
    }
  }
  return null;
}

function extractRole(text: string): string | null {
  const rolePatterns = [
    /(?:former\s+)?((?:\w+\s+)?(?:grade\s+)?teacher)/i,
    /(?:former\s+)?((?:\w+\s+)?professor)/i,
    /(?:former\s+)?((?:\w+\s+)?(?:coach|instructor))/i,
    /(?:former\s+)?((?:\w+\s+)?(?:doctor|physician|surgeon|pediatrician|gynecologist|psychiatrist|therapist))/i,
    /(?:former\s+)?((?:\w+\s+)?(?:nurse|nurse practitioner))/i,
    /(?:former\s+)?((?:\w+\s+)?(?:priest|pastor|rabbi|imam|minister|deacon|bishop|monsignor|reverend|chaplain))/i,
  ];

  for (const pattern of rolePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return null;
}
