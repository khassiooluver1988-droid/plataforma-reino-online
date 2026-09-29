const STORE={user:'reino_user',access:'reino_access_granted_v2',favorites:'reino_favorites',posts:'reino_posts',score:'reino_best_score',contents:'reino_contents',daily:'reino_daily_path',streak:'reino_daily_streak',library:'reino_library_saved',connections:'reino_connections',podcast:'reino_podcast_follow',testimony:'reino_testimony',missions:'reino_mission_interests',postInteractions:'reino_post_interactions',groupChats:'reino_group_chats'};
const BIBLE=window.REINO_BIBLE||{books:[]};
const churches=[
  {name:'Comunidade da Esperança',place:'Teresina - PI',time:'Domingo, 18h'},
  {name:'Igreja Batista Central',place:'Timon - MA',time:'Domingo, 19h'},
  {name:'Comunidade Vida Plena',place:'Zona Norte, Teresina - PI',time:'Sábado, 18h30'},
  {name:'Igreja do Caminho',place:'Centro, Timon - MA',time:'Quarta, 19h30'},
  {name:'Comunidade da Graça',place:'Zona Leste, Teresina - PI',time:'Domingo, 17h'},
  {name:'Igreja Família da Fé',place:'Santa Maria, Teresina - PI',time:'Domingo, 19h'}
];
const users=[{name:'João da Silva',role:'Usuário',active:true},{name:'Maria Souza',role:'Moderadora',active:true},{name:'Pedro Lima',role:'Usuário',active:true},{name:'Ana Santos',role:'Líder',active:false}];
const defaultPosts=[{id:'post-teatro',name:'Ana Clara',role:'Teatro Cristão',category:'Teatro',text:'Nosso grupo está preparando uma apresentação sobre o filho pródigo. Quem gosta de atuação, figurino ou roteiro pode participar!',time:'Hoje, 09:20',likes:38,compliments:14,media:{type:'image',url:'assets/banner-testemunho.webp'}},{id:'post-musica',name:'Lucas Martins',role:'Músicos do Reino',category:'Música',text:'Compartilhei uma sequência simples de acordes para o ensaio de sábado. Vamos aprender e crescer juntos, sem competição.',time:'Hoje, 08:35',likes:52,compliments:21,media:{type:'image',url:'assets/capa-comunidade-rede.webp'}},{id:'post-video',name:'Rebeca Santos',role:'Mídia Criativa',category:'Audiovisual',text:'Terminei meu primeiro vídeo para a juventude da igreja. O curso de edição me ajudou a organizar melhor a mensagem.',time:'Ontem, 20:10',likes:47,compliments:9},{id:'post-social',name:'Pedro Lima',role:'Ação Social',category:'Ação Social',text:'Neste fim de semana vamos separar alimentos e materiais escolares. Toda ajuda é bem-vinda.',time:'Ontem, 18:42',likes:31,compliments:36}];
let currentBookIndex=42,currentChapter=3;

function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value))}
function toast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2800)}
function initials(name='Visitante'){return name.split(/\s+/).filter(Boolean).slice(0,2).map(v=>v[0]).join('').toUpperCase()||'V'}
function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function safeReturnDestination(){const value=new URLSearchParams(location.search).get('return')||'';return /^(quiz|historia)\.html(?:[?#].*)?$/.test(value)?value:''}
function validContact(value){const clean=value.trim();return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)}
async function passwordFingerprint(value){if(window.crypto?.subtle){const bytes=new TextEncoder().encode(`reino:${value}`);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}let hash=5381;for(const char of value)hash=((hash<<5)+hash)^char.charCodeAt(0);return`local-${(hash>>>0).toString(16)}`}
async function loadSupabaseProfile(authUser){
  const client=window.REINO_SUPABASE;
  if(!client||!authUser)return null;
  const {data,error}=await client.from('profiles').select('id,email,full_name,phone,avatar_url').eq('id',authUser.id).maybeSingle();
  if(error){console.warn('Perfil Supabase:',error.message);return null}
  return data
}
const PROFILE_PHOTO_BUCKET='reino-avatars';
function profilePhotoPath(userId){return `${userId}/profile-${crypto.randomUUID()}.jpg`}
async function signedProfilePhoto(path){
  if(!path)return '';
  if(/^data:image\//.test(path))return path;
  const {data,error}=await window.REINO_SUPABASE.storage.from(PROFILE_PHOTO_BUCKET).createSignedUrl(path,60*60*24);
  if(error){console.warn('Foto do perfil:',error.message);return ''}
  return data.signedUrl
}
async function cacheAuthenticatedUser(authUser,fallbackName=''){
  const profile=await loadSupabaseProfile(authUser);
  const name=(profile?.full_name||authUser.user_metadata?.full_name||fallbackName||authUser.email?.split('@')[0]||'Usuário').trim();
  const email=authUser.email||profile?.email||'';
  const photo=await signedProfilePhoto(profile?.avatar_url);
  write(STORE.user,{name,contact:email,email,phone:profile?.phone||'',photo});
  write(STORE.access,{connected:true,userId:authUser.id,createdAt:Date.now()});
  refreshUser();
}
function authMessage(id,message,isError=false){
  const el=document.getElementById(id);if(!el)return;el.textContent=message||'';el.classList.toggle('error',Boolean(isError));
}
async function finishAuthenticatedAccess(authUser,fallbackName=''){
  if(!authUser)throw new Error('Não foi possível validar o usuário.');
  await cacheAuthenticatedUser(authUser,fallbackName);
  document.body.classList.remove('auth-locked');
  document.getElementById('auth-gate').classList.add('authenticated');
  const destination=safeReturnDestination();
  if(destination)setTimeout(()=>location.href=destination,200);
}
function setAuthMode(mode){
  const login=mode==='login';
  document.getElementById('login-form').classList.toggle('hidden',!login);
  document.getElementById('signup-form').classList.toggle('hidden',login);
  document.getElementById('auth-login-tab').classList.toggle('active',login);
  document.getElementById('auth-signup-tab').classList.toggle('active',!login);
  document.getElementById('auth-login-tab').setAttribute('aria-selected',String(login));
  document.getElementById('auth-signup-tab').setAttribute('aria-selected',String(!login));
  document.getElementById('access-title').textContent=login?'Acesse sua conta':'Crie sua conta';
  authMessage('login-status','');authMessage('signup-status','');
  setTimeout(()=>document.getElementById(login?'login-email':'signup-name')?.focus(),50);
}
async function setupFirstAccess(){
  const gate=document.getElementById('auth-gate'),client=window.REINO_SUPABASE;
  document.body.classList.add('auth-locked');
  if(!client){authMessage('login-status','Conexão com Supabase indisponível.',true);return}
  const {data:{session}}=await client.auth.getSession();
  if(session?.user){
    await cacheAuthenticatedUser(session.user);
    gate.classList.add('authenticated');document.body.classList.remove('auth-locked');
    const destination=safeReturnDestination();if(destination)location.replace(destination);
    return
  }
  document.getElementById('auth-login-tab').addEventListener('click',()=>setAuthMode('login'));
  document.getElementById('auth-signup-tab').addEventListener('click',()=>setAuthMode('signup'));
  document.getElementById('show-login-password').addEventListener('change',event=>document.getElementById('login-password').type=event.target.checked?'text':'password');
  document.getElementById('show-signup-password').addEventListener('change',event=>['signup-password','signup-password-confirm'].forEach(id=>document.getElementById(id).type=event.target.checked?'text':'password'));
  document.getElementById('login-form').addEventListener('submit',async event=>{
    event.preventDefault();const email=document.getElementById('login-email').value.trim().toLowerCase(),password=document.getElementById('login-password').value;
    if(!validContact(email)||password.length<6)return authMessage('login-status','Informe um e-mail válido e sua senha.',true);
    const button=event.currentTarget.querySelector('[type="submit"]');button.disabled=true;button.textContent='ENTRANDO...';authMessage('login-status','');
    try{
      const {data,error}=await client.auth.signInWithPassword({email,password});
      if(error){
        if(error.code==='email_not_confirmed')throw new Error('Confirme seu e-mail antes de entrar.');
        if(error.code==='invalid_credentials')throw new Error('E-mail ou senha incorretos.');
        throw error;
      }
      await finishAuthenticatedAccess(data.user||data.session?.user);
    }catch(error){authMessage('login-status',error.message||'Não foi possível entrar.',true)}
    finally{button.disabled=false;button.textContent='ENTRAR →'}
  });
  document.getElementById('signup-form').addEventListener('submit',async event=>{
    event.preventDefault();
    const name=document.getElementById('signup-name').value.trim(),email=document.getElementById('signup-email').value.trim().toLowerCase(),password=document.getElementById('signup-password').value,confirm=document.getElementById('signup-password-confirm').value;
    if(!name||!validContact(email)||password.length<6)return authMessage('signup-status','Preencha nome, e-mail válido e uma senha com pelo menos 6 caracteres.',true);
    if(password!==confirm)return authMessage('signup-status','As senhas não são iguais.',true);
    if(!document.getElementById('signup-consent').checked)return authMessage('signup-status','Confirme a criação da conta para continuar.',true);
    const button=event.currentTarget.querySelector('[type="submit"]');button.disabled=true;button.textContent='CRIANDO CONTA...';authMessage('signup-status','');
    try{
      const emailRedirectTo=new URL('index.html',location.href).href;
      const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo,data:{full_name:name}}});
      if(error){
        if(error.code==='user_already_exists')throw new Error('Este e-mail já possui conta. Use a opção Entrar.');
        throw error;
      }
      if(!data.session){authMessage('signup-status','Conta criada. Confira seu e-mail para confirmar o cadastro e depois use Entrar.');setTimeout(()=>setAuthMode('login'),3500);return}
      await client.from('profiles').update({full_name:name,email}).eq('id',data.user.id);
      await finishAuthenticatedAccess(data.user,name);
    }catch(error){authMessage('signup-status',error.message||'Não foi possível criar a conta.',true)}
    finally{button.disabled=false;button.textContent='CRIAR MINHA CONTA →'}
  });
  setAuthMode('login');
}
// Evita o acúmulo de abas: toda a plataforma navega na mesma janela.
document.querySelectorAll('a[target="_blank"]').forEach(link=>link.removeAttribute('target'));
function activateRoute(){const route=(location.hash||'#inicio').slice(1);const page=document.getElementById(route)||document.getElementById('inicio');document.querySelectorAll('.page').forEach(item=>item.classList.remove('active'));page.classList.add('active');document.querySelectorAll('[data-route]').forEach(link=>link.classList.toggle('active',link.dataset.route===page.id));document.getElementById('page-title').textContent=page.dataset.title;document.title=`${page.dataset.title} | Plataforma Reino`;window.scrollTo(0,0);document.body.classList.remove('menu-open')}
window.addEventListener('hashchange',activateRoute);activateRoute();
const promoSlides=[...document.querySelectorAll('[data-promo-slide]')];
const promoDots=[...document.querySelectorAll('[data-promo-dot]')];
const promoCarousel=document.getElementById('promo-carousel');
let activePromo=0,promoTimer;
function showPromo(index){activePromo=(index+promoSlides.length)%promoSlides.length;promoSlides.forEach((slide,i)=>slide.classList.toggle('active',i===activePromo));promoDots.forEach((dot,i)=>{const selected=i===activePromo;dot.classList.toggle('active',selected);dot.setAttribute('aria-selected',String(selected))})}
function startPromo(){clearInterval(promoTimer);if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)promoTimer=setInterval(()=>showPromo(activePromo+1),5200)}
document.getElementById('promo-previous').addEventListener('click',()=>{showPromo(activePromo-1);startPromo()});
document.getElementById('promo-next').addEventListener('click',()=>{showPromo(activePromo+1);startPromo()});
promoDots.forEach(dot=>dot.addEventListener('click',()=>{showPromo(Number(dot.dataset.promoDot));startPromo()}));
promoCarousel.addEventListener('mouseenter',()=>clearInterval(promoTimer));promoCarousel.addEventListener('mouseleave',startPromo);promoCarousel.addEventListener('focusin',()=>clearInterval(promoTimer));promoCarousel.addEventListener('focusout',startPromo);startPromo();
promoCarousel.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){showPromo(activePromo-1);startPromo()}if(event.key==='ArrowRight'){showPromo(activePromo+1);startPromo()}});
let promoPointerStart=0;promoCarousel.addEventListener('pointerdown',event=>{promoPointerStart=event.clientX});promoCarousel.addEventListener('pointerup',event=>{const distance=event.clientX-promoPointerStart;if(Math.abs(distance)<55)return;showPromo(activePromo+(distance<0?1:-1));startPromo()});

