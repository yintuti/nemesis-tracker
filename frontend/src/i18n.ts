"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Language = "en" | "pt";

const STORAGE_KEY = "nemesis-tracker-language";
const LANGUAGE_CHANGE_EVENT = "nemesis-tracker-language-change";

export const translations = {
  en: {
    common: {
      switchLanguage: "Switch to Portuguese",
      winAbbreviation: "W",
      lossAbbreviation: "L",
      winRate: "WR",
      noData: "No data",
      back: "Back",
      unknown: "Unknown",
    },
    home: {
      eyebrow: "Identify Your",
      title: "Nemesis",
      subtitleLine1: "Discover your weak spots in League of Legends.",
      subtitleLine2: "Face your nemeses. Improve.",
      search: "Search",
      hint: "Enter your Riot ID in the Name#TAG format",
      placeholder: "PlayerName#BR1",
      errors: {
        missingSeparator: "Use the format: PlayerName#TAG",
        invalidRiotId: "Invalid name or TAG.",
      },
    },
    summoner: {
      loadingSteps: {
        locatingSummoner: "Locating summoner...",
        analyzingMatches: "Analyzing matches...",
        calculatingNemeses: "Calculating nemeses...",
        preparingDashboard: "Preparing dashboard...",
      },
      errors: {
        summonerNotFound: "Summoner not found.",
        loadFailed: "Unable to load data.",
      },
      matchesAnalyzed: "matches analyzed",
      overallWinRate: "overall WR",
      mortalEnemy: "Mortal Enemy",
      bestWinRate: "Best WR",
      clickRanking: "click to view ranking",
      worstRanking: "Ranking - Worst WR",
      bestRanking: "Ranking - Best WR",
      classWinRate: "WR by Class",
      playedChampions: "Played Champions",
      matchupsPlaying: "Matchups playing as",
    },
    championClasses: {
      Assassin: "Assassin",
      Fighter: "Fighter",
      Mage: "Mage",
      Marksman: "Marksman",
      Support: "Support",
      Tank: "Tank",
      Unknown: "Unknown",
    },
  },
  pt: {
    common: {
      switchLanguage: "Mudar para inglês",
      winAbbreviation: "V",
      lossAbbreviation: "D",
      winRate: "WR",
      noData: "Sem dados",
      back: "Voltar",
      unknown: "Desconhecido",
    },
    home: {
      eyebrow: "Identifique seu",
      title: "Nemesis",
      subtitleLine1: "Descubra seus pontos fracos no League of Legends.",
      subtitleLine2: "Enfrente seus nemeses. Evolua.",
      search: "Buscar",
      hint: "Digite seu Riot ID no formato Nome#TAG",
      placeholder: "NomeDoJogador#BR1",
      errors: {
        missingSeparator: "Use o formato: NomeDoJogador#TAG",
        invalidRiotId: "Nome ou TAG inválidos.",
      },
    },
    summoner: {
      loadingSteps: {
        locatingSummoner: "Localizando invocador...",
        analyzingMatches: "Analisando partidas...",
        calculatingNemeses: "Calculando nemeses...",
        preparingDashboard: "Preparando dashboard...",
      },
      errors: {
        summonerNotFound: "Invocador não encontrado.",
        loadFailed: "Erro ao carregar dados.",
      },
      matchesAnalyzed: "partidas analisadas",
      overallWinRate: "WR geral",
      mortalEnemy: "Inimigo Mortal",
      bestWinRate: "Melhor WR",
      clickRanking: "clique para ver ranking",
      worstRanking: "Ranking - Pior WR",
      bestRanking: "Ranking - Melhor WR",
      classWinRate: "WR por Classe",
      playedChampions: "Campeões Jogados",
      matchupsPlaying: "Matchups jogando de",
    },
    championClasses: {
      Assassin: "Assassino",
      Fighter: "Lutador",
      Mage: "Mago",
      Marksman: "Atirador",
      Support: "Suporte",
      Tank: "Tank",
      Unknown: "Desconhecido",
    },
  },
} as const;

export type HomeErrorKey = keyof typeof translations.en.home.errors;
export type SummonerErrorKey = keyof typeof translations.en.summoner.errors;
export type LoadingStepKey = keyof typeof translations.en.summoner.loadingSteps;

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "pt";
}

function getLanguageSnapshot(): Language {
  if (typeof window === "undefined") return "en";

  const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
  return isLanguage(savedLanguage) ? savedLanguage : "en";
}

function getServerLanguageSnapshot(): Language {
  return "en";
}

function subscribeToLanguageChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleChange);
  };
}

export function useLanguage() {
  const language = useSyncExternalStore<Language>(
    subscribeToLanguageChanges,
    getLanguageSnapshot,
    getServerLanguageSnapshot,
  );

  const applyLanguage = useCallback((nextLanguage: Language) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
      document.documentElement.lang = nextLanguage === "pt" ? "pt-BR" : "en";
      window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "pt" ? "pt-BR" : "en";
  }, [language]);

  const toggleLanguage = useCallback(() => {
    applyLanguage(language === "en" ? "pt" : "en");
  }, [applyLanguage, language]);

  return {
    language,
    setLanguage: applyLanguage,
    toggleLanguage,
    t: translations[language],
  };
}

export function formatRecord(wins: number, losses: number, language: Language) {
  const labels = translations[language].common;
  return `${wins}${labels.winAbbreviation} / ${losses}${labels.lossAbbreviation}`;
}

export function formatCompactRecord(wins: number, losses: number, language: Language) {
  const labels = translations[language].common;
  return `${wins}${labels.winAbbreviation}/${losses}${labels.lossAbbreviation}`;
}

export function getChampionClassLabel(championClass: string | null | undefined, language: Language) {
  if (!championClass) return translations[language].common.unknown;

  const labels = translations[language].championClasses as Record<string, string>;
  return labels[championClass] ?? championClass;
}
