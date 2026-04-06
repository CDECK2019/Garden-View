export interface Material {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

export interface ImageAngle {
  id: string;
  url: string;
  name: string;
  timestamp: number;
}

export interface ProjectVersion {
  id: string;
  name: string;
  timestamp: number;
  images: ImageAngle[];
  materials: Material[];
  laborRate: number;
  laborHours: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  zipCode: string;
  createdAt: number;
  updatedAt: number;
  versions: ProjectVersion[];
  currentVersionId: string;
  collection?: ImageAngle[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  materials: Material[];
  icon: string;
}

export const LANDSCAPE_TEMPLATES: Template[] = [
  {
    id: 'modern',
    name: 'Modern Minimalist',
    description: 'Clean lines, geometric shapes, and a limited palette of plants and materials.',
    icon: 'Layout',
    materials: [
      { id: 'm1', name: 'Concrete Pavers (Large Format)', unit: 'sq ft', unitPrice: 15, quantity: 100 },
      { id: 'm2', name: 'Black Polished Pebbles', unit: 'bag', unitPrice: 25, quantity: 20 },
      { id: 'm3', name: 'Ornamental Grasses', unit: 'each', unitPrice: 35, quantity: 15 },
      { id: 'm4', name: 'Steel Edging', unit: 'linear ft', unitPrice: 12, quantity: 50 },
    ]
  },
  {
    id: 'rustic',
    name: 'Rustic Retreat',
    description: 'Natural stone, weathered wood, and lush, informal plantings for a cozy feel.',
    icon: 'Trees',
    materials: [
      { id: 'r1', name: 'Flagstone (Irregular)', unit: 'ton', unitPrice: 450, quantity: 2 },
      { id: 'r2', name: 'Cedar Mulch', unit: 'cubic yard', unitPrice: 40, quantity: 5 },
      { id: 'r3', name: 'Native Wildflower Mix', unit: 'lb', unitPrice: 65, quantity: 1 },
      { id: 'r4', name: 'Fieldstone Boulders', unit: 'ton', unitPrice: 180, quantity: 3 },
    ]
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean Oasis',
    description: 'Warm tones, terracotta, gravel paths, and drought-tolerant plants like lavender.',
    icon: 'Sun',
    materials: [
      { id: 'med1', name: 'Decomposed Granite', unit: 'ton', unitPrice: 85, quantity: 4 },
      { id: 'med2', name: 'Terracotta Pots (Large)', unit: 'each', unitPrice: 120, quantity: 3 },
      { id: 'med3', name: 'Lavender Plants', unit: 'each', unitPrice: 18, quantity: 12 },
      { id: 'med4', name: 'Olive Tree (Small)', unit: 'each', unitPrice: 250, quantity: 1 },
    ]
  },
  {
    id: 'zen',
    name: 'Zen Garden',
    description: 'Tranquil space with raked gravel, moss, bamboo, and carefully placed stones.',
    icon: 'Wind',
    materials: [
      { id: 'z1', name: 'Fine White Gravel', unit: 'ton', unitPrice: 110, quantity: 3 },
      { id: 'z2', name: 'Bamboo Fencing', unit: 'linear ft', unitPrice: 18, quantity: 40 },
      { id: 'z3', name: 'Japanese Maple', unit: 'each', unitPrice: 180, quantity: 1 },
      { id: 'z4', name: 'Moss Spores', unit: 'sq ft', unitPrice: 5, quantity: 200 },
    ]
  },
  {
    id: 'cottage',
    name: 'English Cottage',
    description: 'Abundant flowers, brick paths, and a charming, informal garden layout.',
    icon: 'Flower',
    materials: [
      { id: 'c1', name: 'Antique Red Bricks', unit: 'each', unitPrice: 1.2, quantity: 500 },
      { id: 'c2', name: 'Rose Bushes (Climbing)', unit: 'each', unitPrice: 45, quantity: 6 },
      { id: 'c3', name: 'Wrought Iron Trellis', unit: 'each', unitPrice: 85, quantity: 2 },
      { id: 'c4', name: 'Hydrangeas', unit: 'each', unitPrice: 32, quantity: 8 },
    ]
  },
  {
    id: 'desert',
    name: 'Desert Xeriscape',
    description: 'Low-maintenance, water-wise design using succulents, cacti, and crushed rock.',
    icon: 'Mountain',
    materials: [
      { id: 'd1', name: 'Crushed Lava Rock', unit: 'ton', unitPrice: 95, quantity: 5 },
      { id: 'd2', name: 'Agave Plants (Large)', unit: 'each', unitPrice: 75, quantity: 4 },
      { id: 'd3', name: 'Saguaro Cactus (Medium)', unit: 'each', unitPrice: 350, quantity: 1 },
      { id: 'd4', name: 'Drip Irrigation Kit', unit: 'each', unitPrice: 150, quantity: 1 },
    ]
  }
];

export const DEFAULT_MATERIALS: Material[] = [
  { id: '1', name: 'Premium Sod', unit: 'sq ft', unitPrice: 0.85, quantity: 0 },
  { id: '2', name: 'Mulch (Dark Brown)', unit: 'cubic yard', unitPrice: 45, quantity: 0 },
  { id: '3', name: 'Paver Stones', unit: 'sq ft', unitPrice: 12, quantity: 0 },
  { id: '4', name: 'River Rock', unit: 'ton', unitPrice: 120, quantity: 0 },
  { id: '5', name: 'Topsoil', unit: 'cubic yard', unitPrice: 35, quantity: 0 },
  { id: '6', name: 'Retaining Wall Block', unit: 'linear ft', unitPrice: 25, quantity: 0 },
];
