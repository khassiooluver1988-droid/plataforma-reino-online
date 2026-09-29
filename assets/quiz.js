const BANK=Array.isArray(window.REINO_QUIZ_BANK)?window.REINO_QUIZ_BANK:[];
const QUIZ_SIZE=10;
const KEYS={seen:'reino_quiz_seen_v2',ranking:'reino_quiz_ranking_v2',score:'reino_best_score',gamer:'reino_gamer_name',sound:'reino_quiz_sound',metrics:'reino_quiz_metrics_v1'};
let questions=[],current=0,correctCount=0,xp=0,streak=0,maxStreak=0,locked=false,usedTotal=0,selectedMode='TODOS',audioContext=null;
let soundEnabled=read(KEYS.sound,true);
let autoAdvanceTimer=null;
const FEEDBACK_MS=2400;
const $=id=>document.getElementById(id);

function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(error){console.warn('Armazenamento local indisponível:',error)}}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2500)}
function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function initials(name='G'){return name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'G'}

function editorialLevel(item){
  const level=String(item.difficulty||item.level||'DESCOBERTA').toUpperCase();
  return ['DESCOBERTA','CONHECIMENTO','APROFUNDAMENTO','MESTRE DO REINO'].includes(level)?level:'DESCOBERTA'
}
function questionType(item){
  if(item.type)return String(item.type).toUpperCase();
  if(item.category==='VIDA CRISTÃ')return 'VIDA CRISTÃ';
  if(item.category==='EVANGELHOS')return 'JESUS E EVANGELHOS';
  if(item.category==='ANTIGO TESTAMENTO')return 'ANTIGO TESTAMENTO';
  if(item.category==='NOVO TESTAMENTO')return 'BÍBLIA';
  return 'CURIOSIDADE'
}
function normalizedQuestion(item){
  return {
    ...item,
    difficulty:editorialLevel(item),
    type:questionType(item),
    status:item.status||'published',
    classification:item.classification||'TEXTO BÍBLICO',
    source:item.source||'Bíblia',
    tags:Array.isArray(item.tags)?item.tags:[item.category].filter(Boolean)
  }
}
function metrics(){
  return read(KEYS.metrics,{started:0,answered:0,correct:0,wrong:0,bibleOpens:0,completed:0,categories:{}})
}
function bumpMetric(key,amount=1){
  const data=metrics();
  data[key]=(data[key]||0)+amount;
  write(KEYS.metrics,data);
}
function bumpCategory(category){
  const data=metrics();
  data.categories=data.categories||{};
  data.categories[category]=(data.categories[category]||0)+1;
  write(KEYS.metrics,data);
}
function discoveryRate(){
  const data=metrics();
  return data.answered?Math.round((data.bibleOpens/data.answered)*100):0
}

async function supabaseUser(){try{const {data}=await window.REINO_SUPABASE?.auth.getUser();return data?.user||null}catch{return null}}
async function syncQuizEvent(item,correct){try{const user=await supabaseUser();if(!user)return;await window.REINO_SUPABASE.from('quiz_events').insert({user_id:user.id,question_id:String(item.id||''),category:item.category||null,is_correct:Boolean(correct)})}catch(error){console.warn('quiz_events',error)}}
async function markBibleOpen(item){try{bumpMetric('bibleOpens');const user=await supabaseUser();if(!user)return;await window.REINO_SUPABASE.from('quiz_events').insert({user_id:user.id,question_id:String(item.id||''),category:item.category||null,opened_bible:true})}catch(error){console.warn('bible_open',error)}}
async function syncQuizProgress(best){try{const user=await supabaseUser();if(!user)return;const m=metrics();const {data:cloud}=await window.REINO_SUPABASE.from('quiz_progress').select('xp,best_score,max_streak,questions_answered,correct_answers,bible_opens').eq('user_id',user.id).maybeSingle();await window.REINO_SUPABASE.from('quiz_progress').upsert({user_id:user.id,xp:Number(cloud?.xp||0)+Number(xp||0),best_score:Math.max(Number(cloud?.best_score||0),Number(best||0)),current_streak:Number(streak||0),max_streak:Math.max(Number(cloud?.max_streak||0),Number(maxStreak||0)),questions_answered:Number(cloud?.questions_answered||0)+Number(questions.length||0),correct_answers:Number(cloud?.correct_answers||0)+Number(correctCount||0),bible_opens:Math.max(Number(cloud?.bible_opens||0),Number(m.bibleOpens||0)),updated_at:new Date().toISOString()},{onConflict:'user_id'});await window.REINO_SUPABASE.from('quiz_scores').insert({user_id:user.id,gamer_name:gamerName()||'Jogador',correct_answers:Number(correctCount||0),xp:Number(xp||0),max_combo:Number(maxStreak||0)});await loadSupabaseLeaderboard()}catch(error){console.warn('quiz_progress',error)}}
async function loadSupabaseLeaderboard(){try{const client=window.REINO_SUPABASE;if(!client)return;const {data,error}=await client.from('quiz_scores').select('gamer_name,correct_answers,xp,max_combo,created_at').order('xp',{ascending:false}).order('correct_answers',{ascending:false}).limit(5);if(error||!data?.length)return;const medals=['◆','◇','○','4','5'];const html=data.map((item,index)=>`<li><span><b>${medals[index]}</b><span>${escapeHtml(item.gamer_name)}<small>${item.correct_answers}/10 acertos • combo ${item.max_combo||0}</small></span></span><strong>${item.xp||0} XP</strong></li>`).join('');[$('leaderboard-start'),$('leaderboard-result')].forEach(list=>{if(list)list.innerHTML=html})}catch(error){console.warn('ranking',error)}}

