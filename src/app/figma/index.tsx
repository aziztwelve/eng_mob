import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

const screens = [
  { id: "0", title: "Dark / ENtry Flow / Onboarding / 2159:12444", source: require("../../../assets/figma/screens/Dark__ENtry_Flow__Onboarding__2159-12444.png") },
  { id: "1", title: "Dark / ENtry Flow / Splash / 2159:12106", source: require("../../../assets/figma/screens/Dark__ENtry_Flow__Splash__2159-12106.png") },
  { id: "2", title: "Dark / Game Play / Chears / 2159:12974", source: require("../../../assets/figma/screens/Dark__Game_Play__Chears__2159-12974.png") },
  { id: "3", title: "Dark / Game Play / Survey / 2159:12556", source: require("../../../assets/figma/screens/Dark__Game_Play__Survey__2159-12556.png") },
  { id: "4", title: "Dark / Game Play / Survey / 2159:12732", source: require("../../../assets/figma/screens/Dark__Game_Play__Survey__2159-12732.png") },
  { id: "5", title: "Dark / Game Play / Survey / 2159:12908", source: require("../../../assets/figma/screens/Dark__Game_Play__Survey__2159-12908.png") },
  { id: "6", title: "Dark / Home / Loading", source: require("../../../assets/figma/screens/Dark__Home__Loading.png") },
  { id: "7", title: "Dark / Home / Loading / 2159:21423", source: require("../../../assets/figma/screens/Dark__Home__Loading__2159-21423.png") },
  { id: "8", title: "Dark / Home / Loading / 2159:22457", source: require("../../../assets/figma/screens/Dark__Home__Loading__2159-22457.png") },
  { id: "9", title: "Dark / Home / Streak / 2159:22300", source: require("../../../assets/figma/screens/Dark__Home__Streak__2159-22300.png") },
  { id: "10", title: "Dark / Home / Streak / 2159:22367", source: require("../../../assets/figma/screens/Dark__Home__Streak__2159-22367.png") },
  { id: "11", title: "Dark / Leaderboard / Leaderboard Week Start / 2159:18590", source: require("../../../assets/figma/screens/Dark__Leaderboard__Leaderboard_Week_Start__2159-18590.png") },
  { id: "12", title: "Dark / Leaderboard / Leaderboard week end / 2159:19882", source: require("../../../assets/figma/screens/Dark__Leaderboard__Leaderboard_week_end__2159-19882.png") },
  { id: "13", title: "Dark / Live Questions / Survey / 2159:24816", source: require("../../../assets/figma/screens/Dark__Live_Questions__Survey__2159-24816.png") },
  { id: "14", title: "Dark / Live Questions / Survey / 2159:25018", source: require("../../../assets/figma/screens/Dark__Live_Questions__Survey__2159-25018.png") },
  { id: "15", title: "Dark / Live Questions / Survey / 2159:25225", source: require("../../../assets/figma/screens/Dark__Live_Questions__Survey__2159-25225.png") },
  { id: "16", title: "Dark / Login / After Social Login / 2159:38492", source: require("../../../assets/figma/screens/Dark__Login__After_Social_Login__2159-38492.png") },
  { id: "17", title: "Dark / Login / Login", source: require("../../../assets/figma/screens/Dark__Login__Login.png") },
  { id: "18", title: "Dark / Login / Login / 2159:38555", source: require("../../../assets/figma/screens/Dark__Login__Login__2159-38555.png") },
  { id: "19", title: "Dark / New Account Progress / Continue with Email / 2159:38426", source: require("../../../assets/figma/screens/Dark__New_Account_Progress__Continue_with_Email__2159-38426.png") },
  { id: "20", title: "Dark / New Account Progress / Loading / 2159:38306", source: require("../../../assets/figma/screens/Dark__New_Account_Progress__Loading__2159-38306.png") },
  { id: "21", title: "Dark / New Account Progress / Onboarding / 2159:37580", source: require("../../../assets/figma/screens/Dark__New_Account_Progress__Onboarding__2159-37580.png") },
  { id: "22", title: "Dark / New Account Progress / Onboarding / 2159:37689", source: require("../../../assets/figma/screens/Dark__New_Account_Progress__Onboarding__2159-37689.png") },
  { id: "23", title: "Dark / New Account Progress / Streak Goal / 2159:38336", source: require("../../../assets/figma/screens/Dark__New_Account_Progress__Streak_Goal__2159-38336.png") },
  { id: "24", title: "Dark / New Account Progress / Survey / 2159:37809", source: require("../../../assets/figma/screens/Dark__New_Account_Progress__Survey__2159-37809.png") },
  { id: "25", title: "Dark / New Account Progress / Survey / 2159:37925", source: require("../../../assets/figma/screens/Dark__New_Account_Progress__Survey__2159-37925.png") },
  { id: "26", title: "Dark / New Account Progress / Survey / 2159:38042", source: require("../../../assets/figma/screens/Dark__New_Account_Progress__Survey__2159-38042.png") },
  { id: "27", title: "Dark / New Account Progress / Survey / 2159:38157", source: require("../../../assets/figma/screens/Dark__New_Account_Progress__Survey__2159-38157.png") },
  { id: "28", title: "Dark / Overlays / Bottom App Bar / 2159:24739", source: require("../../../assets/figma/screens/Dark__Overlays__Bottom_App_Bar__2159-24739.png") },
  { id: "29", title: "Dark / Overlays / Select Languages / 2159:24692", source: require("../../../assets/figma/screens/Dark__Overlays__Select_Languages__2159-24692.png") },
  { id: "30", title: "Dark / Overlays / Select Languages / 2159:24725", source: require("../../../assets/figma/screens/Dark__Overlays__Select_Languages__2159-24725.png") },
  { id: "31", title: "Dark / Profile / Edit profile / 2159:18543", source: require("../../../assets/figma/screens/Dark__Profile__Edit_profile__2159-18543.png") },
  { id: "32", title: "Dark / Profile / Profile Setting / 2159:18256", source: require("../../../assets/figma/screens/Dark__Profile__Profile_Setting__2159-18256.png") },
  { id: "33", title: "Dark / Profile / Profile / 2159:18065", source: require("../../../assets/figma/screens/Dark__Profile__Profile__2159-18065.png") },
  { id: "34", title: "Dark / Result / Play Result / 2159:37173", source: require("../../../assets/figma/screens/Dark__Result__Play_Result__2159-37173.png") },
  { id: "35", title: "Dark / Result / Rewpord / 2159:37383", source: require("../../../assets/figma/screens/Dark__Result__Rewpord__2159-37383.png") },
  { id: "36", title: "Dark / Result / Streak Goal / 2159:37450", source: require("../../../assets/figma/screens/Dark__Result__Streak_Goal__2159-37450.png") },
  { id: "37", title: "Dark / Result / Streak / 2159:37301", source: require("../../../assets/figma/screens/Dark__Result__Streak__2159-37301.png") },
  { id: "38", title: "Dark / Review Mistakes / Review Mistakes / 2159:25464", source: require("../../../assets/figma/screens/Dark__Review_Mistakes__Review_Mistakes__2159-25464.png") },
  { id: "39", title: "Dark / Review Mistakes / Test / 2159:25475", source: require("../../../assets/figma/screens/Dark__Review_Mistakes__Test__2159-25475.png") },
  { id: "40", title: "Dark / Shop / Shop / 2159:21177", source: require("../../../assets/figma/screens/Dark__Shop__Shop__2159-21177.png") },
  { id: "41", title: "Dark / Shop / Subscription /  2159:21230", source: require("../../../assets/figma/screens/Dark__Shop__Subscription___2159-21230.png") },
  { id: "42", title: "Dark / Stories / Stories / 2159:25649", source: require("../../../assets/figma/screens/Dark__Stories__Stories__2159-25649.png") },
  { id: "43", title: "Dark / Stories / Survey / 2159:25655", source: require("../../../assets/figma/screens/Dark__Stories__Survey__2159-25655.png") },
  { id: "44", title: "Dark / Stories / Survey / 2159:31403", source: require("../../../assets/figma/screens/Dark__Stories__Survey__2159-31403.png") },
  { id: "45", title: "Dark / Streak Mieo Talk / Ai Meet / 2159:13247", source: require("../../../assets/figma/screens/Dark__Streak_Mieo_Talk__Ai_Meet__2159-13247.png") },
  { id: "46", title: "Dark / Streak Mieo Talk / Streak / 2159:13060", source: require("../../../assets/figma/screens/Dark__Streak_Mieo_Talk__Streak__2159-13060.png") },
  { id: "47", title: "Light / Account / ContinueEmail", source: require("../../../assets/figma/screens/Light__Account__ContinueEmail.png") },
  { id: "48", title: "Light / Account / Loading", source: require("../../../assets/figma/screens/Light__Account__Loading.png") },
  { id: "49", title: "Light / Account / StreakGoal", source: require("../../../assets/figma/screens/Light__Account__StreakGoal.png") },
  { id: "50", title: "Light / Account / Survey-3", source: require("../../../assets/figma/screens/Light__Account__Survey-3.png") },
  { id: "51", title: "Light / Account / Survey-4", source: require("../../../assets/figma/screens/Light__Account__Survey-4.png") },
  { id: "52", title: "Light / ENtry Flow / Onboarding / 25:1919", source: require("../../../assets/figma/screens/Light__ENtry_Flow__Onboarding__25-1919.png") },
  { id: "53", title: "Light / ENtry Flow / Splash / 22:5", source: require("../../../assets/figma/screens/Light__ENtry_Flow__Splash__22-5.png") },
  { id: "54", title: "Light / Entry / Onboarding", source: require("../../../assets/figma/screens/Light__Entry__Onboarding.png") },
  { id: "55", title: "Light / Entry / Splash", source: require("../../../assets/figma/screens/Light__Entry__Splash.png") },
  { id: "56", title: "Light / GamePlay / Chears", source: require("../../../assets/figma/screens/Light__GamePlay__Chears.png") },
  { id: "57", title: "Light / GamePlay / Survey-1", source: require("../../../assets/figma/screens/Light__GamePlay__Survey-1.png") },
  { id: "58", title: "Light / GamePlay / Survey-2", source: require("../../../assets/figma/screens/Light__GamePlay__Survey-2.png") },
  { id: "59", title: "Light / GamePlay / Survey-3", source: require("../../../assets/figma/screens/Light__GamePlay__Survey-3.png") },
  { id: "60", title: "Light / Game Play / Chears / 204:3638", source: require("../../../assets/figma/screens/Light__Game_Play__Chears__204-3638.png") },
  { id: "61", title: "Light / Game Play / Survey / 149:34400", source: require("../../../assets/figma/screens/Light__Game_Play__Survey__149-34400.png") },
  { id: "62", title: "Light / Game Play / Survey / 149:34931", source: require("../../../assets/figma/screens/Light__Game_Play__Survey__149-34931.png") },
  { id: "63", title: "Light / Game Play / Survey / 149:35178", source: require("../../../assets/figma/screens/Light__Game_Play__Survey__149-35178.png") },
  { id: "64", title: "Light / Home / Home", source: require("../../../assets/figma/screens/Light__Home__Home.png") },
  { id: "65", title: "Light / Home / Loading / 408:10297", source: require("../../../assets/figma/screens/Light__Home__Loading__408-10297.png") },
  { id: "66", title: "Light / Home / Loading / 429:34434", source: require("../../../assets/figma/screens/Light__Home__Loading__429-34434.png") },
  { id: "67", title: "Light / Home / Streak / 408:16310", source: require("../../../assets/figma/screens/Light__Home__Streak__408-16310.png") },
  { id: "68", title: "Light / Home / Streak / 408:16810", source: require("../../../assets/figma/screens/Light__Home__Streak__408-16810.png") },
  { id: "69", title: "Light / Leaderboard / Leaderboard Week Start / 375:6341", source: require("../../../assets/figma/screens/Light__Leaderboard__Leaderboard_Week_Start__375-6341.png") },
  { id: "70", title: "Light / Leaderboard / Leaderboard week end / 408:5035", source: require("../../../assets/figma/screens/Light__Leaderboard__Leaderboard_week_end__408-5035.png") },
  { id: "71", title: "Light / Leaderboard / Start", source: require("../../../assets/figma/screens/Light__Leaderboard__Start.png") },
  { id: "72", title: "Light / Live Questions / Survey / 421:10166", source: require("../../../assets/figma/screens/Light__Live_Questions__Survey__421-10166.png") },
  { id: "73", title: "Light / Live Questions / Survey / 421:10724", source: require("../../../assets/figma/screens/Light__Live_Questions__Survey__421-10724.png") },
  { id: "74", title: "Light / Live Questions / Survey / 421:11123", source: require("../../../assets/figma/screens/Light__Live_Questions__Survey__421-11123.png") },
  { id: "75", title: "Light / Login / AfterSocial", source: require("../../../assets/figma/screens/Light__Login__AfterSocial.png") },
  { id: "76", title: "Light / Login / After Social Login / 366:15263", source: require("../../../assets/figma/screens/Light__Login__After_Social_Login__366-15263.png") },
  { id: "77", title: "Light / Login / Login", source: require("../../../assets/figma/screens/Light__Login__Login.png") },
  { id: "78", title: "Light / Login / Login / 364:14961", source: require("../../../assets/figma/screens/Light__Login__Login__364-14961.png") },
  { id: "79", title: "Light / New Account Progress / Continue with Email / 2016:11880", source: require("../../../assets/figma/screens/Light__New_Account_Progress__Continue_with_Email__2016-11880.png") },
  { id: "80", title: "Light / New Account Progress / Loading / 62:12681", source: require("../../../assets/figma/screens/Light__New_Account_Progress__Loading__62-12681.png") },
  { id: "81", title: "Light / New Account Progress / Onboarding / 62:3649", source: require("../../../assets/figma/screens/Light__New_Account_Progress__Onboarding__62-3649.png") },
  { id: "82", title: "Light / New Account Progress / Onboarding / 62:8081", source: require("../../../assets/figma/screens/Light__New_Account_Progress__Onboarding__62-8081.png") },
  { id: "83", title: "Light / New Account Progress / Streak Goal / 277:6001", source: require("../../../assets/figma/screens/Light__New_Account_Progress__Streak_Goal__277-6001.png") },
  { id: "84", title: "Light / New Account Progress / Survey / 62:10515", source: require("../../../assets/figma/screens/Light__New_Account_Progress__Survey__62-10515.png") },
  { id: "85", title: "Light / New Account Progress / Survey / 62:8472", source: require("../../../assets/figma/screens/Light__New_Account_Progress__Survey__62-8472.png") },
  { id: "86", title: "Light / New Account Progress / Survey / 62:9100", source: require("../../../assets/figma/screens/Light__New_Account_Progress__Survey__62-9100.png") },
  { id: "87", title: "Light / New Account Progress / Survey / 62:9688", source: require("../../../assets/figma/screens/Light__New_Account_Progress__Survey__62-9688.png") },
  { id: "88", title: "Light / Overlays / Bottom App Bar / 149:34134", source: require("../../../assets/figma/screens/Light__Overlays__Bottom_App_Bar__149-34134.png") },
  { id: "89", title: "Light / Overlays / QuickPlay", source: require("../../../assets/figma/screens/Light__Overlays__QuickPlay.png") },
  { id: "90", title: "Light / Overlays / Select Languages / 408:17145", source: require("../../../assets/figma/screens/Light__Overlays__Select_Languages__408-17145.png") },
  { id: "91", title: "Light / Overlays / Select Languages / 408:17404", source: require("../../../assets/figma/screens/Light__Overlays__Select_Languages__408-17404.png") },
  { id: "92", title: "Light / Profile / Edit", source: require("../../../assets/figma/screens/Light__Profile__Edit.png") },
  { id: "93", title: "Light / Profile / Edit profile / 329:9009", source: require("../../../assets/figma/screens/Light__Profile__Edit_profile__329-9009.png") },
  { id: "94", title: "Light / Profile / Profile", source: require("../../../assets/figma/screens/Light__Profile__Profile.png") },
  { id: "95", title: "Light / Profile / Profile Setting / 304:6117", source: require("../../../assets/figma/screens/Light__Profile__Profile_Setting__304-6117.png") },
  { id: "96", title: "Light / Profile / Profile / 304:2746", source: require("../../../assets/figma/screens/Light__Profile__Profile__304-2746.png") },
  { id: "97", title: "Light / Profile / Settings", source: require("../../../assets/figma/screens/Light__Profile__Settings.png") },
  { id: "98", title: "Light / Result / Play Result / 204:3755", source: require("../../../assets/figma/screens/Light__Result__Play_Result__204-3755.png") },
  { id: "99", title: "Light / Result / Rewpord / 229:14410", source: require("../../../assets/figma/screens/Light__Result__Rewpord__229-14410.png") },
  { id: "100", title: "Light / Result / Streak Goal / 246:15735", source: require("../../../assets/figma/screens/Light__Result__Streak_Goal__246-15735.png") },
  { id: "101", title: "Light / Result / Streak / 204:4197", source: require("../../../assets/figma/screens/Light__Result__Streak__204-4197.png") },
  { id: "102", title: "Light / Review Mistakes / Review Mistakes / 429:7288", source: require("../../../assets/figma/screens/Light__Review_Mistakes__Review_Mistakes__429-7288.png") },
  { id: "103", title: "Light / Review Mistakes / Test / 429:8667", source: require("../../../assets/figma/screens/Light__Review_Mistakes__Test__429-8667.png") },
  { id: "104", title: "Light / Shop / Shop", source: require("../../../assets/figma/screens/Light__Shop__Shop.png") },
  { id: "105", title: "Light / Shop / Shop / 329:10628", source: require("../../../assets/figma/screens/Light__Shop__Shop__329-10628.png") },
  { id: "106", title: "Light / Shop / Subscription", source: require("../../../assets/figma/screens/Light__Shop__Subscription.png") },
  { id: "107", title: "Light / Shop / Subscription /  2088:24806", source: require("../../../assets/figma/screens/Light__Shop__Subscription___2088-24806.png") },
  { id: "108", title: "Light / Stories / Stories / 429:8892", source: require("../../../assets/figma/screens/Light__Stories__Stories__429-8892.png") },
  { id: "109", title: "Light / Stories / Survey / 2088:13951", source: require("../../../assets/figma/screens/Light__Stories__Survey__2088-13951.png") },
  { id: "110", title: "Light / Stories / Survey / 429:11254", source: require("../../../assets/figma/screens/Light__Stories__Survey__429-11254.png") },
  { id: "111", title: "Light / Streak Mieo Talk / Ai Meet / 255:3557", source: require("../../../assets/figma/screens/Light__Streak_Mieo_Talk__Ai_Meet__255-3557.png") },
  { id: "112", title: "Light / Streak Mieo Talk / Streak / 246:18355", source: require("../../../assets/figma/screens/Light__Streak_Mieo_Talk__Streak__246-18355.png") },
  { id: "113", title: "Light / Streak / AiMeet", source: require("../../../assets/figma/screens/Light__Streak__AiMeet.png") },
  { id: "114", title: "Light / Streak / Streak", source: require("../../../assets/figma/screens/Light__Streak__Streak.png") },
] as const;

