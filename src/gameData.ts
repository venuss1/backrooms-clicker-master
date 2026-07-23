// AUTO-GENERATED from backrooms.db (Backrooms Wiki ARPG curation). Do not edit by hand.
// Regenerate with: python3 scripts/gen_gamedata.py

export type SceneKind = 'corridor' | 'office' | 'hotel' | 'dark' | 'water' | 'cave' | 'suburb' | 'field' | 'digital' | 'ruins' | 'void' | 'neon';
export interface Level { id: string; name: string; desc: string; hook: string; unlockCost: number; mult: number; rating: number; scene: SceneKind; verb: string; icon: string; hue: number; }
export interface Generator { id: string; name: string; desc: string; hook: string; baseCost: number; baseProd: number; rating: number; }
export type GearSlot = 'Weapon' | 'Light' | 'Armor' | 'Trinket';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export interface GearStats { clickMult: number; prodMult: number; luck: number; crit: number; }
export interface Gear { id: string; name: string; desc: string; hook: string; slot: GearSlot; rarity: Rarity; cost: number; stats: GearStats; rating: number; minDelveRoom: number; abyssOnly?: boolean; }
export interface Encounter { id: string; name: string; desc: string; hook: string; boss: boolean; rating: number; }
export interface Finale { id: string; name: string; desc: string; hook: string; rating: number; }
export interface Phenomenon { id: string; name: string; desc: string; hook: string; effect: string; label: string; rating: number; }

