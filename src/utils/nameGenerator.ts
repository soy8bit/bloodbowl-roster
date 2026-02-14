import raceNames from '../data/raceNames.json';

type RaceKey = keyof typeof raceNames;

const teamRaceMap: Record<string, RaceKey> = {
  '1': 'human',       // Imperial Nobility
  '2': 'orc',         // Black Orc
  '3': 'chaos',       // Chaos Chosen
  '4': 'dark_elf',    // Dark Elf
  '5': 'dwarf',       // Dwarf
  '6': 'elf',         // Elven Union
  '7': 'goblin',      // Goblin
  '8': 'halfling',    // Halfling
  '9': 'human',       // Human
  '10': 'lizardmen',  // Lizardmen
  '11': 'undead',     // Necromantic Horror
  '12': 'nurgle',     // Nurgle
  '13': 'ogre',       // Ogre
  '14': 'human',      // Old World Alliance
  '15': 'orc',        // Orc
  '16': 'undead',     // Shambling Undead
  '17': 'skaven',     // Skaven
  '18': 'snotling',   // Snotling
  '19': 'skaven',     // Underworld Denizens
  '20': 'wood_elf',   // Wood Elf
  '21': 'chaos',      // Chaos Renegade
  '22': 'amazon',     // Amazon (ToL)
  '23': 'chaos_dwarf',// Chaos Dwarf (ToL)
  '24': 'elf',        // High Elf
  '25': 'norse',      // Norse (ToL)
  '26': 'tomb_kings', // Tomb Kings
  '27': 'vampire',    // Vampire (ToL)
  '28': 'khorne',     // Daemons of Khorne
  '29': 'lizardmen',  // Slann
  '30': 'khorne',     // Khorne
  '31': 'norse',      // Norse
  '32': 'amazon',     // Amazon
  '33': 'vampire',    // Vampire
  '34': 'gnome',      // Gnome
  '35': 'chaos_dwarf',// Chaos Dwarf
};

export function generateRandomName(teamId: string, existingNames: string[]): string | null {
  const raceKey = teamRaceMap[teamId];
  if (!raceKey) return null;

  const data = raceNames[raceKey];
  if (!data) return null;

  const existing = new Set(existingNames.map(n => n.toLowerCase()));

  for (let i = 0; i < 100; i++) {
    const first = data.first[Math.floor(Math.random() * data.first.length)];
    const last = data.last[Math.floor(Math.random() * data.last.length)];
    const name = `${first} ${last}`;
    if (!existing.has(name.toLowerCase())) return name;
  }

  return null;
}
