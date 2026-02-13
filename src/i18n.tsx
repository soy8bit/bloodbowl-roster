import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Lang = 'en' | 'es';

const strings = {
  en: {
    // Header
    appTitle: 'Blood Bowl Roster',
    newTeam: 'New Team',
    savedRosters: 'Saved Rosters',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',

    // Team selector
    chooseTeam: 'Choose Your Team',
    searchTeams: 'Search teams...',
    showRetired: 'Show retired teams',
    tier1: 'Tier 1',
    tier2: 'Tier 2',
    tier3: 'Tier 3',
    noSpecialRules: 'No special rules',
    rerollCost: 'Reroll:',
    positions: 'positions',
    noTeamsMatch: 'No teams match your search',

    // Roster builder
    back: 'Back',
    teamNamePlaceholder: 'Team Name',
    hideAvailable: 'Hide Available Players',
    showAvailable: 'Show Available Players',
    roster: 'Roster',
    name: 'Name',
    position: 'Position',
    skills: 'Skills',
    cost: 'Cost',
    qty: 'Qty',
    addPlayersHint: 'Add players from the list above',
    availablePlayers: 'Available Players',
    none: 'None',
    addPlayer: 'Add player',
    removePlayer: 'Remove player',

    // Summary
    teamValue: 'Team Value',
    rerolls: 'Rerolls',
    each: 'each',
    assistantCoaches: 'Assistant Coaches',
    cheerleaders: 'Cheerleaders',
    dedicatedFans: 'Dedicated Fans',
    apothecary: 'Apothecary',
    treasury: 'Treasury',
    players: 'Players',
    min11: '(min 11)',
    exportPdf: 'Export PDF',
    import_: 'Import',
    importFailed: 'Import failed',

    // Saved rosters
    importJson: 'Import JSON',
    noSavedRosters: 'No saved rosters yet.',
    createToStart: 'Create a new team to get started!',
    unnamed: 'Unnamed',
    playersCount: 'players',
    delete_: 'Delete',
    deleteConfirm: (name: string) => `Delete roster "${name}"? This cannot be undone.`,

    // Skill modal
    catAgility: 'Agility',
    catGeneral: 'General',
    catMutation: 'Mutation',
    catPassing: 'Passing',
    catStrength: 'Strength',
    catTrait: 'Trait',
    catExtraordinary: 'Extraordinary',

    // Validation
    maxPlayersReached: 'Maximum 16 players reached',
    playerNotAvailable: 'Player not available for this team',
    maxPosition: (n: number) => `Maximum ${n} of this position`,
    tooManyPlayers: (have: number, max: number) => `Too many players: ${have}/${max}`,
    needMinPlayers: (min: number, have: number) => `Need at least ${min} players (have ${have})`,
    tooManyRerolls: (have: number, max: number) => `Too many rerolls: ${have}/${max}`,
    tooManyPosition: (id: number, have: number, max: number) => `Too many of position ID ${id}: ${have}/${max}`,

    // PDF
    pdfTitle: 'Blood Bowl Roster',
    unnamedTeam: 'Unnamed Team',
    pdfTeamValue: 'Team Value:',
    noPlayers: 'No players',
    pdfRerolls: 'Rerolls',
    pdfCoaches: 'Assistant Coaches',
    pdfCheerleaders: 'Cheerleaders',
    pdfFans: 'Dedicated Fans',
    pdfApothecary: 'Apothecary',
    pdfTreasury: 'Treasury',
    yes: 'Yes',
    no: 'No',
    pdfPlayers: 'Players:',
    pdfFooter: 'Blood Bowl Roster Creator',
  },
  es: {
    // Header
    appTitle: 'Blood Bowl Roster',
    newTeam: 'Nuevo Equipo',
    savedRosters: 'Plantillas Guardadas',
    switchToLight: 'Cambiar a modo claro',
    switchToDark: 'Cambiar a modo oscuro',

    // Team selector
    chooseTeam: 'Elige tu Equipo',
    searchTeams: 'Buscar equipos...',
    showRetired: 'Mostrar equipos retirados',
    tier1: 'Tier 1',
    tier2: 'Tier 2',
    tier3: 'Tier 3',
    noSpecialRules: 'Sin reglas especiales',
    rerollCost: 'Repeticion:',
    positions: 'posiciones',
    noTeamsMatch: 'Ningun equipo coincide con la busqueda',

    // Roster builder
    back: 'Volver',
    teamNamePlaceholder: 'Nombre del Equipo',
    hideAvailable: 'Ocultar Jugadores Disponibles',
    showAvailable: 'Mostrar Jugadores Disponibles',
    roster: 'Plantilla',
    name: 'Nombre',
    position: 'Posicion',
    skills: 'Habilidades',
    cost: 'Coste',
    qty: 'Cant.',
    addPlayersHint: 'Añade jugadores de la lista de arriba',
    availablePlayers: 'Jugadores Disponibles',
    none: 'Ninguna',
    addPlayer: 'Añadir jugador',
    removePlayer: 'Quitar jugador',

    // Summary
    teamValue: 'Valor del Equipo',
    rerolls: 'Repeticiones',
    each: 'c/u',
    assistantCoaches: 'Entrenadores Asistentes',
    cheerleaders: 'Animadoras',
    dedicatedFans: 'Hinchas',
    apothecary: 'Boticario',
    treasury: 'Tesoro',
    players: 'Jugadores',
    min11: '(min 11)',
    exportPdf: 'Exportar PDF',
    import_: 'Importar',
    importFailed: 'Error al importar',

    // Saved rosters
    importJson: 'Importar JSON',
    noSavedRosters: 'No hay plantillas guardadas.',
    createToStart: 'Crea un equipo nuevo para empezar.',
    unnamed: 'Sin nombre',
    playersCount: 'jugadores',
    delete_: 'Eliminar',
    deleteConfirm: (name: string) => `¿Eliminar plantilla "${name}"? No se puede deshacer.`,

    // Skill modal
    catAgility: 'Agilidad',
    catGeneral: 'General',
    catMutation: 'Mutacion',
    catPassing: 'Pase',
    catStrength: 'Fuerza',
    catTrait: 'Rasgo',
    catExtraordinary: 'Extraordinaria',

    // Validation
    maxPlayersReached: 'Maximo 16 jugadores alcanzado',
    playerNotAvailable: 'Jugador no disponible para este equipo',
    maxPosition: (n: number) => `Maximo ${n} en esta posicion`,
    tooManyPlayers: (have: number, max: number) => `Demasiados jugadores: ${have}/${max}`,
    needMinPlayers: (min: number, have: number) => `Necesitas al menos ${min} jugadores (tienes ${have})`,
    tooManyRerolls: (have: number, max: number) => `Demasiadas repeticiones: ${have}/${max}`,
    tooManyPosition: (id: number, have: number, max: number) => `Demasiados en posicion ID ${id}: ${have}/${max}`,

    // PDF
    pdfTitle: 'Blood Bowl Roster',
    unnamedTeam: 'Equipo sin nombre',
    pdfTeamValue: 'Valor del Equipo:',
    noPlayers: 'Sin jugadores',
    pdfRerolls: 'Repeticiones',
    pdfCoaches: 'Entrenadores Asistentes',
    pdfCheerleaders: 'Animadoras',
    pdfFans: 'Hinchas',
    pdfApothecary: 'Boticario',
    pdfTreasury: 'Tesoro',
    yes: 'Si',
    no: 'No',
    pdfPlayers: 'Jugadores:',
    pdfFooter: 'Blood Bowl Roster Creator',
  },
};

export type Strings = {
  [K in keyof typeof strings.en]: (typeof strings.en)[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : string;
};

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  t: strings.en,
});

function getInitialLang(): Lang {
  try {
    const saved = localStorage.getItem('bb_lang');
    if (saved === 'en' || saved === 'es') return saved;
  } catch {}
  // Auto-detect from browser
  if (navigator.language.startsWith('es')) return 'es';
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('bb_lang', l);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const t = strings[lang];

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function getStrings(lang: Lang): Strings {
  return strings[lang];
}
