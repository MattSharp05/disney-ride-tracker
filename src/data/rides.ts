export type ParkId = 'mk' | 'epcot' | 'hs' | 'ak';

export interface Park {
  id: ParkId;
  name: string;
  short: string;
}

export interface Ride {
  id: string;
  park: ParkId;
  name: string;
  land: string;
  /** Short note shown under the name, e.g. a temporary closure. */
  note?: string;
  custom?: boolean;
}

export const PARKS: Park[] = [
  { id: 'mk', name: 'Magic Kingdom', short: 'Magic Kingdom' },
  { id: 'epcot', name: 'EPCOT', short: 'EPCOT' },
  { id: 'hs', name: "Disney's Hollywood Studios", short: 'Hollywood Studios' },
  { id: 'ak', name: "Disney's Animal Kingdom", short: 'Animal Kingdom' },
];

type Seed = [name: string, land: string, note?: string];

const seed: Record<ParkId, Seed[]> = {
  mk: [
    ['Walt Disney World Railroad', 'Main Street, U.S.A.', 'Main Street ↔ Fantasyland only'],
    ['Jungle Cruise', 'Adventureland'],
    ['Pirates of the Caribbean', 'Adventureland'],
    ['The Magic Carpets of Aladdin', 'Adventureland'],
    ['Big Thunder Mountain Railroad', 'Frontierland'],
    ["Tiana's Bayou Adventure", 'Frontierland'],
    ['Haunted Mansion', 'Liberty Square'],
    ['Seven Dwarfs Mine Train', 'Fantasyland'],
    ["Peter Pan's Flight", 'Fantasyland'],
    ['"it\'s a small world"', 'Fantasyland'],
    ['The Many Adventures of Winnie the Pooh', 'Fantasyland'],
    ['Under the Sea ~ Journey of The Little Mermaid', 'Fantasyland'],
    ['Mad Tea Party', 'Fantasyland'],
    ['Dumbo the Flying Elephant', 'Fantasyland'],
    ['The Barnstormer', 'Fantasyland'],
    ['Prince Charming Regal Carrousel', 'Fantasyland'],
    ['TRON Lightcycle / Run', 'Tomorrowland'],
    ['Space Mountain', 'Tomorrowland'],
    ["Buzz Lightyear's Space Ranger Spin", 'Tomorrowland'],
    ['Tomorrowland Speedway', 'Tomorrowland'],
    ['Astro Orbiter', 'Tomorrowland'],
    ['Tomorrowland Transit Authority PeopleMover', 'Tomorrowland'],
    ["Walt Disney's Carousel of Progress", 'Tomorrowland', 'Closed for refurbishment until 2027'],
  ],
  epcot: [
    ['Spaceship Earth', 'World Celebration'],
    ['Guardians of the Galaxy: Cosmic Rewind', 'World Discovery'],
    ['Test Track', 'World Discovery'],
    ['Mission: SPACE', 'World Discovery'],
    ["Soarin'", 'World Nature'],
    ['Living with the Land', 'World Nature'],
    ['The Seas with Nemo & Friends', 'World Nature'],
    ['Journey Into Imagination with Figment', 'World Nature'],
    ['Gran Fiesta Tour Starring The Three Caballeros', 'World Showcase'],
    ['Frozen Ever After', 'World Showcase'],
    ["Remy's Ratatouille Adventure", 'World Showcase'],
  ],
  hs: [
    ["Mickey & Minnie's Runaway Railway", 'Hollywood Boulevard'],
    ['Star Tours – The Adventures Continue', 'Echo Lake'],
    ['The Twilight Zone Tower of Terror', 'Sunset Boulevard'],
    ["Rock 'n' Roller Coaster Starring The Muppets", 'Sunset Boulevard'],
    ['Star Wars: Rise of the Resistance', "Star Wars: Galaxy's Edge"],
    ['Millennium Falcon: Smugglers Run', "Star Wars: Galaxy's Edge"],
    ['Slinky Dog Dash', 'Toy Story Land'],
    ['Toy Story Mania!', 'Toy Story Land'],
    ['Alien Swirling Saucers', 'Toy Story Land'],
  ],
  ak: [
    ['Avatar Flight of Passage', 'Pandora – The World of Avatar'],
    ["Na'vi River Journey", 'Pandora – The World of Avatar'],
    ['Kilimanjaro Safaris', 'Africa'],
    ['Wildlife Express Train', 'Africa'],
    ['Expedition Everest – Legend of the Forbidden Mountain', 'Asia'],
    ['Kali River Rapids', 'Asia'],
  ],
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const RIDES: Ride[] = (Object.keys(seed) as ParkId[]).flatMap((park) =>
  seed[park].map(([name, land, note]) => ({
    id: `${park}-${slug(name)}`,
    park,
    name,
    land,
    note,
  })),
);

export interface Category {
  id: string;
  label: string;
  hint: string;
}

export const CATEGORIES: Category[] = [
  { id: 'thrill', label: 'Thrill', hint: 'How intense it felt' },
  { id: 'line', label: 'Line experience', hint: 'Queue theming, shade, wait vs. payoff' },
  { id: 'theming', label: 'Theming', hint: 'Story, sets, immersion' },
  { id: 'rerider', label: 'Re-ride value', hint: 'Would you go again right now?' },
  { id: 'overall', label: 'Overall', hint: 'Your gut score' },
];