export const LEVELS: Level[] = [
  {
    "id": "level-0",
    "name": "Level 0 - 'Threshold'",
    "desc": "Tutorial labyrinth built around isolation, attrition, shifting rooms, and architectural aberrations.",
    "hook": "Rearrange unseen corridors while dehydration and isolation pressure the player to keep moving.",
    "unlockCost": 0,
    "mult": 1.0,
    "rating": 167,
    "scene": "corridor",
    "verb": "PHASE",
    "icon": "\u259a",
    "hue": 0
  },
  {
    "id": "level-1",
    "name": "Level 1 - 'Habitable Zone'",
    "desc": "First major inhabited zone with loot crates, sectors, settlements, traders, and intermittent danger.",
    "hook": "Use settlements as the first trade hub while flickering sectors become timed loot runs.",
    "unlockCost": 442,
    "mult": 2.0,
    "rating": 164,
    "scene": "suburb",
    "verb": "SCAVENGE",
    "icon": "\u2302",
    "hue": 47
  },
  {
    "id": "level-4",
    "name": "Level 4 - 'Abandoned Office'",
    "desc": "Abandoned-office biome with deceptive black windows and multiple safe-zone factions.",
    "hook": "Alternate calm offices and lethal window traps around faction outposts.",
    "unlockCost": 1666.7,
    "mult": 3.1,
    "rating": 203,
    "scene": "office",
    "verb": "RUMMAGE",
    "icon": "\u25a6",
    "hue": 94
  },
  {
    "id": "level-5",
    "name": "Level 5 - 'Terror Hotel'",
    "desc": "Multi-wing hotel dungeon with faction pockets, a boiler descent, and the Beast of Level 5.",
    "hook": "Make each hotel wing a distinct dungeon layer culminating in the Beast's domain.",
    "unlockCost": 5591.45,
    "mult": 4.25,
    "rating": 222,
    "scene": "hotel",
    "verb": "CREEP",
    "icon": "\ud83d\udeaa",
    "hue": 141
  },
  {
    "id": "level-6",
    "name": "Level 6 - 'Lights Out'",
    "desc": "Darkness and sound-driven stealth zone with mimicry and sanity pressure.",
    "hook": "Navigate by sound while hostile mimicry makes every audio cue uncertain.",
    "unlockCost": 17673.3,
    "mult": 5.44,
    "rating": 177,
    "scene": "dark",
    "verb": "FEEL",
    "icon": "\u25d0",
    "hue": 188
  },
  {
    "id": "level-7",
    "name": "Level 7 - 'Thalassophobia'",
    "desc": "Open-water dungeon built around oxygen, light, depth, and deep-sea enemies.",
    "hook": "Trade light and oxygen for deeper loot routes through hostile water.",
    "unlockCost": 55629.7,
    "mult": 6.68,
    "rating": 148,
    "scene": "water",
    "verb": "WADE",
    "icon": "\u2248",
    "hue": 235
  },
  {
    "id": "level-8",
    "name": "Level 8 - 'Cave Systems'",
    "desc": "Branching cave biome with hostile ecology, difficult terrain, roads, and faction outposts.",
    "hook": "Use speleology tools and outpost routes to push through an enemy-rich cave network.",
    "unlockCost": 178249,
    "mult": 7.94,
    "rating": 140,
    "scene": "cave",
    "verb": "CRAWL",
    "icon": "\u26f0",
    "hue": 282
  },
  {
    "id": "level-9",
    "name": "Level 9 - 'The Suburbs'",
    "desc": "Hostile midnight suburb designed for house-to-house looting and stalking encounters.",
    "hook": "Turn each house into a risky loot pocket within a predator-controlled overworld.",
    "unlockCost": 581912,
    "mult": 9.24,
    "rating": 184,
    "scene": "suburb",
    "verb": "SCAVENGE",
    "icon": "\u2302",
    "hue": 329
  },
  {
    "id": "level-10",
    "name": "Level 10 - 'Bumper Crop'",
    "desc": "Farmland recovery biome supporting foraging, food production, and settlements.",
    "hook": "Use farms as a consumable-production region threatened by weather and supply quests.",
    "unlockCost": 1923920,
    "mult": 10.56,
    "rating": 114,
    "scene": "field",
    "verb": "FORAGE",
    "icon": "\u2766",
    "hue": 16
  },
  {
    "id": "level-12",
    "name": "Level 12 - 'Matrix'",
    "desc": "Self-censoring reality where observation and recording fail.",
    "hook": "Hide state from maps and recordings so players solve the zone through indirect observation.",
    "unlockCost": 6405690,
    "mult": 11.9,
    "rating": 120,
    "scene": "digital",
    "verb": "GLITCH",
    "icon": "\u2593",
    "hue": 63
  },
  {
    "id": "level-14",
    "name": "Level 14 - 'Paradise'",
    "desc": "Seductive false paradise whose crimson forest inflicts escalating mental corruption.",
    "hook": "Reward staying in a beautiful high-loot forest while corruption steadily distorts choices.",
    "unlockCost": 21401400,
    "mult": 13.27,
    "rating": 228,
    "scene": "field",
    "verb": "FORAGE",
    "icon": "\u2766",
    "hue": 110
  },
  {
    "id": "level-22",
    "name": "Level 22 - 'Ruins Left Behind'",
    "desc": "Abandoned parking-city ruins suited to scavenging and environmental storytelling.",
    "hook": "Reconstruct the vanished settlement through salvage, ruins, and layered records.",
    "unlockCost": 71613900,
    "mult": 14.66,
    "rating": 115,
    "scene": "ruins",
    "verb": "SIFT",
    "icon": "\u25c8",
    "hue": 157
  },
  {
    "id": "level-23",
    "name": "Level 23 - 'The Petrified Garden'",
    "desc": "Planetoid-scale living dungeon with glow rooms, ancient ruins, sentries, and giants.",
    "hook": "Build long expeditions around living terrain, ancient defenses, and landmark-scale bosses.",
    "unlockCost": 239797000,
    "mult": 16.06,
    "rating": 120,
    "scene": "field",
    "verb": "FORAGE",
    "icon": "\u2766",
    "hue": 204
  },
  {
    "id": "level-37",
    "name": "Level 37 - 'Sublimity'",
    "desc": "Calm Poolrooms biome with healing water, irregular geometry, and dangerous submerged pits.",
    "hook": "Offer healing and respite while hiding traversal puzzles beneath apparently safe pools.",
    "unlockCost": 803177000,
    "mult": 17.49,
    "rating": 308,
    "scene": "void",
    "verb": "DRIFT",
    "icon": "\u2726",
    "hue": 251
  },
  {
    "id": "level-69",
    "name": "Level 69 - 'The Road Trip of Affliction'",
    "desc": "Vehicle-bound road survival map with fog, finite light, and pursuit encounters.",
    "hook": "Make fuel, visibility, and roadside stops the resource loop of a continuous chase.",
    "unlockCost": 2690460000,
    "mult": 18.93,
    "rating": 118,
    "scene": "ruins",
    "verb": "SIFT",
    "icon": "\u25c8",
    "hue": 298
  },
  {
    "id": "level-200",
    "name": "Level 200 - 'Home'",
    "desc": "Large uncanny town supporting NPC services, social play, and a hidden-state mystery.",
    "hook": "Use a comfortable civic hub whose normality slowly reveals a concealed world state.",
    "unlockCost": 9012800000,
    "mult": 20.4,
    "rating": 192,
    "scene": "suburb",
    "verb": "SCAVENGE",
    "icon": "\u2302",
    "hue": 345
  },
  {
    "id": "level-263",
    "name": "Level 263 - 'Untextured'",
    "desc": "Glitched checkerboard space with visual noise, broken geometry, and unstable enemies.",
    "hook": "Let visual corruption alter collision, enemy rules, and navigable geometry.",
    "unlockCost": 30192600000,
    "mult": 21.88,
    "rating": 154,
    "scene": "digital",
    "verb": "GLITCH",
    "icon": "\u2593",
    "hue": 32
  },
  {
    "id": "level-289",
    "name": "Level 289 - 'Overflow'",
    "desc": "Flooded unfinished basement with electrified water, scaffolding, entities, and escape pressure.",
    "hook": "Route players across scaffolds while water level and electrical danger reshape safe paths.",
    "unlockCost": 101145000000,
    "mult": 23.37,
    "rating": 184,
    "scene": "water",
    "verb": "WADE",
    "icon": "\u2248",
    "hue": 79
  },
  {
    "id": "level-404",
    "name": "level 404 - 'my dearly fragmented'",
    "desc": "Endgame anomaly zone built from data fragmentation, memory loss, and broken geometry.",
    "hook": "Fragment the map, codex, and remembered objectives as the player advances.",
    "unlockCost": 338835000000,
    "mult": 24.88,
    "rating": 425,
    "scene": "digital",
    "verb": "GLITCH",
    "icon": "\u2593",
    "hue": 126
  },
  {
    "id": "level-601",
    "name": "Level 601 - 'The End'",
    "desc": "False-exit library with looping geometry, deceptive terminals, ambushes, and fake realities.",
    "hook": "Present convincing exits and system messages that can strand players in deeper loops.",
    "unlockCost": 1135100000000,
    "mult": 26.4,
    "rating": 162,
    "scene": "void",
    "verb": "DRIFT",
    "icon": "\u2726",
    "hue": 173
  },
  {
    "id": "level-906",
    "name": "Level 906 - 'The Cygnus Archive'",
    "desc": "Infinite gothic archive and knowledge hub centered on Blanche, books, and portal lore.",
    "hook": "Turn recovered books into portal access, crafting knowledge, and Blanche reputation.",
    "unlockCost": 3802570000000,
    "mult": 27.94,
    "rating": 179,
    "scene": "void",
    "verb": "DRIFT",
    "icon": "\u2726",
    "hue": 220
  },
  {
    "id": "level-999",
    "name": "Level 999",
    "desc": "Finite monochrome island in a starry void suited to a finale or end-state journey.",
    "hook": "Use desaturation and isolation to stage a reflective endgame destination.",
    "unlockCost": 12738600000000,
    "mult": 29.5,
    "rating": 143,
    "scene": "void",
    "verb": "DRIFT",
    "icon": "\u2726",
    "hue": 267
  },
  {
    "id": "the-hub",
    "name": "Unnumbered Level - 'The Hub'",
    "desc": "Central door nexus for fast travel, faction outposts, and the Keymaster.",
    "hook": "Gate the travel network behind discovered doors, keys, and faction control.",
    "unlockCost": 42674400000000,
    "mult": 31.06,
    "rating": 167,
    "scene": "neon",
    "verb": "SLIP",
    "icon": "\u25c6",
    "hue": 314
  },
  {
    "id": "blue-channel",
    "name": "Unnumbered Level - 'The Blue Channel'",
    "desc": "Inter-level void with swimming-like zero-gravity movement and isolated scene landmarks.",
    "hook": "Let players move between exposed level fragments through a disorienting void.",
    "unlockCost": 142959000000000,
    "mult": 32.64,
    "rating": 160,
    "scene": "water",
    "verb": "WADE",
    "icon": "\u2248",
    "hue": 1
  },
  {
    "id": "red-rooms",
    "name": "Red Rooms",
    "desc": "Level 0 sub-dungeon with mold, communications decay, paranoia, and near-impossible escape.",
    "hook": "Lock escape routes as mold and paranoia intensify during a high-stakes delve.",
    "unlockCost": 478913000000000,
    "mult": 34.23,
    "rating": 114,
    "scene": "neon",
    "verb": "SLIP",
    "icon": "\u25c6",
    "hue": 48
  },
  {
    "id": "manila-room",
    "name": "The Manila Room",
    "desc": "Rare safe room suitable as tutorial archive, meeting point, and checkpoint.",
    "hook": "Use a difficult-to-find refuge to deliver early lore and restore the player.",
    "unlockCost": 1604360000000000,
    "mult": 35.84,
    "rating": 108,
    "scene": "office",
    "verb": "RUMMAGE",
    "icon": "\u25a6",
    "hue": 95
  },
  {
    "id": "level-0-1",
    "name": "Level 0.1 - 'Zenith Station'",
    "desc": "Vast space station and failed wormhole experiment for a science-fiction expedition.",
    "hook": "Explore station systems while reconstructing a disastrous transit experiment.",
    "unlockCost": 5374600000000000,
    "mult": 37.46,
    "rating": 135,
    "scene": "void",
    "verb": "DRIFT",
    "icon": "\u2726",
    "hue": 142
  },
  {
    "id": "level-0-2",
    "name": "Level 0.2 - 'Remodeled Mess'",
    "desc": "Pristine Level 0 variant that destabilizes after physical interaction.",
    "hook": "Make touch itself the trigger that corrupts safe-looking routes and loot rooms.",
    "unlockCost": 18004900000000000,
    "mult": 39.09,
    "rating": 119,
    "scene": "office",
    "verb": "RUMMAGE",
    "icon": "\u25a6",
    "hue": 189
  },
  {
    "id": "level-1-1",
    "name": "Level 1.1 - 'Corrupted Corridor'",
    "desc": "Multi-sector expedition gauntlet with declining supplies and rising enemy density.",
    "hook": "Escalate danger across sectors while denying easy resupply or retreat.",
    "unlockCost": 60316500000000000,
    "mult": 40.73,
    "rating": 116,
    "scene": "digital",
    "verb": "GLITCH",
    "icon": "\u2593",
    "hue": 236
  },
  {
    "id": "level-1-3",
    "name": "Level 1.3 - 'Malignance'",
    "desc": "Healing hospital and contested medical resource with Detox Zones and faction defense.",
    "hook": "Tie healing access to defense events and control of scarce medical zones.",
    "unlockCost": 202060000000000000,
    "mult": 42.38,
    "rating": 118,
    "scene": "dark",
    "verb": "FEEL",
    "icon": "\u25d0",
    "hue": 283
  },
  {
    "id": "level-5-1",
    "name": "Level 5.1 - 'GRAND OPENING OF THE TERROR HOTEL CASINO'",
    "desc": "Casino hub-dungeon with wagers, rare loot, staff NPCs, and Beast encounters.",
    "hook": "Let players wager resources and danger for casino-specific gear and routes.",
    "unlockCost": 676901000000000000,
    "mult": 44.04,
    "rating": 145,
    "scene": "hotel",
    "verb": "CREEP",
    "icon": "\ud83d\udeaa",
    "hue": 330
  },
  {
    "id": "level-6-1",
    "name": "Level 6.1 - 'The Snackrooms'",
    "desc": "Mall-food labyrinth with merchants, consumables, faction bases, and breach events.",
    "hook": "Anchor the food economy in a merchant hub periodically disrupted by hostile breaches.",
    "unlockCost": 2267620000000000000,
    "mult": 45.72,
    "rating": 124,
    "scene": "suburb",
    "verb": "SCAVENGE",
    "icon": "\u2302",
    "hue": 17
  },
  {
    "id": "level-11-3",
    "name": "Level 11.3 - 'The Red Light District'",
    "desc": "Endgame urban zone with psychoactive air, red lightning, and mask-based mitigation.",
    "hook": "Require protective masks while storms and altered perception transform combat.",
    "unlockCost": 7596530000000000000,
    "mult": 47.4,
    "rating": 123,
    "scene": "neon",
    "verb": "SLIP",
    "icon": "\u25c6",
    "hue": 64
  },
  {
    "id": "th3-sh4dy-gr3y",
    "name": "Unnumbered Level - 'Th3 Sh4dy Gr3y'",
    "desc": "Cluster of unstable sublevels with extreme temperatures, factions, and entities.",
    "hook": "Chain mechanically incompatible sublevels into an endgame expedition.",
    "unlockCost": 25448400000000000000,
    "mult": 49.1,
    "rating": 251,
    "scene": "dark",
    "verb": "FEEL",
    "icon": "\u25d0",
    "hue": 111
  },
  {
    "id": "deleted-level-14",
    "name": "Unnumbered Level - 'Deleted Level 14'",
    "desc": "Abandoned military hospital with dangerous medical loot, phasing ghosts, and a route puzzle.",
    "hook": "Use repeatable route patterns to evade phasing enemies and reach surgical loot.",
    "unlockCost": 85252000000000000000,
    "mult": 50.8,
    "rating": 142,
    "scene": "digital",
    "verb": "GLITCH",
    "icon": "\u2593",
    "hue": 158
  },
  {
    "id": "level-611",
    "name": "Level 611 - 'The maze, the creatures, the monster'",
    "desc": "Filthy mixed-architecture maze with structural hazards and a Sentinel boss.",
    "hook": "Telegraph a persistent Sentinel through maze damage before the final confrontation.",
    "unlockCost": 285594000000000000000,
    "mult": 52.52,
    "rating": 131,
    "scene": "cave",
    "verb": "CRAWL",
    "icon": "\u26f0",
    "hue": 205
  }
];

