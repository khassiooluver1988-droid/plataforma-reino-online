window.reinoCertificatePdf=async function(cert,validationUrl){
 const {PDFDocument,StandardFonts,rgb}=window.PDFLib;
 const doc=await PDFDocument.create();doc.setTitle('Certificado — '+cert.title);doc.setAuthor('Plataforma Reino');doc.registerFontkit(window.fontkit);
 const load=async file=>window.REINO_TEST_FONTS?window.REINO_TEST_FONTS[file]:new Uint8Array(await(await fetch(new URL('assets/'+file,location.href))).arrayBuffer());
 const p=doc.addPage([842,595]);const regular=await doc.embedFont(await load('course-font.ttf'),{subset:true});const bold=await doc.embedFont(await load('course-font-bold.ttf'),{subset:true});
 const safe=v=>String(v).replace(/[—–]/g,'-').replace(/[\x00-\x1f]/g,' ');
 function line(text,y,size=16,font=regular,color=rgb(.09,.19,.29)) {text=safe(text);const width=font.widthOfTextAtSize(text,size);p.drawText(text,{x:(842-width)/2,y,size,font,color});}
 function fit(text,y,start=28){text=safe(text);let size=start;while(bold.widthOfTextAtSize(text,size)>700&&size>12)size--;line(text,y,size,bold);}
 p.drawRectangle({x:24,y:24,width:794,height:547,borderColor:rgb(.7,.5,.18),borderWidth:2});
 p.drawRectangle({x:34,y:34,width:774,height:527,borderColor:rgb(.09,.19,.29),borderWidth:.7});
 line('PLATAFORMA REINO',518,17,bold);line('CERTIFICADO DE CONCLUSÃO',459,28,bold);
 line('Certificamos que',408);fit(cert.name,367,30);
 line('concluiu o curso livre de formação complementar',323,16);fit(cert.title,287,28);line('Categoria: Gestão de Negócios | Área Administrativa',266,12);
 line('Carga horária: 40 horas  |  Nota final: '+Number(cert.score).toFixed(1).replace('.',','),247,17,bold);
 const date=v=>new Date(v).toLocaleDateString('pt-BR',{timeZone:'America/Fortaleza'});
 line('Período: '+date(cert.startedAt)+' a '+date(cert.issuedAt),215,14);
 line('Emissão: '+new Date(cert.issuedAt).toLocaleString('pt-BR',{timeZone:'America/Fortaleza'})+' (Fortaleza)',192,12);
 line('Plataforma Reino - Formação e desenvolvimento',151,15,bold);
 line('Registro: '+cert.code,119,11);line('Curso: '+cert.courseCode,101,11);
 line('Verifique o registro pelo código na página de validação do curso.',77,11);
 // Link clicável para o registro oficial; não é assinatura digital.
 if(validationUrl){const link=doc.context.obj({Type:'Annot',Subtype:'Link',Rect:[100,64,742,91],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:window.PDFLib.PDFString.of(validationUrl)}});p.node.set(window.PDFLib.PDFName.of('Annots'),doc.context.obj([doc.context.register(link)]));}
 return await doc.save();
};
