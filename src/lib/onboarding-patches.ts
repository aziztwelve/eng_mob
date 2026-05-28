import type { PatchOnboardingRequest } from '@/types/api';

/**
 * Helpers, скрывающие awkward-схемы в `PatchOnboardingRequest`.
 *
 * Backend-протокол наследует JSON-merge-patch с особенностью: некоторые
 * поля имеют sentinel-флаг "был ли он явно установлен" (например,
 * `motivation_set`), потому что пустой массив `[]` нельзя отличить от
 * "не передавали" в обычном partial-update'е. Эти helpers инкапсулируют
 * протокольные детали — UI-код просто говорит "хочу выставить такое
 * значение".
 */

/**
 * motivationPatch — подготавливает part-of-PatchOnboardingRequest для
 * установки motivation (он же goal).
 *
 * @param value
 *   - `string` — single-select goal (на mobile — сейчас именно этот вариант).
 *   - `string[]` — multi-select.
 *   - `null` — явно очистить (юзер передумал, removed).
 *   - `undefined` — НЕ ПЕРЕДАВАТЬ. Не вызывайте функцию вместо этого.
 *
 * Всегда устанавливает `motivation_set: true`, чтобы backend знал,
 * что юзер сделал явный выбор (включая случай `[]` для clear).
 *
 * @example
 *   await patch.mutateAsync({ patch: motivationPatch(value) });
 *   // вместо: ({ motivation: [v], motivation_set: true })
 */
export function motivationPatch(
  value: string | string[] | null,
): Pick<PatchOnboardingRequest, 'motivation' | 'motivation_set'> {
  if (value === null) {
    return { motivation: [], motivation_set: true };
  }
  const arr = Array.isArray(value) ? value : [value];
  return { motivation: arr, motivation_set: true };
}
