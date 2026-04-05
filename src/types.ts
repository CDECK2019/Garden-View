export interface Material {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
}

export interface ProjectData {
  zipCode: string;
  materials: Material[];
  laborRate: number;
  laborHours: number;
}

export const DEFAULT_MATERIALS: Material[] = [
  { id: '1', name: 'Premium Sod', unit: 'sq ft', unitPrice: 0.85, quantity: 0 },
  { id: '2', name: 'Mulch (Dark Brown)', unit: 'cubic yard', unitPrice: 45, quantity: 0 },
  { id: '3', name: 'Paver Stones', unit: 'sq ft', unitPrice: 12, quantity: 0 },
  { id: '4', name: 'River Rock', unit: 'ton', unitPrice: 120, quantity: 0 },
  { id: '5', name: 'Topsoil', unit: 'cubic yard', unitPrice: 35, quantity: 0 },
  { id: '6', name: 'Retaining Wall Block', unit: 'linear ft', unitPrice: 25, quantity: 0 },
];
