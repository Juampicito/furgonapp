const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');

// Offline canvas animation: no Maps key, user location, or live account is recorded.
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.setContent('<canvas width="1280" height="720"></canvas>');
  await page.locator('canvas').click();
  const audio = await Promise.all(Array.from({length:7}, async (_,i) => (await fs.readFile(path.join(__dirname, '../../.tools/tutorial-voice', `${i}.wav`))).toString('base64')));
  const video = await page.evaluate(async (audio) => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const captions = [
      ['Conecta con familias de tu zona', 'Para comenzar, entra a Área de cobertura.'],
      ['Marca los bordes de tu zona', 'Toca el mapa: necesitas al menos 3 puntos.'],
      ['Pulsa Terminar dibujo', 'El área azul representa tu zona de recogida.'],
      ['Ajusta el área azul', 'Arrastra los puntos blancos para cambiar los bordes.'],
      ['Selecciona los colegios', 'Busca cada institución y pulsa Seleccionar institución.'],
      ['Pulsa Guardar cobertura', 'La zona y los colegios quedan guardados.'],
      ['¡Listo para recibir solicitudes!', 'Las recogidas deben estar dentro de tu zona azul.'],
    ];
    function text(value,x,y,size=24,color='#183c30') { ctx.font=`${size}px Arial`;ctx.fillStyle=color;ctx.fillText(value,x,y); }
    function button(label,x,y,w,active=false) {ctx.fillStyle=active?'#2563eb':'#178a45';ctx.fillRect(x,y,w,42);text(label,x+14,y+28,18,'white');}
    const audioContext=new AudioContext();await audioContext.resume();
    const buffers=await Promise.all(audio.map(async encoded=>{const binary=atob(encoded);const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return audioContext.decodeAudioData(bytes.buffer);}));
    const durations=buffers.map(b=>b.duration+0.7);const total=durations.reduce((a,b)=>a+b,0);
    const cursorPaths = [
      [[0,835,570],[0.8,180,400],[1,180,400]],
      [[0,180,400],[0.18,230,360],[0.25,230,360],[0.4,540,320],[0.47,540,320],[0.62,590,510],[0.69,590,510],[0.84,260,535],[1,260,535]],
      [[0,260,535],[0.18,160,220],[1,160,220]],
      [[0,160,220],[0.15,540,320],[0.22,540,320],[0.43,605,295],[1,605,295]],
      [[0,605,295],[0.15,1030,326],[0.45,1030,326],[0.55,1030,385],[0.65,1030,385],[0.78,1050,450],[1,1050,450]],
      [[0,1050,450],[0.25,1050,552],[1,1050,552]],
      [[0,1050,552],[0.5,835,570],[1,835,570]],
    ];
    const clicks=[[],[0.18,0.4,0.62,0.84],[0.18],[0.22],[0.15,0.55,0.78],[0.25],[]];
    function cursorAt(step,phase){
      const route=cursorPaths[step];let index=1;while(index<route.length-1 && phase>route[index][0])index++;
      const a=route[index-1],b=route[index];let progress=Math.max(0,Math.min(1,(phase-a[0])/(b[0]-a[0])));
      progress=progress*progress*(3-2*progress);
      return [a[1]+(b[1]-a[1])*progress,a[2]+(b[2]-a[2])*progress];
    }
    function drawCursor(step,phase){
      const [x,y]=cursorAt(step,phase);
      const dragging=step===3 && phase>=0.22 && phase<=0.43;
      ctx.beginPath();ctx.arc(x,y,dragging?24:20,0,Math.PI*2);ctx.fillStyle=dragging?'#2563eb44':'#fbbf2455';ctx.fill();
      for(const click of clicks[step]){
        const elapsed=(phase-click)*durations[step];
        if(elapsed>=0 && elapsed<0.9){const [cx,cy]=cursorAt(step,click);ctx.beginPath();ctx.arc(cx,cy,12+elapsed*30,0,Math.PI*2);ctx.strokeStyle=`rgba(234,88,12,${1-elapsed/0.9})`;ctx.lineWidth=4;ctx.stroke();text('Clic',cx+32,cy+5,18,'#9a3412');}
      }
      ctx.save();ctx.shadowColor='#00000066';ctx.shadowBlur=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3,y+34);ctx.lineTo(x+12,y+24);ctx.lineTo(x+20,y+40);ctx.lineTo(x+27,y+36);ctx.lineTo(x+19,y+20);ctx.lineTo(x+34,y+19);ctx.closePath();ctx.fillStyle='#162f46';ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=2;ctx.stroke();ctx.restore();
      if(dragging)text('Arrastra el punto',x+35,y+5,18,'#174da2');
    }
    function draw(t) {
      let step=0,startTime=0;while(step<6 && t>=startTime+durations[step])startTime+=durations[step++];
      const phase=Math.min(1,(t-startTime)/durations[step]);
      ctx.fillStyle='#f1f5f2';ctx.fillRect(0,0,1280,720);
      ctx.fillStyle='#153e30';ctx.fillRect(0,0,1280,70);text('FurgonApp  ·  Aprende a delimitar tu zona',38,45,28,'white');
      text(`${step+1} / 7`,1140,45,22,'white');
      text(captions[step][0],50,120,32);text(captions[step][1],50,158,24);
      ctx.fillStyle='white';ctx.fillRect(40,183,1200,450);
      button('Terminar dibujo',65,199,190,step===2);button('Deshacer último punto',267,199,225);button('Borrar zona y dibujar otra',504,199,262);
      ctx.fillStyle='#e6ece6';ctx.fillRect(65,257,805,347);
      ctx.fillStyle='#d4e3cf';ctx.fillRect(660,280,150,280);text('Parque',694,443,21,'#648266');
      ctx.strokeStyle='white';ctx.lineWidth=12;
      for(let x=110;x<870;x+=125){ctx.beginPath();ctx.moveTo(x,257);ctx.lineTo(x+40,604);ctx.stroke();}
      for(let y=300;y<600;y+=90){ctx.beginPath();ctx.moveTo(65,y);ctx.lineTo(870,y-15);ctx.stroke();}
      text('Ejemplo ilustrativo',84,584,16,'#526659');
      const count=step===0?0:step===1?clicks[1].filter(click=>phase>=click).length:4;
      const points=[[230,360],[540,320],[590,510],[260,535]];
      if(step>=4)points[1]=[605,295];
      if(step===3 && phase>=0.22)points[1]=phase<=0.43?cursorAt(step,phase):[605,295];
      if(count){ctx.beginPath();points.slice(0,count).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(count>=3)ctx.closePath();ctx.fillStyle='#2563eb44';ctx.fill();ctx.strokeStyle='#2563eb';ctx.lineWidth=4;ctx.stroke();
        points.slice(0,count).forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();ctx.stroke();});}
      text('Instituciones atendidas',906,289,23);
      const selected=step>4 || (step===4 && phase>=0.78);
      const saved=step>5 || (step===5 && phase>=0.25);
      const searchText=step>4?'Los Aromos':step===4 && phase>=0.15?'Los Aromos'.slice(0,Math.min(10,Math.floor((phase-0.15)/0.3*10))):'Buscar colegio…';
      ctx.strokeStyle='#cad9cf';ctx.lineWidth=1;ctx.strokeRect(899,305,315,42);text(searchText,912,333,20);
      text('Colegio Los Aromos',910,382,23);text('Macul',910,409,18,'#687b70');
      button(selected?'Seleccionada ✓':'Seleccionar institución',903,430,300,step===4);
      button(saved?'Cobertura guardada ✓':'Guardar cobertura',903,531,300,step===5);
      drawCursor(step,phase);
      text('Puedes deshacer un punto o borrar la zona para empezar otra vez.',50,674,21);
      ctx.fillStyle='#2563eb';ctx.fillRect(0,712,1280*Math.min(1,t/total),8);
    }
    draw(durations[0]+durations[1]*0.405);
    const poster=canvas.toDataURL('image/png').split(',')[1];
    const stream=canvas.captureStream(20);const parts=[];
    const destination=audioContext.createMediaStreamDestination();
    destination.stream.getAudioTracks().forEach(track=>stream.addTrack(track));
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm;codecs=vp8';
    const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:1400000});
    recorder.ondataavailable=e=>{if(e.data.size)parts.push(e.data);};
    const finished=new Promise(resolve=>recorder.onstop=resolve);
    recorder.start();const start=performance.now();let audioStart=audioContext.currentTime;
    buffers.forEach((buffer,i)=>{const source=audioContext.createBufferSource();source.buffer=buffer;source.connect(destination);source.start(audioStart);audioStart+=durations[i];});
    await new Promise(resolve=>{function frame(){const t=(performance.now()-start)/1000;draw(t);if(t<total)requestAnimationFrame(frame);else resolve();}frame();});
    recorder.stop();await finished;stream.getTracks().forEach(track=>track.stop());
    const data=await new Blob(parts,{type:'video/webm'}).arrayBuffer();
    let binary='';for(const byte of new Uint8Array(data))binary+=String.fromCharCode(byte);
    await audioContext.close();
    return {video:btoa(binary),poster,total};
  }, audio);
  const folder=path.join(__dirname,'../public/tutoriales');await fs.mkdir(folder,{recursive:true});
  await fs.writeFile(path.join(folder,'zona-de-trabajo.webm'),Buffer.from(video.video,'base64'));
  await fs.writeFile(path.join(folder,'zona-de-trabajo.png'),Buffer.from(video.poster,'base64'));
  await browser.close();console.log(`Video narrado y portada creados (${Math.round(video.total)} segundos).`);
})();
