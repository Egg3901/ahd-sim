// Portrait URLs keyed by full candidate / running-mate name. Anyone without an
// entry falls back to an initials avatar (see ui/Avatar). Local files live in
// public/images (Wikimedia Commons, public-domain / official).
export const PORTRAITS: Record<string, string> = {
  "Joe Biden": "/images/biden.jpg",
  "Donald Trump": "/images/trump.jpg",
  "Kamala Harris": "/images/harris.jpg",
  "Mike Pence": "/images/pence.jpg",
};

export function portraitFor(name: string): string | undefined {
  return PORTRAITS[name];
}