export default function FigmaScreensArchive() {
  const { width, height } = useWindowDimensions();
  const [selected, setSelected] = useState<(typeof screens)[number] | null>(null);
  const [filter, setFilter] = useState<'all' | 'light' | 'dark'>('all');
  const visible = useMemo(
    () => screens.filter((screen) => filter === 'all' || screen.title.toLowerCase().startsWith(filter)),
    [filter],
  );
  const cardWidth = Math.max(145, (width - 36) / 2);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>MIEO / FIGMA IMPORT</Text>
        <Text style={styles.title}>All mobile screens</Text>
        <Text style={styles.subtitle}>{visible.length} exported frames · tap to inspect</Text>
        <View style={styles.filters}>
          {(['all', 'light', 'dark'] as const).map((value) => (
            <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterActive]}>
              <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{value.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)} style={[styles.card, { width: cardWidth }]}>
            <Image source={item.source} style={[styles.thumb, { width: cardWidth - 2, height: (cardWidth - 2) * 2.16 }]} resizeMode="cover" />
            <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
          </Pressable>
        )}
      />
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSelected(null)}><Text style={styles.close}>Close</Text></Pressable>
            <Text numberOfLines={1} style={styles.modalTitle}>{selected?.title}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.preview}>
            {selected && <Image source={selected.source} style={{ width: width, height: Math.min(height * 1.2, width * 812 / 375) }} resizeMode="contain" />}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#06070D' },
  header: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12 },
  eyebrow: { color: '#00FFA3', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 6 },
  subtitle: { color: '#9EA8B7', fontSize: 13, marginTop: 4 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 14 },
  filter: { borderColor: '#263142', borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  filterActive: { backgroundColor: '#00FFA3', borderColor: '#00FFA3' },
  filterText: { color: '#9EA8B7', fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: '#06120D' },
  grid: { padding: 12, paddingBottom: 32 },
  row: { gap: 10, marginBottom: 12 },
  card: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#141A24', borderColor: '#263142', borderWidth: 1 },
  thumb: { backgroundColor: '#FFF' },
  cardTitle: { color: '#FFF', fontSize: 11, lineHeight: 15, paddingHorizontal: 9, paddingVertical: 9 },
  modal: { flex: 1, backgroundColor: '#06070D' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  close: { color: '#00FFA3', fontWeight: '800' },
  modalTitle: { color: '#FFF', flex: 1, fontWeight: '700' },
  preview: { alignItems: 'center', paddingBottom: 32 },
});

