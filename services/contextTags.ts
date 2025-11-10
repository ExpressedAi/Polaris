export const deriveScopeFromTags = (tags: string[] = []): 'personal' | 'professional' => {
  const personal = ['feelings', 'reflection', 'relationship'];
  const professional = ['client', 'calendar', 'agenda', 'task'];
  if (tags.some(tag => professional.includes(tag))) return 'professional';
  if (tags.some(tag => personal.includes(tag))) return 'personal';
  return 'personal';
};
