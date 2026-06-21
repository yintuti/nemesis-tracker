'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LanguageToggle } from '@/components/LanguageToggle';
import {
  formatCompactRecord,
  formatRecord,
  getChampionClassLabel,
  type LoadingStepKey,
  type SummonerErrorKey,
  useLanguage,
} from '@/i18n';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const LOADING_STEPS: LoadingStepKey[] = [
  'locatingSummoner',
  'analyzingMatches',
  'calculatingNemeses',
  'preparingDashboard',
];

function getChampionIcon(championName: string) {
  const normalized = championName.replace(/\s/g, '');
  return `https://ddragon.leagueoflegends.com/cdn/14.9.1/img/champion/${normalized}.png`;
}

type Summoner = {
  game_name: string;
  tag_line: string;
  puuid: string;
};

type PipelineStats = {
  total_matches: number;
  winrate: number;
};

type PipelineData = {
  summoner: Summoner;
  stats: PipelineStats;
};

type MatchupStats = {
  opponent_champion: string;
  wins: number;
  losses: number;
  winrate: number;
  class: string;
};

type ClassStats = {
  class: string;
  wins: number;
  losses: number;
  winrate: number;
};

type NemesisData = {
  nemesis: {
    champion: string;
    wins: number;
    losses: number;
    winrate: number;
    class: string;
  } | null;
  class_stats: ClassStats[];
  champion_stats: MatchupStats[];
};

type ChampionStats = {
  champion: string;
  wins: number;
  losses: number;
  winrate: number;
};

