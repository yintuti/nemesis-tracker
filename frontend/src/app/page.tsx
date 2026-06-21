'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LanguageToggle } from '@/components/LanguageToggle';
import { type HomeErrorKey, useLanguage } from '@/i18n';

export default function Home() {
  const [input, setInput] = useState('');
  const [errorKey, setErrorKey] = useState<HomeErrorKey | null>(null);
  const router = useRouter();
  const { language, t, toggleLanguage } = useLanguage();
  const home = t.home;

  function handleSearch() {
    const trimmed = input.trim();
    if (!trimmed.includes('#')) {
      setErrorKey('missingSeparator');
      return;
    }
    const [gameName, tagLine] = trimmed.split('#');
    if (!gameName || !tagLine) {
      setErrorKey('invalidRiotId');
      return;
    }
    setErrorKey(null);
    router.push(`/summoner/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <main className="home-root">
      <LanguageToggle
        language={language}
        label={t.common.switchLanguage}
        onToggle={toggleLanguage}
      />

      <div className="bg-overlay" />
      <div className="bg-grid" />

      <div className="content">
        <div className="logo-area">
          <span className="logo-eyebrow">{home.eyebrow}</span>
          <h1 className="logo-title">
            <span className="logo-accent">{home.title}</span>
          </h1>
          <p className="logo-sub">
            {home.subtitleLine1}<br />
            {home.subtitleLine2}
          </p>
        </div>

        <div className="search-wrapper">
          <div className="search-box">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder={home.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="search-btn" onClick={handleSearch}>
              {home.search}
            </button>
          </div>
          {errorKey && <p className="search-error">{home.errors[errorKey]}</p>}
          <p className="search-hint">{home.hint}</p>
        </div>

      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Beaufort+for+LOL:wght@700&family=Spiegel:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Raleway:wght@300;400;600&display=swap');

        .home-root {
          min-height: 100vh;
          background: #030A0F;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Raleway', sans-serif;
        }

        .bg-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200, 155, 60, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(180, 30, 30, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 50% 50% at 20% 60%, rgba(20, 80, 120, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(200, 155, 60, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200, 155, 60, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3rem;
          padding: 2rem;
          width: 100%;
          max-width: 700px;
        }

        .logo-area {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-eyebrow {
          font-family: 'Raleway', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.4em;
          color: #C89B3C;
          text-transform: uppercase;
        }

        .logo-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(3rem, 8vw, 5.5rem);
          font-weight: 900;
          line-height: 0.9;
          color: #F0E6D3;
          text-shadow:
            0 0 80px rgba(200, 155, 60, 0.3),
            0 2px 4px rgba(0,0,0,0.8);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .logo-accent {
          color: #C89B3C;
          text-shadow:
            0 0 40px rgba(200, 155, 60, 0.6),
            0 0 80px rgba(200, 155, 60, 0.3);
        }

        .logo-sub {
          font-size: 0.95rem;
          color: #5B5A56;
          line-height: 1.6;
          font-weight: 300;
          letter-spacing: 0.02em;
          margin-top: 0.5rem;
        }

        .search-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .search-box {
          width: 100%;
          display: flex;
          align-items: center;
          background: rgba(10, 20, 30, 0.9);
          border: 1px solid rgba(200, 155, 60, 0.3);
          border-radius: 2px;
          padding: 0 0 0 1.25rem;
          transition: border-color 0.2s;
          box-shadow:
            0 0 0 1px rgba(200, 155, 60, 0.05),
            inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .search-box:focus-within {
          border-color: rgba(200, 155, 60, 0.7);
          box-shadow:
            0 0 20px rgba(200, 155, 60, 0.1),
            inset 0 1px 0 rgba(255,255,255,0.03);
        }

        .search-icon {
          width: 18px;
          height: 18px;
          color: #5B5A56;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 1.1rem 1rem;
          font-family: 'Raleway', sans-serif;
          font-size: 1rem;
          font-weight: 400;
          color: #F0E6D3;
          letter-spacing: 0.02em;
        }

        .search-input::placeholder {
          color: #3A3935;
        }

        .search-btn {
          background: #C89B3C;
          border: none;
          align-self: stretch;
          padding: 0 1.75rem;
          font-family: 'Raleway', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #030A0F;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }

        .search-btn:hover {
          background: #D4A843;
        }

        .search-btn:active {
          background: #B8882F;
        }

        .search-error {
          font-size: 0.8rem;
          color: #C84B4B;
          letter-spacing: 0.02em;
        }

        .search-hint {
          font-size: 0.75rem;
          color: #3A3935;
          letter-spacing: 0.05em;
        }

      `}</style>
    </main>
  );
}
