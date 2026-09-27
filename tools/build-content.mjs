import fs from 'node:fs';
import path from 'node:path';

const projectRoot=path.resolve(import.meta.dirname,'..');
const corpusRoot=path.resolve(projectRoot,'../tmp/pd-text-corpus/bibles/pt');
const index=JSON.parse(fs.readFileSync(path.join(corpusRoot,'index.json'),'utf8'));
const names={
  genesis:'Gênesis',exodus:'Êxodo',leviticus:'Levítico',numbers:'Números',deuteronomy:'Deuteronômio',joshua:'Josué',judges:'Juízes',ruth:'Rute','i-samuel':'1 Samuel','ii-samuel':'2 Samuel','i-kings':'1 Reis','ii-kings':'2 Reis','i-chronicles':'1 Crônicas','ii-chronicles':'2 Crônicas',ezra:'Esdras',nehemiah:'Neemias',esther:'Ester',job:'Jó',psalms:'Salmos',proverbs:'Provérbios',ecclesiastes:'Eclesiastes','song-of-solomon':'Cânticos',isaiah:'Isaías',jeremiah:'Jeremias',lamentations:'Lamentações',ezekiel:'Ezequiel',daniel:'Daniel',hosea:'Oséias',joel:'Joel',amos:'Amós',obadiah:'Obadias',jonah:'Jonas',micah:'Miquéias',nahum:'Naum',habakkuk:'Habacuque',zephaniah:'Sofonias',haggai:'Ageu',zechariah:'Zacarias',malachi:'Malaquias',matthew:'Mateus',mark:'Marcos',luke:'Lucas',john:'João',acts:'Atos',romans:'Romanos','i-corinthians':'1 Coríntios','ii-corinthians':'2 Coríntios',galatians:'Gálatas',ephesians:'Efésios',philippians:'Filipenses',colossians:'Colossenses','i-thessalonians':'1 Tessalonicenses','ii-thessalonians':'2 Tessalonicenses','i-timothy':'1 Timóteo','ii-timothy':'2 Timóteo',titus:'Tito',philemon:'Filemom',hebrews:'Hebreus',james:'Tiago','i-peter':'1 Pedro','ii-peter':'2 Pedro','i-john':'1 João','ii-john':'2 João','iii-john':'3 João',jude:'Judas','revelation-of-john':'Apocalipse'
};

const books=index.books.map((book,order)=>{
  const chapters=[];
  for(let chapter=1;chapter<=book.chapters;chapter++){
    const file=path.join(corpusRoot,'books',book.slug,'chapters',`${chapter}.json`);
    chapters.push(JSON.parse(fs.readFileSync(file,'utf8')).verses);
  }
  return {name:names[book.slug]||book.name,slug:book.slug,chapters,testament:order<39?'Antigo Testamento':'Novo Testamento'};
});

const biblePayload={translation:'João Ferreira de Almeida',license:'Domínio público',source:'seven1m/open-bibles via pd-text-corpus',books};
fs.writeFileSync(path.join(projectRoot,'assets','bible-data.js'),`window.REINO_BIBLE=${JSON.stringify(biblePayload)};\n`);

const core=[
  {id:'core-noe',category:'ANTIGO TESTAMENTO',q:'Quem construiu a arca?',options:['Abraão','Moisés','Noé','Davi'],answer:2,explanation:'Deus orientou Noé a construir a arca antes do dilúvio, preservando sua família e os animais.',reference:'Gênesis 6:13-22',learn:'Noé fez conforme tudo o que Deus lhe ordenou.',bookSlug:'genesis',chapter:6},
  {id:'core-belem',category:'EVANGELHOS',q:'Em qual cidade Jesus nasceu?',options:['Nazaré','Belém','Jerusalém','Cafarnaum'],answer:1,explanation:'Jesus nasceu em Belém da Judeia, cumprindo o que havia sido anunciado nas Escrituras.',reference:'Lucas 2:1-7',learn:'Deus conduz a história e cumpre suas promessas.',bookSlug:'luke',chapter:2},
  {id:'core-davi',category:'ANTIGO TESTAMENTO',q:'Quem derrotou o gigante Golias?',options:['Davi','Samuel','Saul','Salomão'],answer:0,explanation:'Davi enfrentou Golias confiando no Senhor e venceu o gigante com uma funda e uma pedra.',reference:'1 Samuel 17:45-50',learn:'A fé em Deus é maior do que os desafios que parecem impossíveis.',bookSlug:'i-samuel',chapter:17},
  {id:'core-discipulos',category:'NOVO TESTAMENTO',q:'Quantos discípulos Jesus escolheu?',options:['7','10','12','14'],answer:2,explanation:'Jesus escolheu doze discípulos, chamou-os de apóstolos e os preparou para anunciar sua mensagem.',reference:'Lucas 6:12-16',learn:'Jesus chama pessoas comuns para uma missão extraordinária.',bookSlug:'luke',chapter:6},
  {id:'core-daniel',category:'ANTIGO TESTAMENTO',q:'Quem foi lançado na cova dos leões?',options:['José','Daniel','Elias','Josué'],answer:1,explanation:'Daniel foi lançado na cova dos leões porque permaneceu fiel em oração, e Deus o protegeu.',reference:'Daniel 6:16-23',learn:'A fidelidade permanece firme mesmo diante da pressão.',bookSlug:'daniel',chapter:6},
  {id:'core-cana',category:'EVANGELHOS',q:'Qual foi o primeiro milagre de Jesus registrado no Evangelho de João?',options:['Multiplicar pães','Curar um cego','Acalmar a tempestade','Transformar água em vinho'],answer:3,explanation:'Em Caná da Galileia, Jesus transformou água em vinho e manifestou sua glória.',reference:'João 2:1-11',learn:'Jesus se importa com as necessidades humanas e revela sua glória.',bookSlug:'john',chapter:2},
  {id:'core-mandamentos',category:'ANTIGO TESTAMENTO',q:'Quem recebeu os Dez Mandamentos?',options:['Moisés','Abraão','Isaque','Arão'],answer:0,explanation:'Moisés recebeu de Deus os mandamentos que orientariam a vida do povo de Israel.',reference:'Êxodo 20:1-17',learn:'A Palavra de Deus orienta escolhas, relacionamentos e adoração.',bookSlug:'exodus',chapter:20},
  {id:'core-pedro',category:'NOVO TESTAMENTO',q:'Qual discípulo andou sobre as águas em direção a Jesus?',options:['João','Tiago','Pedro','André'],answer:2,explanation:'Pedro saiu do barco e caminhou sobre as águas enquanto manteve os olhos em Jesus.',reference:'Mateus 14:28-31',learn:'A fé cresce quando mantemos o foco em Cristo.',bookSlug:'matthew',chapter:14},
  {id:'core-apocalipse',category:'BÍBLIA',q:'Qual é o último livro da Bíblia?',options:['Judas','Atos','Hebreus','Apocalipse'],answer:3,explanation:'Apocalipse encerra o Novo Testamento com uma mensagem de esperança, perseverança e vitória de Cristo.',reference:'Apocalipse 1:1-3',learn:'A história termina com a vitória de Deus e a esperança renovada.',bookSlug:'revelation-of-john',chapter:1},
  {id:'core-batismo',category:'EVANGELHOS',q:'Quem batizou Jesus no rio Jordão?',options:['João Batista','Pedro','Zacarias','Nicodemos'],answer:0,explanation:'João Batista batizou Jesus no Jordão; naquele momento, o Espírito de Deus desceu sobre ele.',reference:'Mateus 3:13-17',learn:'Jesus confirmou publicamente o início de sua missão.',bookSlug:'matthew',chapter:3}
];

