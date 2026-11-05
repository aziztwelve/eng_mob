export const DEFAULT_AVATAR = 1;
export const AVATAR_COUNT = 10;
export const avatarStorageKey = (userId: string) => `free_talk_avatar_v1:${userId}`;

export function parseAvatarId(value: string | null): number {
  const id = Number(value);
  return Number.isInteger(id) && id >= 1 && id <= AVATAR_COUNT ? id : DEFAULT_AVATAR;
}