const editorialArticles={
  noticias:[
    {category:'IGREJA PERSEGUIDA',date:'24 SET 2026',title:'Jovens se unem em uma onda de oração pela Igreja Perseguida',lead:'O Shockwave 2026 reuniu jovens para interceder por cristãos do Chifre da África e transformar informação em oração.',image:'assets/noticia-igreja-mundo.webp',alt:'Cristãos de diferentes povos unidos em oração ao redor de um mapa e uma Bíblia',body:['A mobilização apresentada pela Portas Abertas conecta jovens brasileiros à realidade de comunidades cristãs que enfrentam pressão e violência por causa da fé.','Mais do que acompanhar números, a proposta é conhecer histórias, orar com responsabilidade e apoiar iniciativas sérias de cuidado à Igreja Perseguida.'],verse:'“Lembrem-se dos que estão na prisão, como se aprisionados com eles.” — Hebreus 13:3',source:'Portas Abertas Brasil',url:'https://portasabertas.org.br/'},
    {category:'BÍBLIA E EDUCAÇÃO',date:'31 MAR 2026',title:'Academia da Bíblia amplia o acesso à formação bíblica on-line',lead:'Nova etapa da plataforma educacional da Sociedade Bíblica do Brasil estreou com conteúdo voltado à fé, ao propósito e às Escrituras.',image:'assets/noticia-estudo-biblico.webp',alt:'Grupo de jovens brasileiros estudando a Bíblia em comunidade',body:['A formação bíblica on-line ajuda pessoas de diferentes regiões a estudar com organização, orientação e flexibilidade. A iniciativa da SBB reforça a importância de unir tecnologia e conhecimento das Escrituras.','Na Plataforma Reino, a notícia também serve como convite: informação cristã deve conduzir à leitura direta do texto bíblico e à prática responsável da fé.'],verse:'“Examinai tudo. Retende o bem.” — 1 Tessalonicenses 5:21',source:'Sociedade Bíblica do Brasil',url:'https://www.sbb.org.br/artigos/sbb-lanca-nova-academia-da-biblia-com-curso-inedito-para-mulheres'},
    {category:'MISSÃO NO MUNDO',date:'13 JAN 2026',title:'Mais de 388 milhões de cristãos enfrentam perseguição no mundo',lead:'A Lista Mundial da Perseguição 2026 aponta o avanço da pressão e da violência contra cristãos em dezenas de países.',image:'assets/categoria-mundo.webp',alt:'Voluntários cristãos servindo uma comunidade em missão',body:['Segundo a Portas Abertas, a perseguição extrema passou a atingir 15 países. O levantamento considera restrições na vida privada, familiar, comunitária, nacional e eclesiástica, além de episódios de violência.','O dado não deve produzir medo ou sensacionalismo. Ele chama a Igreja à oração, à solidariedade e ao apoio a organizações que atuam de modo responsável nesses contextos.'],verse:'“Se um membro sofre, todos sofrem com ele.” — 1 Coríntios 12:26',source:'Portas Abertas Brasil',url:'https://portasabertas.org.br/noticias/cristaos-perseguidos/lmp-2026-mais-de-388-milhoes-de-cristaos-sao-perseguidos-no-mundo/'}
  ],
  informativo:[
    {category:'INFORMATIVO',date:'GUIA PRÁTICO',title:'Como reconhecer uma informação cristã confiável antes de compartilhar',lead:'Cinco verificações simples ajudam a evitar boatos, manipulações e mensagens fora de contexto.',image:'assets/categoria-informativo.webp',alt:'Pessoa verificando informações cristãs com Bíblia e computador',body:['Confira quem publicou, procure a data, leia além da manchete, compare com uma fonte oficial e observe se o versículo citado respeita o contexto.','Uma mensagem pode parecer piedosa e ainda assim estar incorreta. Prudência também é uma forma de testemunho cristão no ambiente digital.'],verse:'“O simples dá crédito a toda palavra, mas o prudente atenta para os seus passos.” — Provérbios 14:15',source:'Conteúdo editorial Plataforma Reino',url:'https://www.sbb.org.br/artigos'},
    {category:'FORMAÇÃO BÍBLICA',date:'LEITURA DE 4 MIN',title:'Bíblia, igreja e missão: três partes de uma mesma caminhada',lead:'A leitura bíblica amadurece quando se conecta à comunidade, ao serviço e à vida cotidiana.',image:'assets/noticia-estudo-biblico.webp',alt:'Jovens reunidos para estudar as Escrituras',body:['A Bíblia fundamenta a fé; a igreja local oferece comunhão, ensino e cuidado; a missão transforma aprendizado em serviço ao próximo.','Quando essas dimensões caminham juntas, o conhecimento deixa de ser apenas informação e se torna formação de caráter e prática cristã.'],verse:'“Sede praticantes da palavra e não somente ouvintes.” — Tiago 1:22',source:'Conteúdo editorial Plataforma Reino',url:'https://www.sbb.org.br/dia-da-biblia'},
    {category:'VIDA DIGITAL',date:'LEITURA DE 3 MIN',title:'Fé nas redes sociais: verdade, respeito e responsabilidade',lead:'O testemunho cristão também aparece na maneira como comentamos, discordamos e compartilhamos.',image:'assets/capa-noticias-cristas.webp',alt:'Ambiente editorial com Bíblia e computador',body:['Antes de publicar, pergunte se o conteúdo é verdadeiro, necessário e respeitoso. Evite expor pessoas, alimentar ataques ou compartilhar acusações sem evidência.','No ambiente digital, firmeza não precisa significar agressividade. Graça e verdade podem caminhar juntas.'],verse:'“A vossa palavra seja sempre agradável, temperada com sal.” — Colossenses 4:6',source:'Conteúdo editorial Plataforma Reino',url:'https://www.sbb.org.br/artigos'}
  ],
  curiosidades:[
    {category:'TRADUÇÃO DA BÍBLIA',date:'HISTÓRIA',title:'João Ferreira de Almeida começou a traduzir a Bíblia ainda jovem',lead:'O nome presente em milhões de Bíblias em português representa uma história de dedicação à tradução das Escrituras.',image:'assets/categoria-curiosidades.webp',alt:'Bíblia, mapas e objetos históricos usados em pesquisa',body:['João Ferreira de Almeida iniciou seu trabalho de tradução na juventude e, mais tarde, atuou como pastor na congregação de língua portuguesa em Batávia.','Em 1676, comunicou que o Novo Testamento estava pronto. Seu legado atravessou séculos e permanece ligado à leitura bíblica em português.'],verse:'“A tua palavra é lâmpada para os meus pés e luz para o meu caminho.” — Salmos 119:105',source:'Sociedade Bíblica do Brasil',url:'https://www.sbb.org.br/a-biblia-sagrada/joao-ferreira-de-almeida/'},
    {category:'CURIOSIDADE BÍBLICA',date:'LEITURA DE 3 MIN',title:'Por que a Bíblia é uma biblioteca e não apenas um livro?',lead:'Os 66 livros reúnem diferentes gêneros, épocas e autores em uma grande narrativa de criação, queda, redenção e esperança.',image:'assets/noticia-estudo-biblico.webp',alt:'Grupo estudando diferentes livros da Bíblia',body:['A Bíblia reúne narrativa histórica, poesia, sabedoria, profecia, Evangelhos, cartas e literatura apocalíptica. Reconhecer o gênero ajuda a interpretar cada passagem com mais cuidado.','Mesmo com diversidade de estilos e contextos, os cristãos reconhecem uma unidade que aponta para a ação de Deus na história e culmina em Cristo.'],verse:'“Toda a Escritura é inspirada por Deus e útil para o ensino.” — 2 Timóteo 3:16',source:'Conteúdo educativo Plataforma Reino',url:'https://www.sbb.org.br/a-biblia-sagrada/'},
    {category:'HISTÓRIA CRISTÃ',date:'VOCÊ SABIA?',title:'O Dia da Bíblia começou a ser celebrado no Brasil no século XIX',lead:'A celebração busca destacar a importância das Escrituras para a vida, a igreja e a sociedade.',image:'assets/capa-noticias-cristas.webp',alt:'Bíblia aberta em ambiente de estudo e comunicação',body:['Segundo a Sociedade Bíblica do Brasil, a celebração chegou ao país em 1850, com missionários evangélicos vindos da Europa e dos Estados Unidos.','Hoje, igrejas e comunidades usam a data para incentivar leitura, estudo, distribuição responsável e ações de serviço inspiradas pela Palavra.'],verse:'“Bem-aventurados os que ouvem a palavra de Deus e a guardam.” — Lucas 11:28',source:'Sociedade Bíblica do Brasil',url:'https://www.sbb.org.br/dia-da-biblia'}
  ]
};
function renderEditorial(){document.querySelectorAll('[data-editorial-grid]').forEach(grid=>{const items=editorialArticles[grid.dataset.editorialGrid]||[];grid.innerHTML=items.map((article,index)=>`<article class="news-card"><div class="news-image"><img src="${article.image}" alt="${escapeHtml(article.alt)}"><span>${article.category}</span></div><div class="news-copy"><small>${article.date}</small><h3>${article.title}</h3><p>${article.lead}</p><button class="news-open" type="button" data-article-category="${grid.dataset.editorialGrid}" data-article-index="${index}">Ler matéria completa →</button></div></article>`).join('')})}
function openEditorialArticle(category,index){const article=editorialArticles[category]?.[Number(index)];if(!article)return;document.getElementById('article-dialog-image').src=article.image;document.getElementById('article-dialog-image').alt=article.alt;document.getElementById('article-dialog-category').textContent=`${article.category} • ${article.date}`;document.getElementById('article-dialog-title').textContent=article.title;document.getElementById('article-dialog-lead').textContent=article.lead;document.getElementById('article-dialog-body').innerHTML=article.body.map(text=>`<p>${text}</p>`).join('');document.getElementById('article-dialog-verse').textContent=article.verse;document.getElementById('article-dialog-source').textContent=`Fonte: ${article.source}`;document.getElementById('article-dialog-link').href=article.url;document.getElementById('article-dialog').showModal()}
renderEditorial();document.querySelectorAll('.news-open').forEach(button=>button.addEventListener('click',()=>openEditorialArticle(button.dataset.articleCategory,button.dataset.articleIndex)));document.getElementById('close-article-dialog').addEventListener('click',()=>document.getElementById('article-dialog').close());
document.querySelectorAll('[data-scroll-target]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({behavior:'smooth',block:'start'})));
document.querySelector('.mobile-menu').addEventListener('click',event=>{document.body.classList.toggle('menu-open');event.currentTarget.setAttribute('aria-expanded',document.body.classList.contains('menu-open'))});
document.querySelector('.main-content').addEventListener('click',event=>{if(innerWidth<781&&!event.target.closest('.mobile-menu'))document.body.classList.remove('menu-open')});
document.getElementById('theme-toggle').addEventListener('click',()=>{document.body.classList.toggle('high-contrast');toast(document.body.classList.contains('high-contrast')?'Contraste reforçado':'Contraste padrão')});
document.querySelectorAll('[data-dialog]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.dialog).showModal()));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()}));

function renderUserAvatar(element,user){if(!element)return;element.replaceChildren();element.classList.toggle('has-photo',Boolean(user.photo));if(user.photo){const image=document.createElement('img');image.src=user.photo;image.alt=`Foto de ${user.name||'perfil'}`;element.appendChild(image)}else element.textContent=initials(user.name)}
let pendingProfilePhoto;
function refreshUser(){const user=read(STORE.user,{name:'Visitante',contact:'',email:'',phone:'',photo:''});const email=user.email||user.contact||'';document.getElementById('header-name').textContent=user.name;['header-avatar','profile-avatar','profile-photo-preview','community-avatar','composer-avatar'].forEach(id=>renderUserAvatar(document.getElementById(id),user));document.getElementById('profile-display-name').textContent=user.name;document.getElementById('profile-display-email').textContent=[email,user.phone].filter(Boolean).join(' • ')||'Perfil da Plataforma Reino';document.getElementById('profile-name').value=user.name==='Visitante'?'':user.name;document.getElementById('profile-contact').value=email;const phone=document.getElementById('profile-phone');if(phone)phone.value=user.phone||'';document.getElementById('remove-profile-photo').hidden=!user.photo&&pendingProfilePhoto===undefined}
async function saveUser(name,contact,phone=''){
  if(!name.trim()||!validContact(contact))throw new Error('Preencha nome e e-mail válido.');
  const client=window.REINO_SUPABASE;
  if(!client)throw new Error('Conexão com Supabase indisponível.');
  const {data:{user},error:authError}=await client.auth.getUser();
  if(authError||!user)throw new Error('Entre novamente para salvar seu perfil.');
  const normalized=contact.trim().toLowerCase();
  const oldProfile=await loadSupabaseProfile(user);
  const oldPath=oldProfile?.avatar_url||'';
  let path=oldPath;
  if(pendingProfilePhoto){
    const response=await fetch(pendingProfilePhoto);
    const blob=await response.blob();
    const target=profilePhotoPath(user.id);
    const {error:uploadError}=await client.storage.from(PROFILE_PHOTO_BUCKET).upload(target,blob,{contentType:'image/jpeg',upsert:false,cacheControl:'3600'});
    if(uploadError)throw uploadError;
    path=target;
  }else if(pendingProfilePhoto==='')path='';
  const cleanPhone=phone.trim();
  if(cleanPhone&&!/^[0-9()+\-\s.]{8,20}$/.test(cleanPhone))throw new Error('Informe um telefone válido.');
  const {error:updateError}=await client.from('profiles').update({full_name:name.trim(),email:normalized,phone:cleanPhone||null,avatar_url:path||null,updated_at:new Date().toISOString()}).eq('id',user.id);
  if(updateError)throw updateError;
  if(pendingProfilePhoto!==undefined&&oldPath&&oldPath!==path&&!oldPath.startsWith('data:')){
    const {error:removeError}=await client.storage.from(PROFILE_PHOTO_BUCKET).remove([oldPath]);
    if(removeError)console.warn('Remoção da foto antiga:',removeError.message);
  }
  pendingProfilePhoto=undefined;
  await cacheAuthenticatedUser(user,name);
  toast('Perfil salvo na sua conta.');
}
function prepareProfilePhoto(file){return new Promise((resolve,reject)=>{if(!file?.type.startsWith('image/'))return reject(new Error('Escolha uma imagem válida.'));if(file.size>8*1024*1024)return reject(new Error('A imagem deve ter no máximo 8 MB.'));const reader=new FileReader();reader.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));reader.onload=()=>{const source=new Image();source.onerror=()=>reject(new Error('Não foi possível abrir a imagem.'));source.onload=()=>{const size=Math.min(source.naturalWidth,source.naturalHeight);const sx=(source.naturalWidth-size)/2,sy=(source.naturalHeight-size)/2;const canvas=document.createElement('canvas');canvas.width=canvas.height=420;canvas.getContext('2d').drawImage(source,sx,sy,size,size,0,0,420,420);resolve(canvas.toDataURL('image/jpeg',.82))};source.src=reader.result};reader.readAsDataURL(file)})}
document.getElementById('profile-photo').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{pendingProfilePhoto=await prepareProfilePhoto(file);const current=read(STORE.user,{name:'Visitante'});renderUserAvatar(document.getElementById('profile-photo-preview'),{...current,photo:pendingProfilePhoto});document.getElementById('remove-profile-photo').hidden=false;toast('Foto pronta. Toque em Salvar alterações.')}catch(error){toast(error.message)}finally{event.target.value=''}});
document.getElementById('remove-profile-photo').addEventListener('click',()=>{pendingProfilePhoto='';const current=read(STORE.user,{name:'Visitante'});renderUserAvatar(document.getElementById('profile-photo-preview'),{...current,photo:''});document.getElementById('remove-profile-photo').hidden=true;toast('Foto removida. Salve as alterações.')});
document.getElementById('profile-dialog').addEventListener('close',event=>{if(event.target.returnValue!=='default'){pendingProfilePhoto=undefined;refreshUser()}});
document.querySelector('#profile-dialog form').addEventListener('submit',async event=>{
  if(event.submitter?.id!=='save-profile')return;
  event.preventDefault();
  const button=event.submitter;
  button.disabled=true;
  try{
    const status=document.getElementById('profile-save-status');if(status)status.textContent='Salvando...';
    await saveUser(document.getElementById('profile-name').value,document.getElementById('profile-contact').value,document.getElementById('profile-phone').value);
    if(status)status.textContent='Perfil salvo com sucesso.';
    document.getElementById('profile-dialog').close('default');
  }catch(error){console.error('Perfil:',error);toast(error.message||'Não foi possível salvar o perfil.')}
  finally{button.disabled=false}
});refreshUser();
document.getElementById('reset-access').addEventListener('click',async()=>{try{await window.REINO_SUPABASE?.auth.signOut()}catch{}localStorage.removeItem(STORE.access);localStorage.removeItem('reino_access_granted_v1');localStorage.removeItem(STORE.user);location.href='index.html#inicio'});setupFirstAccess();

