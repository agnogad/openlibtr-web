import { useEffect } from 'react';

interface GiscusProps {
  slug: string;
  chapterId: number;
}

export default function Giscus({ slug, chapterId }: GiscusProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'agnogad/openlibtr');
    script.setAttribute('data-repo-id', 'R_kgDOSAxLnQ');
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOSAxLnc4C6sr5');
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', `${slug}-ch${chapterId}`);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'dark_dimmed');
    script.setAttribute('data-lang', 'tr');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    const container = document.getElementById('giscus-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      // Cleanup if needed
      if (container) container.innerHTML = '';
    };
  }, [slug, chapterId]);

  return <div id="giscus-container" className="mt-12 w-full" />;
}
