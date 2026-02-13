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
    navStarPlayers: 'Star Players',
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
    uploadLogo: 'Upload Logo',
    logoTooLarge: 'Image must be under 2MB',
    removeLogo: 'Remove Logo',
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
    helpTitle: 'Guide',
    helpPageTitle: 'User Guide',
    helpPageIntro: 'Complete guide to Blood Bowl Roster Creator. Use the sidebar to jump to any section.',
    helpBudgetDesc: 'Your team starts with a budget of 1,000,000 gold. The Team Value (TV) is the sum of all players, rerolls, staff, star players and inducements. Tap the TV value to see the full breakdown.',
    helpGameModeDesc: 'Tap "Game Mode" in the header to switch to a read-only match view. Track score, turns, rerolls, and player status (OK/KO/BH/SI/Dead/Sent Off). Use the dropdown to change status. All game state persists during the session.',

    helpGettingStartedTitle: 'Getting Started',
    helpGettingStartedContent: [
      'Welcome to BB Roster Maker! This app lets you create, manage, and use Blood Bowl team rosters. To start, select a team from the team selector on the home screen.',
      'Each team has its own set of available player positions, special rules, reroll costs, and whether it can hire an apothecary. Teams are classified in Tiers (1, 2, 3) based on their competitive level.',
      'You can use the search bar and tier filters to find your team quickly. Once selected, you\'ll enter the Roster Builder where you can add players, configure staff, and prepare your team for the match.',
    ],
    helpRosterTitle: 'Building Your Roster',
    helpRosterContent: [
      'The Roster tab is where you add and manage your players. At the top you\'ll see the available positions for your team with their stats, skills, cost, and maximum count.',
      'Tap the "+" button next to a position to add a player. Each position has a maximum number of players you can hire. Your roster needs at least 11 players and can have up to 16.',
      'Each player shows their stats: MA (Movement Allowance), ST (Strength), AG (Agility), PA (Passing), and AV (Armor Value). AG and PA values shown with "+" are roll targets (lower is better).',
      'You can give each player a custom name by tapping the name field in the roster. To remove a player, tap the "X" button on their row.',
    ],
    helpBudgetTitle: 'Budget & Team Value',
    helpBudgetContent: [
      'Your team starts with a treasury of 1,000,000 gold pieces (displayed as 1,000k). Every player, reroll, and staff member costs gold from this budget.',
      'The Team Value (TV) is the total value of everything in your roster: players, rerolls, staff (coaches, cheerleaders, fans), star players, and inducements. It is displayed in the top bar.',
      'Tap the TV value to expand a detailed breakdown showing exactly how your team value is distributed. This is useful for checking where your gold is going.',
      'The budget indicator shows how much gold you have left. If it turns red, you\'ve exceeded your budget. You can adjust the treasury amount in the Staff tab if your league uses a different starting budget.',
    ],
    helpStaffTitle: 'Staff & Team Configuration',
    helpStaffContent: [
      'In the Staff tab you can manage your team\'s support staff and configuration. Use the +/- buttons to adjust quantities.',
      'Rerolls: Allow you to re-roll dice during a match. The cost varies by team (shown next to the counter). Each team has a maximum number of rerolls.',
      'Assistant Coaches: Add +1 to your BRILLIANT COACHING roll at kick-off. You can hire up to 6.',
      'Cheerleaders: Add +1 to your CHEERING FANS roll at kick-off. You can hire up to 6.',
      'Dedicated Fans: Your starting fan base (1-6). Affects revenue and THROW A ROCK results.',
      'Apothecary: If available for your team, allows you to attempt to heal a player who suffers a Casualty or KO result once per match. Costs 50k.',
      'Treasury: Your total budget. Defaults to 1,000k but you can modify it for custom league budgets.',
    ],
    helpStarsTitle: 'Star Players',
    helpStarsContent: [
      'Star Players are famous mercenaries that can be hired for your team. They are found in the Star Players tab.',
      'Available star players are filtered based on your team\'s special rules. Each star lists which teams or special rules can hire them.',
      'Star players have their own stats and skills and are more powerful than regular players, but they come at a high gold cost.',
      'Hired star players appear in both the Star Players tab and the Roster tab, and are included in your Team Value calculation. They also appear in the Game Mode view and in exported PDFs.',
      'Use the search bar to filter stars by name or skills. You cannot hire the same star player twice.',
    ],
    helpInducementsTitle: 'Inducements',
    helpInducementsContent: [
      'Inducements are one-time purchases available in the Inducements tab. They represent special resources for a single match.',
      'Common inducements include: Bloodweiser Kegs (re-roll KO recovery), Bribes (avoid send-off), Wizards (one-shot magic attack), Extra Training (additional team re-roll), and more.',
      'Each inducement has a cost and a maximum quantity. Some inducements are restricted to certain team types.',
      'Inducements add to your Team Value and appear in Game Mode for quick reference during play.',
    ],
    helpSkillsTitle: 'Skills',
    helpSkillsContent: [
      'Each player comes with a set of skills determined by their position. Tap any skill badge on a player to see its full description.',
      'Skills are color-coded by category: Agility (green), General (blue), Mutation (purple), Passing (orange), Strength (red), and Traits (gray).',
      'You can browse all skills in the dedicated Skills page, accessible from the navigation menu. Use the search and category filters to find specific skills.',
      'In Game Mode, skill badges remain tappable so you can quickly look up rules during a match.',
    ],
    helpGameModeTitle: 'Game Mode',
    helpGameModeContent: [
      'Game Mode is a read-only match view designed for use during play. Tap "Game Mode" in the roster header to activate it. The app goes fullscreen (hides the header and footer) to maximize screen space.',
      'Scoreboard: Track the score for both Home and Away teams with +/- buttons. The turn counter (1-8) and half selector (H1/H2) are in the center.',
      'Resources: A compact bar shows your available rerolls (tap to mark as used), apothecary, assistant coaches, cheerleaders, and fans. A summary counter shows how many players are in each status.',
      'Player Status: Each player card has a colored dropdown to set their status: OK (green), KO (yellow), BH - Badly Hurt (red), SI - Serious Injury (dark red), Dead (gray), or Sent Off (purple). The card\'s left border changes color to match.',
      'Players are automatically sorted by status: active players first, then injured, then dead/sent off. This helps you quickly see who is available.',
      'All game state (scores, turns, rerolls, player statuses) is saved in your browser session. If you refresh, your game state is preserved. It resets when you close the browser tab.',
      'Tap "Edit Mode" to go back to the roster builder. Your game state is kept so you can switch freely between modes.',
    ],
    helpExportTitle: 'Export & Import',
    helpExportContent: [
      'Export PDF: Generates a printable roster sheet with all players, stats, skills, star players, and staff. Optimized for A4 printing with large readable typography.',
      'Export JSON: Saves your roster as a JSON file. Use this to backup your roster or share it with other players who use this app.',
      'Import: Load a previously exported JSON file to restore a roster. This will create a new roster entry from the file.',
      'All export/import options are found in the Staff tab of the Roster Builder.',
    ],
    helpSavedTitle: 'Saved Rosters',
    helpSavedContent: [
      'All rosters are automatically saved in your browser\'s local storage. Access them from the "Saved Rosters" option in the menu.',
      'The saved rosters list shows each roster\'s name, team type, player count, and team value at a glance.',
      'You can load any saved roster to edit it, or delete rosters you no longer need. Deletion is permanent and cannot be undone.',
      'Note: Rosters are saved locally in your browser. Clearing your browser data will delete them. Use JSON export to create backups.',
    ],
    helpShortcutsTitle: 'Tips & Shortcuts',
    helpShortcutsContent: [
      'Language: Toggle between English and Spanish with the EN/ES button in the header.',
      'Theme: Switch between dark and light mode using the sun/moon toggle in the header.',
      'TV Breakdown: Tap the Team Value in the budget bar to expand the detailed cost breakdown.',
      'Skill Lookup: Tap any skill badge anywhere in the app (roster, game mode, star players) to see its description.',
      'Game Mode Swipe: On mobile, swipe left on a player card to quickly cycle their status to the next value.',
      'Info Buttons: Look for the small "i" buttons throughout the app for contextual help and explanations.',
    ],

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

    // Landing
    landingSubtitle: 'The ultimate tool to build, manage, and play with your Blood Bowl team rosters. All teams, all rules, all in one place.',
    landingCta: 'Create Your Roster',
    landingCtaSaved: 'My Rosters',
    landingFeaturesTitle: 'Everything You Need',
    landingFeature1Title: 'All Teams Available',
    landingFeature1Desc: 'Every official Blood Bowl team with correct positions, stats, skills, and tier classification. Includes retired teams.',
    landingFeature2Title: 'Smart Budget Tracking',
    landingFeature2Desc: 'Real-time budget control with detailed Team Value breakdown. Never overspend — see exactly where your gold goes.',
    landingFeature3Title: 'Skills Reference',
    landingFeature3Desc: 'Full skill database with descriptions, color-coded by category. Tap any skill badge for instant lookup during play.',
    landingFeature4Title: 'Star Players & Inducements',
    landingFeature4Desc: 'Hire star players filtered by your team\'s special rules. Add inducements like Wizards, Bribes, and Bloodweiser Kegs.',
    landingFeature5Title: 'Game Mode',
    landingFeature5Desc: 'A dedicated match-day view to track scores, turns, rerolls, and player status (OK/KO/BH/SI/Dead). Designed for quick mobile use.',
    landingFeature6Title: 'Export & Print',
    landingFeature6Desc: 'Export your roster as a print-ready PDF or shareable JSON file. Import rosters from other coaches easily.',
    landingHowTitle: 'How It Works',
    landingStep1: 'Pick your team from all official Blood Bowl races',
    landingStep2: 'Add players, staff, stars, and inducements within budget',
    landingStep3: 'Play! Use Game Mode to track your match live',
    landingBottomText: 'Ready to build your dream team?',

    // Cookie banner
    cookieText: 'This site uses cookies and local storage to save your rosters and preferences.',
    cookiePolicy: 'Privacy & Cookie Policy',
    cookieAccept: 'Accept',

    // Policy page
    policyTitle: 'Privacy & Cookie Policy',
    policyUpdated: 'Last updated: February 2026',
    policyIntroTitle: 'Introduction',
    policyIntroContent: [
      'BB Roster Maker ("the App") is a free, open-source tool for creating and managing Blood Bowl team rosters. We respect your privacy and are committed to transparency about how data is handled.',
      'This policy explains what data the App stores, how it is used, and your rights regarding that data.',
    ],
    policyCookiesTitle: 'Cookies',
    policyCookiesContent: [
      'The App uses a minimal cookie (or localStorage entry) solely to remember that you have accepted this cookie policy. No tracking cookies, analytics cookies, or third-party advertising cookies are used.',
      'The cookie stored is: "bb_cookies_accepted" — a simple flag ("1") indicating you have dismissed the cookie banner. It has no expiration and can be deleted at any time by clearing your browser data.',
    ],
    policyLocalStorageTitle: 'Local Storage',
    policyLocalStorageContent: [
      'The App uses your browser\'s Local Storage and Session Storage to save data locally on your device. This data never leaves your browser and is not sent to any server.',
      'Data stored includes: your saved rosters (team composition, player names, staff configuration), your language preference (English/Spanish), your theme preference (dark/light), and temporary game mode state (scores, turns, player statuses) in session storage.',
      'All stored data remains on your device. Clearing your browser data or local storage will permanently delete all saved rosters and preferences.',
    ],
    policyDataTitle: 'Data Collection',
    policyDataContent: [
      'The App does not collect, transmit, or store any personal data on external servers. There are no user accounts required to use the roster builder (the login feature is reserved for admin purposes only).',
      'No analytics, telemetry, or usage tracking of any kind is performed. Your IP address is not logged by the App.',
    ],
    policyThirdPartyTitle: 'Third-Party Services',
    policyThirdPartyContent: [
      'The App is hosted as a static website. No third-party scripts for analytics, advertising, or tracking are loaded.',
      'The only external resources loaded are web fonts (Google Fonts: Bungee, Inter) for typography purposes. Google\'s font service may log standard web request data per their own privacy policy.',
    ],
    policyRightsTitle: 'Your Rights',
    policyRightsContent: [
      'Since all data is stored locally in your browser, you have full control over it at all times. You can view, export (via JSON export), or delete your data whenever you wish.',
      'To delete all App data: clear your browser\'s local storage for this site, or use your browser\'s "Clear site data" option.',
    ],
    policyContactTitle: 'Contact',
    policyContactContent: [
      'If you have any questions about this privacy policy or the App, you can reach us through the project\'s repository or contact the developer.',
    ],
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
    navStarPlayers: 'Jugadores Estrella',
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
    uploadLogo: 'Subir Logo',
    logoTooLarge: 'La imagen debe ser menor a 2MB',
    removeLogo: 'Quitar Logo',
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
    helpTitle: 'Guia',
    helpPageTitle: 'Guia de Usuario',
    helpPageIntro: 'Guia completa de Blood Bowl Roster Creator. Usa la barra lateral para saltar a cualquier seccion.',
    helpBudgetDesc: 'Tu equipo empieza con un presupuesto de 1.000.000 de oro. El Valor de Equipo (TV) es la suma de todos los jugadores, repeticiones, staff, estrellas e incentivos. Toca el valor de TV para ver el desglose completo.',
    helpGameModeDesc: 'Toca "Modo Juego" en la cabecera para cambiar a la vista de partido. Controla el marcador, turnos, repeticiones y estado de jugadores (OK/KO/BH/SI/Muerto/Expulsado). Usa el desplegable para cambiar el estado. El estado se mantiene durante la sesion.',

    helpGettingStartedTitle: 'Primeros Pasos',
    helpGettingStartedContent: [
      'Bienvenido a BB Roster Maker! Esta app te permite crear, gestionar y usar plantillas de equipos de Blood Bowl. Para empezar, selecciona un equipo en la pantalla principal.',
      'Cada equipo tiene sus propias posiciones de jugadores, reglas especiales, costes de repeticion y si puede contratar boticario. Los equipos se clasifican en Tiers (1, 2, 3) segun su nivel competitivo.',
      'Puedes usar la barra de busqueda y los filtros de tier para encontrar tu equipo rapidamente. Una vez seleccionado, entraras en el Constructor de Plantillas donde podras añadir jugadores, configurar el staff y preparar tu equipo.',
    ],
    helpRosterTitle: 'Construir tu Plantilla',
    helpRosterContent: [
      'La pestaña Plantilla es donde añades y gestionas tus jugadores. Arriba veras las posiciones disponibles para tu equipo con sus stats, habilidades, coste y cantidad maxima.',
      'Toca el boton "+" junto a una posicion para añadir un jugador. Cada posicion tiene un numero maximo de jugadores. Tu plantilla necesita al menos 11 jugadores y puede tener hasta 16.',
      'Cada jugador muestra sus stats: MA (Movimiento), ST (Fuerza), AG (Agilidad), PA (Pase) y AV (Armadura). Los valores de AG y PA con "+" son objetivos de tirada (mas bajo es mejor).',
      'Puedes dar a cada jugador un nombre personalizado tocando el campo de nombre en la plantilla. Para quitar un jugador, toca el boton "X" en su fila.',
    ],
    helpBudgetTitle: 'Presupuesto y Valor de Equipo',
    helpBudgetContent: [
      'Tu equipo empieza con un tesoro de 1.000.000 de piezas de oro (mostrado como 1.000k). Cada jugador, repeticion y miembro del staff cuesta oro de este presupuesto.',
      'El Valor de Equipo (TV) es el valor total de todo en tu plantilla: jugadores, repeticiones, staff (entrenadores, animadoras, hinchas), jugadores estrella e incentivos. Se muestra en la barra superior.',
      'Toca el valor de TV para expandir un desglose detallado mostrando exactamente como se distribuye el valor de tu equipo. Util para ver a donde va tu oro.',
      'El indicador de presupuesto muestra cuanto oro te queda. Si se pone rojo, has excedido tu presupuesto. Puedes ajustar el tesoro en la pestaña Staff si tu liga usa un presupuesto diferente.',
    ],
    helpStaffTitle: 'Staff y Configuracion',
    helpStaffContent: [
      'En la pestaña Staff puedes gestionar el personal de apoyo y la configuracion de tu equipo. Usa los botones +/- para ajustar cantidades.',
      'Repeticiones: Te permiten repetir tiradas de dados durante un partido. El coste varia segun el equipo (se muestra junto al contador). Cada equipo tiene un maximo de repeticiones.',
      'Entrenadores Asistentes: Añaden +1 a tu tirada de ENTRENAMIENTO BRILLANTE en el saque. Puedes contratar hasta 6.',
      'Animadoras: Añaden +1 a tu tirada de HINCHAS ANIMANDO en el saque. Puedes contratar hasta 6.',
      'Hinchas: Tu base de fans inicial (1-6). Afecta a los ingresos y resultados de LANZAR UNA PIEDRA.',
      'Boticario: Si esta disponible para tu equipo, permite intentar curar a un jugador que sufra Baja o resultado de KO una vez por partido. Cuesta 50k.',
      'Tesoro: Tu presupuesto total. Por defecto 1.000k pero puedes modificarlo para presupuestos de liga personalizados.',
    ],
    helpStarsTitle: 'Jugadores Estrella',
    helpStarsContent: [
      'Los Jugadores Estrella son mercenarios famosos que puedes contratar para tu equipo. Se encuentran en la pestaña Jugadores Estrella.',
      'Los jugadores estrella disponibles se filtran segun las reglas especiales de tu equipo. Cada estrella indica que equipos o reglas especiales pueden contratarla.',
      'Los jugadores estrella tienen sus propios stats y habilidades y son mas poderosos que los jugadores normales, pero tienen un alto coste en oro.',
      'Los jugadores estrella contratados aparecen tanto en la pestaña de Estrellas como en la de Plantilla, y se incluyen en el calculo del Valor de Equipo. Tambien aparecen en el Modo Juego y en los PDFs exportados.',
      'Usa la barra de busqueda para filtrar estrellas por nombre o habilidades. No puedes contratar al mismo jugador estrella dos veces.',
    ],
    helpInducementsTitle: 'Incentivos',
    helpInducementsContent: [
      'Los Incentivos son compras puntuales disponibles en la pestaña Incentivos. Representan recursos especiales para un unico partido.',
      'Incentivos comunes incluyen: Barriles Bloodweiser (repetir recuperacion de KO), Sobornos (evitar expulsion), Magos (ataque magico de un solo uso), Entrenamiento Extra (repeticion de equipo adicional), y mas.',
      'Cada incentivo tiene un coste y una cantidad maxima. Algunos incentivos estan restringidos a ciertos tipos de equipo.',
      'Los incentivos suman al Valor de Equipo y aparecen en el Modo Juego para consulta rapida durante la partida.',
    ],
    helpSkillsTitle: 'Habilidades',
    helpSkillsContent: [
      'Cada jugador viene con un conjunto de habilidades determinado por su posicion. Toca cualquier badge de habilidad para ver su descripcion completa.',
      'Las habilidades tienen colores por categoria: Agilidad (verde), General (azul), Mutacion (morado), Pase (naranja), Fuerza (rojo) y Rasgos (gris).',
      'Puedes explorar todas las habilidades en la pagina dedicada de Habilidades, accesible desde el menu de navegacion. Usa la busqueda y filtros de categoria para encontrar habilidades especificas.',
      'En el Modo Juego, los badges de habilidades siguen siendo tocables para que puedas consultar reglas rapidamente durante un partido.',
    ],
    helpGameModeTitle: 'Modo Juego',
    helpGameModeContent: [
      'El Modo Juego es una vista de solo lectura diseñada para usar durante la partida. Toca "Modo Juego" en la cabecera de la plantilla para activarlo. La app entra en pantalla completa (oculta cabecera y pie) para maximizar el espacio.',
      'Marcador: Controla el resultado para los equipos Local y Visitante con los botones +/-. El contador de turno (1-8) y el selector de mitad (H1/H2) estan en el centro.',
      'Recursos: Una barra compacta muestra tus repeticiones disponibles (toca para marcar como usadas), boticario, entrenadores asistentes, animadoras e hinchas. Un contador resumen muestra cuantos jugadores hay en cada estado.',
      'Estado del Jugador: Cada tarjeta de jugador tiene un desplegable con colores para establecer su estado: OK (verde), KO (amarillo), BH - Herida Grave (rojo), SI - Lesion Seria (rojo oscuro), Muerto (gris) o Expulsado (morado). El borde izquierdo de la tarjeta cambia de color segun el estado.',
      'Los jugadores se ordenan automaticamente por estado: activos primero, luego heridos, luego muertos/expulsados. Esto te ayuda a ver rapidamente quien esta disponible.',
      'Todo el estado del partido (marcador, turnos, repeticiones, estados de jugadores) se guarda en la sesion del navegador. Si refrescas, el estado se mantiene. Se reinicia al cerrar la pestaña.',
      'Toca "Modo Edicion" para volver al constructor. Tu estado de partido se mantiene y puedes cambiar libremente entre modos.',
    ],
    helpExportTitle: 'Exportar e Importar',
    helpExportContent: [
      'Exportar PDF: Genera una hoja de plantilla imprimible con todos los jugadores, stats, habilidades, jugadores estrella y staff. Optimizado para impresion en A4 con tipografia grande y legible.',
      'Exportar JSON: Guarda tu plantilla como archivo JSON. Usalo para hacer copias de seguridad o compartir con otros jugadores que usen esta app.',
      'Importar: Carga un archivo JSON previamente exportado para restaurar una plantilla. Esto creara una nueva entrada de plantilla desde el archivo.',
      'Todas las opciones de exportacion/importacion se encuentran en la pestaña Staff del Constructor de Plantillas.',
    ],
    helpSavedTitle: 'Plantillas Guardadas',
    helpSavedContent: [
      'Todas las plantillas se guardan automaticamente en el almacenamiento local de tu navegador. Accede a ellas desde la opcion "Plantillas Guardadas" en el menu.',
      'La lista de plantillas guardadas muestra el nombre, tipo de equipo, numero de jugadores y valor de equipo de un vistazo.',
      'Puedes cargar cualquier plantilla guardada para editarla, o eliminar plantillas que ya no necesites. La eliminacion es permanente y no se puede deshacer.',
      'Nota: Las plantillas se guardan localmente en tu navegador. Borrar los datos del navegador las eliminara. Usa la exportacion JSON para crear copias de seguridad.',
    ],
    helpShortcutsTitle: 'Consejos y Atajos',
    helpShortcutsContent: [
      'Idioma: Cambia entre ingles y español con el boton EN/ES en la cabecera.',
      'Tema: Cambia entre modo oscuro y claro usando el interruptor de sol/luna en la cabecera.',
      'Desglose de TV: Toca el Valor de Equipo en la barra de presupuesto para expandir el desglose detallado de costes.',
      'Consultar Habilidades: Toca cualquier badge de habilidad en cualquier parte de la app (plantilla, modo juego, jugadores estrella) para ver su descripcion.',
      'Deslizar en Modo Juego: En movil, desliza a la izquierda sobre una tarjeta de jugador para cambiar rapidamente su estado al siguiente valor.',
      'Botones de Info: Busca los pequeños botones "i" a lo largo de la app para ayuda contextual y explicaciones.',
    ],

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

    // Landing
    landingSubtitle: 'La herramienta definitiva para crear, gestionar y jugar con tus plantillas de Blood Bowl. Todos los equipos, todas las reglas, todo en un solo lugar.',
    landingCta: 'Crea tu Plantilla',
    landingCtaSaved: 'Mis Plantillas',
    landingFeaturesTitle: 'Todo lo que Necesitas',
    landingFeature1Title: 'Todos los Equipos',
    landingFeature1Desc: 'Todos los equipos oficiales de Blood Bowl con posiciones, stats, habilidades y clasificacion por tier. Incluye equipos retirados.',
    landingFeature2Title: 'Control de Presupuesto',
    landingFeature2Desc: 'Control de presupuesto en tiempo real con desglose detallado del Valor de Equipo. Nunca gastes de mas — ve exactamente a donde va tu oro.',
    landingFeature3Title: 'Referencia de Habilidades',
    landingFeature3Desc: 'Base de datos completa con descripciones, con colores por categoria. Toca cualquier habilidad para consultarla al instante.',
    landingFeature4Title: 'Estrellas e Incentivos',
    landingFeature4Desc: 'Contrata jugadores estrella filtrados por las reglas de tu equipo. Añade incentivos como Magos, Sobornos y Barriles Bloodweiser.',
    landingFeature5Title: 'Modo Juego',
    landingFeature5Desc: 'Vista dedicada para el dia del partido. Controla marcador, turnos, repeticiones y estado de jugadores (OK/KO/BH/SI/Muerto). Diseñado para movil.',
    landingFeature6Title: 'Exportar e Imprimir',
    landingFeature6Desc: 'Exporta tu plantilla como PDF listo para imprimir o como JSON para compartir. Importa plantillas de otros coaches facilmente.',
    landingHowTitle: 'Como Funciona',
    landingStep1: 'Elige tu equipo entre todas las razas oficiales de Blood Bowl',
    landingStep2: 'Añade jugadores, staff, estrellas e incentivos dentro del presupuesto',
    landingStep3: 'A jugar! Usa el Modo Juego para seguir tu partido en directo',
    landingBottomText: 'Listo para crear tu equipo ideal?',

    // Cookie banner
    cookieText: 'Este sitio usa cookies y almacenamiento local para guardar tus plantillas y preferencias.',
    cookiePolicy: 'Politica de Privacidad y Cookies',
    cookieAccept: 'Aceptar',

    // Policy page
    policyTitle: 'Politica de Privacidad y Cookies',
    policyUpdated: 'Ultima actualizacion: Febrero 2026',
    policyIntroTitle: 'Introduccion',
    policyIntroContent: [
      'BB Roster Maker ("la App") es una herramienta gratuita y de codigo abierto para crear y gestionar plantillas de equipos de Blood Bowl. Respetamos tu privacidad y nos comprometemos a ser transparentes sobre como se manejan los datos.',
      'Esta politica explica que datos almacena la App, como se usan y tus derechos respecto a esos datos.',
    ],
    policyCookiesTitle: 'Cookies',
    policyCookiesContent: [
      'La App usa una cookie (o entrada de localStorage) minima unicamente para recordar que has aceptado esta politica de cookies. No se usan cookies de seguimiento, analitica ni publicidad de terceros.',
      'La cookie almacenada es: "bb_cookies_accepted" — una simple marca ("1") que indica que has cerrado el banner de cookies. No tiene caducidad y puede eliminarse en cualquier momento limpiando los datos del navegador.',
    ],
    policyLocalStorageTitle: 'Almacenamiento Local',
    policyLocalStorageContent: [
      'La App usa el Local Storage y Session Storage de tu navegador para guardar datos localmente en tu dispositivo. Estos datos nunca salen de tu navegador y no se envian a ningun servidor.',
      'Los datos almacenados incluyen: tus plantillas guardadas (composicion del equipo, nombres de jugadores, configuracion de staff), tu preferencia de idioma (ingles/español), tu preferencia de tema (oscuro/claro) y el estado temporal del modo juego (marcador, turnos, estados de jugadores) en session storage.',
      'Todos los datos permanecen en tu dispositivo. Limpiar los datos del navegador o el almacenamiento local eliminara permanentemente todas las plantillas y preferencias guardadas.',
    ],
    policyDataTitle: 'Recopilacion de Datos',
    policyDataContent: [
      'La App no recopila, transmite ni almacena ningun dato personal en servidores externos. No se requieren cuentas de usuario para usar el creador de plantillas (la funcion de login esta reservada solo para administracion).',
      'No se realiza ningun tipo de analitica, telemetria ni seguimiento de uso. Tu direccion IP no es registrada por la App.',
    ],
    policyThirdPartyTitle: 'Servicios de Terceros',
    policyThirdPartyContent: [
      'La App se aloja como un sitio web estatico. No se cargan scripts de terceros para analitica, publicidad ni seguimiento.',
      'Los unicos recursos externos cargados son fuentes web (Google Fonts: Bungee, Inter) para tipografia. El servicio de fuentes de Google puede registrar datos estandar de solicitud web segun su propia politica de privacidad.',
    ],
    policyRightsTitle: 'Tus Derechos',
    policyRightsContent: [
      'Como todos los datos se almacenan localmente en tu navegador, tienes control total sobre ellos en todo momento. Puedes ver, exportar (via exportacion JSON) o eliminar tus datos cuando quieras.',
      'Para eliminar todos los datos de la App: limpia el almacenamiento local de tu navegador para este sitio, o usa la opcion "Borrar datos del sitio" de tu navegador.',
    ],
    policyContactTitle: 'Contacto',
    policyContactContent: [
      'Si tienes alguna pregunta sobre esta politica de privacidad o la App, puedes contactarnos a traves del repositorio del proyecto o contactar al desarrollador.',
    ],
  },
};

export type Strings = {
  [K in keyof typeof strings.en]: (typeof strings.en)[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : (typeof strings.en)[K] extends string[]
    ? string[]
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
