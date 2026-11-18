export interface BackgroundTheme {
  id: string;
  name: string; // English name: Red, Green, Yellow, Blue, Purple, Orange
  nameSi: string;
  previewBg: string; // Tailwind swatch preview
  previewBorder: string;
  accentBadge: string;
  appContainerClass: string;
  bgColor: string; // Direct Hex for 100% visible and reliable background styling
  bgGradient: string;
  headerAccent: string;
  headerIconBg: string;
  headerBarBorder: string;
  cardBorder: string;
  description: string;
}

export const DEFAULT_THEME: BackgroundTheme = {
  id: 'Default',
  name: 'Default',
  nameSi: 'පෙරනිමි',
  previewBg: 'bg-slate-400',
  previewBorder: 'border-slate-500',
  accentBadge: 'bg-slate-100 text-slate-800 border-slate-300',
  appContainerClass: 'bg-slate-100',
  bgColor: '#f1f5f9',
  bgGradient: 'bg-slate-100',
  headerAccent: 'border-b-2 border-blue-500',
  headerIconBg: 'bg-blue-600',
  headerBarBorder: 'border-slate-700',
  cardBorder: 'border-slate-200',
  description: 'Classic Light Slate (පෙරනිමි)',
};

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: 'Red',
    name: 'Red',
    nameSi: 'රතු',
    previewBg: 'bg-rose-500',
    previewBorder: 'border-rose-600',
    accentBadge: 'bg-rose-100 text-rose-800 border-rose-300',
    appContainerClass: 'bg-rose-100',
    bgColor: '#ffe4e6',
    bgGradient: 'bg-rose-100',
    headerAccent: 'border-b-2 border-rose-500',
    headerIconBg: 'bg-rose-600',
    headerBarBorder: 'border-rose-800',
    cardBorder: 'border-rose-300',
    description: 'Warm Rose / Red Theme',
  },
  {
    id: 'Green',
    name: 'Green',
    nameSi: 'කොළ',
    previewBg: 'bg-emerald-500',
    previewBorder: 'border-emerald-600',
    accentBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    appContainerClass: 'bg-emerald-100',
    bgColor: '#d1fae5',
    bgGradient: 'bg-emerald-100',
    headerAccent: 'border-b-2 border-emerald-500',
    headerIconBg: 'bg-emerald-600',
    headerBarBorder: 'border-emerald-800',
    cardBorder: 'border-emerald-300',
    description: 'Fresh Emerald / Green Theme',
  },
  {
    id: 'Yellow',
    name: 'Yellow',
    nameSi: 'කහ',
    previewBg: 'bg-amber-400',
    previewBorder: 'border-amber-500',
    accentBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    appContainerClass: 'bg-amber-100',
    bgColor: '#fef3c7',
    bgGradient: 'bg-amber-100',
    headerAccent: 'border-b-2 border-amber-500',
    headerIconBg: 'bg-amber-500',
    headerBarBorder: 'border-amber-700',
    cardBorder: 'border-amber-300',
    description: 'Warm Amber / Yellow Theme',
  },
  {
    id: 'Blue',
    name: 'Blue',
    nameSi: 'නිල්',
    previewBg: 'bg-blue-500',
    previewBorder: 'border-blue-600',
    accentBadge: 'bg-blue-100 text-blue-800 border-blue-300',
    appContainerClass: 'bg-blue-100',
    bgColor: '#dbeafe',
    bgGradient: 'bg-blue-100',
    headerAccent: 'border-b-2 border-blue-500',
    headerIconBg: 'bg-blue-600',
    headerBarBorder: 'border-blue-800',
    cardBorder: 'border-blue-300',
    description: 'Classic Sky / Blue Theme',
  },
  {
    id: 'Purple',
    name: 'Purple',
    nameSi: 'දම්',
    previewBg: 'bg-purple-500',
    previewBorder: 'border-purple-600',
    accentBadge: 'bg-purple-100 text-purple-800 border-purple-300',
    appContainerClass: 'bg-purple-100',
    bgColor: '#f3e8ff',
    bgGradient: 'bg-purple-100',
    headerAccent: 'border-b-2 border-purple-500',
    headerIconBg: 'bg-purple-600',
    headerBarBorder: 'border-purple-800',
    cardBorder: 'border-purple-300',
    description: 'Royal Violet / Purple Theme',
  },
  {
    id: 'Orange',
    name: 'Orange',
    nameSi: 'තැඹිලි',
    previewBg: 'bg-orange-500',
    previewBorder: 'border-orange-600',
    accentBadge: 'bg-orange-100 text-orange-900 border-orange-300',
    appContainerClass: 'bg-orange-100',
    bgColor: '#ffedd5',
    bgGradient: 'bg-orange-100',
    headerAccent: 'border-b-2 border-orange-500',
    headerIconBg: 'bg-orange-500',
    headerBarBorder: 'border-orange-800',
    cardBorder: 'border-orange-300',
    description: 'Vibrant Warm Orange Theme',
  },
];

export function getBackgroundTheme(colorName?: string): BackgroundTheme {
  if (!colorName || colorName.toLowerCase() === 'default') {
    return DEFAULT_THEME;
  }
  const match = BACKGROUND_THEMES.find(
    (t) => t.id.toLowerCase() === colorName.toLowerCase() || t.name.toLowerCase() === colorName.toLowerCase()
  );
  return match || DEFAULT_THEME;
}

export function getAppBackgroundClass(colorName?: string): string {
  return getBackgroundTheme(colorName).appContainerClass;
}
