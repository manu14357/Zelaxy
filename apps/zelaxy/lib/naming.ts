/**
 * Utility functions for generating names for all entities (workspaces, folders, workflows)
 */

import type { WorkflowFolder } from '@/stores/folders/store'
import type { Workspace } from '@/stores/organization/types'

export interface NameableEntity {
  name: string
}

interface WorkspacesApiResponse {
  workspaces: Workspace[]
}

interface FoldersApiResponse {
  folders: WorkflowFolder[]
}

const ADJECTIVES = [
  'Blazing',
  'Crystal',
  'Golden',
  'Silver',
  'Mystic',
  'Cosmic',
  'Electric',
  'Frozen',
  'Burning',
  'Shining',
  'Dancing',
  'Flying',
  'Roaring',
  'Whispering',
  'Glowing',
  'Sparkling',
  'Thunder',
  'Lightning',
  'Storm',
  'Ocean',
  'Mountain',
  'Forest',
  'Desert',
  'Arctic',
  'Tropical',
  'Midnight',
  'Dawn',
  'Sunset',
  'Rainbow',
  'Diamond',
  'Ruby',
  'Emerald',
  'Sapphire',
  'Pearl',
  'Jade',
  'Amber',
  'Coral',
  'Ivory',
  'Obsidian',
  'Marble',
  'Stormy',
  'Misty',
  'Foggy',
  'Windy',
  'Cloudy',
  'Sunny',
  'Rainy',
  'Snowy',
  'Frosty',
  'Icy',
  'Ancient',
  'Modern',
  'Futuristic',
  'Vintage',
  'Classic',
  'Elegant',
  'Rustic',
  'Urban',
  'Rural',
  'Coastal',
  'Digital',
  'Quantum',
  'Neural',
  'Organic',
  'Synthetic',
  'Natural',
  'Artificial',
  'Wild',
  'Gentle',
  'Fierce',
  // Galaxy & Space adjectives
  'Stellar',
  'Lunar',
  'Solar',
  'Celestial',
  'Galactic',
  'Nebular',
  'Orbital',
  'Interstellar',
  'Cosmic',
  'Astral',
  'Radiant',
  'Luminous',
  'Infinite',
  'Eternal',
  'Supernova',
  'Binary',
  'Plasma',
  'Gravitational',
  'Magnetic',
  'Photonic',
]

const VERBS = [
  'Racing',
  'Soaring',
  'Diving',
  'Climbing',
  'Flowing',
  'Drifting',
  'Spinning',
  'Gliding',
  'Rushing',
  'Floating',
  'Jumping',
  'Sliding',
  'Rolling',
  'Bouncing',
  'Swirling',
  'Cascading',
  'Spiraling',
  'Weaving',
  'Dancing',
  'Singing',
  'Thundering',
  'Crackling',
  'Bubbling',
  'Sparkling',
  'Gleaming',
  'Shimmering',
  'Flickering',
  'Pulsing',
  'Vibrating',
  'Echoing',
  'Raining',
  'Snowing',
  'Storming',
  'Blowing',
  'Gusting',
  'Breezing',
  'Howling',
  'Whistling',
  'Clearing',
  'Misting',
  'Blazing',
  'Freezing',
  'Melting',
  'Crystallizing',
  'Evaporating',
  'Reflecting',
  'Refracting',
  'Resonating',
  'Pulsing',
  'Waves',
  // Galaxy & Space verbs
  'Orbiting',
  'Revolving',
  'Rotating',
  'Expanding',
  'Colliding',
  'Exploding',
  'Radiating',
  'Transmitting',
  'Navigating',
  'Exploring',
]

const NOUNS = [
  'Phoenix',
  'Dragon',
  'Eagle',
  'Wolf',
  'Lion',
  'Tiger',
  'Panther',
  'Falcon',
  'Hawk',
  'Raven',
  'Swan',
  'Dove',
  'Butterfly',
  'Firefly',
  'Hummingbird',
  'Galaxy',
  'Nebula',
  'Comet',
  'Meteor',
  'Star',
  'Moon',
  'Sun',
  'Planet',
  'Aurora',
  'Eclipse',
  'Horizon',
  'Castle',
  'Tower',
  'Bridge',
  'Garden',
  'Fountain',
  'Palace',
  'Temple',
  'Lighthouse',
  'Waterfall',
  'Canyon',
  'Valley',
  'Peak',
  'Ocean',
  'River',
  'Thunder',
  'Lightning',
  'Storm',
  'Hurricane',
  'Tornado',
  'Blizzard',
  'Rainbow',
  'Sunshine',
  'Frost',
  'Snowflake',
  'Volcano',
  'Glacier',
  'Oasis',
  'Prairie',
  'Tundra',
  'Mesa',
  'Crater',
  'Summit',
  'Meadow',
  'Grove',
  'Citadel',
  'Fortress',
  'Sanctuary',
  'Haven',
  'Realm',
  'Domain',
  'Empire',
  'Kingdom',
  'Cake',
  'Cookie',
  // Galaxy & Space nouns
  'Constellation',
  'Supernova',
  'Quasar',
  'Pulsar',
  'Blackhole',
  'Wormhole',
  'Asteroid',
  'Satellite',
  'Cosmos',
  'Universe',
  'Starfield',
  'Milkyway',
  'Andromeda',
  'Orion',
  'Vega',
  'Sirius',
  'Polaris',
  'Centauri',
  'Voyager',
  'Pioneer',
]