export const GENERATORS: Generator[] = [
  {
    "id": "entity-140",
    "name": "Entity 140 - 'Blanche'",
    "desc": "Archive guardian Blanche is a knowledge-focused quest giver and social NPC.",
    "hook": "Reward book recovery, manners, and lore discovery with knowledge and archive access.",
    "baseCost": 18,
    "baseProd": 0.15,
    "rating": 233
  },
  {
    "id": "entity-71",
    "name": "Entity 71 - 'The Red Knight'",
    "desc": "Roaming champion who can rescue, duel, train, or accompany the player.",
    "hook": "Use reputation and conduct to decide whether the Red Knight aids or challenges the player.",
    "baseCost": 111.6,
    "baseProd": 0.765,
    "rating": 172
  },
  {
    "id": "the-m-e-g",
    "name": "The M.E.G.",
    "desc": "Friendly exploration faction with regiments, divisions, outposts, and discovery work.",
    "hook": "Progress from volunteer expeditions into specialized regiments and outpost command.",
    "baseCost": 691.92,
    "baseProd": 3.9015,
    "rating": 169
  },
  {
    "id": "entity-106",
    "name": "Entity 106 - 'tgochi.exe'",
    "desc": "Sentient software companion found on USB keys that possesses electronics and changes over time.",
    "hook": "Develop a digital pet through care, device possession, and conditional buffs or debuffs.",
    "baseCost": 4289.9,
    "baseProd": 19.8976,
    "rating": 90
  },
  {
    "id": "backrooms-remodeling-co",
    "name": "Backrooms Remodeling Co",
    "desc": "Militarized builders whose improvements catastrophically alter levels.",
    "hook": "Let remodeling operations split familiar zones into dangerous altered sublayers.",
    "baseCost": 26597.4,
    "baseProd": 101.478,
    "rating": 87
  },
  {
    "id": "entity-29",
    "name": "Entity 29 - \u201cBlub Cats\u201d",
    "desc": "Tameable telepathic pet family with pack behavior and unusual consumable tolerance.",
    "hook": "Offer variant pets whose pack traits and consumable reactions support different builds.",
    "baseCost": 164904,
    "baseProd": 517.538,
    "rating": 87
  },
  {
    "id": "a-river",
    "name": "A. River",
    "desc": "Missing archivist and infrastructure expert altered by Level 404.",
    "hook": "Trace database corruption and lost infrastructure to locate a transformed archivist.",
    "baseCost": 1022400,
    "baseProd": 2639.44,
    "rating": 86
  },
  {
    "id": "the-eyes-of-argos",
    "name": "The Eyes Of Argos",
    "desc": "Justice faction suited to crime, trials, patrol branches, and bounty systems.",
    "hook": "Track crimes and restitution through wanted levels, trials, patrols, and bounties.",
    "baseCost": 6338910,
    "baseProd": 13461.2,
    "rating": 83
  },
  {
    "id": "the-masked-maidens",
    "name": "Welcome to the Masked Maidens Database.",
    "desc": "Mask-powered infiltrator cells fighting corruption through disguise and espionage.",
    "hook": "Use masks and identities to infiltrate hostile sectors and expose corruption.",
    "baseCost": 39301200,
    "baseProd": 68651.9,
    "rating": 82
  },
  {
    "id": "the-lost",
    "name": "The Lost",
    "desc": "Ancient allied cultures offering relic gear, historical lore, and collective defense.",
    "hook": "Earn access to tribal relics by recovering history and defending old settlements.",
    "baseCost": 243668000,
    "baseProd": 350125,
    "rating": 80
  },
  {
    "id": "the-pantheon",
    "name": "The Pantheon",
    "desc": "Endgame cosmology connecting major unique entities as gods.",
    "hook": "Tie boons, curses, temples, and raid arcs to competing divine allegiances.",
    "baseCost": 1510740000,
    "baseProd": 1785640,
    "rating": 76
  },
  {
    "id": "the-u-e-c",
    "name": "The U.E.C.",
    "desc": "Paramilitary coalition with squads, colonies, technology, and ideological conflict.",
    "hook": "Stage competing exploration campaigns and technology races against the M.E.G.",
    "baseCost": 9366580000,
    "baseProd": 9106750,
    "rating": 75
  },
  {
    "id": "lines-please",
    "name": "Notable Person - The Actor",
    "desc": "Recurring stranger associated with plant growth, repeated deaths, and improvised weapons.",
    "hook": "Reintroduce the Actor after apparent deaths with changing motives and combat styles.",
    "baseCost": 58072800000,
    "baseProd": 46444400,
    "rating": 71
  },
  {
    "id": "the-black-knights",
    "name": "The Black Knights",
    "desc": "Non-human tactical units with exotic armor that become lethal when obstructed.",
    "hook": "Let players avoid, cooperate with, or provoke dangerous units for rare salvage.",
    "baseCost": 360051000000,
    "baseProd": 236866000,
    "rating": 59
  },
  {
    "id": "followers-of-jerry",
    "name": "Followers of Jerry",
    "desc": "Indoctrinating cult centered on Jerry, sanctuaries, doctrine, and recruitment.",
    "hook": "Use contact and recruitment pressure to turn neutral settlements into cult territory.",
    "baseCost": 2232320000000,
    "baseProd": 1208020000,
    "rating": 56
  },
  {
    "id": "tom-von-haderach",
    "name": "Tom Von Haderach",
    "desc": "Blanche's planar courier and recurring retrieval or delivery quest giver.",
    "hook": "Connect distant factions through book retrieval, rare-object delivery, and messages.",
    "baseCost": 13840400000000,
    "baseProd": 6160900000,
    "rating": 54
  },
  {
    "id": "eden-g",
    "name": "Eden G",
    "desc": "Missing entity expert who communicated peacefully and returned transformed from Heaven.",
    "hook": "Build a rescue arc around peaceful entity contact and uncertain transformation.",
    "baseCost": 85810300000000,
    "baseProd": 31420600000,
    "rating": 53
  },
  {
    "id": "the-b-n-t-g",
    "name": "The B.N.T.G.",
    "desc": "Merchant faction controlling trade, manufacturing, agriculture, stockpiles, and services.",
    "hook": "Make regional prices and crafting access respond to B.N.T.G. supply lines and diplomacy.",
    "baseCost": 532024000000000,
    "baseProd": 160245000000,
    "rating": 50
  },
  {
    "id": "kimiko",
    "name": "Kimiko",
    "desc": "Shapeshifting infiltrator with blue-fire orbs and flame walls.",
    "hook": "Mix disguise detection with blue-fire zoning in an infiltrator encounter.",
    "baseCost": 3298550000000000,
    "baseProd": 817249000000,
    "rating": 50
  },
  {
    "id": "entity-9",
    "name": "Entity 9 - 'Facelings'",
    "desc": "Neutral faceless population with adult, child, emotional, evolved, shadow, and mimic variants.",
    "hook": "Use silhouette and behavior rather than faces to distinguish traders, civilians, and threats.",
    "baseCost": 20451000000000000,
    "baseProd": 4167970000000,
    "rating": 46
  },
  {
    "id": "janus",
    "name": "Janus",
    "desc": "Doorway traveler whose eyes reveal possible futures and the past.",
    "hook": "Trade future telegraphs and past reconstruction against branching-choice consequences.",
    "baseCost": 126796000000000000,
    "baseProd": 21256600000000,
    "rating": 44
  },
  {
    "id": "the-augur",
    "name": "The Augur",
    "desc": "Traveling prophet whose accurate knowledge carries a non-monetary cost.",
    "hook": "Offer reliable predictions that impose narrative, reputation, or memory costs.",
    "baseCost": 786137000000000000,
    "baseProd": 108409000000000,
    "rating": 34
  },
  {
    "id": "herne-the-huntmaster",
    "name": "Herne The Huntmaster",
    "desc": "Primordial Wild Hunt master who accepts offerings and grants travel or longevity.",
    "hook": "Use player-made offerings to unlock hunts, travel routes, or extended-life boons.",
    "baseCost": 4874050000000000000,
    "baseProd": 552885000000000,
    "rating": 33
  }
];

