export type AngleLabel =
  | 'front'
  | 'side-left'
  | 'side-right'
  | 'back'
  | 'aerial'
  | 'entrance'
  | 'garden'
  | 'pool'
  | 'custom';

export const ANGLE_LABEL_DISPLAY: Record<AngleLabel, string> = {
  'front': 'Front Yard',
  'side-left': 'Left Side',
  'side-right': 'Right Side',
  'back': 'Backyard',
  'aerial': 'Aerial View',
  'entrance': 'Entrance',
  'garden': 'Garden Area',
  'pool': 'Pool Area',
  'custom': 'Custom',
};

export interface ImageAngle {
  id: string;
  url: string;
  name: string;
  label: AngleLabel;
  customLabelName?: string; // when label === 'custom'
  timestamp: number;
}

export interface PropertyFeature {
  type: string;
  location: string;
  notes?: string;
}

export interface PropertyContext {
  summary: string;
  features: PropertyFeature[];
  estimatedSqFt?: number;
  suggestedImprovements: string[];
  analyzedAt: number;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  appliedToAngles?: string[]; // image IDs that were modified
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  category?: MaterialCategory;
}

export type MaterialCategory =
  | 'groundcover'
  | 'hardscape'
  | 'edging'
  | 'plants'
  | 'lighting'
  | 'irrigation'
  | 'labor'
  | 'other';

export interface ProjectVersion {
  id: string;
  name: string;
  timestamp: number;
  images: ImageAngle[];
  materials: Material[];
  laborRate: number;
  laborHours: number;
  propertyContext?: PropertyContext;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  createdAt: number;
  updatedAt: number;
  versions: ProjectVersion[];
  currentVersionId: string;
  chatHistory: ChatMessage[];
}

export const DEFAULT_MATERIALS: Material[] = [
  // Groundcover
  { id: '1', name: 'Premium Sod', unit: 'sq ft', unitPrice: 0.85, quantity: 0, category: 'groundcover' },
  { id: '2', name: 'Mulch (Dark Brown)', unit: 'cubic yard', unitPrice: 45, quantity: 0, category: 'groundcover' },
  { id: '3', name: 'River Rock', unit: 'ton', unitPrice: 120, quantity: 0, category: 'groundcover' },
  { id: '4', name: 'Topsoil', unit: 'cubic yard', unitPrice: 35, quantity: 0, category: 'groundcover' },
  { id: '5', name: 'Decomposed Granite', unit: 'ton', unitPrice: 95, quantity: 0, category: 'groundcover' },
  // Hardscape
  { id: '6', name: 'Concrete Paver (12x12)', unit: 'sq ft', unitPrice: 12, quantity: 0, category: 'hardscape' },
  { id: '7', name: 'Natural Stone Flagging', unit: 'sq ft', unitPrice: 18, quantity: 0, category: 'hardscape' },
  { id: '8', name: 'Retaining Wall Block', unit: 'linear ft', unitPrice: 25, quantity: 0, category: 'hardscape' },
  { id: '9', name: 'Concrete Curbing', unit: 'linear ft', unitPrice: 8, quantity: 0, category: 'hardscape' },
  // Edging
  { id: '10', name: 'Steel Edging', unit: 'linear ft', unitPrice: 3.5, quantity: 0, category: 'edging' },
  { id: '11', name: 'Plastic Landscape Edging', unit: 'linear ft', unitPrice: 1.2, quantity: 0, category: 'edging' },
  // Plants
  { id: '12', name: 'Ornamental Grass (3-gal)', unit: 'each', unitPrice: 18, quantity: 0, category: 'plants' },
  { id: '13', name: 'Shrub / Hedge (5-gal)', unit: 'each', unitPrice: 45, quantity: 0, category: 'plants' },
  { id: '14', name: 'Shade Tree (15-gal)', unit: 'each', unitPrice: 185, quantity: 0, category: 'plants' },
  { id: '15', name: 'Annual Flowers (flat)', unit: 'flat', unitPrice: 22, quantity: 0, category: 'plants' },
  { id: '16', name: 'Perennials (1-gal)', unit: 'each', unitPrice: 12, quantity: 0, category: 'plants' },
  // Lighting
  { id: '17', name: 'Path Light (LED)', unit: 'each', unitPrice: 35, quantity: 0, category: 'lighting' },
  { id: '18', name: 'Spot Light (LED)', unit: 'each', unitPrice: 55, quantity: 0, category: 'lighting' },
  { id: '19', name: 'Low-Voltage Wire', unit: 'linear ft', unitPrice: 0.45, quantity: 0, category: 'lighting' },
  // Irrigation
  { id: '20', name: 'Drip Irrigation (zone)', unit: 'zone', unitPrice: 280, quantity: 0, category: 'irrigation' },
  { id: '21', name: 'Sprinkler Head (rotary)', unit: 'each', unitPrice: 18, quantity: 0, category: 'irrigation' },
];
