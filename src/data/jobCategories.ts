export const JOB_CATEGORIES = [
  'Community',
  'Engineering',
  'Marketing',
  'Design',
  'Events',
  'Partnerships',
  'Operations',
] as const;

export function presetCategoryIndex(name: string) {
  return (JOB_CATEGORIES as readonly string[]).indexOf(name);
}