export const GEAR: Gear[] = [
  // ===== WEAPONS (click power + crit) — 7 items, scaling with delve depth =====
  {
    "id": "weapon-rusty-pipe",
    "name": "Rusty Pipe",
    "desc": "A corroded pipe pulled from the walls. Crude but effective in a swing.",
    "hook": "Every wanderer's first weapon — found wedged behind a ceiling tile.",
    "slot": "Weapon",
    "rarity": "common",
    "cost": 100,
    "stats": { "clickMult": 1.15, "prodMult": 1.0, "luck": 0.0, "crit": 0.03 },
    "rating": 10,
    "minDelveRoom": 3
  },
  {
    "id": "weapon-firesalt-shard",
    "name": "Firesalt Shard",
    "desc": "A fragment of explosive crystal. Warm to the touch, volatile in a fist.",
    "hook": "Refined from raw Object 15 — size determines whether it's a grenade or a blade.",
    "slot": "Weapon",
    "rarity": "uncommon",
    "cost": 500,
    "stats": { "clickMult": 1.28, "prodMult": 1.0, "luck": 0.0, "crit": 0.06 },
    "rating": 25,
    "minDelveRoom": 8
  },
  {
    "id": "weapon-lightning-bottle",
    "name": "Lightning In A Bottle",
    "desc": "Trapped electrical charge that arcs through anything conductive — including entities.",
    "hook": "Fragile, deadly, and eager to find the nearest conductor.",
    "slot": "Weapon",
    "rarity": "rare",
    "cost": 2500,
    "stats": { "clickMult": 1.40, "prodMult": 1.0, "luck": 0.0, "crit": 0.09 },
    "rating": 45,
    "minDelveRoom": 13
  },
  {
    "id": "weapon-liquid-pain",
    "name": "Liquid Pain Vial",
    "desc": "A forbidden poison disguised as Almond Water. One splash dissolves entity flesh.",
    "hook": "Unidentified until tested — the cure looks identical to the killer.",
    "slot": "Weapon",
    "rarity": "rare",
    "cost": 12000,
    "stats": { "clickMult": 1.52, "prodMult": 1.0, "luck": 0.0, "crit": 0.12 },
    "rating": 60,
    "minDelveRoom": 18
  },
  {
    "id": "weapon-voidstone-edge",
    "name": "Voidstone Edge",
    "desc": "A blade of frictionless, indestructible stone. Cuts through anything without resistance.",
    "hook": "Immutable material — the edge never dulls because nothing can wear it down.",
    "slot": "Weapon",
    "rarity": "epic",
    "cost": 60000,
    "stats": { "clickMult": 1.65, "prodMult": 1.0, "luck": 0.0, "crit": 0.15 },
    "rating": 78,
    "minDelveRoom": 23
  },
  {
    "id": "weapon-retributor",
    "name": "Retributor Pistol",
    "desc": "Soul-bound firearm that scales with the wielder's will — and mirrors their wounds back.",
    "hook": "The stronger your resolve, the harder it hits. The pain is shared.",
    "slot": "Weapon",
    "rarity": "epic",
    "cost": 300000,
    "stats": { "clickMult": 1.78, "prodMult": 1.0, "luck": 0.0, "crit": 0.18 },
    "rating": 90,
    "minDelveRoom": 28
  },
  {
    "id": "weapon-abyssal-blade",
    "name": "Abyssal Blade",
    "desc": "A weapon forged in the deepest dark. It hums with hunger and never stops drinking.",
    "hook": "Only found in the Abyss — it cuts holes in reality itself.",
    "slot": "Weapon",
    "rarity": "mythic",
    "cost": 1500000,
    "stats": { "clickMult": 2.00, "prodMult": 1.0, "luck": 0.05, "crit": 0.22 },
    "rating": 120,
    "minDelveRoom": 33,
    "abyssOnly": true
  },

  // ===== LIGHT (production + luck) — 7 items =====
  {
    "id": "light-glowstick",
    "name": "Glowstick Remnant",
    "desc": "A dying chemical light. Faint, flickering, but it pushes back the dark for now.",
    "hook": "Found clutched in the hand of a previous wanderer who didn't make it.",
    "slot": "Light",
    "rarity": "common",
    "cost": 100,
    "stats": { "clickMult": 1.0, "prodMult": 1.15, "luck": 0.03, "crit": 0.0 },
    "rating": 10,
    "minDelveRoom": 3
  },
  {
    "id": "light-warpberry-lantern",
    "name": "Warpberry Lantern",
    "desc": "Berries sealed in a glass casing that glow brighter near their discovery level.",
    "hook": "Crafted from Object 74 — the light remembers where it was born.",
    "slot": "Light",
    "rarity": "uncommon",
    "cost": 500,
    "stats": { "clickMult": 1.0, "prodMult": 1.28, "luck": 0.06, "crit": 0.0 },
    "rating": 25,
    "minDelveRoom": 8
  },
  {
    "id": "light-hyrum-lantern",
    "name": "Hyrum Lantern",
    "desc": "Faith-powered lamp that repels entities and calms the holder's nerves.",
    "hook": "The flame burns brighter with conviction — and sears those who lack it.",
    "slot": "Light",
    "rarity": "rare",
    "cost": 2500,
    "stats": { "clickMult": 1.0, "prodMult": 1.40, "luck": 0.09, "crit": 0.0 },
    "rating": 45,
    "minDelveRoom": 13
  },
  {
    "id": "light-candy-beacon",
    "name": "Candy Beacon",
    "desc": "A stack of glowing candies arranged into a crude signal tower.",
    "hook": "Manufactured buffs, repurposed as a light source. Sweet and dangerous.",
    "slot": "Light",
    "rarity": "rare",
    "cost": 12000,
    "stats": { "clickMult": 1.0, "prodMult": 1.52, "luck": 0.12, "crit": 0.0 },
    "rating": 60,
    "minDelveRoom": 18
  },
  {
    "id": "light-seer-tea-lamp",
    "name": "Seer Tea Lamp",
    "desc": "A lamp fueled by precognitive tea. Its light flickers toward things yet to come.",
    "hook": "Brewed from entity remains — the flame sees a second into the future.",
    "slot": "Light",
    "rarity": "epic",
    "cost": 60000,
    "stats": { "clickMult": 1.0, "prodMult": 1.65, "luck": 0.15, "crit": 0.0 },
    "rating": 78,
    "minDelveRoom": 23
  },
  {
    "id": "light-starlight-vessel",
    "name": "Starlight Vessel",
    "desc": "A bottle of captured starlight from a level where the ceiling opened to a void sky.",
    "hook": "The light never dims — it's not from this place.",
    "slot": "Light",
    "rarity": "epic",
    "cost": 300000,
    "stats": { "clickMult": 1.0, "prodMult": 1.78, "luck": 0.18, "crit": 0.0 },
    "rating": 90,
    "minDelveRoom": 28
  },
  {
    "id": "light-abyssal-eye",
    "name": "Abyssal Eye",
    "desc": "A floating, luminous eye that sees through every wall. It blinks when danger approaches.",
    "hook": "Plucked from something that lived in the Abyss. It still watches.",
    "slot": "Light",
    "rarity": "mythic",
    "cost": 1500000,
    "stats": { "clickMult": 1.0, "prodMult": 2.00, "luck": 0.25, "crit": 0.0 },
    "rating": 120,
    "minDelveRoom": 33,
    "abyssOnly": true
  },

  // ===== ARMOR (balanced click + prod) — 7 items =====
  {
    "id": "armor-torn-hazmat",
    "name": "Torn Hazmat Suit",
    "desc": "A patched, yellowed suit that still filters the worst of the air. Barely.",
    "hook": "Standard issue for wanderers who expected contamination, not entities.",
    "slot": "Armor",
    "rarity": "common",
    "cost": 100,
    "stats": { "clickMult": 1.08, "prodMult": 1.08, "luck": 0.0, "crit": 0.0 },
    "rating": 10,
    "minDelveRoom": 3
  },
  {
    "id": "armor-compression-cube",
    "name": "Compression Cube Plate",
    "desc": "Armor woven from captured compression volumes. Punishes anything that strikes it.",
    "hook": "Mistime the compression and it folds you instead of the attacker.",
    "slot": "Armor",
    "rarity": "uncommon",
    "cost": 500,
    "stats": { "clickMult": 1.12, "prodMult": 1.12, "luck": 0.0, "crit": 0.0 },
    "rating": 25,
    "minDelveRoom": 8
  },
  {
    "id": "armor-temporal-watch",
    "name": "Temporal Apotheosis Vest",
    "desc": "A vest threaded with pocket-watch gears that occasionally rewinds a fatal blow.",
    "hook": "The countdown ticks. When it hits zero, reality stutters and you're somewhere else.",
    "slot": "Armor",
    "rarity": "rare",
    "cost": 2500,
    "stats": { "clickMult": 1.16, "prodMult": 1.16, "luck": 0.0, "crit": 0.0 },
    "rating": 45,
    "minDelveRoom": 13
  },
  {
    "id": "armor-dark-reparation",
    "name": "Dark Reparation Plate",
    "desc": "Armor forged from unidentified vials. It heals you in ways you'd rather not examine.",
    "hook": "The crystal colors change every time you look away. Don't drink the runoff.",
    "slot": "Armor",
    "rarity": "rare",
    "cost": 12000,
    "stats": { "clickMult": 1.20, "prodMult": 1.20, "luck": 0.0, "crit": 0.0 },
    "rating": 60,
    "minDelveRoom": 18
  },
  {
    "id": "armor-wall-mask",
    "name": "Wall Mask Carapace",
    "desc": "A cursed mask fused to chest armor. It grants power and whispers what to do with it.",
    "hook": "The mask chooses the wearer. The behavior changes are... optional. Mostly.",
    "slot": "Armor",
    "rarity": "epic",
    "cost": 60000,
    "stats": { "clickMult": 1.24, "prodMult": 1.24, "luck": 0.0, "crit": 0.0 },
    "rating": 78,
    "minDelveRoom": 23
  },
  {
    "id": "armor-mirror-aegis",
    "name": "Mirror Aegis",
    "desc": "A shield of polished Backrooms glass. Entities see themselves in it and hesitate.",
    "hook": "Reflections in this glass don't match. That's the point — that's the defense.",
    "slot": "Armor",
    "rarity": "epic",
    "cost": 300000,
    "stats": { "clickMult": 1.28, "prodMult": 1.28, "luck": 0.0, "crit": 0.0 },
    "rating": 90,
    "minDelveRoom": 28
  },
  {
    "id": "armor-abyssal-carapace",
    "name": "Abyssal Carapace",
    "desc": "Armor grown from Abyssal chitin. It adapts to whatever the dark throws at you.",
    "hook": "It was alive once. Parts of it still are. It remembers the shape of its host.",
    "slot": "Armor",
    "rarity": "mythic",
    "cost": 1500000,
    "stats": { "clickMult": 1.35, "prodMult": 1.35, "luck": 0.0, "crit": 0.05 },
    "rating": 120,
    "minDelveRoom": 33,
    "abyssOnly": true
  },

  // ===== TRINKET (luck + balanced) — 7 items =====
  {
    "id": "trinket-level-key",
    "name": "Level Key Fragment",
    "desc": "A broken key still warm with attunement. It hums near locked doors.",
    "hook": "Half a key from Object 2 — enough to open half a door, which is sometimes enough.",
    "slot": "Trinket",
    "rarity": "common",
    "cost": 100,
    "stats": { "clickMult": 1.06, "prodMult": 1.06, "luck": 0.04, "crit": 0.0 },
    "rating": 10,
    "minDelveRoom": 3
  },
  {
    "id": "trinket-almond-flask",
    "name": "Almond Water Flask",
    "desc": "A sealed flask of the lifeblood of the Backrooms. Trade it, drink it, or wield it.",
    "hook": "Object 1 in its purest form — the contaminated variants are worth more... and worse.",
    "slot": "Trinket",
    "rarity": "uncommon",
    "cost": 500,
    "stats": { "clickMult": 1.10, "prodMult": 1.10, "luck": 0.07, "crit": 0.0 },
    "rating": 25,
    "minDelveRoom": 8
  },
  {
    "id": "trinket-pockets",
    "name": "Pockets",
    "desc": "A small jewel that opens into a frozen, infinite inventory space.",
    "hook": "Time stops inside. Pull out what you need, when you need it — if you can find it.",
    "slot": "Trinket",
    "rarity": "rare",
    "cost": 2500,
    "stats": { "clickMult": 1.14, "prodMult": 1.14, "luck": 0.10, "crit": 0.0 },
    "rating": 45,
    "minDelveRoom": 13
  },
  {
    "id": "trinket-hermes-compass",
    "name": "Hermes Compass",
    "desc": "A biomechanical navigation device built from a brain, a key, and liquid electricity.",
    "hook": "Object 99 miniaturized — it points toward exits. Sometimes it points toward things that point back.",
    "slot": "Trinket",
    "rarity": "rare",
    "cost": 12000,
    "stats": { "clickMult": 1.18, "prodMult": 1.18, "luck": 0.12, "crit": 0.0 },
    "rating": 60,
    "minDelveRoom": 18
  },
  {
    "id": "trinket-cookbook-tome",
    "name": "Ultimate Cookbook Tome",
    "desc": "A recipe book that combines Backrooms objects into food, drinks, and Memory Juice.",
    "hook": "Each page unlocked is a new buff recipe. Some pages are stuck together with something.",
    "slot": "Trinket",
    "rarity": "epic",
    "cost": 60000,
    "stats": { "clickMult": 1.22, "prodMult": 1.22, "luck": 0.15, "crit": 0.0 },
    "rating": 78,
    "minDelveRoom": 23
  },
  {
    "id": "trinket-ariadne-string",
    "name": "Ariadne's String",
    "desc": "A navigation relic that reveals exits, hazards, entities, and maze instructions.",
    "hook": "The string knows the way. Anomalous zones make it lie, but it lies consistently.",
    "slot": "Trinket",
    "rarity": "epic",
    "cost": 300000,
    "stats": { "clickMult": 1.26, "prodMult": 1.26, "luck": 0.18, "crit": 0.0 },
    "rating": 90,
    "minDelveRoom": 28
  },
  {
    "id": "trinket-abyssal-core",
    "name": "Abyssal Core",
    "desc": "A pulsing orb of compressed dark. It bends luck itself toward you.",
    "hook": "The Abyss gave this up reluctantly. It still pulls, gently, toward the deep.",
    "slot": "Trinket",
    "rarity": "mythic",
    "cost": 1500000,
    "stats": { "clickMult": 1.33, "prodMult": 1.33, "luck": 0.25, "crit": 0.05 },
    "rating": 120,
    "minDelveRoom": 33,
    "abyssOnly": true
  }
];