function refreshStats(){const favorites=read(STORE.favorites,[]).length;const posts=communityPostsCache?.filter?.(post=>post.user_id===read(STORE.access,{}).userId).length||0;const score=Number(read(STORE.score,0));[['home-best-score',`${score}/10`],['home-favorites',favorites],['home-posts',posts],['profile-score',`${score}/10`],['profile-favorites',favorites],['profile-posts',posts]].forEach(([id,value])=>{const element=document.getElementById(id);if(element)element.textContent=value})}

function populateBookSelect(){const select=document.getElementById('bible-book-select');select.innerHTML=BIBLE.books.map((book,index)=>`<option value="${index}">${escapeHtml(book.name)}</option>`).join('')}
function populateChapterSelect(){const book=BIBLE.books[currentBookIndex];const select=document.getElementById('bible-chapter-select');select.innerHTML=book.chapters.map((_,index)=>`<option value="${index+1}">${index+1}</option>`).join('');select.value=String(currentChapter)}
function loadChapter(bookIndex=currentBookIndex,chapter=currentChapter,scroll=false){if(!BIBLE.books.length)return;currentBookIndex=Math.max(0,Math.min(Number(bookIndex),BIBLE.books.length-1));const book=BIBLE.books[currentBookIndex];currentChapter=Math.max(1,Math.min(Number(chapter),book.chapters.length));document.getElementById('bible-book-select').value=String(currentBookIndex);populateChapterSelect();document.getElementById('reading-title').textContent=`${book.name} ${currentChapter}`;const verses=book.chapters[currentChapter-1];document.getElementById('verse-list').innerHTML=verses.map(verse=>`<p><sup>${verse.verse}</sup>${escapeHtml(verse.text)}</p>`).join('');document.getElementById('previous-chapter').disabled=currentBookIndex===0&&currentChapter===1;document.getElementById('next-chapter').disabled=currentBookIndex===BIBLE.books.length-1&&currentChapter===book.chapters.length;if(scroll)document.getElementById('reading-panel').scrollIntoView({behavior:'smooth',block:'start'})}
function selectBook(index,chapter=1,scroll=true){currentBookIndex=Number(index);currentChapter=Number(chapter);loadChapter(currentBookIndex,currentChapter,scroll)}
function renderBooks(query=''){const normalized=query.toLocaleLowerCase('pt-BR');const filtered=BIBLE.books.map((book,index)=>({...book,index})).filter(book=>book.name.toLocaleLowerCase('pt-BR').includes(normalized));const grid=document.getElementById('book-grid');grid.innerHTML=filtered.map(book=>`<button class="book-button" type="button" data-index="${book.index}">${escapeHtml(book.name)}<br><small>${book.chapters.length} capítulos</small></button>`).join('')||'<p>Nenhum livro encontrado.</p>';grid.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>selectBook(button.dataset.index)))}
populateBookSelect();renderBooks();
document.getElementById('bible-search').addEventListener('input',event=>renderBooks(event.target.value));
document.getElementById('bible-book-select').addEventListener('change',event=>selectBook(event.target.value,1,false));
document.getElementById('bible-chapter-select').addEventListener('change',event=>loadChapter(currentBookIndex,event.target.value));
document.getElementById('previous-chapter').addEventListener('click',()=>{if(currentChapter>1)loadChapter(currentBookIndex,currentChapter-1);else if(currentBookIndex>0){currentBookIndex--;loadChapter(currentBookIndex,BIBLE.books[currentBookIndex].chapters.length)}});
document.getElementById('next-chapter').addEventListener('click',()=>{const book=BIBLE.books[currentBookIndex];if(currentChapter<book.chapters.length)loadChapter(currentBookIndex,currentChapter+1);else if(currentBookIndex<BIBLE.books.length-1)loadChapter(currentBookIndex+1,1)});
const params=new URLSearchParams(location.search);const requestedSlug=params.get('book');const requestedChapter=Number(params.get('chapter')||1);const requestedIndex=BIBLE.books.findIndex(book=>book.slug===requestedSlug);if(requestedIndex>=0)selectBook(requestedIndex,requestedChapter,false);else loadChapter();
document.getElementById('favorite-verse').addEventListener('click',()=>{const ref=`${BIBLE.books[currentBookIndex].name} ${currentChapter}`;const favorites=read(STORE.favorites,[]);const exists=favorites.includes(ref);write(STORE.favorites,exists?favorites.filter(item=>item!==ref):[...favorites,ref]);refreshStats();toast(exists?'Capítulo removido dos favoritos.':'Capítulo salvo nos favoritos.')});
async function shareText(text){if(navigator.share){try{await navigator.share({text});return}catch{}}if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Texto copiado para compartilhar.');return}toast('Selecione e copie o texto para compartilhar.')}
document.getElementById('share-verse').addEventListener('click',()=>shareText(`${BIBLE.books[currentBookIndex].name} ${currentChapter} — Plataforma Reino`));
const copyDaily=document.getElementById('copy-daily');if(copyDaily)copyDaily.addEventListener('click',()=>shareText('João 15:5 — Eu sou a videira; vocês são os ramos. Se alguém permanecer em mim e eu nele, esse dará muito fruto. — Plataforma Reino'));

function localDate(){return new Date().toLocaleDateString('en-CA')}
function previousDate(){const date=new Date();date.setDate(date.getDate()-1);return date.toLocaleDateString('en-CA')}
function refreshDaily(){if(!document.getElementById('daily-streak'))return;const today=localDate();let daily=read(STORE.daily,{date:today,completed:[]});if(daily.date!==today)daily={date:today,completed:[]};write(STORE.daily,daily);let streak=read(STORE.streak,{last:'',count:0});if(streak.last!==today){streak={last:today,count:streak.last===previousDate()?streak.count+1:1};write(STORE.streak,streak)}document.getElementById('daily-streak').textContent=streak.count;document.getElementById('daily-completed').textContent=`${daily.completed.length} de 3`;document.getElementById('daily-progress-bar').style.width=`${daily.completed.length/3*100}%`;document.querySelectorAll('[data-daily]').forEach(button=>button.classList.toggle('done',daily.completed.includes(button.dataset.daily)))}
document.querySelectorAll('[data-daily]').forEach(button=>button.addEventListener('click',()=>{const today=localDate();const daily=read(STORE.daily,{date:today,completed:[]});if(daily.date!==today)daily.completed=[];daily.date=today;if(!daily.completed.includes(button.dataset.daily))daily.completed.push(button.dataset.daily);write(STORE.daily,daily);refreshDaily();if(button.dataset.daily==='palavra')location.href='index.html?book=john&chapter=3#palavra';if(button.dataset.daily==='quiz')location.href='quiz.html';if(button.dataset.daily==='oracao')toast('Momento de oração marcado. Que este tempo fortaleça sua caminhada.')}));refreshDaily();

const libraryItems=[
  {id:'evangelho-joao',kind:'Plano',category:'Vida cristã',title:'Conhecendo Jesus em João',description:'Uma caminhada de 7 dias pelos sinais, palavras e encontros de Jesus.',days:7,book:'john',chapter:1},
  {id:'salmos-oracao',kind:'Plano',category:'Oração',title:'Aprendendo a orar com os Salmos',description:'Cinco leituras para transformar sentimentos sinceros em oração.',days:5,book:'psalms',chapter:1},
  {id:'familia-efesios',kind:'Plano',category:'Família',title:'Graça dentro de casa',description:'Princípios bíblicos para cultivar perdão, serviço e diálogo na família.',days:5,book:'ephesians',chapter:4},
  {id:'lideranca-servico',kind:'Plano',category:'Liderança',title:'Liderar como quem serve',description:'Sete encontros sobre caráter, responsabilidade e o exemplo de Cristo.',days:7,book:'mark',chapter:10},
  {id:'proverbios-decisoes',kind:'Plano',category:'Vida cristã',title:'Sabedoria para decisões',description:'Um roteiro prático em Provérbios para escolhas guiadas pelo temor de Deus.',days:6,book:'proverbs',chapter:3},
  {id:'familia-rute',kind:'Plano',category:'Família',title:'Lealdade e esperança em Rute',description:'Quatro dias sobre cuidado, providência e recomeços em família.',days:4,book:'ruth',chapter:1},
  {id:'cristianismo-puro',kind:'Livro',category:'Fundamentos',title:'Cristianismo Puro e Simples',author:'C. S. Lewis',description:'Uma apresentação racional e acessível dos fundamentos centrais da fé cristã.',reason:'Ajuda a organizar perguntas essenciais sobre moral, fé, Cristo e transformação cristã.'},
  {id:'o-peregrino',kind:'Livro',category:'Clássicos',title:'O Peregrino',author:'John Bunyan',description:'A jornada alegórica de Cristão desde a Cidade da Destruição até a Cidade Celestial.',reason:'Transforma temas como perseverança, tentação e esperança em uma narrativa memorável.'},
  {id:'discipulo-radical',kind:'Livro',category:'Discipulado',title:'O Discípulo Radical',author:'John Stott',description:'Um chamado a seguir Jesus com inteireza, humildade, maturidade e compromisso.',reason:'Confronta um cristianismo superficial e apresenta marcas práticas do discipulado.'},
  {id:'cruz-de-cristo',kind:'Livro',category:'Fundamentos',title:'A Cruz de Cristo',author:'John Stott',description:'Estudo sobre o significado da cruz para a fé, o perdão, a justiça e a vida cristã.',reason:'Aprofunda o entendimento da obra de Cristo e de suas implicações para o discípulo.'},
  {id:'conhecimento-santo',kind:'Livro',category:'Espiritualidade',title:'O Conhecimento do Santo',author:'A. W. Tozer',description:'Reflexões sobre os atributos de Deus e como nossa visão de Deus molda nossa vida.',reason:'Incentiva reverência, adoração e uma compreensão mais profunda do caráter de Deus.'},
  {id:'santidade-de-deus',kind:'Livro',category:'Fundamentos',title:'A Santidade de Deus',author:'R. C. Sproul',description:'Uma exposição sobre a santidade divina e suas implicações para a adoração e a vida cristã.',reason:'Ajuda a compreender reverência, pecado, graça e a centralidade do caráter de Deus.'},
  {id:'celebracao-disciplina',kind:'Livro',category:'Discipulado',title:'Celebração da Disciplina',author:'Richard Foster',description:'Introdução a práticas cristãs como oração, jejum, estudo, serviço e simplicidade.',reason:'Oferece caminhos práticos para desenvolver hábitos espirituais com propósito.'},
  {id:'vida-propositos',kind:'Livro',category:'Vida cristã',title:'Uma Vida com Propósitos',author:'Rick Warren',description:'Uma jornada sobre adoração, comunhão, maturidade, serviço e missão.',reason:'Ajuda o leitor a conectar fé, vocação, comunidade e serviço cristão.'},
  {id:'deus-prodigo',kind:'Livro',category:'Fundamentos',title:'O Deus Pródigo',author:'Timothy Keller',description:'Uma leitura da parábola do filho pródigo que observa os dois irmãos e o amor do pai.',reason:'Convida a compreender graça, arrependimento e religiosidade de maneira mais profunda.'},
  {id:'oracao-keller',kind:'Livro',category:'Oração',title:'Oração',author:'Timothy Keller',description:'Reflexão bíblica e prática sobre aprender a conversar com Deus.',reason:'Reúne fundamentos e exercícios para uma vida de oração mais consistente.'},
  {id:'custo-discipulado',kind:'Livro',category:'Discipulado',title:'Discipulado',author:'Dietrich Bonhoeffer',description:'Reflexão exigente sobre graça, obediência e o custo real de seguir Jesus.',reason:'Desafia o leitor a diferenciar fé confortável de compromisso cristão concreto.'},
  {id:'busca-de-deus',kind:'Livro',category:'Clássicos',title:'Em Busca de Deus',author:'A. W. Tozer',description:'Um chamado evangélico para cultivar fome espiritual, reverência e comunhão verdadeira com Deus.',reason:'Convida o leitor a ir além da religiosidade exterior e buscar uma fé viva e centrada em Deus.'},
  {id:'graca-futura',kind:'Livro',category:'Discipulado',title:'Graça Futura',author:'John Piper',description:'Reflexões sobre viver pela confiança nas promessas de Deus e combater pecados pela fé.',reason:'Relaciona esperança futura, satisfação em Deus e escolhas concretas no presente.'},
  {id:'herois-fe',kind:'Livro',category:'Biografias',title:'Heróis da Fé',author:'Orlando Boyer',description:'Biografias de homens e mulheres ligados a avivamentos, missões e evangelização.',reason:'Apresenta exemplos históricos de perseverança e serviço, que devem ser lidos com discernimento.'},
  {id:'cruz-punhal',kind:'Livro',category:'Testemunhos',title:'A Cruz e o Punhal',author:'David Wilkerson',description:'Relato do trabalho cristão entre jovens e gangues em Nova York.',reason:'Mostra como presença, coragem e compaixão podem alcançar contextos de grande vulnerabilidade.'},
  {id:'refugio-secreto',kind:'Livro',category:'Biografias',title:'O Refúgio Secreto',author:'Corrie ten Boom',description:'Relato de fé, resistência e perdão em meio à perseguição nazista.',reason:'Provoca reflexão sobre coragem, sofrimento, proteção ao próximo e reconciliação.'},
  {id:'campo-mente',kind:'Livro',category:'Saúde emocional',title:'Campo de Batalha da Mente',author:'Joyce Meyer',description:'Reflexões cristãs sobre pensamentos, hábitos mentais e renovação da mente.',reason:'Pode iniciar conversas sobre padrões de pensamento, sem substituir cuidado psicológico ou médico.'},
  {id:'ansiedade-lucado',kind:'Livro',category:'Saúde emocional',title:'Ansiedade',author:'Max Lucado',description:'Uma abordagem pastoral sobre preocupação, oração e confiança em tempos difíceis.',reason:'Oferece encorajamento espiritual; quadros persistentes de ansiedade exigem avaliação profissional.'},
  {id:'louco-amor',kind:'Livro',category:'Vida cristã',title:'Louco Amor',author:'Francis Chan',description:'Um chamado a responder ao amor de Deus com entrega e vida cristã coerente.',reason:'Estimula autoavaliação sobre prioridades, generosidade e compromisso.'},
  {id:'em-seus-passos',kind:'Livro',category:'Clássicos',title:'Em Seus Passos, o Que Faria Jesus?',author:'Charles M. Sheldon',description:'Romance cristão sobre uma comunidade que decide orientar escolhas pelo exemplo de Jesus.',reason:'Transforma uma pergunta simples em reflexão prática sobre ética, trabalho e serviço.'}
];
let activeLibraryFilter='Todos';
let selectedBookId='';
function libraryMatches(item){if(activeLibraryFilter==='Todos')return true;if(activeLibraryFilter==='Livros')return item.kind==='Livro';if(activeLibraryFilter==='Planos')return item.kind==='Plano';return item.category===activeLibraryFilter}
function toggleLibrarySave(id){let list=read(STORE.library,[]);list=list.includes(id)?list.filter(item=>item!==id):[...list,id];write(STORE.library,list);renderLibrary();updateBookDialogButton();toast(list.includes(id)?'Item salvo na sua biblioteca.':'Item removido dos salvos.')}
function openBook(id){const item=libraryItems.find(entry=>entry.id===id&&entry.kind==='Livro');if(!item)return;selectedBookId=id;document.getElementById('book-dialog-category').textContent=`${item.category.toUpperCase()} • EDIÇÃO EM PORTUGUÊS`;document.getElementById('book-dialog-title').textContent=item.title;document.getElementById('book-dialog-author').textContent=item.author;document.getElementById('book-dialog-description').textContent=item.description;document.getElementById('book-dialog-reason').textContent=item.reason;updateBookDialogButton();document.getElementById('book-dialog').showModal()}
function updateBookDialogButton(){const button=document.getElementById('save-dialog-book');if(!button||!selectedBookId)return;button.textContent=read(STORE.library,[]).includes(selectedBookId)?'★ Salvo na biblioteca':'☆ Salvar na biblioteca'}
function renderLibrary(){const query=document.getElementById('library-search').value.trim().toLocaleLowerCase('pt-BR');const saved=read(STORE.library,[]);const items=libraryItems.filter(item=>libraryMatches(item)&&(item.title+(item.author||'')+item.description+item.category).toLocaleLowerCase('pt-BR').includes(query));let bookNumber=0;document.getElementById('library-grid').innerHTML=items.map(item=>{if(item.kind==='Livro')bookNumber++;const action=item.kind==='Livro'?`<button type="button" class="library-open" data-open-book="${item.id}">Conhecer livro</button>`:`<a href="index.html?book=${item.book}&chapter=${item.chapter}#palavra" rel="noopener">Começar plano →</a>`;const meta=item.kind==='Livro'?`Livro cristão • português`:`${item.days} dias • plano bíblico`;return `<article class="library-card ${item.kind==='Livro'?'book-card':''}">${item.kind==='Livro'?`<span class="book-index">${String(bookNumber).padStart(2,'0')}</span>`:''}<small>${item.category.toUpperCase()}</small><h3>${escapeHtml(item.title)}</h3>${item.author?`<b class="library-author">${escapeHtml(item.author)}</b>`:''}<p>${escapeHtml(item.description)}</p><div class="library-meta"><span>${meta}</span><span>${action} <button type="button" class="${saved.includes(item.id)?'saved':''}" data-save-library="${item.id}" aria-label="Salvar item">${saved.includes(item.id)?'★':'☆'}</button></span></div></article>`}).join('')||'<article class="panel"><p>Nenhum item encontrado para esta busca.</p></article>';document.querySelectorAll('[data-save-library]').forEach(button=>button.addEventListener('click',()=>toggleLibrarySave(button.dataset.saveLibrary)));document.querySelectorAll('[data-open-book]').forEach(button=>button.addEventListener('click',()=>openBook(button.dataset.openBook)))}
document.getElementById('library-search').addEventListener('input',renderLibrary);document.querySelectorAll('[data-library-filter]').forEach(button=>button.addEventListener('click',()=>{activeLibraryFilter=button.dataset.libraryFilter;document.querySelectorAll('[data-library-filter]').forEach(item=>item.classList.toggle('active',item===button));renderLibrary()}));renderLibrary();
document.getElementById('close-book-dialog').addEventListener('click',()=>document.getElementById('book-dialog').close());document.getElementById('save-dialog-book').addEventListener('click',()=>selectedBookId&&toggleLibrarySave(selectedBookId));

const faithHeroes=[
  {name:'Martinho Lutero',years:'1483–1546',category:'Reforma',place:'Alemanha',mark:'ML',title:'Reforma e consciência',description:'Monge e professor de teologia cuja atuação impulsionou a Reforma Protestante. Defendeu a centralidade das Escrituras e a justificação pela fé.',lesson:'Legado: coragem para confrontar estruturas e tornar o ensino bíblico acessível.'},
  {name:'John Wesley',years:'1703–1791',category:'Reforma',place:'Inglaterra',mark:'JW',title:'Fé que se torna serviço',description:'Pregador ligado ao nascimento do metodismo. Organizou pequenos grupos e uniu evangelização, disciplina espiritual e ação social.',lesson:'Legado: santidade pessoal acompanhada de responsabilidade social.'},
  {name:'William Carey',years:'1761–1834',category:'Missões',place:'Índia',mark:'WC',title:'Missão, educação e tradução',description:'Missionário e linguista britânico que serviu por décadas na Índia, trabalhando com tradução bíblica, educação e iniciativas sociais.',lesson:'Legado: preparo, perseverança e respeito pelo aprendizado de línguas.'},
  {name:'George Müller',years:'1805–1898',category:'Serviço',place:'Inglaterra',mark:'GM',title:'Oração e cuidado de órfãos',description:'Conhecido pelo cuidado de milhares de crianças órfãs em Bristol e por registrar respostas de oração ao longo de seu ministério.',lesson:'Legado: fé prática, transparência e cuidado consistente com crianças vulneráveis.'},
  {name:'Hudson Taylor',years:'1832–1905',category:'Missões',place:'China',mark:'HT',title:'Servir com proximidade cultural',description:'Fundador da Missão para o Interior da China. Adotou costumes locais e incentivou missionários a conhecerem a cultura do povo que serviam.',lesson:'Legado: missão com adaptação cultural, presença e perseverança.'},
  {name:'Amy Carmichael',years:'1867–1951',category:'Missões',place:'Índia',mark:'AC',title:'Proteção e acolhimento',description:'Missionária irlandesa que dedicou grande parte da vida ao cuidado de crianças vulneráveis na Índia e fundou a Comunidade Dohnavur.',lesson:'Legado: serviço de longo prazo e proteção aos vulneráveis.'},
  {name:'William J. Seymour',years:'1870–1922',category:'Serviço',place:'Estados Unidos',mark:'WS',title:'Avivamento e reconciliação',description:'Pregador afro-americano associado ao avivamento da Rua Azusa, marco da expansão pentecostal mundial no início do século XX.',lesson:'Legado: oração, participação comunitária e superação de barreiras raciais em seu contexto.'},
  {name:'Corrie ten Boom',years:'1892–1983',category:'Serviço',place:'Países Baixos',mark:'CB',title:'Coragem e perdão',description:'Cristã holandesa cuja família ajudou judeus durante a ocupação nazista. Sobreviveu a um campo de concentração e falou sobre perdão.',lesson:'Legado: proteger o próximo mesmo sob risco e buscar reconciliação sem negar a dor.'},
  {name:'Dietrich Bonhoeffer',years:'1906–1945',category:'Serviço',place:'Alemanha',mark:'DB',title:'Discipulado com responsabilidade',description:'Pastor e teólogo alemão que resistiu ao nazismo, participou da Igreja Confessante e foi executado nos últimos dias da guerra.',lesson:'Legado: a fé cristã envolve responsabilidade pública e pode exigir alto custo.'},
  {name:'Billy Graham',years:'1918–2018',category:'Missões',place:'Mundo',mark:'BG',title:'Evangelização em grande escala',description:'Evangelista norte-americano que pregou em campanhas internacionais e utilizou rádio, televisão, imprensa e grandes encontros.',lesson:'Legado: comunicação simples do evangelho e uso responsável dos meios disponíveis.'},
  {name:'Ashbel Green Simonton',years:'1833–1867',category:'Brasil',place:'Brasil',mark:'AS',title:'Pioneiro presbiteriano',description:'Missionário que chegou ao Rio de Janeiro em 1859 e participou da organização da Igreja Presbiteriana do Brasil, de um seminário e de um jornal.',lesson:'Legado: plantar instituições para que o trabalho continue além de uma pessoa.'},
  {name:'Sarah Poulton Kalley',years:'1825–1907',category:'Brasil',place:'Brasil',mark:'SK',title:'Educação, música e missão',description:'Missionária e musicista inglesa que atuou no Brasil com Robert Kalley, colaborando com educação cristã, hinologia e comunidades congregacionais.',lesson:'Legado: mulheres também construíram de forma decisiva a história cristã brasileira.'}
];
let activeHeroFilter='Todos';
function renderHeroes(){const items=faithHeroes.filter(hero=>activeHeroFilter==='Todos'||hero.category===activeHeroFilter);document.getElementById('heroes-grid').innerHTML=items.map((hero,index)=>`<article class="hero-person"><div class="hero-portrait"><span>${hero.mark}</span><small>${hero.years}</small></div><div class="hero-person-copy"><span class="eyebrow">${hero.category.toUpperCase()} • ${hero.place.toUpperCase()}</span><h3>${hero.name}</h3><b>${hero.title}</b><p>${hero.description}</p><small>${hero.lesson}</small></div></article>`).join('')}
document.querySelectorAll('[data-hero-filter]').forEach(button=>button.addEventListener('click',()=>{activeHeroFilter=button.dataset.heroFilter;document.querySelectorAll('[data-hero-filter]').forEach(item=>item.classList.toggle('active',item===button));renderHeroes()}));renderHeroes();

const heroesQuestions=[
  {question:'Quem ficou conhecido pelo cuidado de milhares de crianças órfãs em Bristol?',options:['George Müller','Hudson Taylor','John Wesley','Billy Graham'],correct:0,explanation:'George Müller organizou lares para crianças órfãs e ficou conhecido por unir oração, transparência e cuidado prático.'},
  {question:'Qual pioneiro chegou ao Rio de Janeiro em 1859 e participou do início da Igreja Presbiteriana do Brasil?',options:['William Carey','Ashbel Green Simonton','Martinho Lutero','William Seymour'],correct:1,explanation:'Ashbel Green Simonton chegou ao Brasil em 1859 e ajudou a estruturar igreja, formação teológica e imprensa presbiteriana.'},
  {question:'Quem é lembrada por ajudar judeus durante a ocupação nazista nos Países Baixos?',options:['Amy Carmichael','Sarah Kalley','Corrie ten Boom','Agostinho'],correct:2,explanation:'Corrie ten Boom e sua família esconderam e ajudaram judeus. Ela sobreviveu à prisão e depois falou sobre perdão e reconciliação.'},
  {question:'Quem fundou a Missão para o Interior da China e valorizou a proximidade com a cultura local?',options:['Hudson Taylor','John Stott','Dietrich Bonhoeffer','George Müller'],correct:0,explanation:'Hudson Taylor incentivou o aprendizado da língua e a adaptação cultural no trabalho missionário na China.'},
  {question:'Qual mulher contribuiu para a educação cristã e a hinologia no início do protestantismo brasileiro?',options:['Corrie ten Boom','Amy Carmichael','Sarah Poulton Kalley','C. S. Lewis'],correct:2,explanation:'Sarah Poulton Kalley atuou no Brasil como missionária, educadora e musicista, deixando contribuição importante à hinologia e às igrejas congregacionais.'}
];
let heroesQuestionIndex=0,heroesCorrect=0,heroesAnswered=false;
function renderHeroesQuestion(){const item=heroesQuestions[heroesQuestionIndex];heroesAnswered=false;document.getElementById('heroes-question-number').textContent=`PERGUNTA ${heroesQuestionIndex+1} DE ${heroesQuestions.length}`;document.getElementById('heroes-question').textContent=item.question;document.getElementById('heroes-options').innerHTML=item.options.map((option,index)=>`<button type="button" data-hero-answer="${index}"><span>${String.fromCharCode(65+index)}</span>${option}</button>`).join('');document.getElementById('heroes-feedback').classList.add('hidden');document.getElementById('heroes-next').classList.add('hidden');document.querySelectorAll('[data-hero-answer]').forEach(button=>button.addEventListener('click',()=>answerHeroQuestion(Number(button.dataset.heroAnswer))))}
function answerHeroQuestion(answer){if(heroesAnswered)return;heroesAnswered=true;const item=heroesQuestions[heroesQuestionIndex];if(answer===item.correct)heroesCorrect++;document.getElementById('heroes-score').textContent=`${heroesCorrect}/${heroesQuestions.length}`;document.querySelectorAll('[data-hero-answer]').forEach((button,index)=>{button.disabled=true;if(index===item.correct)button.classList.add('correct');if(index===answer&&answer!==item.correct)button.classList.add('wrong')});const feedback=document.getElementById('heroes-feedback');feedback.innerHTML=`<strong>${answer===item.correct?'Acertou!':'Quase!'}</strong><p>${item.explanation}</p>`;feedback.classList.remove('hidden');const next=document.getElementById('heroes-next');next.textContent=heroesQuestionIndex===heroesQuestions.length-1?'Refazer prova':'Próxima pergunta';next.classList.remove('hidden')}
document.getElementById('heroes-next').addEventListener('click',()=>{if(heroesQuestionIndex===heroesQuestions.length-1){heroesQuestionIndex=0;heroesCorrect=0;document.getElementById('heroes-score').textContent=`0/${heroesQuestions.length}`}else heroesQuestionIndex++;renderHeroesQuestion()});renderHeroesQuestion();

function refreshMissions(){const selected=read(STORE.missions,[]);document.getElementById('mission-interest-count').textContent=selected.length?`${selected.length} ${selected.length===1?'frente selecionada':'frentes selecionadas'}`:'Nenhuma frente selecionada';document.querySelectorAll('[data-mission]').forEach(button=>{const active=selected.includes(button.dataset.mission);button.classList.toggle('selected',active);button.textContent=active?'✓ Interesse registrado':button.dataset.mission==='Missão digital'?'Quero colaborar':button.dataset.mission==='Missão social'?'Quero ajudar':button.dataset.mission==='Missão global'?'Conhecer melhor':'Tenho interesse'})}
document.querySelectorAll('[data-mission]').forEach(button=>button.addEventListener('click',()=>{let selected=read(STORE.missions,[]);const mission=button.dataset.mission;selected=selected.includes(mission)?selected.filter(item=>item!==mission):[...selected,mission];write(STORE.missions,selected);refreshMissions();toast(selected.includes(mission)?'Interesse missionário salvo neste aparelho.':'Interesse removido.')}));document.getElementById('clear-missions').addEventListener('click',()=>{write(STORE.missions,[]);refreshMissions();toast('Escolhas missionárias removidas.')});refreshMissions();

const freeCourses=[
  {title:'Vídeo Maker para Projetos da Igreja',provider:'Escola Criativa do Canva',audience:'Jovens e adultos',area:'Mídia para Igreja',description:'Aprenda princípios de gravação e edição para avisos, testemunhos, eventos e conteúdos cristãos.',url:'https://www.canva.com/pt_br/design-school/explore/'},
  {title:'Social Media para Igreja e Ministérios',provider:'Sebrae',audience:'Jovens e adultos',area:'Mídia para Igreja',description:'Planejamento de conteúdo, redes sociais, interação e comunicação digital aplicados ao ministério.',url:'https://sebrae.com.br/sites/PortalSebrae/cursosonline/sua-empresa-nas-redes-sociais%2C2fb0b8a6a28bb610VgnVCM1000004c00210aRCRD'},
  {title:'Design para Cultos e Redes Sociais',provider:'Escola Criativa do Canva',audience:'Jovens e adultos',area:'Mídia para Igreja',description:'Cores, tipografia, composição e criação de artes para cultos, eventos e publicações.',url:'https://www.canva.com/pt_br/design-school/?types=COURSE'},
  {title:'Projeção de Mídia e Apresentações',provider:'Fundação Bradesco',audience:'Jovens e adultos',area:'Mídia para Igreja',description:'Crie apresentações claras para letras, mensagens, avisos e eventos usando recursos visuais.',url:'https://www.ev.org.br/cursos/powerpoint-na-pratica'},
  {title:'Produção de Conteúdo para YouTube',provider:'YouTube Creators',audience:'Jovens e adultos',area:'Mídia para Igreja',description:'Planeje vídeos, organize o canal e publique conteúdos que comuniquem a mensagem com clareza.',url:'https://creatoracademy.youtube.com/'},
  {title:'Som para Cultos: fundamentos e prática',provider:'Shure Academy',audience:'Jovens e adultos',area:'Mídia para Igreja',description:'Treinamento gratuito sobre fundamentos de áudio, microfones, sistemas sem fio e som ao vivo.',url:'https://www.shure.com/pt-BR/shure-academy/treinamento-online'},
  {title:'Marketing Digital e Redes Sociais',provider:'Sebrae',audience:'Jovens e adultos',area:'Marketing',description:'Público, conteúdo, redes sociais, anúncios e campanhas para quem está começando.',url:'https://loja.sebrae.com.br/marketing-digital-e-redes-sociais-1-372000114127'},
  {title:'Fundamentos de Marketing Digital',provider:'HubSpot Academy',audience:'Jovens e adultos',area:'Marketing',description:'Estratégia digital, presença online, conteúdo e relacionamento com clientes.',url:'https://academy.hubspot.com/pt/lessons/digital-marketing-fundamentals'},
  {title:'Inbound Marketing',provider:'HubSpot Academy',audience:'Adultos',area:'Marketing',description:'Aprenda atração, relacionamento, conversão e fidelização de clientes.',url:'https://academy.hubspot.com/pt/courses/inbound-marketing'},
  {title:'Marketing Digital para a Administração',provider:'Escola Virtual.Gov',audience:'Jovens e adultos',area:'Marketing',description:'Estratégias, canais e planejamento de comunicação no ambiente digital.',url:'https://www.escolavirtual.gov.br/curso/806'},
  {title:'Como Vender Mais e Melhor',provider:'Sebrae',audience:'Jovens e adultos',area:'Vendas',description:'Organize o processo comercial e desenvolva ações para melhorar seus resultados.',url:'https://loja.sebrae.com.br/como-vender-mais-e-melhor-1-372000017878'},
  {title:'Negociação',provider:'Sebrae',audience:'Jovens e adultos',area:'Vendas',description:'Prepare negociações, compreenda interesses e busque acordos sustentáveis.',url:'https://loja.sebrae.com.br/negociac-o-1-372000027025'},
  {title:'Venda pela Internet com Marketing Digital',provider:'Sebrae',audience:'Jovens e adultos',area:'Vendas',description:'Use canais digitais para apresentar produtos, alcançar clientes e vender online.',url:'https://df.loja.sebrae.com.br/aprenda-a-vender-pela-internet-com-marketing-digital-372000005127'},
  {title:'Atendimento ao Público',provider:'Fundação Bradesco',audience:'Jovens e adultos',area:'Telemarketing e Atendimento',description:'Atendimento pessoal, por telefone e pela internet com clareza e profissionalismo.',url:'https://www.ev.org.br/cursos/atendimento-ao-publico'},
  {title:'Atendimento ao Cliente',provider:'Sebrae',audience:'Jovens e adultos',area:'Telemarketing e Atendimento',description:'Princípios para compreender necessidades e oferecer uma boa experiência ao cliente.',url:'https://loja.sebrae.com.br/atendimento-ao-cliente-1-372000017766'},
  {title:'Qualidade no Atendimento ao Cliente',provider:'Sebrae',audience:'Jovens e adultos',area:'Telemarketing e Atendimento',description:'Boas práticas para criar confiança, resolver demandas e fidelizar clientes.',url:'https://loja.sebrae.com.br/qualidade-no-atendimento-ao-cliente-1-372000027109'},
  {title:'Noções Básicas de Atendimento ao Cidadão',provider:'Escola Virtual.Gov',audience:'Jovens e adultos',area:'Telemarketing e Atendimento',description:'Curso de 20 horas sobre comunicação, escuta e atendimento de qualidade.',url:'https://www.escolavirtual.gov.br/curso/1349'},
  {title:'Estratégia de Negócios',provider:'Fundação Bradesco',audience:'Adultos',area:'Administração e Negócios',description:'Análise, planejamento e decisões estratégicas para negócios e carreira.',url:'https://www.ev.org.br/cursos/estrategia-de-negocios'},
  {title:'Assistente Administrativo',provider:'Portal Cate',audience:'Jovens e adultos',area:'Administração e Negócios',description:'Rotinas administrativas, organização de documentos e apoio às atividades da empresa.',url:'https://cate.prefeitura.sp.gov.br/cursos/gestao-empreendedorismo-e-trabalho/assistente-administrativo/'},
  {title:'Gestão e Empreendedorismo',provider:'Portal Cate',audience:'Jovens e adultos',area:'Administração e Negócios',description:'Trilha para desenvolver organização, iniciativa e visão de negócio.',url:'https://cate.prefeitura.sp.gov.br/trilhas/trilha-de-gestao-e-empreendedorismo/'},
  {title:'Excel na Prática',provider:'Fundação Bradesco',audience:'Jovens e adultos',area:'Tecnologia e Informática',description:'Planilhas, cálculos e recursos do Excel aplicados a situações do trabalho.',url:'https://www.ev.org.br/cursos/excel-na-pratica'},
  {title:'Cultura Digital',provider:'Fundação Bradesco',audience:'Jovens e adultos',area:'Tecnologia e Informática',description:'Competências digitais essenciais para estudar, trabalhar e participar do mundo conectado.',url:'https://www.ev.org.br/cursos/cultura-digital'},
  {title:'AvançaTech',provider:'Portal Cate',audience:'Jovens e adultos',area:'Tecnologia e Informática',description:'Trilhas gratuitas para desenvolver competências e iniciar uma carreira em tecnologia.',url:'https://cate.prefeitura.sp.gov.br/avancatech/'},
  {title:'Comunicação Assertiva',provider:'Escola Virtual.Gov',audience:'Jovens e adultos',area:'Comunicação e RH',description:'Oratória, retórica e técnicas para comunicar ideias com respeito e segurança.',url:'https://www.escolavirtual.gov.br/curso/1347'},
  {title:'Assistente de Recursos Humanos',provider:'Portal Cate',audience:'Jovens e adultos',area:'Comunicação e RH',description:'Introdução às rotinas de RH, documentos, pessoas e ambiente de trabalho.',url:'https://cate.prefeitura.sp.gov.br/cursos/gestao-empreendedorismo-e-trabalho/assistente-de-recursos-humanos/'},
  {title:'Gestão de Pessoas',provider:'Escola Virtual.Gov',audience:'Adultos',area:'Comunicação e RH',description:'Conceitos e práticas para trabalhar com equipes, desenvolvimento e resultados.',url:'https://www.escolavirtual.gov.br/curso/1338'}
];
let activeCourseFilter='Todos';
function renderCourses(){const items=freeCourses.filter(course=>activeCourseFilter==='Todos'||course.area===activeCourseFilter);document.getElementById('courses-grid').innerHTML=items.map((course,index)=>`<article class="course-card"><small>CURSO ${String(index+1).padStart(2,'0')} • ${course.audience.toUpperCase()}</small><h3>${escapeHtml(course.title)}</h3><span class="provider">${escapeHtml(course.provider)}</span><p>${escapeHtml(course.description)}</p><div class="course-tags"><span>${course.area}</span><span>Online</span><span>Fonte oficial</span></div><a class="button navy" href="${course.url}" rel="noopener noreferrer">Ver curso gratuito →</a></article>`).join('')}
document.querySelectorAll('[data-course-filter]').forEach(button=>button.addEventListener('click',()=>{activeCourseFilter=button.dataset.courseFilter;document.querySelectorAll('[data-course-filter]').forEach(item=>item.classList.toggle('active',item===button));renderCourses()}));renderCourses();

const followPodcast=document.getElementById('follow-podcast');function refreshPodcast(){const followed=read(STORE.podcast,false);followPodcast.textContent=followed?'✓ Seguindo o ReinoCast':'＋ Seguir o ReinoCast';followPodcast.classList.toggle('soft',followed)}followPodcast.addEventListener('click',()=>{const followed=!read(STORE.podcast,false);write(STORE.podcast,followed);refreshPodcast();toast(followed?'ReinoCast adicionado aos seus interesses.':'Você deixou de seguir o ReinoCast.')});refreshPodcast();

let connectionRequests=[];
async function refreshConnections(){
  const client=window.REINO_SUPABASE;if(!client)return;
  const {data:{user}}=await client.auth.getUser();
  if(!user){connectionRequests=[];document.getElementById('connection-count').textContent='Entre na sua conta para acompanhar conexões';return}
  const {data,error}=await client.from('connection_requests').select('connection_type,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false});
  if(error){console.warn('Conexão Reino:',error);return}
  connectionRequests=data||[];
  document.getElementById('connection-count').textContent=connectionRequests.length?`${connectionRequests.length} ${connectionRequests.length===1?'conexão solicitada':'conexões solicitadas'}`:'Nenhuma conexão solicitada';
  document.querySelectorAll('[data-connection]').forEach(button=>{const active=connectionRequests.some(item=>item.connection_type===button.dataset.connection);button.textContent=active?'✓ Interesse registrado':button.dataset.connection==='oração'?'Entrar na sala':button.dataset.connection==='mentoria'?'Solicitar contato':'Tenho interesse';button.disabled=active});
}
document.querySelectorAll('[data-connection]').forEach(button=>button.addEventListener('click',async()=>{
  const client=window.REINO_SUPABASE;if(!client)return toast('Conexão indisponível.');
  try{const {data:{user},error:authError}=await client.auth.getUser();if(authError||!user)throw new Error('Entre na sua conta para continuar.');
    const type=button.dataset.connection;
    if(type==='oração'){showCommunityView('chat');activeChatRoom='biblia';await renderGroupChat();document.getElementById('comunidade').scrollIntoView({behavior:'smooth'});return}
    const {error}=await client.from('connection_requests').upsert({user_id:user.id,connection_type:type,status:'requested'},{onConflict:'user_id,connection_type'});if(error)throw error;
    await refreshConnections();toast('Interesse registrado na sua conta.');
  }catch(error){console.warn('Conexão Reino:',error);toast(error.message||'Não foi possível registrar o interesse.')}
}));
document.getElementById('clear-connections').addEventListener('click',async()=>{const client=window.REINO_SUPABASE;if(!client)return;try{const {data:{user}}=await client.auth.getUser();if(!user)throw new Error('Entre na sua conta.');const {error}=await client.from('connection_requests').delete().eq('user_id',user.id);if(error)throw error;await refreshConnections();toast('Interesses removidos da sua conta.')}catch(error){toast(error.message||'Não foi possível limpar.')}});
refreshConnections();

document.getElementById('focus-support-request')?.addEventListener('click',()=>{document.querySelector('#support-request-form textarea[name="message"]')?.focus();document.getElementById('support-request-form')?.scrollIntoView({behavior:'smooth',block:'center'})});
document.getElementById('support-request-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=form.querySelector('[type="submit"]'),status=document.getElementById('support-request-status');
  const subject=form.elements.subject.value.trim(),message=form.elements.message.value.trim(),wantsContact=form.elements.wants_contact.checked;
  if(!subject||!message){status.textContent='Escolha uma opção e escreva sua mensagem.';return}
  const client=window.REINO_SUPABASE;
  if(!client){status.textContent='Conexão indisponível. Tente novamente mais tarde.';return}
  button.disabled=true;status.textContent='Enviando sua mensagem...';
  try{
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user)throw new Error('Entre na sua conta para enviar a mensagem.');
    const {error}=await client.from('support_requests').insert({user_id:user.id,subject,message,wants_contact:wantsContact});
    if(error)throw error;
    form.reset();status.textContent=wantsContact?'Mensagem enviada. A equipe poderá entrar em contato usando os dados da sua conta.':'Mensagem enviada para a equipe da Plataforma Reino.';
  }catch(error){console.warn('Oração e Conversa:',error);status.textContent=error.message||'Não foi possível enviar. Tente novamente.'}
  finally{button.disabled=false}
});
async function submitReinoForm(event,table,fields,honeypot){
  event.preventDefault();
  const form=event.currentTarget;
  if(form.elements[honeypot]?.value)return;
  const button=form.querySelector('[type="submit"]');
  const status=form.querySelector('.form-status');
  const client=window.REINO_SUPABASE;
  if(!client){status.textContent='Conexão indisponível. Tente novamente.';return}
  button.disabled=true;
  status.textContent='Enviando...';
  try{
    const {data:{user},error:authError}=await client.auth.getUser();
    if(authError||!user)throw new Error('Entre na sua conta para enviar.');
    const values=Object.fromEntries(fields.map(field=>[field,form.elements[field].value.trim()]));
    const row=table==='contact_submissions'
      ?{user_id:user.id,name:values.nome,email:values.email,subject:values.assunto,message:values.mensagem,consent:form.elements.consentimento.checked}
      :{user_id:user.id,display_name:values.nome,city:values.cidade,title:values.titulo,testimony:values.testemunho,consent:form.elements.autorizacao.checked};
    const {error}=await client.from(table).insert(row);
    if(error)throw error;
    form.reset();
    status.textContent=table==='contact_submissions'?'Mensagem registrada. A equipe poderá analisá-la.':'Testemunho recebido para análise. Ele não será publicado automaticamente.';
  }catch(error){console.warn('Envio do formulário:',error);status.textContent=error.message||'Não foi possível enviar. Tente novamente.'}
  finally{button.disabled=false}
}
document.querySelector('.contact-form').addEventListener('submit',event=>submitReinoForm(event,'contact_submissions',['nome','email','assunto','mensagem'],'site-confirmacao'));
document.querySelector('.public-testimony-form').addEventListener('submit',event=>submitReinoForm(event,'testimony_submissions',['nome','cidade','titulo','testemunho'],'empresa-site'));
document.getElementById('clear-care-chat').addEventListener('click',()=>{document.getElementById('care-chat-messages').innerHTML='<div class="chat-message bot">Olá. Eu estou aqui para ajudar você a organizar este momento. O que está pesando mais hoje?</div>';toast('Conversa local apagada.')});

