import React from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, Text, View } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// Each avatar is an independent asset; indices match the two comparison sheets.
export const FREE_TALK_AVATARS = [
  require('../../../assets/ai/avatars/robot-01.png'),
  require('../../../assets/ai/avatars/robot-02.png'),
  require('../../../assets/ai/avatars/robot-03.png'),
  require('../../../assets/ai/avatars/robot-04.png'),
  require('../../../assets/ai/avatars/robot-05.png'),
  require('../../../assets/ai/avatars/robot-06.png'),
  require('../../../assets/ai/avatars/robot-07.png'),
  require('../../../assets/ai/avatars/robot-08.png'),
  require('../../../assets/ai/avatars/robot-09.png'),
  require('../../../assets/ai/avatars/robot-10.png'),
] as const;

type Props = { visible: boolean; selected: number; loading: boolean; saving: boolean; error: boolean; onRetry: () => void; onClose: () => void; onSelect: (id: number) => void };

export function AvatarPicker({ visible, selected, loading, saving, error, onRetry, onClose, onSelect }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View className="flex-1 justify-end bg-black/40">
      <View className="max-h-[85%] rounded-t-[28px] bg-white" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
        <View className="flex-row items-center gap-3 px-5 pb-3 pt-5">
          <View className="flex-1"><Text className="font-nunito-extrabold text-xl text-mieo-heading">{t('freeTalk.choose_avatar')}</Text><Text className="font-nunito-semibold text-sm text-mieo-body">{t('freeTalk.avatar_saved_device')}</Text></View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} className="h-11 w-11 items-center justify-center rounded-full bg-[#F2F8FB]"><X size={22} color="#171A1C" /></Pressable>
        </View>
        {loading ? <View className="items-center p-8"><ActivityIndicator color="#2FA8E6" /></View> : error ?
          <Pressable onPress={onRetry} className="items-center p-8"><Text className="font-nunito-bold text-mieo-error-text">{t('common.load_failed')} · {t('practice.retry')}</Text></Pressable> :
          <FlatList data={FREE_TALK_AVATARS} keyExtractor={(_item, i) => String(i + 1)} numColumns={2}
            contentContainerClassName="gap-3 px-4 pb-4" columnWrapperClassName="gap-3" showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const id = index + 1; const active = id === selected;
              return <Pressable onPress={() => onSelect(id)} disabled={saving} accessibilityRole="radio" accessibilityLabel={t('freeTalk.avatar_number', { number: id })} accessibilityState={{ checked: active, disabled: saving }}
                className={`flex-1 overflow-hidden rounded-2xl border-2 ${active ? 'border-[#2FA8E6] bg-[#E7F8FF]' : 'border-[#E3E6E8] bg-[#F5FAFC]'}`}>
                <View className="h-32 items-center justify-end"><Image source={item} resizeMode="contain" resizeMethod="resize" className="h-32 w-full" /></View>
                <View className="flex-row items-center justify-between px-3 pb-3 pt-2"><Text className="font-nunito-extrabold text-sm text-mieo-heading">{t('freeTalk.avatar_number', { number: id })}</Text>{active && <Check size={19} color="#1685BD" />}</View>
              </Pressable>;
            }} />}
      </View>
    </View>
  </Modal>;
}