export default function SummonerPage() {
  const params = useParams();
  const gameName = decodeURIComponent(params.game_name as string);
  const tagLine = decodeURIComponent(params.tag_line as string);

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorKey, setErrorKey] = useState<SummonerErrorKey | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [nemesis, setNemesis] = useState<NemesisData | null>(null);
  const [champions, setChampions] = useState<ChampionStats[]>([]);
  const [selectedChampion, setSelectedChampion] = useState<ChampionStats | null>(null);
  const [listMode, setListMode] = useState<'worst' | 'best' | null>(null);
  const { language, t, toggleLanguage } = useLanguage();
  const dashboard = t.summoner;

  useEffect(() => {
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < LOADING_STEPS.length) setLoadingStep(step);
    }, 800);

    let prog = 0;
    const progInterval = setInterval(() => {
      prog += 1;
      if (prog <= 90) setProgress(prog);
    }, 30);

    async function fetchAll() {
      try {
        const pipelineRes = await fetch(`${API}/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
        if (!pipelineRes.ok) throw new Error('summonerNotFound');
        const pipelineData = await pipelineRes.json();
        setPipeline(pipelineData);

        const puuid = pipelineData.summoner.puuid;

        const [nemesisRes, championsRes] = await Promise.all([
          fetch(`${API}/nemesis/${puuid}`),
          fetch(`${API}/player/champions/${puuid}`),
        ]);

        const nemesisData = await nemesisRes.json();
        const championsData = await championsRes.json();

        setNemesis(nemesisData);
        setChampions(championsData);
        setProgress(100);

        setTimeout(() => setLoading(false), 400);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        setErrorKey(message === 'summonerNotFound' ? 'summonerNotFound' : 'loadFailed');
        setLoading(false);
      }
    }

    fetchAll();
    return () => {
      clearInterval(stepInterval);
      clearInterval(progInterval);
    };
  }, [gameName, tagLine]);

  if (loading || errorKey) {
    return (
      <div className="loading-root">
        <LanguageToggle
          language={language}
          label={t.common.switchLanguage}
          onToggle={toggleLanguage}
        />

        <div className="bg-overlay" />
        <div className="bg-grid" />
        {errorKey ? (
          <div className="loading-content">
            <p className="error-text">{dashboard.errors[errorKey]}</p>
            <Link href="/" className="back-link"><span aria-hidden="true">&larr;</span> {t.common.back}</Link>
          </div>
        ) : (
          <div className="loading-content">
            <p className="loading-name">{gameName}<span className="loading-tag">#{tagLine}</span></p>
            <div className="loading-title-wrap">
              <h1 className="loading-title">NEMESIS</h1>
              <div className="loading-pulse" />
            </div>
            <p className="loading-step">{dashboard.loadingSteps[LOADING_STEPS[loadingStep]]}</p>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        <Style />
      </div>
    );
  }

  const summoner = pipeline?.summoner;
  const stats = pipeline?.stats;
  const totalMatches = stats?.total_matches ?? 0;
  const overallWinrate = stats?.winrate ?? 0;
  const topNemesis = nemesis?.nemesis;
  const classStats = nemesis?.class_stats || [];
  const bestChamp = nemesis?.champion_stats?.find(
    (champion) => champion.winrate === Math.max(...(nemesis?.champion_stats.map((item) => item.winrate) || [0])),
  );

  const sortedWorst = [...(nemesis?.champion_stats || [])].sort((a, b) => a.winrate - b.winrate);
  const sortedBest = [...(nemesis?.champion_stats || [])].sort((a, b) => b.winrate - a.winrate);

  return (
    <div className="dash-root">
      <LanguageToggle
        language={language}
        label={t.common.switchLanguage}
        onToggle={toggleLanguage}
      />

      <div className="bg-overlay" />
      <div className="bg-grid" />

      <div className="dash-content">
        <header className="dash-header">
          <Link href="/" className="back-link"><span aria-hidden="true">&larr;</span> {t.common.back}</Link>
          <div className="summoner-info">
            <h2 className="summoner-name">{summoner?.game_name}<span className="summoner-tag">#{summoner?.tag_line}</span></h2>
            <p className="summoner-meta">
              {totalMatches} {dashboard.matchesAnalyzed} &middot; {dashboard.overallWinRate}: <span className={overallWinrate >= 50 ? 'wr-positive' : 'wr-negative'}>{overallWinrate}%</span>
            </p>
          </div>
        </header>

        <section className="spotlight-section">
          <div className="spotlight-card nemesis-card" onClick={() => setListMode(listMode === 'worst' ? null : 'worst')}>
            <span className="card-eyebrow">{dashboard.mortalEnemy}</span>
            {topNemesis ? (
              <>
                <Image className="champ-icon" src={getChampionIcon(topNemesis.champion)} alt={topNemesis.champion} width={80} height={80} unoptimized onError={(e) => (e.currentTarget.src = '/fallback.png')} />
                <p className="champ-name">{topNemesis.champion}</p>
                <p className="champ-class">{getChampionClassLabel(topNemesis.class, language)}</p>
                <p className="champ-wr wr-negative">{topNemesis.winrate}% {t.common.winRate}</p>
                <p className="champ-record">{formatRecord(topNemesis.wins, topNemesis.losses, language)}</p>
              </>
            ) : <p className="no-data">{t.common.noData}</p>}
            <span className="card-hint">{dashboard.clickRanking}</span>
          </div>

          <div className="spotlight-card best-card" onClick={() => setListMode(listMode === 'best' ? null : 'best')}>
            <span className="card-eyebrow">{dashboard.bestWinRate}</span>
            {bestChamp ? (
              <>
                <Image className="champ-icon" src={getChampionIcon(bestChamp.opponent_champion)} alt={bestChamp.opponent_champion} width={80} height={80} unoptimized onError={(e) => (e.currentTarget.src = '/fallback.png')} />
                <p className="champ-name">{bestChamp.opponent_champion}</p>
                <p className="champ-class">{getChampionClassLabel(bestChamp.class, language)}</p>
                <p className="champ-wr wr-positive">{bestChamp.winrate}% {t.common.winRate}</p>
                <p className="champ-record">{formatRecord(bestChamp.wins, bestChamp.losses, language)}</p>
              </>
            ) : <p className="no-data">{t.common.noData}</p>}
            <span className="card-hint">{dashboard.clickRanking}</span>
          </div>
        </section>

        {listMode && (
          <section className="list-section">
            <h3 className="section-title">{listMode === 'worst' ? dashboard.worstRanking : dashboard.bestRanking}</h3>
            <div className="champ-list">
              {(listMode === 'worst' ? sortedWorst : sortedBest).map((c) => (
                <div key={c.opponent_champion} className="list-row">
                  <Image className="list-icon" src={getChampionIcon(c.opponent_champion)} alt={c.opponent_champion} width={36} height={36} unoptimized onError={(e) => (e.currentTarget.src = '/fallback.png')} />
                  <span className="list-name">{c.opponent_champion}</span>
                  <span className="list-class">{getChampionClassLabel(c.class, language)}</span>
                  <span className="list-record">{formatCompactRecord(c.wins, c.losses, language)}</span>
                  <span className={`list-wr ${c.winrate >= 50 ? 'wr-positive' : 'wr-negative'}`}>{c.winrate}%</span>
                  <div className="list-bar-track">
                    <div className="list-bar" style={{ width: `${c.winrate}%`, background: c.winrate >= 50 ? '#4A9B6F' : '#C84B4B' }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="class-section">
          <h3 className="section-title">{dashboard.classWinRate}</h3>
          <div className="class-grid">
            {classStats.map((c) => (
              <div key={c.class} className="class-card">
                <span className="class-name">{getChampionClassLabel(c.class, language)}</span>
                <span className={`class-wr ${c.winrate >= 50 ? 'wr-positive' : 'wr-negative'}`}>{c.winrate}%</span>
                <div className="class-bar-track">
                  <div className="class-bar" style={{ width: `${c.winrate}%`, background: c.winrate >= 50 ? '#4A9B6F' : '#C84B4B' }} />
                </div>
                <span className="class-record">{formatRecord(c.wins, c.losses, language)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="played-section">
          <h3 className="section-title">{dashboard.playedChampions}</h3>
          <div className="played-grid">
            {champions.map((c) => (
              <div key={c.champion} className={`played-card ${selectedChampion?.champion === c.champion ? 'active' : ''}`} onClick={() => setSelectedChampion(selectedChampion?.champion === c.champion ? null : c)}>
                <Image className="played-icon" src={getChampionIcon(c.champion)} alt={c.champion} width={56} height={56} unoptimized onError={(e) => (e.currentTarget.src = '/fallback.png')} />
                <p className="played-name">{c.champion}</p>
                <p className={`played-wr ${c.winrate >= 50 ? 'wr-positive' : 'wr-negative'}`}>{c.winrate}%</p>
                <p className="played-record">{formatCompactRecord(c.wins, c.losses, language)}</p>
              </div>
            ))}
          </div>
        </section>

        {selectedChampion && (
          <section className="matchup-section">
            <h3 className="section-title">{dashboard.matchupsPlaying} {selectedChampion.champion}</h3>
            <div className="champ-list">
              {(nemesis?.champion_stats || [])
                .filter((c) => c.wins + c.losses > 0)
                .sort((a, b) => a.winrate - b.winrate)
                .map((c) => (
                  <div key={c.opponent_champion} className="list-row">
                    <Image className="list-icon" src={getChampionIcon(c.opponent_champion)} alt={c.opponent_champion} width={36} height={36} unoptimized onError={(e) => (e.currentTarget.src = '/fallback.png')} />
                    <span className="list-name">{c.opponent_champion}</span>
                    <span className="list-class">{getChampionClassLabel(c.class, language)}</span>
                    <span className="list-record">{formatCompactRecord(c.wins, c.losses, language)}</span>
                    <span className={`list-wr ${c.winrate >= 50 ? 'wr-positive' : 'wr-negative'}`}>{c.winrate}%</span>
                    <div className="list-bar-track">
                      <div className="list-bar" style={{ width: `${c.winrate}%`, background: c.winrate >= 50 ? '#4A9B6F' : '#C84B4B' }} />
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </div>

      <Style />
    </div>
  );
}

function Style() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Raleway:wght@300;400;600;700&display=swap');

      * { box-sizing: border-box; margin: 0; padding: 0; }

      .loading-root, .dash-root {
        min-height: 100vh;
        background: #030A0F;
        position: relative;
        overflow-x: hidden;
        font-family: 'Raleway', sans-serif;
        color: #F0E6D3;
      }

      .bg-overlay {
        position: fixed;
        inset: 0;
        background:
          radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,155,60,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 80%, rgba(180,30,30,0.06) 0%, transparent 50%);
        pointer-events: none;
        z-index: 0;
      }

      .bg-grid {
        position: fixed;
        inset: 0;
        background-image:
          linear-gradient(rgba(200,155,60,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,155,60,0.03) 1px, transparent 1px);
        background-size: 60px 60px;
        pointer-events: none;
        z-index: 0;
      }

      .loading-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 1.5rem;
        padding: 2rem;
      }

      .loading-name {
        font-size: 0.85rem;
        letter-spacing: 0.2em;
        color: #5B5A56;
        text-transform: uppercase;
      }

      .loading-tag { color: #3A3935; }

      .loading-title-wrap {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .loading-title {
        font-family: 'Cinzel', serif;
        font-size: clamp(4rem, 12vw, 8rem);
        font-weight: 900;
        color: #C89B3C;
        text-shadow: 0 0 60px rgba(200,155,60,0.5);
        animation: pulse 2s ease-in-out infinite;
      }

      .loading-pulse {
        position: absolute;
        inset: -20px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(200,155,60,0.15) 0%, transparent 70%);
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(0.97); }
      }

      .loading-step {
        font-size: 0.8rem;
        letter-spacing: 0.15em;
        color: #5B5A56;
        text-transform: uppercase;
      }

      .progress-track {
        width: 280px;
        height: 2px;
        background: rgba(200,155,60,0.1);
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        background: #C89B3C;
        transition: width 0.1s linear;
        box-shadow: 0 0 8px rgba(200,155,60,0.6);
      }

      .error-text { color: #C84B4B; font-size: 1rem; }

      .back-link {
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        color: #5B5A56;
        text-decoration: none;
        text-transform: uppercase;
        transition: color 0.2s;
      }
      .back-link:hover { color: #C89B3C; }

      .dash-content {
        position: relative;
        z-index: 1;
        max-width: 1100px;
        margin: 0 auto;
        padding: 2rem 1.5rem 4rem;
        display: flex;
        flex-direction: column;
        gap: 3rem;
      }

      .dash-header {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .summoner-name {
        font-family: 'Cinzel', serif;
        font-size: 1.75rem;
        font-weight: 700;
        color: #F0E6D3;
      }

      .summoner-tag { color: #5B5A56; font-size: 1rem; }

      .summoner-meta {
        font-size: 0.8rem;
        color: #5B5A56;
        letter-spacing: 0.05em;
      }

      .wr-positive { color: #4A9B6F; }
      .wr-negative { color: #C84B4B; }

      .spotlight-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }

      .spotlight-card {
        background: rgba(10,20,30,0.8);
        border: 1px solid rgba(200,155,60,0.15);
        border-radius: 2px;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: border-color 0.2s, box-shadow 0.2s;
        position: relative;
      }

      .spotlight-card:hover {
        border-color: rgba(200,155,60,0.4);
        box-shadow: 0 0 30px rgba(200,155,60,0.05);
      }

      .card-eyebrow {
        font-size: 0.7rem;
        letter-spacing: 0.15em;
        color: #5B5A56;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
      }

      .card-hint {
        position: absolute;
        bottom: 0.75rem;
        font-size: 0.65rem;
        color: #3A3935;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .champ-icon, .list-icon, .played-icon {
        border-radius: 50%;
        border: 2px solid rgba(200,155,60,0.3);
        object-fit: cover;
      }

      .champ-icon { width: 80px; height: 80px; }
      .list-icon { width: 36px; height: 36px; flex-shrink: 0; }
      .played-icon { width: 56px; height: 56px; }

      .champ-name { font-family: 'Cinzel', serif; font-size: 1.1rem; font-weight: 700; }
      .champ-class { font-size: 0.7rem; color: #5B5A56; letter-spacing: 0.1em; text-transform: uppercase; }
      .champ-wr { font-size: 1.5rem; font-weight: 700; }
      .champ-record { font-size: 0.75rem; color: #5B5A56; }

      .section-title {
        font-family: 'Cinzel', serif;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.2em;
        color: #C89B3C;
        text-transform: uppercase;
        margin-bottom: 1rem;
      }

      .champ-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .list-row {
        display: grid;
        grid-template-columns: 36px 1fr 80px 70px 60px 1fr;
        align-items: center;
        gap: 1rem;
        padding: 0.6rem 1rem;
        background: rgba(10,20,30,0.6);
        border: 1px solid rgba(200,155,60,0.08);
        border-radius: 2px;
        transition: border-color 0.2s;
      }

      .list-row:hover { border-color: rgba(200,155,60,0.2); }

      .list-name { font-size: 0.85rem; font-weight: 600; }
      .list-class { font-size: 0.7rem; color: #5B5A56; }
      .list-record { font-size: 0.75rem; color: #5B5A56; text-align: center; }
      .list-wr { font-size: 0.85rem; font-weight: 700; text-align: right; }

      .list-bar-track {
        height: 3px;
        background: rgba(255,255,255,0.05);
        border-radius: 2px;
        overflow: hidden;
      }

      .list-bar { height: 100%; border-radius: 2px; transition: width 0.5s ease; }

      .class-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }

      .class-card {
        background: rgba(10,20,30,0.8);
        border: 1px solid rgba(200,155,60,0.1);
        border-radius: 2px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .class-name { font-size: 0.75rem; letter-spacing: 0.1em; color: #5B5A56; text-transform: uppercase; }
      .class-wr { font-size: 1.5rem; font-weight: 700; }
      .class-bar-track { height: 3px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
      .class-bar { height: 100%; border-radius: 2px; }
      .class-record { font-size: 0.7rem; color: #3A3935; }

      .played-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 1rem;
      }

      .played-card {
        background: rgba(10,20,30,0.8);
        border: 1px solid rgba(200,155,60,0.1);
        border-radius: 2px;
        padding: 1rem 0.75rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
        cursor: pointer;
        transition: border-color 0.2s;
      }

      .played-card:hover, .played-card.active {
        border-color: rgba(200,155,60,0.5);
        box-shadow: 0 0 20px rgba(200,155,60,0.05);
      }

      .played-name { font-size: 0.7rem; font-weight: 600; text-align: center; color: #F0E6D3; }
      .played-wr { font-size: 0.9rem; font-weight: 700; }
      .played-record { font-size: 0.65rem; color: #5B5A56; }

      .no-data { color: #3A3935; font-size: 0.8rem; }

      @media (max-width: 600px) {
        .spotlight-section { grid-template-columns: 1fr; }
        .list-row { grid-template-columns: 36px 1fr 60px 50px; }
        .list-class, .list-bar-track { display: none; }
      }
    `}</style>
  );
}