const testimonyText=document.getElementById('testimony-text');testimonyText.addEventListener('input',()=>document.getElementById('testimony-count').textContent=testimonyText.value.length);
function renderTestimony(){const value=read(STORE.testimony,'');document.getElementById('saved-testimony').innerHTML=value?`<blockquote>“${escapeHtml(value)}”</blockquote><small>Salvo somente neste aparelho • não publicado</small><br><button class="button soft" type="button" id="delete-testimony">Excluir relato</button>`:'<p>Nenhum depoimento salvo neste aparelho.</p>';const remove=document.getElementById('delete-testimony');if(remove)remove.addEventListener('click',()=>{write(STORE.testimony,'');renderTestimony();toast('Depoimento local excluído.')})}
document.getElementById('save-testimony').addEventListener('click',()=>{const value=testimonyText.value.trim();if(!value)return toast('Escreva seu depoimento antes de salvar.');write(STORE.testimony,value);testimonyText.value='';document.getElementById('testimony-count').textContent='0';renderTestimony();toast('Depoimento salvo somente neste aparelho.')});renderTestimony();

const radio=document.getElementById('radio-stream');const radioToggle=document.getElementById('radio-toggle');const radioStatus=document.getElementById('radio-status');radio.volume=.8;
radioToggle.addEventListener('click',async()=>{if(radio.paused){radioStatus.textContent='Conectando à transmissão...';try{await radio.play()}catch{radioStatus.textContent='Não foi possível iniciar. Tente novamente.'}}else radio.pause()});
radio.addEventListener('playing',()=>{radioToggle.textContent='❚❚';radioStatus.textContent='Rádio Gospel • ao vivo'});radio.addEventListener('pause',()=>{radioToggle.textContent='▶';radioStatus.textContent='Transmissão pausada'});radio.addEventListener('error',()=>{radioToggle.textContent='▶';radioStatus.textContent='Rádio temporariamente indisponível'});document.getElementById('radio-volume').addEventListener('input',event=>radio.volume=Number(event.target.value));

