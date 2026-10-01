(() => {
 const grid=document.getElementById('courses-grid'); if(!grid)return;
 function insert(){
  let section=document.getElementById('cuidador-category');
  if(!section){
   section=document.createElement('section'); section.id='cuidador-category';
   section.style.marginTop='32px'; section.setAttribute('aria-labelledby','cuidador-category-title');
   section.innerHTML='<div class="section-heading"><div><span class="eyebrow">FORMAÇÃO INTRODUTÓRIA · CUIDADO COTIDIANO</span><h2 id="cuidador-category-title">Cuidado e Bem-estar</h2></div></div><div class="courses-grid"><article class="course-card"><img src="assets/cuidador-visuals/capa.svg" alt="Cuidador de Idosos — Cuidado e Bem-estar" loading="lazy" width="1100" height="650" style="width:100%;height:auto;border-radius:8px;display:block;margin-bottom:16px"><small>CURSO 01 · 40 HORAS</small><h3>Cuidador de Idosos</h3><span class="provider">Plataforma Reino</span><p>Autonomia, cuidados diários, segurança, comunicação e organização da rotina. Cinco módulos com imagens, exemplos e exercícios.</p><div class="course-tags"><span>20 aulas</span><span>40 horas</span><span>Certificado após aprovação</span></div><a class="button navy" href="curso-cuidador-idosos.html">Começar curso grátis</a></article></div>';
   const gestao=document.querySelector('[data-reino02-category]'); (gestao||grid).after(section);
  }
  const filter=document.querySelector('[data-course-filter].active')?.dataset.courseFilter||'Todos';
  section.hidden=!['Todos','Cuidado e Bem-estar','Saúde e Bem-estar'].includes(filter);
 }
 new MutationObserver(insert).observe(grid,{childList:true});
 document.querySelectorAll('[data-course-filter]').forEach(b=>b.addEventListener('click',()=>queueMicrotask(insert)));
 insert();
})();
