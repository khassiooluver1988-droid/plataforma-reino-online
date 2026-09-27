(function(){
  const bank=window.REINO_QUIZ_BANK=Array.isArray(window.REINO_QUIZ_BANK)?window.REINO_QUIZ_BANK:[];
  const books=[
    ['Gênesis','genesis','Antigo Testamento','Pentateuco',50],['Êxodo','exodus','Antigo Testamento','Pentateuco',40],['Levítico','leviticus','Antigo Testamento','Pentateuco',27],['Números','numbers','Antigo Testamento','Pentateuco',36],['Deuteronômio','deuteronomy','Antigo Testamento','Pentateuco',34],
    ['Josué','joshua','Antigo Testamento','Histórico',24],['Juízes','judges','Antigo Testamento','Histórico',21],['Rute','ruth','Antigo Testamento','Histórico',4],['1 Samuel','i-samuel','Antigo Testamento','Histórico',31],['2 Samuel','ii-samuel','Antigo Testamento','Histórico',24],['1 Reis','i-kings','Antigo Testamento','Histórico',22],['2 Reis','ii-kings','Antigo Testamento','Histórico',25],['1 Crônicas','i-chronicles','Antigo Testamento','Histórico',29],['2 Crônicas','ii-chronicles','Antigo Testamento','Histórico',36],['Esdras','ezra','Antigo Testamento','Histórico',10],['Neemias','nehemiah','Antigo Testamento','Histórico',13],['Ester','esther','Antigo Testamento','Histórico',10],
    ['Jó','job','Antigo Testamento','Poético e de sabedoria',42],['Salmos','psalms','Antigo Testamento','Poético e de sabedoria',150],['Provérbios','proverbs','Antigo Testamento','Poético e de sabedoria',31],['Eclesiastes','ecclesiastes','Antigo Testamento','Poético e de sabedoria',12],['Cânticos','song-of-solomon','Antigo Testamento','Poético e de sabedoria',8],
    ['Isaías','isaiah','Antigo Testamento','Profeta maior',66],['Jeremias','jeremiah','Antigo Testamento','Profeta maior',52],['Lamentações','lamentations','Antigo Testamento','Profeta maior',5],['Ezequiel','ezekiel','Antigo Testamento','Profeta maior',48],['Daniel','daniel','Antigo Testamento','Profeta maior',12],
    ['Oséias','hosea','Antigo Testamento','Profeta menor',14],['Joel','joel','Antigo Testamento','Profeta menor',3],['Amós','amos','Antigo Testamento','Profeta menor',9],['Obadias','obadiah','Antigo Testamento','Profeta menor',1],['Jonas','jonah','Antigo Testamento','Profeta menor',4],['Miquéias','micah','Antigo Testamento','Profeta menor',7],['Naum','nahum','Antigo Testamento','Profeta menor',3],['Habacuque','habakkuk','Antigo Testamento','Profeta menor',3],['Sofonias','zephaniah','Antigo Testamento','Profeta menor',3],['Ageu','haggai','Antigo Testamento','Profeta menor',2],['Zacarias','zechariah','Antigo Testamento','Profeta menor',14],['Malaquias','malachi','Antigo Testamento','Profeta menor',4],
    ['Mateus','matthew','Novo Testamento','Evangelho',28],['Marcos','mark','Novo Testamento','Evangelho',16],['Lucas','luke','Novo Testamento','Evangelho',24],['João','john','Novo Testamento','Evangelho',21],['Atos','acts','Novo Testamento','Histórico',28],
    ['Romanos','romans','Novo Testamento','Carta de Paulo',16],['1 Coríntios','i-corinthians','Novo Testamento','Carta de Paulo',16],['2 Coríntios','ii-corinthians','Novo Testamento','Carta de Paulo',13],['Gálatas','galatians','Novo Testamento','Carta de Paulo',6],['Efésios','ephesians','Novo Testamento','Carta de Paulo',6],['Filipenses','philippians','Novo Testamento','Carta de Paulo',4],['Colossenses','colossians','Novo Testamento','Carta de Paulo',4],['1 Tessalonicenses','i-thessalonians','Novo Testamento','Carta de Paulo',5],['2 Tessalonicenses','ii-thessalonians','Novo Testamento','Carta de Paulo',3],['1 Timóteo','i-timothy','Novo Testamento','Carta de Paulo',6],['2 Timóteo','ii-timothy','Novo Testamento','Carta de Paulo',4],['Tito','titus','Novo Testamento','Carta de Paulo',3],['Filemom','philemon','Novo Testamento','Carta de Paulo',1],
    ['Hebreus','hebrews','Novo Testamento','Carta geral',13],['Tiago','james','Novo Testamento','Carta geral',5],['1 Pedro','i-peter','Novo Testamento','Carta geral',5],['2 Pedro','ii-peter','Novo Testamento','Carta geral',3],['1 João','i-john','Novo Testamento','Carta geral',5],['2 João','ii-john','Novo Testamento','Carta geral',1],['3 João','iii-john','Novo Testamento','Carta geral',1],['Judas','jude','Novo Testamento','Carta geral',1],['Apocalipse','revelation-of-john','Novo Testamento','Profecia',22]
  ];
  const life=[
    ['Amor ao próximo','Mateus 22:37-39','matthew',22,'amar a Deus e ao próximo resume o centro da vida cristã','tratar cada pessoa com dignidade e cuidado'],
    ['Perdão','Efésios 4:32','ephesians',4,'o perdão recebido de Deus inspira o perdão nos relacionamentos','buscar reconciliação sem alimentar vingança'],
    ['Serviço','Marcos 10:45','mark',10,'Jesus apresenta o serviço como caminho de liderança','usar capacidades para servir, e não apenas para receber destaque'],
    ['Generosidade','2 Coríntios 9:7','ii-corinthians',9,'a contribuição deve ser consciente e feita com alegria','compartilhar recursos com responsabilidade e sem ostentação'],
    ['Verdade','Efésios 4:25','ephesians',4,'a comunidade cresce quando seus membros falam a verdade','agir com honestidade mesmo quando ninguém está observando'],
    ['Promoção da paz','Mateus 5:9','matthew',5,'os pacificadores refletem o caráter do Reino de Deus','reduzir conflitos e construir pontes entre pessoas'],
    ['Cuidado com quem passa necessidade','Provérbios 19:17','proverbs',19,'a compaixão pelos pobres é apresentada como serviço ao Senhor','oferecer ajuda respeitosa que preserve a dignidade'],
    ['Visita e cuidado com enfermos','Mateus 25:36','matthew',25,'Jesus valoriza a presença junto de quem sofre','visitar, ouvir e apoiar de modo prático uma pessoa enferma'],
    ['Hospitalidade','Hebreus 13:2','hebrews',13,'acolher pessoas é uma prática cristã de amor','receber o visitante com respeito, segurança e atenção'],
    ['Honra aos pais','Efésios 6:1-3','ephesians',6,'honrar pai e mãe inclui respeito e responsabilidade','dialogar com respeito e oferecer cuidado quando necessário'],
    ['Amor no casamento','Efésios 5:25','ephesians',5,'o amor conjugal é descrito como entrega e cuidado','cultivar fidelidade, diálogo e respeito mútuo'],
    ['Amizade fiel','Provérbios 17:17','proverbs',17,'a verdadeira amizade permanece também na dificuldade','estar presente sem abandonar o amigo em um momento difícil'],
    ['Trabalho com excelência','Colossenses 3:23','colossians',3,'o trabalho pode ser realizado de coração e com propósito','cumprir tarefas com qualidade, honestidade e dedicação'],
    ['Planejamento financeiro','Lucas 14:28','luke',14,'Jesus usa o planejamento como exemplo de responsabilidade','organizar gastos antes de assumir um compromisso financeiro'],
    ['Humildade','Filipenses 2:3-4','philippians',2,'a humildade considera também as necessidades dos outros','ouvir, aprender e não agir por vaidade'],
    ['Domínio próprio','Gálatas 5:22-23','galatians',5,'o domínio próprio faz parte do fruto do Espírito','pausar antes de agir por impulso ou raiva'],
    ['Escuta e paciência','Tiago 1:19','james',1,'a sabedoria cristã orienta a ouvir antes de falar','escutar com atenção e responder sem agressividade'],
    ['Oração em tempos difíceis','Filipenses 4:6-7','philippians',4,'a oração apresenta preocupações a Deus e alimenta a paz','orar e também buscar apoio responsável quando necessário'],
    ['Estudo da Palavra','Salmos 119:105','psalms',119,'a Palavra de Deus oferece direção para o caminho','ler o texto bíblico considerando seu contexto'],
    ['Comunhão','Hebreus 10:24-25','hebrews',10,'a reunião da comunidade encoraja amor e boas obras','participar e incentivar outras pessoas com constância'],
    ['Unidade cristã','Efésios 4:3','ephesians',4,'a unidade deve ser preservada com humildade e paz','discordar sem transformar diferenças em hostilidade'],
    ['Justiça e misericórdia','Miquéias 6:8','micah',6,'Deus chama seu povo a praticar justiça, misericórdia e humildade','defender o que é correto sem abandonar a compaixão'],
    ['Compaixão prática','Lucas 10:33-37','luke',10,'o bom samaritano mostra amor que atravessa barreiras','perceber a necessidade e oferecer ajuda concreta'],
    ['Esperança','Romanos 15:13','romans',15,'a fé cristã alimenta esperança mesmo em tempos difíceis','encorajar sem negar a realidade da dor'],
    ['Consolo no luto','2 Coríntios 1:3-4','ii-corinthians',1,'o consolo recebido pode ser compartilhado com quem sofre','acolher o enlutado sem apressar seu processo'],
    ['Ansiedade e confiança','1 Pedro 5:7','i-peter',5,'as preocupações podem ser colocadas diante de Deus','orar, conversar com pessoas confiáveis e buscar ajuda profissional quando preciso'],
    ['Apoio mútuo','Gálatas 6:2','galatians',6,'carregar as cargas uns dos outros expressa a lei do amor','oferecer presença e ajuda sem julgar quem está sofrendo'],
    ['Resolução de conflitos','Mateus 18:15','matthew',18,'conflitos devem ser tratados primeiro com conversa direta e respeitosa','falar com a pessoa envolvida em vez de espalhar o problema'],
    ['Comunicação nas redes sociais','Efésios 4:29','ephesians',4,'as palavras devem contribuir para edificar quem as recebe','verificar fatos e evitar humilhação, mentira e agressão online'],
    ['Cuidado com a criação','Gênesis 2:15','genesis',2,'o ser humano recebe responsabilidade de cultivar e guardar','evitar desperdício e cuidar dos recursos naturais'],
    ['Oração pelas autoridades','1 Timóteo 2:1-2','i-timothy',2,'a igreja é orientada a orar por governantes e pela paz social','orar com responsabilidade sem transformar fé em idolatria política'],
    ['Missão','Mateus 28:19-20','matthew',28,'Jesus envia seus discípulos para ensinar e fazer novos discípulos','compartilhar a fé com respeito, serviço e coerência'],
    ['Discipulado','2 Timóteo 2:2','ii-timothy',2,'o ensino recebido deve ser transmitido a pessoas fiéis','acompanhar o crescimento de alguém com exemplo e ensino'],
    ['Uso dos dons','1 Pedro 4:10','i-peter',4,'cada dom deve ser colocado a serviço das outras pessoas','servir na comunidade conforme capacidades e responsabilidade']
  ];

  function options(answer,values,index){
    const unique=[...new Set(values.filter(value=>value!==answer))];
    const picked=[];
    for(let step=1;picked.length<3&&step<=unique.length;step++){
      const candidate=unique[(index*7+step*11)%unique.length];
      if(!picked.includes(candidate))picked.push(candidate);
    }
    return [answer,...picked];
  }
  function add(id,category,q,answerOptions,explanation,reference,learn,bookSlug,chapter){
    bank.push({id,category,q,options:answerOptions,answer:0,explanation,reference,learn,bookSlug,chapter});
  }

  const genres=books.map(book=>book[3]);
  const chapters=books.map(book=>String(book[4]));
  const positions=books.map((_,index)=>String(index+1));
  const names=books.map(book=>book[0]);
  books.forEach((book,index)=>{
    const [name,slug,testament,genre,totalChapters]=book;
    const previous=index===0?'Nenhum: é o primeiro livro':books[index-1][0];
    const next=index===books.length-1?'Nenhum: é o último livro':books[index+1][0];
    add(`structure-testament-${slug}`,'BÍBLIA',`Em qual parte da Bíblia está o livro de ${name}?`,options(testament,['Antigo Testamento','Novo Testamento','Entre os dois testamentos','Fora da Bíblia'],index),`${name} pertence ao ${testament}.`,'Organização dos livros bíblicos',`Reconhecer as divisões da Bíblia ajuda a localizar e compreender cada livro.`,slug,1);
    add(`structure-genre-${slug}`,'BÍBLIA',`Em qual grupo literário o livro de ${name} é normalmente classificado?`,options(genre,genres,index),`${name} é normalmente classificado no grupo ${genre}.`,'Organização dos livros bíblicos',`Os gêneros ajudam o leitor a interpretar cada texto respeitando sua forma literária.`,slug,1);
    add(`structure-before-${slug}`,'BÍBLIA',`Qual livro aparece imediatamente antes de ${name} na ordem bíblica?`,options(previous,[...names,'Nenhum: é o primeiro livro'],index),`${previous} aparece imediatamente antes de ${name} na ordem tradicional dos 66 livros.`,'Ordem dos livros bíblicos',`Conhecer a sequência facilita a navegação e o estudo bíblico.`,slug,1);
    add(`structure-after-${slug}`,'BÍBLIA',`Qual livro aparece imediatamente depois de ${name} na ordem bíblica?`,options(next,[...names,'Nenhum: é o último livro'],index+3),`${next} aparece imediatamente depois de ${name} na ordem tradicional dos 66 livros.`,'Ordem dos livros bíblicos',`Conhecer a sequência facilita a navegação e o estudo bíblico.`,slug,1);
    add(`structure-position-${slug}`,'BÍBLIA',`Qual é a posição de ${name} na ordem dos 66 livros da Bíblia?`,options(String(index+1),positions,index),`${name} ocupa a posição ${index+1} na ordem bíblica.`,'Ordem dos livros bíblicos',`A ordem dos livros organiza a biblioteca bíblica do Gênesis ao Apocalipse.`,slug,1);
    add(`structure-chapters-${slug}`,'BÍBLIA',`Quantos capítulos possui o livro de ${name}?`,options(String(totalChapters),chapters,index),`${name} possui ${totalChapters} ${totalChapters===1?'capítulo':'capítulos'}.`,'Estrutura dos livros bíblicos',`A divisão em capítulos ajuda a localizar passagens e organizar a leitura.`,slug,1);
  });
const principles=life.map(item=>item[4]),actions=life.map(item=>item[5]),references=life.map(item=>item[1]);
  life.forEach((item,index)=>{
    const [topic,reference,slug,chapter,principle,action]=item;
    const explanation=`Em ${reference}, aprendemos que ${principle}.`;
    add(`life-principle-${index}`,'VIDA CRISTÃ',`Qual ensino melhor representa o tema “${topic}”?`,options(principle,principles,index),explanation,reference,`A fé cristã se torna visível em atitudes coerentes com o amor ao próximo.`,slug,chapter);
    add(`life-action-${index}`,'VIDA CRISTÃ',`Na prática, qual atitude combina melhor com o ensino cristão sobre ${topic.toLowerCase()}?`,options(action,actions,index),explanation,reference,`Conhecimento bíblico deve produzir escolhas responsáveis, respeitosas e compassivas.`,slug,chapter);
    add(`life-reference-${index}`,'VIDA CRISTÃ',`Qual referência bíblica está relacionada ao tema “${topic}”?`,options(reference,references,index),explanation,reference,`Leia a passagem completa para entender o versículo dentro do contexto.`,slug,chapter);
  });

  const clearerPrompts={
    'verse-leviticus-8-1-2':'No relato da consagração de Arão e seus filhos, qual livro inicia o capítulo 8 com: “Disse mais o Senhor a Moisés:”?',
    'verse-numbers-8-1-3':'No capítulo sobre as lâmpadas e a consagração dos levitas, o trecho “Disse mais o Senhor a Moisés:” aparece em qual capítulo de Números?'
  };
  bank.forEach(question=>{if(clearerPrompts[question.id])question.q=clearerPrompts[question.id]});
})();
