import { useEffect, useState } from 'react';

function parseHash(): string[] {
  return window.location.hash.replace(/^#\/?/, '').split('/');
}

export function useHashRoute(): { page: string; param: string | null } {
  const [segments, setSegments] = useState<string[]>(parseHash);

  useEffect(() => {
    const onHashChange = () => {
      setSegments(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return {
    page: segments[0] ?? '',
    param: segments[1] ?? null,
  };
}

export function navigate(path: string): void {
  window.location.hash = `/${path}`;
}
