import type { TFunction } from 'i18next';
import type { Achievement } from '@/types/api';
export function achievementText(achievement: Achievement, t: TFunction) {
 return { title: t(`achievement.${achievement.code}.title`, { defaultValue: achievement.title }), description: t(`achievement.${achievement.code}.description`, { defaultValue: achievement.description }) };
}
