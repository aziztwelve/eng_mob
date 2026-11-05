import type { DeviceToken } from '@/types/api';
export function isCurrentPushDevice(devices: DeviceToken[] | undefined, token: string | null): boolean {
 return !!token && !!devices?.some(d => (d.platform === 2 || d.platform === 'PLATFORM_EXPO') && d.token === token);
}