function ensureAudio(){const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return false;try{if(!audioContext)audioContext=new AudioContextClass();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});return true}catch(error){console.warn('Áudio indisponível:',error);return false}}
function tone(frequency,duration=.12,type='sine',volume=.045,delay=0){if(!soundEnabled||!ensureAudio())return;try{const oscillator=audioContext.createOscillator();const gain=audioContext.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,audioContext.currentTime+delay);gain.gain.setValueAtTime(volume,audioContext.currentTime+delay);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+delay+duration);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(audioContext.currentTime+delay);oscillator.stop(audioContext.currentTime+delay+duration)}catch(error){console.warn('Não foi possível tocar o som:',error)}}
function playSound(kind){if(!soundEnabled)return;if(kind==='click')tone(310,.07,'square',.025);if(kind==='correct'){tone(520,.11,'sine',.055);tone(680,.13,'sine',.05,.1);tone(880,.18,'sine',.045,.2)}if(kind==='wrong'){tone(220,.16,'sawtooth',.035);tone(145,.22,'sawtooth',.03,.12)}if(kind==='victory'){[440,554,659,880].forEach((note,index)=>tone(note,.22,'triangle',.05,index*.12))}}
function updateSoundButton(){const button=$('quiz-sound-toggle');button.textContent=soundEnabled?'♫ Som ligado':'× Som desligado';button.classList.toggle('muted',!soundEnabled);button.setAttribute('aria-pressed',String(soundEnabled))}

function poolForMode(){if(selectedMode==='ANTIGO TESTAMENTO')return BANK.filter(item=>item.category==='ANTIGO TESTAMENTO');if(selectedMode==='NOVO')return BANK.filter(item=>item.category==='NOVO TESTAMENTO'||item.category==='EVANGELHOS');if(selectedMode==='BÍBLIA')return BANK.filter(item=>['BÍBLIA','ANTIGO TESTAMENTO','NOVO TESTAMENTO','EVANGELHOS'].includes(item.category));if(selectedMode==='VIDA CRISTÃ')return BANK.filter(item=>item.category==='VIDA CRISTÃ');return [...BANK]}
function randomizeAnswers(item){const mixed=shuffle(item.options.map((text,index)=>({text,index})));return{...item,options:mixed.map(option=>option.text),answer:mixed.findIndex(option=>option.index===item.answer)}}
function buildRound(){const pool=poolForMode();const seenState=read(KEYS.seen,{});let seen=Array.isArray(seenState)?seenState:(seenState[selectedMode]||[]);seen=seen.filter(id=>pool.some(question=>question.id===id));let available=pool.filter(question=>!seen.includes(question.id));if(available.length<QUIZ_SIZE){seen=[];available=[...pool];toast('Arena concluída! Um novo ciclo de perguntas foi liberado.')}questions=shuffle(available).slice(0,QUIZ_SIZE).map(normalizedQuestion).map(randomizeAnswers);seen.push(...questions.map(question=>question.id));const nextState=Array.isArray(seenState)?{}:{...seenState};nextState[selectedMode]=seen;write(KEYS.seen,nextState);usedTotal=seen.length}

