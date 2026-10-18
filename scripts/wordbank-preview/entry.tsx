import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import ru from '../../src/locales/ru';
import { WordBankFrame, BankFeedbackPanel, BankButton, type BankFeedback } from '../../src/components/vocabulary/player/WordBankChrome';
import { WordBankActivityView } from '../../src/components/vocabulary/player/WordBankActivity';
import data from '../../.expo/wordbank-preview/fixture.json';

i18n.use(initReactI18next).init({lng:'ru',resources:{ru:{translation:ru}},interpolation:{escapeValue:false}});
const fixture:any=data;
const entry={word:{external_id:fixture.id,word:fixture.word,translation:'действие',part_of_speech:fixture.part_of_speech,cefr_level:fixture.cefr_level,has_audio:true},lemma:fixture.lemma,meaning:fixture.meaning,activities:fixture.activities.map((a:any)=>({...a,payload:a}))};
function App(){
 const {t}=useTranslation();
 const [step,setStep]=useState(Number(new URLSearchParams(location.search).get('step'))||1);
 const [reset,setReset]=useState(0);
 const [feedback,setFeedback]=useState<BankFeedback>(null);
 const [pending,setPending]=useState(false);
 const [online,setOnline]=useState(true);
 const [saved,setSaved]=useState<any>(null);
 const [events,setEvents]=useState<string[]>([]);
 const activity=entry.activities[step-1];
 const log=(s:string)=>setEvents(v=>[s,...v].slice(0,5));
 const move=(s:number)=>{setStep(s);setFeedback(null);setReset(v=>v+1);setPending(false);setSaved(null)};
 useEffect(()=>{
  if(!online||!saved)return;
  const timer=setTimeout(()=>{
   const expected=activity.payload.answer;
   const norm=(s:string)=>s.toLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' ').trim();
   const checked=['word_match','meaning_choice','fill_the_blank','sentence_builder'].includes(activity.type);
   const correct=!checked||norm(saved.value)===norm(expected);
   setPending(false);setSaved(null);log(`Ответ: ${saved.value||'выполнено'} · ${correct?'принят':'повторить'}`);
   if(checked){setFeedback({kind:correct?'correct':'wrong',answer:expected});if(!correct)setReset(v=>v+1)}
   else if(step<15)move(step+1);else log('Первое прохождение завершено → повторение');
  },400);return()=>clearTimeout(timer);
 },[online,saved]);
 return <><div className="qa-controls"><strong>QA · компоненты приложения</strong><label>Шаг <select aria-label="Шаг" value={step} onChange={e=>move(Number(e.target.value))}>{entry.activities.map((a:any)=><option key={a.step} value={a.step}>{a.step}. {t(`practice.bank_player.headings.${a.type}`)}</option>)}</select></label><label><input type="checkbox" checked={online} onChange={e=>setOnline(e.target.checked)}/> Сеть в примере</label><button onClick={()=>move(step)}>Сбросить шаг</button></div><div id="device" data-testid="device-screen">
 <WordBankFrame step={step} title={t(`practice.bank_player.headings.${activity.type}`)} onBack={()=>step>1&&move(step-1)}>
 <div className="rn-view flex-1" style={{pointerEvents:pending||feedback?.kind==='correct'?'none':undefined}}>
 <WordBankActivityView key={`${step}:${reset}`} confirmed={feedback?.kind==='correct'} entry={entry} activity={activity} onSubmit={answer=>{setFeedback(null);setPending(true);setSaved(answer);log('Сохранено в тестовой очереди')}} onPlay={async(value,rate)=>{log(`Аудио: ${value} (${rate??1}×)`);await new Promise(r=>setTimeout(r,100))}} renderRecording={({onRecognized})=><div className="qa-recorder"><span>QA: микрофон заменён тестовой репликой</span><button onClick={()=>onRecognized('action')}>Записать тестовую реплику</button></div>} />
 </div>
 <BankFeedbackPanel feedback={feedback} pending={pending} saveError={false} onRetry={()=>setOnline(true)} />
 {feedback?.kind==='correct'?<BankButton tone="green" label={t('practice.bank_player.next')} onPress={()=>move(Math.min(step+1,15))}/>:null}
 </WordBankFrame></div><div id="qa-events" role="log">{events.map((e,i)=><div key={i}>{e}</div>)}</div></>;
}
createRoot(document.getElementById('root')!).render(<App/>);