const communityGroups=[
  {id:'musicos',icon:'♫',name:'Músicos do Reino',topic:'Música',members:346,description:'Louvor, técnica, repertório, composição e experiências de ministério.'},
  {id:'teatro',icon:'🎭',name:'Teatro Cristão',topic:'Teatro',members:128,description:'Roteiros, atuação, figurino, direção e evangelismo por meio das artes.'},
  {id:'danca',icon:'◒',name:'Ministério de Dança',topic:'Dança',members:194,description:'Coreografia, expressão corporal, ensaios e serviço na igreja.'},
  {id:'pregacoes',icon:'✦',name:'Pregações e Mensagens',topic:'Pregações',members:417,description:'Preparação, interpretação bíblica, comunicação e troca de esboços.'},
  {id:'guitarristas',icon:'♬',name:'Guitarristas Cristãos',topic:'Guitarristas',members:263,description:'Timbres, acordes, equipamentos, escalas e repertórios de louvor.'},
  {id:'biblia',icon:'▤',name:'Jovens da Bíblia',topic:'Jovens da Bíblia',members:583,description:'Leitura bíblica, dúvidas, planos de estudo e aplicação prática.'},
  {id:'batistas',icon:'◎',name:'Comunidade Batista',topic:'Batistas',members:372,description:'Comunhão, juventude, música, estudos e projetos entre batistas.'},
  {id:'ccb',icon:'◇',name:'Jovens da CCB',topic:'Jovens da CCB',members:309,description:'Espaço respeitoso para amizade, música e troca de experiências.'},
  {id:'piaui',icon:'●',name:'Jovens Cristãos do Piauí',topic:'Piauí',members:492,description:'Eventos, igrejas, amizades e ações cristãs em todo o Piauí.'},
  {id:'maranhao',icon:'●',name:'Jovens Cristãos do Maranhão',topic:'Maranhão',members:318,description:'Conexões, encontros e projetos cristãos no Maranhão.'},
  {id:'ceara',icon:'●',name:'Jovens Cristãos do Ceará',topic:'Ceará',members:405,description:'Conversas, eventos e iniciativas cristãs no Ceará.'},
  {id:'bahia',icon:'●',name:'Jovens Cristãos da Bahia',topic:'Bahia',members:451,description:'Comunhão e compartilhamento entre jovens cristãos da Bahia.'}
];
const postBox=document.getElementById('new-post');
const postPhoto=document.getElementById('post-photo');
const postVideo=document.getElementById('post-video');
const mediaPreview=document.getElementById('community-media-preview');
let selectedCommunityMedia=null,selectedPostKind='Novo post',activeChatRoom='musicos',communityPostsCache=[];
postBox.addEventListener('input',()=>document.getElementById('char-count').textContent=postBox.value.length);
function communityTime(value){const date=new Date(value);return Number.isNaN(date.getTime())?'Agora':date.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function mediaMarkup(post){if(!post.media_url)return'';return `<img class="post-media" src="${escapeHtml(post.media_url)}" alt="Imagem compartilhada por ${escapeHtml(post.display_name)}">`}
async function loadCommunityPosts(){
  const client=window.REINO_SUPABASE;if(!client)return;
  const {data:posts,error}=await client.from('community_posts').select('id,user_id,display_name,body,media_url,created_at').order('created_at',{ascending:false}).limit(80);
  if(error){console.warn('Comunidade:',error);document.getElementById('community-feed').innerHTML='<article class="panel"><p>Não foi possível carregar a comunidade agora.</p></article>';return}
  const ids=(posts||[]).map(post=>post.id);let comments=[],reactions=[];
  if(ids.length){
    const [commentResult,reactionResult]=await Promise.all([
      client.from('community_comments').select('id,post_id,user_id,display_name,body,created_at').in('post_id',ids).order('created_at',{ascending:true}),
      client.from('community_reactions').select('post_id,user_id,reaction').in('post_id',ids)
    ]);
    if(!commentResult.error)comments=commentResult.data||[];if(!reactionResult.error)reactions=reactionResult.data||[];
  }
  communityPostsCache=(posts||[]).map(post=>({...post,comments:comments.filter(item=>item.post_id===post.id),reactions:reactions.filter(item=>item.post_id===post.id)}));
  renderPosts();refreshStats();
}
function renderPosts(){
  const feed=document.getElementById('community-feed');
  feed.innerHTML=communityPostsCache.map(post=>{const likes=post.reactions.filter(item=>item.reaction==='like').length,praises=post.reactions.filter(item=>item.reaction==='praise').length;return `<article class="panel post-card social-post"><div class="post-head"><span class="avatar">${initials(post.display_name)}</span><span><strong>${escapeHtml(post.display_name)}</strong><small>Comunidade Reino • ${communityTime(post.created_at)}</small></span></div><p>${escapeHtml(post.body)}</p>${mediaMarkup(post)}<div class="post-reactions"><span>♡ ${likes} curtidas</span><span>★ ${praises} elogios especiais</span><span>◯ ${post.comments.length} comentários</span></div><div class="post-actions"><button type="button" data-reaction="like" data-post-id="${post.id}">♡ Curtir</button><button class="special-praise" type="button" data-reaction="praise" data-post-id="${post.id}">★ Elogio especial</button><button type="button" data-comment="${post.id}">◯ Comentar</button><button type="button" data-share-post="${post.id}">↗ Compartilhar</button></div><div class="post-comments">${post.comments.map(comment=>`<p><b>${escapeHtml(comment.display_name)}</b> ${escapeHtml(comment.body)}</p>`).join('')}</div><form class="post-comment-form hidden" data-comment-form="${post.id}"><input maxlength="500" required placeholder="Escreva um comentário respeitoso..."><button type="submit">Enviar</button></form></article>`}).join('')||'<article class="panel"><p>A comunidade ainda não tem publicações. Seja o primeiro a compartilhar.</p></article>';
  document.querySelectorAll('[data-reaction]').forEach(button=>button.addEventListener('click',()=>toggleCommunityReaction(button.dataset.postId,button.dataset.reaction)));
  document.querySelectorAll('[data-comment]').forEach(button=>button.addEventListener('click',()=>document.querySelector(`[data-comment-form="${button.dataset.comment}"]`)?.classList.toggle('hidden')));
  document.querySelectorAll('[data-comment-form]').forEach(form=>form.addEventListener('submit',submitCommunityComment));
  document.querySelectorAll('[data-share-post]').forEach(button=>button.addEventListener('click',async()=>{const post=communityPostsCache.find(item=>item.id===button.dataset.sharePost);if(!post)return;const text=`${post.display_name} na Comunidade Reino: ${post.body}`;if(navigator.share){try{await navigator.share({title:'Comunidade Reino',text});return}catch{}}if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Publicação copiada para compartilhar.')}}));
}
async function currentCommunityUser(){const client=window.REINO_SUPABASE;if(!client)throw new Error('Conexão indisponível.');const {data:{user},error}=await client.auth.getUser();if(error||!user)throw new Error('Entre na sua conta para participar da comunidade.');return user}
async function toggleCommunityReaction(postId,reaction){
  try{const client=window.REINO_SUPABASE,user=await currentCommunityUser();const {data}=await client.from('community_reactions').select('post_id').eq('post_id',postId).eq('user_id',user.id).eq('reaction',reaction).maybeSingle();const result=data?await client.from('community_reactions').delete().eq('post_id',postId).eq('user_id',user.id).eq('reaction',reaction):await client.from('community_reactions').insert({post_id:postId,user_id:user.id,reaction});if(result.error)throw result.error;await loadCommunityPosts()}catch(error){console.warn('Reação:',error);toast(error.message||'Não foi possível registrar a reação.')}}
async function submitCommunityComment(event){
  event.preventDefault();const form=event.currentTarget,input=form.querySelector('input'),body=input.value.trim();if(!body)return;
  try{const client=window.REINO_SUPABASE,user=await currentCommunityUser();const name=(read(STORE.user,{}).name||user.email?.split('@')[0]||'Usuário').slice(0,80);const {error}=await client.from('community_comments').insert({post_id:form.dataset.commentForm,user_id:user.id,display_name:name,body});if(error)throw error;input.value='';await loadCommunityPosts();toast('Comentário publicado.')}catch(error){console.warn('Comentário:',error);toast(error.message||'Comentário não enviado.')}}
function clearSelectedMedia(){selectedCommunityMedia=null;postPhoto.value='';postVideo.value='';mediaPreview.classList.add('hidden');mediaPreview.innerHTML=''}
function showMediaPreview(file,type){if(!file)return;if(type==='video')return toast('Vídeo será ativado em uma próxima etapa. Use uma foto nesta publicação.');if(file.size>1500000)return toast('Escolha uma foto de até 1,5 MB.');const reader=new FileReader();reader.onload=()=>{selectedCommunityMedia={file,url:reader.result};mediaPreview.innerHTML=`<img src="${reader.result}" alt="Prévia da foto"><button type="button" id="remove-post-media">× Remover</button>`;mediaPreview.classList.remove('hidden');document.getElementById('remove-post-media').addEventListener('click',clearSelectedMedia)};reader.readAsDataURL(file)}
postPhoto.addEventListener('change',event=>showMediaPreview(event.target.files[0],'image'));postVideo.addEventListener('change',event=>showMediaPreview(event.target.files[0],'video'));
document.querySelectorAll('[data-post-kind]').forEach(button=>button.addEventListener('click',()=>{selectedPostKind=button.dataset.postKind;postBox.placeholder=`Compartilhe seu ${selectedPostKind.toLowerCase()}...`;postBox.focus();toast(`${selectedPostKind} selecionado.`)}));
document.getElementById('publish-post').addEventListener('click',async()=>{
  const text=postBox.value.trim();if(!text)return toast('Escreva uma mensagem para publicar.');
  const button=document.getElementById('publish-post');button.disabled=true;
  try{const client=window.REINO_SUPABASE,user=await currentCommunityUser();const local=read(STORE.user,{}),name=(local.name||user.email?.split('@')[0]||'Usuário').slice(0,80);let mediaUrl=null;
    if(selectedCommunityMedia){toast('A publicação será enviada sem a foto até ativarmos o armazenamento de mídia da comunidade.')}
    const body=selectedPostKind==='Novo post'?text:`[${selectedPostKind}] ${text}`;
    const {error}=await client.from('community_posts').insert({user_id:user.id,display_name:name,body,media_url:mediaUrl});if(error)throw error;
    postBox.value='';selectedPostKind='Novo post';document.getElementById('char-count').textContent='0';clearSelectedMedia();await loadCommunityPosts();toast('Publicação salva na Comunidade Reino.');
  }catch(error){console.warn('Publicação:',error);toast(error.message||'Não foi possível publicar.')}finally{button.disabled=false}
});
function showCommunityView(view){document.querySelectorAll('[data-community-view]').forEach(button=>button.classList.toggle('active',button.dataset.communityView===view));document.querySelectorAll('[data-community-container]').forEach(panel=>panel.classList.toggle('hidden',panel.dataset.communityContainer!==view));if(view==='chat')renderGroupChat()}
document.querySelectorAll('[data-community-view]').forEach(button=>button.addEventListener('click',()=>showCommunityView(button.dataset.communityView)));
document.querySelectorAll('[data-community-topic]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-community-topic]').forEach(item=>item.classList.toggle('active',item.dataset.communityTopic===button.dataset.communityTopic));selectedPostKind=button.dataset.communityTopic;postBox.placeholder=`Compartilhe uma ideia sobre ${button.dataset.communityTopic}...`;showCommunityView('feed');postBox.focus();toast(`Tema ${button.dataset.communityTopic} selecionado.`)}));
function openGroup(id){activeChatRoom=id;showCommunityView('chat');renderGroupChat();document.getElementById('comunidade').scrollIntoView({behavior:'smooth',block:'start'})}
function renderGroups(){document.getElementById('community-groups-grid').innerHTML=communityGroups.map(group=>`<article class="community-group-card"><span>${group.icon}</span><div><small>${group.topic.toUpperCase()}</small><h3>${group.name}</h3><p>${group.description}</p><b>${group.members} participantes</b></div><button type="button" data-enter-group="${group.id}">Entrar no grupo →</button></article>`).join('');document.querySelectorAll('[data-enter-group]').forEach(button=>button.addEventListener('click',()=>openGroup(button.dataset.enterGroup)))}
async function renderGroupChat(){
  const group=communityGroups.find(item=>item.id===activeChatRoom)||communityGroups[0];activeChatRoom=group.id;
  document.getElementById('chat-room-title').textContent=group.name;
  document.getElementById('chat-room-list').innerHTML=communityGroups.map(item=>`<button class="${item.id===activeChatRoom?'active':''}" type="button" data-chat-room="${item.id}"><span>${item.icon}</span><b>${item.name}</b></button>`).join('');
  document.querySelectorAll('[data-chat-room]').forEach(button=>button.addEventListener('click',()=>{activeChatRoom=button.dataset.chatRoom;renderGroupChat()}));
  const box=document.getElementById('group-chat-messages');box.textContent='Carregando mensagens...';
  const client=window.REINO_SUPABASE;
  if(!client){box.textContent='Conexão indisponível.';return}
  const room=activeChatRoom;
  const {data,error}=await client.from('group_messages').select('display_name,body,created_at').eq('room_id',room).order('created_at',{ascending:false}).limit(80);
  if(room!==activeChatRoom)return;
  if(error){box.textContent='Não foi possível carregar as mensagens. Entre na sua conta e tente novamente.';return}
  box.innerHTML=(data||[]).reverse().map(message=>`<div class="group-chat-message"><span>${initials(message.display_name)}</span><div><b>${escapeHtml(message.display_name)} <small>${new Date(message.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small></b><p>${escapeHtml(message.body)}</p></div></div>`).join('')||'<p>Ainda não há mensagens nesta sala.</p>';
  box.scrollTop=box.scrollHeight;
}
document.getElementById('group-chat-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,input=document.getElementById('group-chat-input'),text=input.value.trim();if(!text)return;
  const button=form.querySelector('[type="submit"]'),client=window.REINO_SUPABASE;if(!client)return toast('Conexão indisponível.');button.disabled=true;
  try{
    const {data:{user},error:authError}=await client.auth.getUser();if(authError||!user)throw new Error('Entre na sua conta para conversar.');
    const name=(read(STORE.user,{}).name||user.email?.split('@')[0]||'Jogador').slice(0,80);
    const {error}=await client.from('group_messages').insert({room_id:activeChatRoom,user_id:user.id,display_name:name,body:text});if(error)throw error;
    input.value='';await renderGroupChat();
  }catch(error){console.warn('Chat:',error);toast('Mensagem não enviada. Tente novamente.')}finally{button.disabled=false}
});
document.querySelectorAll('[data-open-group]').forEach(button=>button.addEventListener('click',()=>openGroup(button.dataset.openGroup)));
const communityUser=read(STORE.user,{name:'Visitante'});['community-avatar','composer-avatar'].forEach(id=>{const element=document.getElementById(id);if(element)element.textContent=initials(communityUser.name)});renderGroups();renderGroupChat();loadCommunityPosts();