async function restoreCloudQuizState(){
  const user=await supabaseUser();if(!user)return;
  const {data,error}=await window.REINO_SUPABASE.from('quiz_state').select('seen,gamer_name').eq('user_id',user.id).maybeSingle();
  if(error){console.warn('Estado do quiz:',error);return}
  // A conta é a fonte do histórico para impedir repetição entre dispositivos.
  write(KEYS.seen,data?.seen&&typeof data.seen==='object'?data.seen:{});if(data?.gamer_name){write(KEYS.gamer,data.gamer_name);$('player-name').value=data.gamer_name}
}
async function saveCloudQuizState(){
  const user=await supabaseUser();if(!user)return;
  const {error}=await window.REINO_SUPABASE.from('quiz_state').upsert({user_id:user.id,seen:read(KEYS.seen,{}),gamer_name:gamerName()||read(KEYS.gamer,''),updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(error)console.warn('Salvamento do quiz:',error);
}
function gamerName(){return $('player-name').value.trim()}
function arenaLabel(){const labels={TODOS:'ARENA COMPLETA',BÍBLIA:'ARENA BÍBLICA','ANTIGO TESTAMENTO':'ARENA ANTIGO TESTAMENTO',NOVO:'ARENA NOVO TESTAMENTO','VIDA CRISTÃ':'ARENA VIDA CRISTÃ'};return labels[selectedMode]||'ARENA COMPLETA'}
async function start(){clearTimeout(autoAdvanceTimer);autoAdvanceTimer=null;if(BANK.length<10){toast('O banco de perguntas ainda não tem conteúdo suficiente para iniciar.');return}const name=gamerName();if(!name){$('player-name').focus();toast('Escolha seu nome gamer para iniciar.');playSound('wrong');return}ensureAudio();playSound('click');write(KEYS.gamer,name);bumpMetric('started');await restoreCloudQuizState();buildRound();saveCloudQuizState();current=0;correctCount=0;xp=0;streak=0;maxStreak=0;locked=false;$('hud-player-name').textContent=name;$('quiz-start').classList.add('hidden');$('quiz-result').classList.add('hidden');$('quiz-game').classList.remove('hidden');render();scrollTo({top:0,behavior:'smooth'})}
function render(){clearTimeout(autoAdvanceTimer);autoAdvanceTimer=null;const item=questions[current];$('question-count').textContent=`MISSÃO ${current+1} DE ${questions.length} • ${usedTotal} USADAS`;$('score-now').textContent=xp;$('streak-now').textContent=streak;$('arena-name').textContent=arenaLabel();$('progress-bar').style.width=`${((current+1)/questions.length)*100}%`;$('question-category').textContent=item.category;$('difficulty-badge').textContent=editorialLevel(item);$('question-text').textContent=item.q;$('answer-feedback').classList.add('hidden');$('next-question').classList.add('hidden');$('next-question').innerHTML=current===questions.length-1?'VER RESULTADO <span>→</span>':'PRÓXIMA MISSÃO <span>→</span>';locked=false;$('quiz-options').innerHTML=item.options.map((option,index)=>`<button class="quiz-option" type="button" data-answer="${index}"><span>${String.fromCharCode(65+index)}</span><b>${escapeHtml(option)}</b></button>`).join('');$('quiz-options').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>answer(Number(button.dataset.answer))))}
function answer(choice){if(locked)return;locked=true;const item=questions[current];const correct=choice===item.answer;syncQuizEvent(item,correct);bumpMetric('answered');bumpMetric(correct?'correct':'wrong');bumpCategory(item.category);let gained=0;if(correct){correctCount++;streak++;maxStreak=Math.max(maxStreak,streak);gained=100+(streak-1)*25;xp+=gained;playSound('correct');$('quiz-question-card').classList.add('success-pulse')}else{streak=0;playSound('wrong');$('quiz-question-card').classList.add('error-shake')}setTimeout(()=>$('quiz-question-card').classList.remove('success-pulse','error-shake'),550);$('quiz-options').querySelectorAll('button').forEach((button,index)=>{button.disabled=true;if(index===item.answer)button.classList.add('correct');if(index===choice&&!correct)button.classList.add('wrong')});const title=correct?`ACERTOU! +${gained} XP`:`QUASE! A RESPOSTA CORRETA É ${item.options[item.answer]}.`;const learnMore=item.bookSlug&&item.chapter?`<div class="learn-more"><b>Quer aprender mais?</b><a class="bible-open-link" href="index.html?book=${encodeURIComponent(item.bookSlug)}&chapter=${item.chapter}#palavra" rel="noopener">VER NA BÍBLIA →</a></div>`:`<div class="learn-more"><b>Continue aprendendo</b><span>Explore outras missões desta arena.</span></div>`;$('answer-feedback').className=`answer-feedback ${correct?'game-correct':'game-wrong'}`;$('answer-feedback').innerHTML=`<strong>${escapeHtml(title)}</strong><span class="feedback-explanation">${escapeHtml(item.explanation)}</span><span class="bible-reference">▤ ${escapeHtml(item.reference)}</span><span class="learn-box"><b>APRENDA:</b> ${escapeHtml(item.learn)}</span>${learnMore}`;$('next-question').classList.remove('hidden');autoAdvanceTimer=setTimeout(()=>{autoAdvanceTimer=null;next(false)},FEEDBACK_MS);const bibleLink=$('answer-feedback').querySelector('.bible-open-link');if(bibleLink)bibleLink.addEventListener('click',()=>markBibleOpen(item),{once:true});$('score-now').textContent=xp;$('streak-now').textContent=streak}
function next(manual=true){if(!locked)return;clearTimeout(autoAdvanceTimer);autoAdvanceTimer=null;if(manual)playSound('click');if(current<questions.length-1){current++;render()}else finish()}
function saveRanking(){const name=gamerName()||'Gamer';const entry={name,xp,correct:correctCount,combo:maxStreak,date:new Date().toLocaleDateString('pt-BR')};const ranking=read(KEYS.ranking,[]);const same=ranking.findIndex(item=>item.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR'));if(same<0)ranking.push(entry);else if((ranking[same].xp||0)<=entry.xp)ranking[same]=entry;ranking.sort((a,b)=>(b.xp||0)-(a.xp||0)||b.correct-a.correct||a.name.localeCompare(b.name,'pt-BR'));write(KEYS.ranking,ranking.slice(0,5));renderLeaderboard()}
function finish(){bumpMetric('completed');const best=Math.max(correctCount,Number(read(KEYS.score,0)));write(KEYS.score,best);saveRanking();syncQuizProgress(best);$('quiz-game').classList.add('hidden');$('quiz-result').classList.remove('hidden');$('result-seal').textContent=`${correctCount}/${questions.length}`;$('correct-total').textContent=correctCount;$('xp-total').textContent=xp;$('combo-total').textContent=maxStreak;$('best-total').textContent=best;let title='Continue treinando, guerreiro!';let message='Cada missão aumenta seu conhecimento. Leia as explicações e volte para conquistar mais XP.';if(correctCount>=9){title='Lendário da Palavra!';message='Você dominou esta arena e mostrou conhecimento bíblico de alto nível.'}else if(correctCount>=7){title='Guardião da Palavra!';message='Grande partida! Você está muito perto de alcançar o nível lendário.'}else if(correctCount>=5){title='Discípulo em evolução!';message='Boa jornada. Revise as referências bíblicas e volte ainda mais preparado.'}$('result-title').textContent=title;$('result-message').textContent=message;playSound('victory');scrollTo({top:0,behavior:'smooth'})}
function renderLeaderboard(){const ranking=read(KEYS.ranking,[]);const medals=['◆','◇','○','4','5'];const html=ranking.length?ranking.map((item,index)=>`<li><span><b>${medals[index]}</b><span>${escapeHtml(item.name)}<small>${item.correct}/10 acertos • combo ${item.combo||0}</small></span></span><strong>${item.xp||0} XP</strong></li>`).join(''):'<li class="empty-ranking">A arena está vazia. Seja o primeiro jogador!</li>';[$('leaderboard-start'),$('leaderboard-result')].forEach(list=>list.innerHTML=html)}
async function share(){const text=`Meu nome gamer é ${gamerName()||'Gamer'} e fiz ${correctCount}/10 com ${xp} XP no Quiz do Reino!`;if(navigator.share){try{await navigator.share({title:'Quiz do Reino',text});return}catch{}}if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Resultado gamer copiado para compartilhar.')}else toast(text)}

const savedName=read(KEYS.gamer,'');$('player-name').value=savedName;$('player-name').addEventListener('keydown',event=>{if(event.key==='Enter')start()});
document.querySelectorAll('[data-quiz-mode]').forEach(button=>button.addEventListener('click',()=>{selectedMode=button.dataset.quizMode;document.querySelectorAll('[data-quiz-mode]').forEach(item=>item.classList.toggle('active',item===button));playSound('click')}));
$('quiz-sound-toggle').addEventListener('click',()=>{soundEnabled=!soundEnabled;write(KEYS.sound,soundEnabled);updateSoundButton();if(soundEnabled)playSound('click')});
updateSoundButton();renderLeaderboard();loadSupabaseLeaderboard();$('start-quiz').addEventListener('click',start);$('next-question').addEventListener('click',next);$('restart-quiz').addEventListener('click',start);$('share-result').addEventListener('click',share);