function shorten(text,max=155){const clean=text.replace(/\s+/g,' ').trim();return clean.length<=max?clean:`${clean.slice(0,max).replace(/\s+\S*$/,'')}...`}
function rotate(list,seed){const offset=seed%list.length;return [...list.slice(offset),...list.slice(0,offset)]}
function optionsWithAnswer(correct,distractors,seed){const values=[correct,...distractors.filter(v=>v!==correct).slice(0,3)];const options=rotate(values,seed);return {options,answer:options.indexOf(correct)}}

const chapterSamples=[];
for(let chapter=1;chapter<=150&&chapterSamples.length<390;chapter++){
  books.forEach((book,bookIndex)=>{
    if(chapterSamples.length>=390||chapter>book.chapters.length)return;
    const verse=book.chapters[chapter-1][0];
    chapterSamples.push({book,bookIndex,chapter,verse});
  });
}

const generated=chapterSamples.map((sample,index)=>{
  const {book,bookIndex,chapter,verse}=sample;
  const excerpt=shorten(verse.text);
  const reference=`${book.name} ${chapter}:${verse.verse}`;
  const peers=books.filter((_,i)=>i!==bookIndex&&((i<39)===(bookIndex<39)));
  const type=index%4;
  let q,pack;
  if(type===0||type===2||(type===3&&book.chapters.length<4)){
    q=type===0?`Em qual livro está escrito: “${excerpt}”`:`Qual livro inicia um de seus capítulos com este trecho: “${excerpt}”`;
    pack=optionsWithAnswer(book.name,rotate(peers.map(peer=>peer.name),index*3).slice(0,3),index);
  }else if(type===1){
    q=`Qual referência corresponde ao trecho: “${excerpt}”`;
    const candidates=rotate(peers.map(peer=>`${peer.name} ${chapter}:${verse.verse}`),index*5).slice(0,3);
    pack=optionsWithAnswer(reference,candidates,index);
  }else{
    q=`O trecho “${excerpt}” aparece em qual capítulo de ${book.name}?`;
    const nums=Array.from({length:book.chapters.length},(_,i)=>i+1).filter(n=>n!==chapter).sort((a,b)=>Math.abs(a-chapter)-Math.abs(b-chapter)).slice(0,3);
    pack=optionsWithAnswer(String(chapter),nums.map(String),index);
  }
  return {id:`verse-${book.slug}-${chapter}-${verse.verse}-${type}`,category:book.testament.toUpperCase(),q,...pack,explanation:`Este trecho está registrado em ${reference}: “${excerpt}”`,reference,learn:`Leia ${book.name} ${chapter} para compreender o versículo dentro de seu contexto.`,bookSlug:book.slug,chapter};
});

const questions=[...core,...generated];
if(questions.length!==400)throw new Error(`Esperadas 400 perguntas; geradas ${questions.length}`);
if(new Set(questions.map(q=>q.id)).size!==400)throw new Error('IDs de perguntas repetidos');
fs.writeFileSync(path.join(projectRoot,'assets','quiz-bank.js'),`window.REINO_QUIZ_BANK=${JSON.stringify(questions)};\n`);
console.log(JSON.stringify({books:books.length,chapters:books.reduce((sum,b)=>sum+b.chapters.length,0),verses:books.reduce((sum,b)=>sum+b.chapters.reduce((n,c)=>n+c.length,0),0),questions:questions.length}));
