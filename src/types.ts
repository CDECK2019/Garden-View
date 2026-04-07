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
  category: 'landscape' | 'interior';
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const DESIGN_TEMPLATES: Template[] = [
  // Landscape Templates
  {
    id: 'zen',
    name: 'Japanese Zen Garden',
    description: 'Create a minimalist composition featuring carefully raked gravel patterns, strategically placed weathered stones, and moss patches framed by pruned maples and bamboo screens. Emphasize asymmetrical balance, muted earth tones, and serene negative space.',
    icon: 'Wind',
    category: 'landscape',
    materials: [
      { id: 'z1', name: 'Fine White Gravel', unit: 'ton', unitPrice: 110, quantity: 3 },
      { id: 'z2', name: 'Bamboo Fencing', unit: 'linear ft', unitPrice: 18, quantity: 40 },
      { id: 'z3', name: 'Japanese Maple', unit: 'each', unitPrice: 180, quantity: 1 },
      { id: 'z4', name: 'Moss Spores', unit: 'sq ft', unitPrice: 5, quantity: 200 },
    ]
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean Courtyard',
    description: 'Design a sun-drenched layout with terracotta pavers, stucco walls, climbing bougainvillea, and a central fountain or mature olive tree. Use warm ochre and azure accents with wrought iron details and gravel-filled drought-tolerant beds.',
    icon: 'Sun',
    category: 'landscape',
    materials: [
      { id: 'med1', name: 'Terracotta Pavers', unit: 'sq ft', unitPrice: 12, quantity: 150 },
      { id: 'med2', name: 'Bougainvillea (5 gal)', unit: 'each', unitPrice: 45, quantity: 4 },
      { id: 'med3', name: 'Tiered Stone Fountain', unit: 'each', unitPrice: 850, quantity: 1 },
      { id: 'med4', name: 'Wrought Iron Bench', unit: 'each', unitPrice: 320, quantity: 1 },
    ]
  },
  {
    id: 'modern',
    name: 'Modern Minimalist',
    description: 'Feature clean geometric hardscape zones in smooth concrete or large-format slate paired with restrained plantings like ornamental grasses or sculptural succulents. Maintain a neutral monochrome palette with intentional negative space and subtle linear lighting.',
    icon: 'Layout',
    category: 'landscape',
    materials: [
      { id: 'm1', name: 'Concrete Pavers (Large Format)', unit: 'sq ft', unitPrice: 15, quantity: 100 },
      { id: 'm2', name: 'Black Polished Pebbles', unit: 'bag', unitPrice: 25, quantity: 20 },
      { id: 'm3', name: 'Ornamental Grasses', unit: 'each', unitPrice: 35, quantity: 15 },
      { id: 'm4', name: 'Steel Edging', unit: 'linear ft', unitPrice: 12, quantity: 50 },
    ]
  },
  {
    id: 'cottage',
    name: 'English Cottage Garden',
    description: 'Arrange a lush, informal planting scheme with overflowing perennials, climbing roses on wooden arbors, and winding flagstone paths edged by low boxwood. Blend soft pastels and whites with weathered brick, natural wood, and a gently wild, romantic aesthetic.',
    icon: 'Flower',
    category: 'landscape',
    materials: [
      { id: 'cot1', name: 'Flagstone Path', unit: 'ton', unitPrice: 450, quantity: 1 },
      { id: 'cot2', name: 'Climbing Rose Bush', unit: 'each', unitPrice: 38, quantity: 6 },
      { id: 'cot3', name: 'Wooden Arbor', unit: 'each', unitPrice: 280, quantity: 1 },
      { id: 'cot4', name: 'Perennial Mix', unit: 'flat', unitPrice: 42, quantity: 10 },
    ]
  },
  {
    id: 'tropical',
    name: 'Tropical Resort',
    description: 'Incorporate broad-leaf palms, monstera, and heliconias alongside natural stone water features, teak decking, and woven or slatted pergola shading. Use rich greens, warm wood tones, and warm ambient lighting to evoke a humid, layered oasis atmosphere.',
    icon: 'PalmTree',
    category: 'landscape',
    materials: [
      { id: 'trop1', name: 'Teak Decking', unit: 'sq ft', unitPrice: 24, quantity: 120 },
      { id: 'trop2', name: 'Windmill Palm', unit: 'each', unitPrice: 250, quantity: 2 },
      { id: 'trop3', name: 'Natural Stone Waterfall', unit: 'each', unitPrice: 1200, quantity: 1 },
      { id: 'trop4', name: 'Monstera Deliciosa', unit: 'each', unitPrice: 55, quantity: 5 },
    ]
  },
  {
    id: 'desert',
    name: 'Xeriscape / Desert Modern',
    description: 'Combine drought-tolerant agave, sage, and yucca with decomposed granite pathways, dry-stack stone walls, and low-profile seating. Emphasize terracotta, rust, and sand tones with clean geometric layouts and high-contrast shadows.',
    icon: 'Mountain',
    category: 'landscape',
    materials: [
      { id: 'des1', name: 'Decomposed Granite', unit: 'ton', unitPrice: 85, quantity: 4 },
      { id: 'des2', name: 'Blue Agave', unit: 'each', unitPrice: 65, quantity: 8 },
      { id: 'des3', name: 'Dry-Stack Stone Wall', unit: 'linear ft', unitPrice: 45, quantity: 30 },
      { id: 'des4', name: 'Modern Fire Pit', unit: 'each', unitPrice: 450, quantity: 1 },
    ]
  },
  {
    id: 'french',
    name: 'French Formal Garden',
    description: 'Design symmetrical axial paths lined with tightly clipped boxwood parterres, ornamental topiaries, and a central focal feature like a sculpted basin or sundial. Incorporate limestone gravel, classical urns, and a highly structured layout with refined green-and-white tones.',
    icon: 'Grid',
    category: 'landscape',
    materials: [
      { id: 'fr1', name: 'Limestone Gravel', unit: 'ton', unitPrice: 120, quantity: 5 },
      { id: 'fr2', name: 'Boxwood Hedge (1 gal)', unit: 'each', unitPrice: 22, quantity: 40 },
      { id: 'fr3', name: 'Classical Stone Urn', unit: 'each', unitPrice: 180, quantity: 4 },
      { id: 'fr4', name: 'Standard Topiary', unit: 'each', unitPrice: 95, quantity: 6 },
    ]
  },
  {
    id: 'coastal',
    name: 'Coastal Dunescape',
    description: 'Blend native beach grasses, sea oats, and salt-tolerant shrubs with weathered boardwalks, driftwood accents, and crushed shell pathways. Use a palette of weathered grays, soft blues, and sandy neutrals to evoke a windswept, naturally resilient shoreline.',
    icon: 'Waves',
    category: 'landscape',
    materials: [
      { id: 'coa1', name: 'Crushed Shell Path', unit: 'cubic yard', unitPrice: 75, quantity: 3 },
      { id: 'coa2', name: 'Cedar Boardwalk', unit: 'linear ft', unitPrice: 35, quantity: 20 },
      { id: 'coa3', name: 'Sea Oats (Plug)', unit: 'flat', unitPrice: 45, quantity: 8 },
      { id: 'coa4', name: 'Driftwood Accent', unit: 'each', unitPrice: 65, quantity: 3 },
    ]
  },
  {
    id: 'woodland',
    name: 'Rustic Woodland',
    description: 'Feature a forest-inspired layout with native ferns, birch or pine log seating, stone fire rings, and mulch pathways beneath a partial tree canopy. Incorporate raw timber, mossy boulders, and warm dappled lighting for a cozy, cabin-adjacent retreat.',
    icon: 'Trees',
    category: 'landscape',
    materials: [
      { id: 'wood1', name: 'Pine Bark Mulch', unit: 'cubic yard', unitPrice: 35, quantity: 10 },
      { id: 'wood2', name: 'Native Ferns', unit: 'each', unitPrice: 18, quantity: 15 },
      { id: 'wood3', name: 'Log Bench (Pine)', unit: 'each', unitPrice: 150, quantity: 2 },
      { id: 'wood4', name: 'Fieldstone Fire Ring', unit: 'each', unitPrice: 220, quantity: 1 },
    ]
  },
  {
    id: 'nordic',
    name: 'Scandinavian Nordic',
    description: 'Create a bright, airy garden with pale birch and pine elements, minimalist raised beds, and cold-hardy plantings like sedum, heather, and fine-textured grasses. Use light gray stone, crisp whites, and seasonal color accents with an emphasis on open sightlines and natural light.',
    icon: 'Snowflake',
    category: 'landscape',
    materials: [
      { id: 'nor1', name: 'Light Gray Granite Pavers', unit: 'sq ft', unitPrice: 18, quantity: 80 },
      { id: 'nor2', name: 'White Birch Tree', unit: 'each', unitPrice: 120, quantity: 3 },
      { id: 'nor3', name: 'Raised Pine Planters', unit: 'each', unitPrice: 140, quantity: 4 },
      { id: 'nor4', name: 'Hardy Heather Mix', unit: 'flat', unitPrice: 38, quantity: 6 },
    ]
  },
  // Interior Templates
  {
    id: 'japandi',
    name: 'Japandi',
    description: 'Merge light Scandinavian wood tones and functional silhouettes with Japanese wabi-sabi elements like hand-thrown ceramics, linen textiles, and subtle imperfections. Emphasize uncluttered negative space, soft natural lighting, and a muted earth-toned palette.',
    icon: 'Home',
    category: 'interior',
    materials: [
      { id: 'jap1', name: 'Light Oak Furniture', unit: 'each', unitPrice: 850, quantity: 2 },
      { id: 'jap2', name: 'Linen Curtains', unit: 'set', unitPrice: 120, quantity: 3 },
      { id: 'jap3', name: 'Ceramic Vase Set', unit: 'set', unitPrice: 75, quantity: 1 },
      { id: 'jap4', name: 'Tatami-style Rug', unit: 'each', unitPrice: 280, quantity: 1 },
    ]
  },
  {
    id: 'midcentury',
    name: 'Mid-Century Modern',
    description: 'Feature tapered wood legs, geometric accent furniture, and a color scheme of walnut, mustard, and olive balanced with large windows and seamless indoor-outdoor flow. Incorporate clean lines, abstract wall art, and warm brass or blackened steel hardware.',
    icon: 'Palette',
    category: 'interior',
    materials: [
      { id: 'mc1', name: 'Walnut Wood Paneling', unit: 'sq ft', unitPrice: 22, quantity: 80 },
      { id: 'mc2', name: 'Geometric Wallpaper', unit: 'roll', unitPrice: 95, quantity: 3 },
      { id: 'mc3', name: 'Eames-style Lounge Chair', unit: 'each', unitPrice: 1500, quantity: 1 },
      { id: 'mc4', name: 'Brass Floor Lamp', unit: 'each', unitPrice: 220, quantity: 1 },
    ]
  },
  {
    id: 'industrial',
    name: 'Industrial Loft',
    description: 'Expose raw architectural elements like brick walls, visible ductwork, and polished concrete floors, paired with reclaimed wood shelving and vintage metal lighting. Use a palette of charcoal, rust, and warm timber with utilitarian furnishings and open spatial zoning.',
    icon: 'Building',
    category: 'interior',
    materials: [
      { id: 'i1', name: 'Exposed Brick Veneer', unit: 'sq ft', unitPrice: 18, quantity: 150 },
      { id: 'i2', name: 'Polished Concrete Finish', unit: 'sq ft', unitPrice: 8, quantity: 200 },
      { id: 'i3', name: 'Metal Pendant Lights', unit: 'each', unitPrice: 150, quantity: 3 },
      { id: 'i4', name: 'Leather Armchair', unit: 'each', unitPrice: 850, quantity: 1 },
    ]
  },
  {
    id: 'scandinavian',
    name: 'Scandinavian Minimalist',
    description: 'Design a bright, airy interior dominated by pale oak floors, white walls, and simple functional furniture with gentle curves and neutral woven textiles. Add subtle greenery, woven baskets, and soft sage or light gray accents to maintain warmth without visual clutter.',
    icon: 'Home',
    category: 'interior',
    materials: [
      { id: 's1', name: 'Light Oak Flooring', unit: 'sq ft', unitPrice: 12, quantity: 200 },
      { id: 's2', name: 'White Matte Paint', unit: 'gallon', unitPrice: 45, quantity: 4 },
      { id: 's3', name: 'Minimalist Sofa', unit: 'each', unitPrice: 1200, quantity: 1 },
      { id: 's4', name: 'Wool Area Rug', unit: 'each', unitPrice: 350, quantity: 1 },
    ]
  },
  {
    id: 'farmhouse',
    name: 'Modern Farmhouse',
    description: 'Combine clean-lined shaker cabinetry, shiplap or beadboard walls, and wide-plank light wood floors with matte black fixtures and oversized woven pendants. Layer vintage-inspired rugs, linen slipcovers, and understated greenery for a relaxed, family-oriented feel.',
    icon: 'Home',
    category: 'interior',
    materials: [
      { id: 'farm1', name: 'White Shaker Cabinets', unit: 'linear ft', unitPrice: 250, quantity: 15 },
      { id: 'farm2', name: 'Matte Black Faucet', unit: 'each', unitPrice: 180, quantity: 1 },
      { id: 'farm3', name: 'Shiplap Wall Panel', unit: 'sq ft', unitPrice: 8, quantity: 120 },
      { id: 'farm4', name: 'Woven Pendant Light', unit: 'each', unitPrice: 140, quantity: 2 },
    ]
  },
  {
    id: 'hamptons',
    name: 'Coastal Hamptons',
    description: 'Use a crisp white and navy palette with natural jute rugs, weathered wood furniture, and subtle nautical details like brass accents and striped textiles. Incorporate breezy linen drapery, oversized mirrors, and soft blue-gray walls to evoke effortless seaside elegance.',
    icon: 'Anchor',
    category: 'interior',
    materials: [
      { id: 'hamp1', name: 'Navy Linen Sofa', unit: 'each', unitPrice: 1400, quantity: 1 },
      { id: 'hamp2', name: 'Natural Jute Rug', unit: 'each', unitPrice: 280, quantity: 1 },
      { id: 'hamp3', name: 'Weathered Oak Coffee Table', unit: 'each', unitPrice: 450, quantity: 1 },
      { id: 'hamp4', name: 'Brass Wall Sconce', unit: 'each', unitPrice: 110, quantity: 2 },
    ]
  },
  {
    id: 'artdeco',
    name: 'Art Deco Glamour',
    description: 'Feature symmetrical geometric patterns, rich jewel tones, and luxurious materials such as velvet, veined marble, and polished brass. Combine stepped silhouettes, mirrored surfaces, and dramatic pendant lighting for refined 1920s-inspired opulence.',
    icon: 'Gem',
    category: 'interior',
    materials: [
      { id: 'art1', name: 'Emerald Velvet Sofa', unit: 'each', unitPrice: 1800, quantity: 1 },
      { id: 'art2', name: 'Carrara Marble Top Table', unit: 'each', unitPrice: 950, quantity: 1 },
      { id: 'art3', name: 'Polished Brass Mirror', unit: 'each', unitPrice: 320, quantity: 1 },
      { id: 'art4', name: 'Geometric Pattern Wallpaper', unit: 'roll', unitPrice: 120, quantity: 4 },
    ]
  },
  {
    id: 'bohemian',
    name: 'Bohemian Eclectic',
    description: 'Layer global textiles, macramé accents, vintage patterned rugs, and mismatched furniture in a relaxed, collected-over-time arrangement. Use earthy terracotta, warm wood, and jewel tones, filled with trailing plants, artisanal ceramics, and soft layered lighting.',
    icon: 'Heart',
    category: 'interior',
    materials: [
      { id: 'boh1', name: 'Rattan Armchair', unit: 'each', unitPrice: 350, quantity: 1 },
      { id: 'boh2', name: 'Macramé Wall Hanging', unit: 'each', unitPrice: 85, quantity: 1 },
      { id: 'boh3', name: 'Vintage Persian Rug', unit: 'each', unitPrice: 650, quantity: 1 },
      { id: 'boh4', name: 'Terracotta Planter Set', unit: 'set', unitPrice: 45, quantity: 3 },
    ]
  },
  {
    id: 'provincial',
    name: 'French Provincial',
    description: 'Blend carved wood furniture, distressed painted finishes, and toile or floral fabrics with wrought iron details and limestone or terracotta flooring. Emphasize soft pastels, muted gold accents, and romantic, slightly asymmetrical layouts for timeless countryside elegance.',
    icon: 'Flower',
    category: 'interior',
    materials: [
      { id: 'prov1', name: 'Distressed Oak Dining Table', unit: 'each', unitPrice: 1100, quantity: 1 },
      { id: 'prov2', name: 'Toile Fabric Armchair', unit: 'each', unitPrice: 550, quantity: 2 },
      { id: 'prov3', name: 'Wrought Iron Chandelier', unit: 'each', unitPrice: 420, quantity: 1 },
      { id: 'prov4', name: 'Limestone Floor Tiles', unit: 'sq ft', unitPrice: 14, quantity: 150 },
    ]
  },
  {
    id: 'maximalist',
    name: 'Contemporary Maximalist',
    description: 'Layer bold saturated colors, dramatic patterned wallpapers, rich mixed textures, and curated object collections with intentional visual density. Combine glossy and matte finishes, metallic accents, and statement lighting to create a highly personalized, gallery-like atmosphere that balances abundance with clear spatial hierarchy.',
    icon: 'Sparkles',
    category: 'interior',
    materials: [
      { id: 'max1', name: 'Bold Pattern Wallpaper', unit: 'roll', unitPrice: 140, quantity: 6 },
      { id: 'max2', name: 'Glossy Lacquer Sideboard', unit: 'each', unitPrice: 850, quantity: 1 },
      { id: 'max3', name: 'Velvet Ottoman (Teal)', unit: 'each', unitPrice: 180, quantity: 2 },
      { id: 'max4', name: 'Neon Art Sign', unit: 'each', unitPrice: 350, quantity: 1 },
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
