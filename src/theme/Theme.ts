import {
  House,
  GraduationCap,
  Bot,
  Trophy,
  User,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * Fluent — единый источник правды по цветам/размерам для нижнего меню
 * (стиль Duolingo + Memrise). Используется FluentBottomTabs.
 */
export const FluentTheme = {
  colors: {
    /** Фон приложения (для справки; глобально применяется через SunsetBg). */
    backgroundGradient: ['#12003A', '#4A005F', '#E74D1A'] as const,
    backgroundGradientLocations: [0, 0.55, 1] as const,
    /** Акцент — активный таб. */
    primary: '#FFD83D',
    text: '#FFFFFF',
    inactive: 'rgba(255,255,255,0.75)',
    card: 'rgba(255,255,255,0.08)',
    cardBorder: 'rgba(255,255,255,0.12)',
    /** Glassmorphism-подложка таб-бара (почти непрозрачная — без просвечивания). */
    tabBarGlass: 'rgba(58,12,40,0.97)',
  },
  tabBar: {
    height: 54,
    radiusTop: 32,
    /** Радиус blur для backdrop (expo-blur). */
    blur: 20,
    iconSize: 22,
    labelSize: 11,
  },
  font: {
    /** Inter; если не загружен — система использует дефолтный шрифт. */
    family: 'Inter',
    activeWeight: '700' as const,
    inactiveWeight: '500' as const,
  },
} as const;

/** Идентификаторы табов приложения (Флешкарты исключены по требованию). */
export type TabId = 'home' | 'lessons' | 'ai' | 'league' | 'profile';

/** Описание одного пункта нижнего меню. */
export interface NavigationItem {
  id: TabId;
  title: string;
  icon: LucideIcon;
}

/**
 * navigationConfig — порядок и иконки пунктов меню.
 * Флешкарты (CreditCard) намеренно не включены.
 */
export const navigationConfig: NavigationItem[] = [
  { id: 'home', title: 'Главная', icon: House },
  { id: 'lessons', title: 'Уроки', icon: GraduationCap },
  { id: 'ai', title: 'AI', icon: Bot },
  { id: 'league', title: 'Лига', icon: Trophy },
  { id: 'profile', title: 'Профиль', icon: User },
];

/**
 * Маппинг имени expo-router маршрута → TabId. Маршруты, которых здесь нет
 * (tracks, courses, home-candy, …), в меню не показываются.
 */
export const ROUTE_TO_TAB_ID: Record<string, TabId> = {
  index: 'home',
  practice: 'lessons',
  ai: 'ai',
  social: 'league',
  profile: 'profile',
};