export const ENCOUNTERS: Encounter[] = [
  {
    "id": "entity-3",
    "name": "Entity 3 - 'Smilers'",
    "desc": "Iconic darkness stalker controlled through light, noise, and eye contact.",
    "hook": "Let eye contact suppress pursuit while thrown lights create decoys or attract danger.",
    "boss": false,
    "rating": 242
  },
  {
    "id": "entity-8",
    "name": "Entity 8 - 'Hound'",
    "desc": "Fast common melee predator with readable growls and a brief eye-contact response.",
    "hook": "Use growls as an aggro warning and direct gaze as a short high-risk stagger.",
    "boss": false,
    "rating": 198
  },
  {
    "id": "entity-10",
    "name": "Entity 10 - 'Skin-Stealer'",
    "desc": "Skin-wearing mimic whose hunger state changes between docile and predatory behavior.",
    "hook": "Signal disguised mimics through translucent blood and food-reactive aggression.",
    "boss": false,
    "rating": 171
  },
  {
    "id": "entity-67",
    "name": "Entity 67 - 'Partygoers =)'",
    "desc": "Infectious Partygoer with a natural multi-stage weak-point combat sequence.",
    "hook": "Sever transforming arms, survive a berserk phase, then strike the opened chest or head.",
    "boss": false,
    "rating": 143
  },
  {
    "id": "entity-5",
    "name": "Entity 5 - 'Clump'",
    "desc": "Small high-speed vent ambusher that drags prey toward a central mouth.",
    "hook": "Use narrow geometry and a long grab limb to punish careless positioning.",
    "boss": false,
    "rating": 135
  },
  {
    "id": "entity-15",
    "name": "Entity 15 - 'Wretches'",
    "desc": "Former-human wretches embody the endpoint of failed survival-resource management.",
    "hook": "Turn prolonged hunger, thirst, sleeplessness, and isolation into a transformation threat.",
    "boss": false,
    "rating": 103
  },
  {
    "id": "entity-50",
    "name": "Entity 50 - 'The Numbed Man'",
    "desc": "Knowledge-linked hunter that becomes better able to locate anyone who reads about it.",
    "hook": "Make opening its lore entry advance a pursuit meter while revealing combat counters.",
    "boss": false,
    "rating": 86
  },
  {
    "id": "entity-2",
    "name": "Entity 2 - 'The Windows'",
    "desc": "Stationary cognitive trap manifesting personalized false exits.",
    "hook": "Generate tempting escape vistas from the player's goals and recent losses.",
    "boss": false,
    "rating": 57
  },
  {
    "id": "the-ghost-killer",
    "name": "The Ghost Killer",
    "desc": "Eyes of Argos assassin using knives, sais, throwing blades, and garrotes.",
    "hook": "Stage stalking encounters whose calling-card trophies reveal the target pattern.",
    "boss": false,
    "rating": 35
  },
  {
    "id": "entity-7",
    "name": "Entity 7 - 'Jerry'",
    "desc": "Unique tameable parrot and cult focus whose touch indoctrinates victims.",
    "hook": "Allow taming with seeds or Almond Water while cult influence creates a rival outcome.",
    "boss": true,
    "rating": 184
  },
  {
    "id": "entity-18",
    "name": "Entity 18 - 'The Beast of Level 5'",
    "desc": "Intelligent Terror Hotel owner suited to bargains, patronage, and recurring boss encounters.",
    "hook": "Make bargains with the hotel owner alter access, hostility, and the eventual boss fight.",
    "boss": true,
    "rating": 182
  },
  {
    "id": "partygoer-zero",
    "name": "Partygoer Zero",
    "desc": "Named Partygoer chimera suited to a multi-stage commander encounter.",
    "hook": "Combine human, crustacean, lamprey, centipede, and technological attacks across phases.",
    "boss": true,
    "rating": 72
  }
];