function renderUsers(query=''){const normalized=query.toLocaleLowerCase('pt-BR');document.getElementById('user-table').innerHTML=users.filter(user=>(user.name+user.role).toLocaleLowerCase('pt-BR').includes(normalized)).map(user=>`<tr><td>${user.name}</td><td>${user.role}</td><td><span class="badge ${user.active?'':'paused'}">${user.active?'Ativo':'Pausado'}</span></td><td><button class="table-action" type="button" data-user="${users.indexOf(user)}">${user.active?'Pausar':'Ativar'}</button></td></tr>`).join('');document.querySelectorAll('[data-user]').forEach(button=>button.addEventListener('click',()=>{const user=users[Number(button.dataset.user)];user.active=!user.active;renderUsers(document.getElementById('user-search').value);toast(`Usuário ${user.active?'ativado':'pausado'}.`)}))}
document.getElementById('user-search').addEventListener('input',event=>renderUsers(event.target.value));renderUsers();
function renderContents(){const extra=read(STORE.contents,[]);const list=[...extra,{title:'Devocional da manhã',category:'Devocional'},{title:'Estudo: o caminho da fé',category:'Estudo'}];document.getElementById('admin-content-list').innerHTML=list.map(content=>`<div class="admin-content"><span><strong>${escapeHtml(content.title)}</strong><br><small>${escapeHtml(content.category)}</small></span><span class="badge">Publicado</span></div>`).join('');document.getElementById('content-count').textContent=184+extra.length}
document.getElementById('save-content').addEventListener('click',event=>{const title=document.getElementById('content-title').value.trim();if(!title){event.preventDefault();return toast('Informe o título do conteúdo.')}const list=read(STORE.contents,[]);list.unshift({title,category:document.getElementById('content-category').value});write(STORE.contents,list);renderContents();document.getElementById('content-title').value='';toast('Conteúdo publicado na demonstração.')});renderContents();
document.getElementById('review-reports').addEventListener('click',event=>{event.currentTarget.textContent='Análises abertas';event.currentTarget.disabled=true;toast('As 3 denúncias foram marcadas para análise.')});refreshStats();
