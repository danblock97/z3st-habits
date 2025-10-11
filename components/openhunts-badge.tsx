'use client';

import { useEffect, useState } from 'react';

export function OpenHuntsBadge() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <a
      href="https://openhunts.com/projects/z3st-habits-3826"
      target="_blank"
      rel="noopener noreferrer"
      title="OpenHunts Top 3 Daily Winner"
      className="inline-block transition-transform hover:scale-105"
    >
      <img
        src={isDark
          ? "https://openhunts.com/images/badges/top3-dark.png"
          : "https://openhunts.com/images/badges/top3-light.png"
        }
        alt="OpenHunts Top 3 Daily Winner"
        width={195}
        height="auto"
        className="h-auto w-[195px]"
      />
    </a>
  );
}
