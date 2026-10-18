import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Check, LockKeyhole } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useUserStats } from '@/hooks/use-user-stats';
import { getLanguage, languageNameForUi, type UiLanguage } from '@/lib/supported-languages';
import { useHomePath } from '@/hooks/use-home-path';
import { useOnboardingState } from '@/hooks/use-onboarding';
import { FigmaSvg } from '@/components/figma/FigmaSvg';
import { markStartup } from '@/lib/startup-timing';

const SCENE = require('../../../assets/figma/home-map/map-scenery.png');
const SKY = '#BFEAFD';
// Coordinates relative to the Figma Body (the native status area replaces its 50pt status bar).
const SLOTS = [[77,381],[144,505],[226,629],[154,738],[79,845],[154,968]];
const A = {
  gems: require('../../../assets/figma/home-map/gems.svg'),
  hearts: require('../../../assets/figma/home-map/hearts.svg'),
  levelIcon: require('../../../assets/figma/home-map/level-icon.svg'),
  listIcon: require('../../../assets/figma/home-map/list-icon.svg'),
  down: require('../../../assets/figma/home-map/lang-down.svg'),
  flag: [
    require('../../../assets/figma/home-map/lang-group-1.svg'),
    require('../../../assets/figma/home-map/lang-group-2.svg'),
    require('../../../assets/figma/home-map/lang-group-3.svg'),
    require('../../../assets/figma/home-map/lang-group-4.svg'),
    require('../../../assets/figma/home-map/lang-group-5.svg'),
    require('../../../assets/figma/home-map/lang-group-6.svg'),
    require('../../../assets/figma/home-map/lang-group-7.svg'),
    require('../../../assets/figma/home-map/lang-group-8.svg'),
    require('../../../assets/figma/home-map/lang-group-9.svg'),
    require('../../../assets/figma/home-map/lang-group-10.svg'),
  ],
  stepFlag: require('../../../assets/figma/home-map/step-flag.svg'),
  stepDumbbell: require('../../../assets/figma/home-map/step-dumbbell.svg'),
  stepPuzzle: require('../../../assets/figma/home-map/step-puzzle.svg'),
  stepStar: require('../../../assets/figma/home-map/step-star.svg'),
};
const CLOUDS = [
  require('../../../assets/figma/home-map/cloud-1.svg'),
  require('../../../assets/figma/home-map/cloud-2.svg'),
  require('../../../assets/figma/home-map/cloud-3.svg'),
  require('../../../assets/figma/home-map/cloud-4.svg'),
  require('../../../assets/figma/home-map/cloud-5.svg'),
  require('../../../assets/figma/home-map/cloud-6.svg'),
  require('../../../assets/figma/home-map/cloud-7.svg'),
];