export const FINALE: Finale = {
  "id": "nostalgi-gaius",
  "name": "Unnumbered Entity - 'Nostalgi Gaius'",
  "desc": "Endgame infohazard and pursuer tied to Level 404 and dangerous knowledge.",
  "hook": "Increase encounter probability as the player learns and records more about the entity.",
  "rating": 199
};

export const PHENOMENA: Phenomenon[] = [
  {
    "id": "phenomenon-5",
    "name": "Phenomenon 5 - 'No-clipping'",
    "desc": "Core stable, conditional, or unpredictable teleportation through obstacles and levels.",
    "hook": "Use learned no-clip conditions as shortcuts while unstable attempts risk displacement.",
    "effect": "clickX2",
    "label": "Click power doubled",
    "rating": 126
  },
  {
    "id": "phenomenon-7",
    "name": "Phenomenon 7 - 'Liminal Echo'",
    "desc": "Psychic contamination that mutates environments and sustains global sanity pressure.",
    "hook": "Apply region-wide mental pressure that explains escalating environmental hostility.",
    "effect": "prodX2",
    "label": "Production doubled",
    "rating": 103
  },
  {
    "id": "phenomenon-2",
    "name": "Phenomenon 2 - 'Blood Moons'",
    "desc": "Timed blood-flood event telegraphed by red light and panic.",
    "hook": "Give five minutes to reach shelter or high ground before a level-wide flood.",
    "effect": "burst",
    "label": "Instant Almond Water burst",
    "rating": 49
  },
  {
    "id": "phenomenon-55",
    "name": "Phenomenon 55 - 'GODHAND'",
    "desc": "Violence-induced berserker state grants strength and euphoria while eroding humanity.",
    "hook": "Reward continued unarmed violence with power while escalating loss of control.",
    "effect": "clickX3",
    "label": "Click power tripled",
    "rating": 49
  },
  {
    "id": "phenomenon-13",
    "name": "Phenomenon 13 - 'A Way Out'",
    "desc": "Cult-controlled seven-step meditation allegedly returns people to the Frontrooms.",
    "hook": "Make escape depend on a morally uncertain ritual chain and unreliable guides.",
    "effect": "prodX3",
    "label": "Production tripled",
    "rating": 47
  },
  {
    "id": "phenomenon-15",
    "name": "Phenomenon 15 - 'Inversion'",
    "desc": "Color and audio warning precede a level-wide gravity reversal.",
    "hook": "Telegraph inversion clearly, then move combat and falling hazards onto the ceiling.",
    "effect": "luck",
    "label": "Fortune surges (loot & events)",
    "rating": 42
  },
  {
    "id": "phenomenon-32",
    "name": "Phenomenon 32 - 'Level Velocity'",
    "desc": "Moving levels collide, alter exits, expose regions, and destabilize collision.",
    "hook": "Change the world graph as level collisions open and close routes.",
    "effect": "clickX2",
    "label": "Click power doubled",
    "rating": 41
  },
  {
    "id": "phenomenon-99",
    "name": "Phenomenon 99 - 'Forced Immortality'",
    "desc": "Involuntary immortality causes instantaneous painful regeneration after attempted death.",
    "hook": "Use cursed regeneration to complicate death, sacrifice, and immortal NPC arcs.",
    "effect": "prodX2",
    "label": "Production doubled",
    "rating": 40
  },
  {
    "id": "phenomenon-9",
    "name": "Phenomenon 9 - 'The Blue Consumption'",
    "desc": "Three-stage lifecycle disintegrates, rearranges, and rebuilds an entire level.",
    "hook": "Transform a live region across seasonal phases of destruction, void drift, and reconstruction.",
    "effect": "burst",
    "label": "Instant Almond Water burst",
    "rating": 36
  },
  {
    "id": "phenomenon-86",
    "name": "Phenomenon 86 - 'The Great Backrooms Meteor Shower'",
    "desc": "Rare sanctuary event calms isolated people, cools the area, and suppresses hostility.",
    "hook": "Create a temporary nonviolent rest window during an otherwise desperate expedition.",
    "effect": "clickX3",
    "label": "Click power tripled",
    "rating": 34
  },
  {
    "id": "phenomenon-16",
    "name": "Phenomenon 16 - 'Destabilizing Storms'",
    "desc": "Reality storm rewrites matter, organisms, and physical laws with advance warning.",
    "hook": "Let players evacuate, mitigate, or exploit a storm that rerolls local rules and mutations.",
    "effect": "prodX3",
    "label": "Production tripled",
    "rating": 33
  },
  {
    "id": "phenomenon-23",
    "name": "Phenomenon 23 - 'No-Clip Fusion'",
    "desc": "No-clip collisions fuse beings into painful hybrids or explosive deaths.",
    "hook": "Create fusion enemies and player risks when multiple travelers share a destination.",
    "effect": "luck",
    "label": "Fortune surges (loot & events)",
    "rating": 32
  },
  {
    "id": "phenomenon-30",
    "name": "Phenomenon 30 - 'Orbs'",
    "desc": "Invisible space-time punctures detectable through flash photography and capable of draining life.",
    "hook": "Require camera flashes to reveal lethal orb density before crossing a route.",
    "effect": "clickX2",
    "label": "Click power doubled",
    "rating": 31
  },
  {
    "id": "phenomenon-50",
    "name": "Phenomenon 50 - 'Vortexes'",
    "desc": "Red-energy portals spread corruption, aggression, entities, and structural change.",
    "hook": "Grow corrupting portal zones until players contain them or face altered populations.",
    "effect": "prodX2",
    "label": "Production doubled",
    "rating": 31
  },
  {
    "id": "phenomenon-27",
    "name": "Phenomenon 27 - 'Phantom Sounds'",
    "desc": "Personalized source-less sounds cannot be reliably distinguished from real threats.",
    "hook": "Blend false footsteps, voices, machinery, and explosions into the genuine audio model.",
    "effect": "burst",
    "label": "Instant Almond Water burst",
    "rating": 29
  },
  {
    "id": "phenomenon-8",
    "name": "Phenomenon 8 - 'Doodletrapping'",
    "desc": "Marked paper teleports sleepers into explorable realms where drawings become interactive.",
    "hook": "Generate paper realms whose drawn objects become traversal tools or enemies.",
    "effect": "clickX3",
    "label": "Click power tripled",
    "rating": 13
  }
];

