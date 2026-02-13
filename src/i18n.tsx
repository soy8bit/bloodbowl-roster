import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Lang = 'en' | 'es';

const strings = {
  en: {
    // Header
    appTitle: 'BB Roster Maker',
    newTeam: 'New Team',
    savedRosters: 'Saved Rosters',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',

    // Navigation
    navHome: 'Home',
    navSkills: 'Skills',
    navAdmin: 'Admin',
    navLogin: 'Login',
    navLogout: (email: string) => `Logout (${email})`,
    navMenu: 'Menu',

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
    coachNamePlaceholder: 'Coach Name',
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

    // Star Players
    starPlayers: 'Star Players',
    searchStar: 'Search star player...',
    alreadyHired: 'Already hired',
    hire: 'Hire',
    noStarsAvailable: 'No star players available',

    // Inducements
    inducements: 'Inducements',

    // Tabs builder
    tabRoster: 'Roster',
    tabStarPlayers: 'Stars',
    tabInducements: 'Inducements',
    tabStaff: 'Staff & Config',

    // Budget bar
    budgetLabel: 'Budget',
    tvBreakdown: 'TV Breakdown',
    tvPlayers: 'Players',
    tvStars: 'Stars',
    tvInducements: 'Inducements',
    tvRerolls: 'Rerolls',
    tvStaff: 'Staff',

    // Toast/feedback
    playerAdded: (pos: string) => `${pos} added to roster`,
    playerRemoved: (pos: string) => `${pos} removed`,
    exportSuccess: 'Export completed',
    importSuccess: 'Roster imported successfully',
    undoRemove: 'Undo',

    // Confirm modal
    cancel: 'Cancel',
    confirmRemovePlayer: (pos: string) => `Remove ${pos} from roster?`,
    remove: 'Remove',
    close: 'Close',

    // Empty states
    emptyRosterHeading: 'No Players Yet',
    emptyRosterHint: 'Add players from the available positions above to build your team.',

    // Accessibility
    ariaIncreaseRerolls: 'Increase rerolls',
    ariaDecreaseRerolls: 'Decrease rerolls',
    ariaIncreaseCoaches: 'Increase assistant coaches',
    ariaDecreaseCoaches: 'Decrease assistant coaches',
    ariaIncreaseCheerleaders: 'Increase cheerleaders',
    ariaDecreaseCheerleaders: 'Decrease cheerleaders',
    ariaIncreaseFans: 'Increase dedicated fans',
    ariaDecreaseFans: 'Decrease dedicated fans',

    // Other
    apoBadge: 'Apo',
    footerAuthor: 'by Hector del Baix',

    // Help
    navHelp: 'Help',
    helpTitle: 'Help',
    helpRosterTitle: 'Building Your Roster',
    helpRosterDesc: 'Select a team, then add players from the available positions. Each position has a maximum number of players. Your roster needs at least 11 players and can have up to 16.',
    helpBudgetTitle: 'Budget & Team Value',
    helpBudgetDesc: 'Your team starts with a budget of 1,000,000 gold. The Team Value (TV) is the sum of all players, rerolls, staff, star players and inducements. Tap the TV value to see the full breakdown.',
    helpGameModeTitle: 'Game Mode',
    helpGameModeDesc: 'Tap "Game Mode" in the header to switch to a read-only match view. Track score, turns, rerolls, and player status (OK/KO/BH/SI/Dead/Sent Off). Tap a player\'s status badge to cycle it. Swipe left on a player card to cycle status too. All game state persists if you refresh.',
    helpStarsTitle: 'Star Players & Inducements',
    helpStarsDesc: 'Star Players are hired mercenaries available based on your team\'s special rules. Inducements are one-off purchases like Wizards, Bribes, or Bloodweiser Kegs. Both add to your Team Value.',
    helpSkillsTitle: 'Skills',
    helpSkillsDesc: 'Tap any skill badge to see its full description. Skills are color-coded by category: Agility (green), General (blue), Mutation (purple), Passing (orange), Strength (red), and Traits (gray).',
    helpExportTitle: 'Export & Import',
    helpExportDesc: 'Export your roster as PDF for printing or as JSON to share/backup. Import a JSON file to load a previously saved roster.',

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
    exportJson: 'Export JSON',
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

    // Game Mode
    gameMode: 'Game Mode',
    exitGameMode: 'Edit Mode',
    gameResources: 'Resources',
    gameStarPlayers: 'Star Players',
    gameInducements: 'Inducements',
    coach: 'Coach',
    playerStatus: 'Status',
    statusOk: 'OK',
    statusKo: 'KO',
    statusBh: 'BH',
    statusSi: 'SI',
    statusDead: 'Dead',
    statusSent: 'Sent Off',
    score: 'Score',
    home: 'HOME',
    away: 'AWAY',
    turn: 'Turn',
    half1: 'H1',
    half2: 'H2',
    available: 'Available',

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
    appTitle: 'BB Roster Maker',
    newTeam: 'Nuevo Equipo',
    savedRosters: 'Plantillas Guardadas',
    switchToLight: 'Cambiar a modo claro',
    switchToDark: 'Cambiar a modo oscuro',

    // Navigation
    navHome: 'Inicio',
    navSkills: 'Habilidades',
    navAdmin: 'Admin',
    navLogin: 'Iniciar sesion',
    navLogout: (email: string) => `Cerrar sesion (${email})`,
    navMenu: 'Menu',

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
    coachNamePlaceholder: 'Nombre del Coach',
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

    // Star Players
    starPlayers: 'Jugadores Estrella',
    searchStar: 'Buscar estrella...',
    alreadyHired: 'Ya contratado',
    hire: 'Contratar',
    noStarsAvailable: 'No hay estrellas disponibles',

    // Inducements
    inducements: 'Incentivos',

    // Tabs builder
    tabRoster: 'Plantilla',
    tabStarPlayers: 'Estrellas',
    tabInducements: 'Incentivos',
    tabStaff: 'Staff y Config',

    // Budget bar
    budgetLabel: 'Presupuesto',
    tvBreakdown: 'Desglose TV',
    tvPlayers: 'Jugadores',
    tvStars: 'Estrellas',
    tvInducements: 'Incentivos',
    tvRerolls: 'Repeticiones',
    tvStaff: 'Staff',

    // Toast/feedback
    playerAdded: (pos: string) => `${pos} añadido a la plantilla`,
    playerRemoved: (pos: string) => `${pos} eliminado`,
    exportSuccess: 'Exportacion completada',
    importSuccess: 'Plantilla importada correctamente',
    undoRemove: 'Deshacer',

    // Confirm modal
    cancel: 'Cancelar',
    confirmRemovePlayer: (pos: string) => `¿Eliminar ${pos} de la plantilla?`,
    remove: 'Eliminar',
    close: 'Cerrar',

    // Empty states
    emptyRosterHeading: 'Sin Jugadores',
    emptyRosterHint: 'Añade jugadores de las posiciones disponibles arriba para construir tu equipo.',

    // Accessibility
    ariaIncreaseRerolls: 'Aumentar repeticiones',
    ariaDecreaseRerolls: 'Reducir repeticiones',
    ariaIncreaseCoaches: 'Aumentar entrenadores asistentes',
    ariaDecreaseCoaches: 'Reducir entrenadores asistentes',
    ariaIncreaseCheerleaders: 'Aumentar animadoras',
    ariaDecreaseCheerleaders: 'Reducir animadoras',
    ariaIncreaseFans: 'Aumentar hinchas',
    ariaDecreaseFans: 'Reducir hinchas',

    // Other
    apoBadge: 'Apo',
    footerAuthor: 'por Hector del Baix',

    // Help
    navHelp: 'Ayuda',
    helpTitle: 'Ayuda',
    helpRosterTitle: 'Construir tu Plantilla',
    helpRosterDesc: 'Selecciona un equipo y añade jugadores de las posiciones disponibles. Cada posicion tiene un maximo de jugadores. Tu plantilla necesita al menos 11 jugadores y puede tener hasta 16.',
    helpBudgetTitle: 'Presupuesto y Valor de Equipo',
    helpBudgetDesc: 'Tu equipo empieza con un presupuesto de 1.000.000 de oro. El Valor de Equipo (TV) es la suma de todos los jugadores, repeticiones, staff, estrellas e incentivos. Toca el valor de TV para ver el desglose completo.',
    helpGameModeTitle: 'Modo Juego',
    helpGameModeDesc: 'Toca "Modo Juego" en la cabecera para cambiar a la vista de partido. Controla el marcador, turnos, repeticiones y estado de jugadores (OK/KO/BH/SI/Muerto/Expulsado). Toca el badge de estado para cambiarlo. Desliza a la izquierda sobre un jugador para cambiar su estado tambien. El estado del partido se mantiene si refrescas.',
    helpStarsTitle: 'Jugadores Estrella e Incentivos',
    helpStarsDesc: 'Los Jugadores Estrella son mercenarios disponibles segun las reglas especiales de tu equipo. Los Incentivos son compras puntuales como Magos, Sobornos o Barriles Bloodweiser. Ambos suman al Valor del Equipo.',
    helpSkillsTitle: 'Habilidades',
    helpSkillsDesc: 'Toca cualquier badge de habilidad para ver su descripcion. Las habilidades tienen colores por categoria: Agilidad (verde), General (azul), Mutacion (morado), Pase (naranja), Fuerza (rojo) y Rasgos (gris).',
    helpExportTitle: 'Exportar e Importar',
    helpExportDesc: 'Exporta tu plantilla como PDF para imprimir o como JSON para compartir/respaldar. Importa un archivo JSON para cargar una plantilla guardada.',

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
    exportJson: 'Exportar JSON',
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

    // Game Mode
    gameMode: 'Modo Juego',
    exitGameMode: 'Modo Edicion',
    gameResources: 'Recursos',
    gameStarPlayers: 'Jugadores Estrella',
    gameInducements: 'Incentivos',
    coach: 'Coach',
    playerStatus: 'Estado',
    statusOk: 'OK',
    statusKo: 'KO',
    statusBh: 'BH',
    statusSi: 'SI',
    statusDead: 'Muerto',
    statusSent: 'Expulsado',
    score: 'Marcador',
    home: 'LOCAL',
    away: 'VISIT',
    turn: 'Turno',
    half1: 'H1',
    half2: 'H2',
    available: 'Disponibles',

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