export default function HomeMap() {
  useEffect(() => { markStartup('home mounted'); }, []);
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const S = Math.min(width, 600) / 375;
  const { data: stats } = useUserStats();
  const path = useHomePath();
  const onboarding = useOnboardingState();
  const scroll = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const currentIndex = path.lessons.findIndex(l => l.state === 'current');
  useEffect(() => { setPage(Math.max(0, Math.floor(currentIndex / 6))); }, [path.track?.id, currentIndex]);
  const pages = Math.max(1, Math.ceil(path.lessons.length / 6));
  const currentPage = Math.min(page, pages - 1);
  const language = path.track?.language || onboarding.data?.target_language || 'en';
  const ui = (['ru','en','kk'].includes(i18n.language) ? i18n.language : 'en') as UiLanguage;
  const languageName = languageNameForUi(language, ui);
  const openTracks = () => router.push('/(tabs)/tracks');
  const changePage = (next: number) => { setPage(next); scroll.current?.scrollTo({ y: 0, animated: true }); };
  const label = path.track?.level ? t('home.path_level', { level: path.track.level.toUpperCase(), unit: currentPage + 1 }) : t('home.path_title');

  return (
    <View className="flex-1 items-center" style={{ backgroundColor: SKY }}>
      <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 * S + insets.bottom }}>
        <View style={{ width: 375 * S, height: 1314 * S, overflow: 'hidden' }}>
          <View style={{position:"absolute",top:50*S,width:375*S,height:1264*S}}>
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 356 * S, bottom: 0, backgroundColor: '#7AB84F' }} />
          {[
            [-80,-97.31,200.388,96.511], [196,-100.31,205.784,72.252], [190,2.69,185.568,67.113],
            [-75,68.84,146.182,96.617], [216,151.84,172.713,53.273], [-88,195.84,104.147,39.641], [113,97.84,87,53.593],
          ].map(([x,y,w,h], i) => <FigmaSvg key={i} source={CLOUDS[i]} width={w*S} height={h*S} style={{ position:'absolute', left:x*S, top:y*S }} />)}
          {/* Full decorative export, with overflow trees at x=-124. No baked lesson buttons. */}
          <View pointerEvents="none" style={{ position:'absolute', left:-124*S, top:154*S }}>
            <Image source={SCENE} contentFit="contain" style={{width:643*S,height:1110*S}} />
          </View>
          <View className="absolute flex-row items-center justify-between" style={{ left:16*S, right:16*S, top:16*S, height:53*S, gap:8*S }}>
            <View className="flex-1" style={{ gap:4*S }}>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ fontFamily:'Nunito_800ExtraBold', fontSize:22*S, color:'#171A1C' }}>{t('home.good_morning')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('home.language_settings')} onPress={() => router.push('/profile/settings')} className="flex-row items-center" style={{ gap:6*S, minHeight:24*S }}>
                {language === 'en' ? <FigmaSvg source={require('../../../assets/figma/home-map/language-en.svg')} width={25.482*S} height={16*S} /> : <Text style={{fontSize:18*S}}>{getLanguage(language)?.flag || '🌐'}</Text>}
                <Text numberOfLines={1} style={{fontFamily:'Nunito_500Medium',fontSize:14*S,color:'#5D686F',flexShrink:1}}>{languageName}</Text>
                <FigmaSvg source={A.down} width={16*S} height={16*S} />
              </Pressable>
            </View>
            <View className="flex-row" style={{gap:12*S}}>
              {[[A.gems,stats?.gems],[A.hearts,stats?.hearts]].map(([src,value],i) => <View key={i} className="flex-row items-center rounded-full border bg-white" style={{gap:4*S,paddingLeft:6*S,paddingRight:12*S,paddingVertical:6*S,borderColor:'#59C8FF',borderBottomWidth:3*S}}>
                <FigmaSvg source={src!} width={24*S} height={24*S}/><Text style={{fontFamily:'Nunito_500Medium',fontSize:14*S,color:'#5D686F'}}>{value ?? '—'}</Text>
              </View>)}
            </View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={t('home.open_tracks')} onPress={openTracks} style={{position:'absolute',left:16*S,top:85*S,width:343*S,height:69*S}}>
            <View className="flex-1 flex-row items-center bg-white" style={{borderRadius:16*S,borderWidth:1.5*S,borderBottomWidth:4*S,borderColor:'#C9EDFF',paddingHorizontal:16*S,gap:16*S}}>
              <FigmaSvg source={A.levelIcon} width={44*S} height={44*S}/>
              <View className="flex-1" style={{gap:4*S}}>
                <Text numberOfLines={1} style={{fontFamily:'Nunito_500Medium',fontSize:14*S,color:'#1AB3FF'}}>{label}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{fontFamily:'Nunito_800ExtraBold',fontSize:16*S,color:'#171A1C'}}>{path.track?.title || t(path.loading ? 'home.path_loading' : 'home.path_title')}</Text>
              </View>
              <View className="items-center justify-center rounded-full" style={{width:36*S,height:36*S,backgroundColor:'#DFF4FF'}}><FigmaSvg source={A.listIcon} width={24*S} height={24*S}/></View>
            </View>
          </Pressable>
          {path.lessons.slice(currentPage*6,currentPage*6+6).map((lesson,i) => {
            const [x,y]=SLOTS[i]; const active=lesson.state==='current'; const done=lesson.state==='done';
            const icon=[A.stepFlag,A.stepDumbbell,A.stepPuzzle,A.stepStar,A.stepStar,A.stepStar][i];
            const dims=[[28.5234,34.2727],[42.4264,42.7696],[34.6065,32],[30,30],[30,30],[30,30]][i];
            return <View key={lesson.id} style={{position:'absolute',left:(x-6)*S,top:(y-6)*S,width:84*S,height:84*S}}>
              {active && <Svg width={84*S} height={84*S} viewBox="0 0 84 84" style={{position:'absolute'}}><Circle cx="42" cy="42" r="39" stroke="rgba(255,255,255,0.35)" strokeWidth="6" fill="none"/><Circle cx="42" cy="42" r="39" stroke="white" strokeWidth="6" strokeDasharray="184 245" rotation="-90" origin="42,42" fill="none"/></Svg>}
              <Pressable accessibilityRole="button" accessibilityLabel={t('home.path_lesson', {n:currentPage*6+i+1,title:lesson.title,state:t(`home.path_${lesson.state}`)})} accessibilityState={{disabled:!active&&!done}} disabled={!active&&!done} onPress={()=>router.push(`/learn/${lesson.id}`)} style={{position:'absolute',left:6*S,top:6*S,width:72*S,height:72*S}}>
                <View className="flex-1 items-center justify-center rounded-full" style={{backgroundColor:done?'rgba(255,255,255,0.89)':active?'rgba(255,255,255,0.34)':'rgba(255,255,255,0.12)',borderTopWidth:2*S,borderLeftWidth:2*S,borderColor:done?'white':'rgba(255,255,255,0.37)'}}>
                  <View style={{opacity:active||done?1:0.5}}><FigmaSvg source={icon} width={dims[0]*S} height={dims[1]*S}/></View>
                  {done && <View className="absolute rounded-full bg-white" style={{right:0,bottom:0,padding:3*S}}><Check size={14*S} color="#549534"/></View>}
                  {!active&&!done && <LockKeyhole size={12*S} color="white" style={{position:'absolute',bottom:4*S}}/>}
                </View>
              </Pressable>
            </View>;
          })}
          {(path.loading || path.error || !path.lessons.length) && <View className="absolute items-center rounded-2xl bg-white p-4" style={{top:381*S,left:40*S,right:40*S,gap:12}}>
            {path.loading ? <ActivityIndicator color="#1AB3FF"/> : <><Text className="text-center" style={{fontFamily:'Nunito_800ExtraBold',color:'#171A1C'}}>{t(path.error?'home.path_error':'home.path_empty')}</Text><Pressable accessibilityRole="button" onPress={path.error?path.refresh:openTracks} className="rounded-full bg-[#DFF4FF] px-5 py-3"><Text style={{color:'#1AB3FF'}}>{t(path.error?'home.path_retry':'home.open_tracks')}</Text></Pressable></>}
          </View>}
          </View>
        </View>
        <View className="items-center px-6" style={{gap:16*S,backgroundColor:'#7AB84F',paddingVertical:16*S}}>
          {pages>1 && <View className="flex-row items-center" style={{gap:20*S}}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('home.path_previous')} disabled={currentPage===0} onPress={()=>changePage(currentPage-1)} className="rounded-full bg-white px-5 py-3" style={{opacity:currentPage===0?0.4:1}}><Text>←</Text></Pressable>
            <Text style={{fontFamily:'Nunito_800ExtraBold',color:'white'}}>{currentPage+1} / {pages}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('home.path_next')} disabled={currentPage===pages-1} onPress={()=>changePage(currentPage+1)} className="rounded-full bg-white px-5 py-3" style={{opacity:currentPage===pages-1?0.4:1}}><Text>→</Text></Pressable>
          </View>}
          <Pressable accessibilityRole="button" onPress={openTracks} className="rounded-full bg-white px-6 py-4"><Text style={{fontFamily:'Nunito_800ExtraBold',color:'#171A1C'}}>{t('home.open_tracks')} →</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