const OBJECTS = [
  'Compass',
  'Telescope',
  'Microscope',
  'Prism',
  'Crystal',
  'Pendant',
  'Crown',
  'Scepter',
  'Orb',
  'Staff',
  'Blade',
  'Shield',
  'Armor',
  'Scroll',
  'Tome',
  'Map',
  'Globe',
  'Clock',
  'Watch',
  'Lens',
  'Mirror',
  'Canvas',
  'Brush',
  'Hammer',
  'Anvil',
  'Engine',
  'Battery',
  'Circuit',
  'Processor',
  'Key',
  'Lock',
  'Chain',
  'Cable',
  'Wire',
  'Signal',
  'Wave',
  'Beacon',
  'Torch',
  'Flame',
  'Stone',
  'Diamond',
  'Ruby',
  'Pearl',
  'Heart',
  'Mind',
  'Dream',
  'Vision',
  'Gift',
  'Treasure',
  'Token',
  // Galaxy & Space objects
  'Telescope',
  'Spacecraft',
  'Rover',
  'Probe',
  'Station',
  'Observatory',
  'Radar',
  'Antenna',
  'Sensor',
  'Scanner',
  'Capsule',
  'Module',
  'Shuttle',
  'Rocket',
  'Thruster',
  'Generator',
  'Reactor',
  'Drive',
  'Navigator',
  'Transmitter',
]

/**
 * Generates the next incremental name for entities following pattern: "{prefix} {number}"
 *
 * @param existingEntities - Array of entities with name property
 * @param prefix - Prefix for the name (e.g., "Workspace", "Folder", "Subfolder")
 * @returns Next available name (e.g., "Workspace 3")
 */
export function generateIncrementalName<T extends NameableEntity>(
  existingEntities: T[],
  prefix: string
): string {
  // Create regex pattern for the prefix (e.g., /^Workspace (\d+)$/)
  const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (\\d+)$`)

  // Extract numbers from existing entities that match the pattern
  const existingNumbers = existingEntities
    .map((entity) => entity.name.match(pattern))
    .filter((match) => match !== null)
    .map((match) => Number.parseInt(match![1], 10))

  // Find next available number (highest + 1, or 1 if none exist)
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1

  return `${prefix} ${nextNumber}`
}

/**
 * Generates the next workspace name
 */
export async function generateWorkspaceName(): Promise<string> {
  const response = await fetch('/api/arenas')
  const data = (await response.json()) as WorkspacesApiResponse
  const workspaces = data.workspaces || []

  return generateIncrementalName(workspaces, 'Workspace')
}

/**
 * Generates the next folder name for a workspace
 */
export async function generateFolderName(workspaceId: string): Promise<string> {
  const response = await fetch(`/api/folders?workspaceId=${workspaceId}`)
  const data = (await response.json()) as FoldersApiResponse
  const folders = data.folders || []

  // Filter to only root-level folders (parentId is null)
  const rootFolders = folders.filter((folder) => folder.parentId === null)

  return generateIncrementalName(rootFolders, 'Folder')
}

/**
 * Generates the next subfolder name for a parent folder
 */
export async function generateSubfolderName(
  workspaceId: string,
  parentFolderId: string
): Promise<string> {
  const response = await fetch(`/api/folders?workspaceId=${workspaceId}`)
  const data = (await response.json()) as FoldersApiResponse
  const folders = data.folders || []

  // Filter to only subfolders of the specified parent
  const subfolders = folders.filter((folder) => folder.parentId === parentFolderId)

  return generateIncrementalName(subfolders, 'Subfolder')
}

/**
 * Generates a creative workflow name using random adjectives and nouns
 * @returns A creative workflow name like "blazing-phoenix" or "crystal-dragon"
 */
export function generateCreativeWorkflowName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${adjective.toLowerCase()}-${noun.toLowerCase()}`
}

/**
 * Generates a creative workflow name using verbs and objects
 * @returns A creative workflow name like "racing-compass" or "soaring-telescope"
 */
export function generateVerbObjectWorkflowName(): string {
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)]
  const object = OBJECTS[Math.floor(Math.random() * OBJECTS.length)]
  return `${verb.toLowerCase()}-${object.toLowerCase()}`
}

/**
 * Generates a creative workflow name using adjectives and objects
 * @returns A creative workflow name like "golden-compass" or "mystic-telescope"
 */
export function generateAdjectiveObjectWorkflowName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const object = OBJECTS[Math.floor(Math.random() * OBJECTS.length)]
  return `${adjective.toLowerCase()}-${object.toLowerCase()}`
}

/**
 * Generates a creative workflow name using verbs and nouns
 * @returns A creative workflow name like "racing-phoenix" or "soaring-dragon"
 */
export function generateVerbNounWorkflowName(): string {
  const verb = VERBS[Math.floor(Math.random() * VERBS.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return `${verb.toLowerCase()}-${noun.toLowerCase()}`
}

/**
 * Generates a random creative workflow name using any combination of word types
 * @returns A creative workflow name using a random pattern
 */
export function generateRandomWorkflowName(): string {
  const patterns = [
    generateCreativeWorkflowName,
    generateVerbObjectWorkflowName,
    generateAdjectiveObjectWorkflowName,
    generateVerbNounWorkflowName,
  ]

  const randomPattern = patterns[Math.floor(Math.random() * patterns.length)]
  return randomPattern()
}
