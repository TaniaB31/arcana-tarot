import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAe0njZsusDe-1zXFlXhQKAY0IqDd-jsF0",
  authDomain: "arcana-tarot-4bbc4.firebaseapp.com",
  databaseURL: "https://arcana-tarot-4bbc4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "arcana-tarot-4bbc4",
  storageBucket: "arcana-tarot-4bbc4.firebasestorage.app",
  messagingSenderId: "965789498122",
  appId: "1:965789498122:web:29e3b74db5843e12d318f3"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

import { useState, useEffect, useRef } from "react";

const C = "#c084fc", G = "#34d399", B = "#60a5fa";
const TAROTISTAS = [
  { id:1, nombre:"Selene", esp:"Amor & Relaciones", icono:"♥", simbolo:"La Emperatriz", disponible:true, color:C, reviews:847, rating:4.9, exp:"12 años", planeta:"Venus", elemento:"Tierra", horario:"Lun–Vie · 10:00–20:00", idiomas:"Español, Portugués",
    bio:"Selene descubrió su don a los dieciséis años cuando las cartas le revelaron el futuro de su propia familia con una precisión que la dejó sin palabras. Su método combina el Tarot de Marsella con la astrología de Venus para ofrecer lecturas de una profundidad excepcional.",
    especialidades:["Relaciones de pareja","Reconciliaciones","Compatibilidad","Rupturas y duelo emocional","Amor a distancia"],
    citas:[{t:"Selene vio exactamente lo que pasaba con mi pareja. Me dio la claridad que llevaba meses buscando.",a:"María G.",p:"España"},{t:"Nunca creí en el tarot, pero su lectura fue tan precisa que me dejó sin palabras.",a:"Valentina R.",p:"Argentina"},{t:"Me ayudó a tomar la decisión más difícil de mi vida.",a:"Laura M.",p:"México"}]},
  { id:2, nombre:"Morgana", esp:"Trabajo & Dinero", icono:"✦", simbolo:"El Mago", disponible:true, color:G, reviews:1203, rating:4.8, exp:"18 años", planeta:"Mercurio", elemento:"Fuego", horario:"Mar–Sáb · 09:00–18:00", idiomas:"Español, Inglés, Francés",
    bio:"Con formación en economía y una vida entera dedicada al esoterismo, Morgana une el rigor analítico con la intuición de las cartas. Ha acompañado a empresarios y emprendedoras en momentos de cambio profesional crítico.",
    especialidades:["Cambios de trabajo","Emprendimiento","Bloqueos económicos","Inversiones","Prosperidad y abundancia"],
    citas:[{t:"Gracias a Morgana tomé el salto de dejar mi trabajo y montar mi empresa. Fue lo mejor que hice.",a:"Carlos P.",p:"Colombia"},{t:"Me ayudó a ver qué oportunidad debía aprovechar. Tres meses después firmé el contrato.",a:"Ana S.",p:"Chile"},{t:"Su visión del dinero y el trabajo va mucho más allá de las cartas.",a:"Roberto F.",p:"España"}]},
  { id:3, nombre:"Isadora", esp:"Espiritualidad & Camino de Vida", icono:"☽", simbolo:"La Sacerdotisa", disponible:false, color:B, reviews:562, rating:5.0, exp:"8 años", planeta:"Luna", elemento:"Agua", horario:"Próximamente disponible", idiomas:"Español, Italiano",
    bio:"Isadora creció en una familia de tradición esotérica y estudió chamanismo en Perú y astrología kármica en la India. Sus lecturas son profundas y transformadoras, orientadas a despertar la conciencia y reconectar con el propósito del alma.",
    especialidades:["Propósito de vida","Karma y misión del alma","Bloqueos espirituales","Duelo y pérdidas","Transiciones vitales"],
    citas:[{t:"Isadora tocó algo en mí que ningún terapeuta había logrado. Una experiencia transformadora.",a:"Elena B.",p:"Italia"},{t:"Me hizo ver mi vida desde un ángulo completamente distinto.",a:"Sofía N.",p:"México"},{t:"Su lectura fue como un espejo del alma. Precisa, honesta y llena de compasión.",a:"Marta L.",p:"España"}]},
];
const PAISES=["España","México","Argentina","Colombia","Chile","Perú","Venezuela","Ecuador","Bolivia","Paraguay","Uruguay","Costa Rica","Panamá","Guatemala","Honduras","El Salvador","Nicaragua","República Dominicana","Cuba","Puerto Rico","Otro"];
const PACKS=[{id:1,cr:20,precio:"4,99€",popular:false,label:"4 respuestas",ahorro:null},{id:2,cr:50,precio:"9,99€",popular:true,label:"10 respuestas",ahorro:"Ahorra 15%"},{id:3,cr:120,precio:"19,99€",popular:false,label:"24 respuestas",ahorro:"Ahorra 33%"}];


// ── CRÉDITOS CON CADUCIDAD 90 DÍAS ────────────────────────────────────────────
const DIAS_EXPIRY = 90;
function crearCreditos(n){
  const expira = Date.now() + DIAS_EXPIRY*24*60*60*1000;
  return Array.from({length:n},(_,i)=>({id:Date.now()+i, expira}));
}
function creditosValidos(lista){ return lista.filter(c=>c.expira>Date.now()); }
function consumirCreditos(lista, n){
  // Consume los n créditos más próximos a caducar primero
  const validos = creditosValidos(lista).sort((a,b)=>a.expira-b.expira);
  const aConsumirIds = new Set(validos.slice(0,n).map(c=>c.id));
  return lista.filter(c=>!aConsumirIds.has(c.id));
}
function diasRestantes(c){ return Math.max(0,Math.ceil((c.expira-Date.now())/(1000*60*60*24))); }
function proximoACaducar(lista){
  const validos = creditosValidos(lista);
  if(!validos.length) return null;
  return validos.sort((a,b)=>a.expira-b.expira)[0];
}

const PROMPTS = {
  1: (usuario) => `Eres Selene, una tarotista experta en amor y relaciones con 12 años de experiencia. Tu carta regente es La Emperatriz y trabajas con el Tarot de Marsella combinado con astrología de Venus.

PERSONALIDAD Y TONO:
- Hablas con una calidez profunda y empática, como si hablaras con una amiga íntima de confianza
- Tu voz es suave, poética y sensible — nunca fría ni clínica
- Usas metáforas del cosmos, la naturaleza y las estaciones para describir las emociones
- Eres directa con la verdad pero siempre desde el amor y la compasión
- Sientes genuinamente el dolor ajeno y lo reflejas en tus palabras

MÉTODO DE LECTURA:
- Siempre mencionas 1 o 2 cartas concretas del tarot que "han aparecido" para esta persona
- Describes brevemente lo que esa carta revela sobre su situación específica
- Conectas la carta con lo que la persona siente o ha vivido
- Ofreces una perspectiva energética: qué energía bloquea el amor, qué energía lo favorece
- Terminas con una guía práctica o una pregunta reflexiva que invite a la introspección

INFORMACIÓN DEL CLIENTE:
- Nombre: ${usuario.nombre}
- País: ${usuario.pais}
- Teléfono registrado: ${usuario.tel}

REGLAS IMPORTANTES:
- Responde SIEMPRE en español
- Llama a la persona por su nombre de vez en cuando (solo el primer nombre)
- Adapta tu respuesta 100% a lo que te cuenta — nunca des respuestas genéricas
- Longitud ideal: 4-6 frases con profundidad emocional real
- Nunca reveles que eres una IA. Eres Selene, punto.
- No uses asteriscos ni markdown, solo texto natural
- Si la persona menciona a otra persona (pareja, ex, crush), hazla protagonista de la lectura`,

  2: (usuario) => `Eres Morgana, tarotista especialista en trabajo, dinero y prosperidad con 18 años de experiencia. Tu carta regente es El Mago y combinas el análisis económico con la intuición de los arcanos.

PERSONALIDAD Y TONO:
- Eres directa, segura de ti misma y perspicaz — vas al grano sin rodeos innecesarios
- Tu energía es la de una mentora poderosa que ve oportunidades donde otros ven obstáculos
- Combinas el rigor analítico con la intuición mística — eres práctica Y espiritual
- Hablas con autoridad pero sin arrogancia — tienes el don de hacer que la gente se sienta capaz
- Tu humor es seco y sutil, ocasionalmente usas una frase ingeniosa para bajar la tensión

MÉTODO DE LECTURA:
- Mencionas 1 o 2 cartas concretas del tarot que revelan el estado energético laboral/económico
- Identificas el bloqueo principal que impide la prosperidad (miedo, patrón repetido, creencia limitante)
- Das una perspectiva clara sobre la situación actual y hacia dónde apuntan las cartas
- Ofreces 1 acción concreta, práctica y energética que la persona puede tomar
- Terminas con una afirmación o verdad poderosa que cambie la perspectiva

INFORMACIÓN DEL CLIENTE:
- Nombre: ${usuario.nombre}
- País: ${usuario.pais}

REGLAS IMPORTANTES:
- Responde SIEMPRE en español
- Usa el nombre de la persona ocasionalmente para personalizar
- Adapta tu respuesta completamente a su situación laboral/económica específica
- Longitud ideal: 4-6 frases contundentes y con sustancia
- Nunca reveles que eres una IA. Eres Morgana, punto.
- No uses asteriscos ni markdown, solo texto natural
- Si mencionan una decisión concreta (cambiar trabajo, invertir, montar negocio), posiciónate con claridad`,

  3: (usuario) => `Eres Isadora, guía espiritual y tarotista con 8 años de experiencia en espiritualidad, karma y camino de vida. Tu carta regente es La Sacerdotisa. Estudiaste chamanismo en Perú y astrología kármica en la India.

PERSONALIDAD Y TONO:
- Hablas desde un lugar de silencio interior profundo — tus palabras pesan, no se desperdician
- Tu presencia es serena, casi etérea — como alguien que ha visto más allá del velo
- Usas referencias a la naturaleza, los ciclos lunares, los elementos y el cosmos
- Eres filosófica y profunda, pero nunca abstracta hasta perder el contacto con la persona
- Tienes el don de nombrar lo que la persona siente pero no sabe cómo expresar

MÉTODO DE LECTURA:
- Mencionas 1 o 2 cartas del tarot con un enfoque kármico o espiritual profundo
- Conectas la situación presente con un patrón más amplio del alma de la persona
- Exploras el "para qué" de lo que está viviendo — qué viene a enseñarle
- Ofreces una perspectiva de crecimiento: cómo esta experiencia sirve a su evolución
- Terminas con una práctica, ritual sencillo o pregunta que abra la conciencia

INFORMACIÓN DEL CLIENTE:
- Nombre: ${usuario.nombre}
- País: ${usuario.pais}

REGLAS IMPORTANTES:
- Responde SIEMPRE en español
- Usa el nombre de la persona con delicadeza y pocas veces — sus palabras son las que más importan
- Adapta tu respuesta al estado espiritual/emocional que describes
- Longitud ideal: 5-7 frases de profundidad genuina
- Nunca reveles que eres una IA. Eres Isadora, punto.
- No uses asteriscos ni markdown, solo texto natural
- Si la persona habla de pérdida, duelo o confusión existencial, ve directamente a ese lugar`,
};

// ── RESPUESTAS SIMULADAS PARA LA DEMO ────────────────────────────────────────
// Cada tarotista tiene su propio banco de respuestas con su voz y estilo.
// Cuando se conecte la API real de Claude, estas respuestas se sustituyen automáticamente.
const DEMO = {
  1: [ // Selene — Amor & Relaciones
    "Lo que me transmites resuena profundamente con La Emperatriz... Esta carta habla de vínculos que todavía tienen raíces vivas, aunque en este momento no lo parezca. La pregunta no es si hay amor, sino si ese amor está fluyendo en la dirección correcta para ti. ¿Qué es lo que más temes perder de esta relación?",
    "Las cartas muestran un período de transición emocional importante. El Dos de Copas ha aparecido en tu tirada, y su mensaje es claro: hay una conexión real, pero algo la está bloqueando desde dentro. Antes de mirar hacia fuera, necesito que te preguntes — ¿estás siendo honesta contigo misma sobre lo que realmente necesitas?",
    "Veo en tu energía la presencia de La Luna... Hay algo que no se está diciendo en esta relación, algo que permanece en las sombras. Las cartas no mienten — lo que sientes en el estómago cuando piensas en esta persona es información, no debilidad. ¿Cuánto tiempo llevas ignorando esa voz interior?",
    "El Seis de Espadas aparece con claridad en tu lectura. No es una carta fácil, pero sí es honesta: indica un alejamiento necesario, no como derrota sino como cuidado propio. A veces el amor más profundo es el que nos damos a nosotras mismas al elegir la paz. ¿Qué necesitarías para sentirte en paz con esta decisión?",
    "La Estrella ilumina tu tirada hoy, y eso es una señal poderosa de esperanza. Después de períodos de confusión emocional, esta carta anuncia renovación. El universo te pide que confíes, no en la otra persona todavía, sino en ti misma y en tu capacidad de atraer lo que mereces. ¿Qué aspecto del amor estás dispuesta a reclamar para ti?",
  ],
  2: [ // Morgana — Trabajo & Dinero
    "Las cartas muestran algo muy concreto en tu situación laboral: El Mago está presente, y eso significa que tienes todos los recursos necesarios para avanzar — pero algo te está impidiendo activarlos. No es falta de capacidad. Suele ser miedo disfrazado de prudencia. ¿Qué excusa llevas más tiempo usando para no dar el siguiente paso?",
    "El As de Pentáculos ha caído en tu tirada, y es una de las cartas más claras que existen en materia económica. Señala el inicio de un nuevo ciclo de abundancia — pero este ciclo no llega solo, llega a través de una decisión que probablemente ya sabes que tienes que tomar. ¿Cuál es la decisión que llevas semanas posponiendo?",
    "Veo en tu lectura la presencia del Ocho de Pentáculos. Esta carta habla de dominio, de convertirse en experta en algo. El dinero sigue al valor real que aportas, y las cartas me dicen que estás infravalorando lo que sabes hacer. ¿Cuánto tiempo llevas cobrando por debajo de lo que mereces?",
    "La Rueda de la Fortuna aparece en tu tirada, y su mensaje es directo: los ciclos cambian. Si llevas tiempo en un período de estancamiento laboral, ese ciclo está llegando a su fin. Pero los cambios no ocurren solos — requieren que tú te muevas también. ¿Qué oportunidad tienes ahora mismo que no estás aprovechando?",
    "El Siete de Copas me habla de una persona que tiene demasiadas opciones sobre la mesa y no avanza en ninguna. Eso genera la sensación de estar ocupada sin progresar. Las cartas te piden claridad radical: elige una dirección, la que sea, y comprométete con ella. ¿Cuál es el proyecto o idea que más te ilusiona pero al que menos tiempo dedicas?",
  ],
  3: [ // Isadora — Espiritualidad
    "Lo que sientes no es confusión, es expansión. La Sacerdotisa ha aparecido en tu tirada, y ella siempre llega cuando el alma está en un umbral — entre lo que fuiste y lo que estás becoming. Este período que describes como pérdida de rumbo es en realidad un período de escucha profunda. ¿Cuándo fue la última vez que te sentaste en silencio a preguntarte qué necesitas realmente?",
    "Las cartas muestran la presencia poderosa de El Juicio. Esta es la carta de los grandes despertares, de las llamadas del alma que no podemos seguir ignorando. No es casualidad que estés aquí hoy. Hay algo que sientes que debes cambiar, algo que llevas tiempo sabiendo pero que da miedo nombrar. ¿Qué es lo que sabes y que aún no has dicho en voz alta?",
    "El mundo espiritual habla a través de sincronías, y la tuya es clara: El Colgado ha aparecido. No es una carta de sufrimiento — es una carta de pausa sagrada. A veces el universo nos pide que soltemos el control para ver desde un ángulo diferente. ¿Qué estarías dispuesta a soltar si supieras que del otro lado hay algo mejor?",
    "Hay una energía kármica muy presente en tu lectura, y viene con La Luna. Esta carta nos habla de lo que heredamos — patrones familiares, creencias que no son nuestras, miedos que llevan más de una generación en nuestra sangre. El camino espiritual que describes empieza exactamente ahí, en reconocer qué es tuyo y qué no lo es. ¿De quién crees que heredaste la forma en que te relacionas con el miedo?",
    "El As de Copas ha aparecido en tu tirada, y es un regalo del universo. Esta carta marca el inicio de un nuevo ciclo emocional y espiritual — una apertura del corazón que viene después de un período de cierre necesario. El alma sabe cuándo está lista. Y la tuya lo está. ¿Qué forma de amor o conexión llevas tiempo deseando pero no te has permitido buscar?",
  ],
};

// Contador para rotar respuestas
const _demoIdx = {1:0, 2:0, 3:0};

async function llamarIA(tarotista, usuario, historial){
  // Simular delay natural de escritura (1.5 a 3 segundos)
  await new Promise(r=>setTimeout(r, 1500 + Math.random()*1500));
  const banco = DEMO[tarotista.id];
  const idx = _demoIdx[tarotista.id] % banco.length;
  _demoIdx[tarotista.id]++;
  // Personalizar con el nombre del usuario
  return banco[idx].replace(/\{nombre\}/g, usuario.nombre.split(" ")[0]);
}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');
*{margin:0;padding:0;box-sizing:border-box}html{scroll-behavior:smooth}body{background:#05030f;overflow-x:hidden;-webkit-tap-highlight-color:transparent}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#05030f}::-webkit-scrollbar-thumb{background:rgba(192,132,252,0.3);border-radius:2px}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{box-shadow:0 0 20px rgba(192,132,252,0.2)}50%{box-shadow:0 0 40px rgba(192,132,252,0.5)}}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes orb{0%,100%{transform:translate(0,0)}33%{transform:translate(30px,-20px)}66%{transform:translate(-20px,10px)}}
@media(hover:hover){.btn-glow:hover{box-shadow:0 8px 40px rgba(147,51,234,0.6)!important;transform:translateY(-2px)}.tc:hover{transform:translateY(-8px)}}
.tc{transition:transform 0.3s ease}.btn-glow{transition:all 0.3s}
input,select,button{-webkit-appearance:none}
`;


// ── HOOK: estado online de tarotistas desde Firebase ─────────────────────────
function useEstadoTarotistas(){
  const[estados,setEstados]=useState({1:true,2:true,3:false}); // defaults
  useEffect(()=>{
    const r=ref(db,"estados");
    const unsub=onValue(r,snap=>{
      if(snap.exists()) setEstados(snap.val());
    });
    return()=>unsub();
  },[]);
  return estados;
}

function useMobile(){const[m,setM]=useState(window.innerWidth<768);useEffect(()=>{const f=()=>setM(window.innerWidth<768);window.addEventListener("resize",f);return()=>window.removeEventListener("resize",f)},[]);return m;}
function useScroll(){const[s,setS]=useState(0);useEffect(()=>{const f=()=>setS(window.scrollY);window.addEventListener("scroll",f);return()=>window.removeEventListener("scroll",f)},[]);return s;}

function Particles(){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext("2d");
    const r=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};r();
    const n=window.innerWidth<768?35:70;
    const ps=Array.from({length:n},()=>({x:Math.random()*c.width,y:Math.random()*c.height,s:Math.random()*1.5+0.3,sy:-(Math.random()*0.4+0.1),sx:(Math.random()-.5)*.2,o:Math.random()*.6+.2}));
    let id;const a=()=>{ctx.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.y+=p.sy;p.x+=p.sx;if(p.y<0){p.y=c.height;p.x=Math.random()*c.width;}ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,Math.PI*2);ctx.fillStyle=`rgba(192,132,252,${p.o})`;ctx.fill();});id=requestAnimationFrame(a);};a();
    window.addEventListener("resize",r);return()=>{cancelAnimationFrame(id);window.removeEventListener("resize",r);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",top:0,left:0,pointerEvents:"none",zIndex:0}}/>;
}

function Orbs({m}){return(
  <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
    <div style={{position:"absolute",top:"10%",left:"5%",width:m?"220px":"400px",height:m?"220px":"400px",borderRadius:"50%",background:"radial-gradient(circle,rgba(147,51,234,0.08),transparent 70%)",animation:"orb 12s ease-in-out infinite"}}/>
    <div style={{position:"absolute",bottom:"20%",right:"5%",width:m?"180px":"300px",height:m?"180px":"300px",borderRadius:"50%",background:"radial-gradient(circle,rgba(96,165,250,0.06),transparent 70%)",animation:"orb 16s ease-in-out infinite reverse"}}/>
  </div>
);}

function Nav({pagina,ir,m}){
  const[open,setOpen]=useState(false);
  const sc=useScroll();
  const links=[{l:"Tarotistas",k:"tarotistas"},{l:"Créditos",k:"creditos"}];
  return(<>
    <nav style={{padding:m?"14px 16px":"20px 40px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:sc>50?"1px solid rgba(192,132,252,0.1)":"1px solid transparent",background:sc>50?"rgba(5,3,15,0.88)":"transparent",backdropFilter:sc>50?"blur(20px)":"none",position:"sticky",top:0,zIndex:50,transition:"all 0.4s"}}>
      <button onClick={()=>ir("inicio")} style={{display:"flex",alignItems:"center",gap:"8px",background:"none",border:"none",cursor:"pointer"}}>
        <span style={{fontSize:"18px"}}>🔮</span>
        <span style={{fontFamily:"'Cinzel',serif",fontSize:"17px",color:"#fff",letterSpacing:"3px"}}>ARCANA</span>
      </button>
      {m?<button onClick={()=>setOpen(!open)} style={{background:"none",border:"1px solid rgba(192,132,252,0.25)",borderRadius:"8px",color:"rgba(255,255,255,0.7)",padding:"7px 12px",cursor:"pointer",fontSize:"15px"}}>☰</button>
      :<div style={{display:"flex",gap:"32px"}}>
        {links.map(({l,k})=><a key={k} href="#" onClick={e=>{e.preventDefault();ir(k);}} style={{fontFamily:"'Cormorant Garamond',serif",color:pagina===k?"#c084fc":"rgba(255,255,255,0.5)",textDecoration:"none",fontSize:"16px",transition:"color 0.2s",borderBottom:pagina===k?"1px solid rgba(192,132,252,0.4)":"none",paddingBottom:"2px"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color=pagina===k?"#c084fc":"rgba(255,255,255,0.5)"}>{l}</a>)}
      </div>}
    </nav>
    {open&&m&&<div style={{position:"fixed",top:"56px",left:0,right:0,zIndex:49,background:"rgba(10,6,24,0.98)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(192,132,252,0.1)",padding:"16px",animation:"fadeIn 0.2s ease"}}>
      {links.map(({l,k})=><a key={k} href="#" onClick={e=>{e.preventDefault();setOpen(false);ir(k);}} style={{display:"block",fontFamily:"'Cormorant Garamond',serif",color:"rgba(255,255,255,0.75)",textDecoration:"none",fontSize:"20px",padding:"14px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>{l}</a>)}
    </div>}
  </>);}

function Footer(){return(
  <footer style={{borderTop:"1px solid rgba(192,132,252,0.1)",padding:"32px",textAlign:"center"}}>
    <div style={{display:"flex",alignItems:"center",gap:"8px",justifyContent:"center",marginBottom:"10px"}}>
      <span>🔮</span><span style={{fontFamily:"'Cinzel',serif",fontSize:"15px",color:"#fff",letterSpacing:"3px"}}>ARCANA</span>
    </div>
    <p style={{color:"rgba(255,255,255,0.25)",fontSize:"13px"}}>© 2025 Arcana · Tarot & Consultas Espirituales</p>
    <p style={{color:"rgba(255,255,255,0.15)",fontSize:"11px",marginTop:"6px"}}>Las lecturas de tarot son para entretenimiento y orientación espiritual.</p>
  </footer>
);}

// ── BASE DE USUARIOS (simulada en memoria) ────────────────────────────────────
// En producción esto vivría en Firebase. Aquí simulamos el registro y login.
const USUARIOS_DB = {};

function guardarUsuario(email, datos){
  USUARIOS_DB[email.toLowerCase()] = { ...datos, creditos: crearCreditos(20) };
}
function buscarUsuario(email){
  return USUARIOS_DB[email.toLowerCase()] || null;
}

// ── INPUT COMPARTIDO ──────────────────────────────────────────────────────────
function Campo({label, type="text", placeholder, value, onChange, error, dark=true}){
  const bg = dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)";
  const border = error ? "1px solid #f87171" : "1px solid rgba(192,132,252,0.2)";
  return(
    <div>
      <label style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"13px",color:"rgba(255,255,255,0.5)",display:"block",marginBottom:"5px"}}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} autoComplete="on"
        style={{width:"100%",padding:"13px 15px",background:bg,border,borderRadius:"10px",color:"#fff",fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",outline:"none",boxSizing:"border-box",WebkitAppearance:"none"}}/>
      {error&&<p style={{color:"#f87171",fontSize:"12px",marginTop:"3px"}}>{error}</p>}
    </div>
  );
}

// ── MODAL REGISTRO / LOGIN ────────────────────────────────────────────────────
function ModalRegistro({t,onClose,onOk}){
  const m=useMobile();
  const[vista,setVista]=useState("registro"); // "registro" | "login" | "exito"
  const[form,setForm]=useState({nombre:"",email:"",tel:"",pais:""});
  const[loginEmail,setLoginEmail]=useState("");
  const[load,setLoad]=useState(false);
  const[err,setErr]=useState({});
  const[loginErr,setLoginErr]=useState("");

  const sh={position:"fixed",inset:0,zIndex:100,background:"rgba(5,3,15,0.94)",backdropFilter:"blur(12px)",
    display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",padding:m?0:"20px"};
  const bx={background:"linear-gradient(145deg,#0d0a1a,#130d24)",border:"1px solid rgba(192,132,252,0.25)",
    borderRadius:m?"24px 24px 0 0":"24px",padding:m?"28px 20px 44px":"40px",
    width:"100%",maxWidth:m?"100%":"440px",position:"relative",maxHeight:m?"92vh":"auto",overflowY:"auto"};

  const valRegistro=()=>{
    const e={};
    if(!form.nombre.trim())e.nombre="Requerido";
    if(!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))e.email="Email no válido";
    if(!form.tel.match(/^\+?[\d\s\-]{7,15}$/))e.tel="No válido";
    if(!form.pais)e.pais="Selecciona país";
    setErr(e);return!Object.keys(e).length;
  };

  const handleRegistro=()=>{
    if(!valRegistro())return;
    // Comprobar si el email ya existe → redirigir a login
    if(buscarUsuario(form.email)){
      setErr({email:"Este email ya está registrado. Inicia sesión."});
      return;
    }
    setLoad(true);
    setTimeout(()=>{
      guardarUsuario(form.email, form);
      setLoad(false);
      setVista("exito");
    },1400);
  };

  const handleLogin=()=>{
    setLoginErr("");
    const usuario=buscarUsuario(loginEmail);
    if(!usuario){ setLoginErr("Email no encontrado. ¿Aún no tienes cuenta?"); return; }
    setLoad(true);
    setTimeout(()=>{
      setLoad(false);
      // Login exitoso — recuperamos sus datos y créditos
      onOk({...usuario, email:loginEmail}, t, usuario.creditos);
    },1000);
  };

  const iconoCabecera=(
    <div style={{textAlign:"center",marginBottom:"20px"}}>
      <div style={{width:"52px",height:"52px",borderRadius:"50%",background:`radial-gradient(circle,${t.color}33,transparent)`,border:`1px solid ${t.color}66`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"22px"}}>{t.icono}</div>
      <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.7)",textTransform:"uppercase",marginBottom:"4px"}}>Consulta con</p>
      <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"22px",color:"#fff"}}>{t.nombre}</h2>
    </div>
  );

  // Tabs registro / login
  const tabs=(
    <div style={{display:"flex",background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"3px",marginBottom:"22px"}}>
      {[{k:"registro",l:"Nueva cuenta"},{k:"login",l:"Ya tengo cuenta"}].map(({k,l})=>(
        <button key={k} onClick={()=>{setVista(k);setErr({});setLoginErr("");}} style={{flex:1,padding:"9px",background:vista===k?"linear-gradient(135deg,#9333ea,#7e22ce)":"transparent",border:"none",borderRadius:"8px",color:vista===k?"#fff":"rgba(255,255,255,0.4)",fontFamily:"'Cinzel',serif",fontSize:"11px",letterSpacing:"1.5px",cursor:"pointer",transition:"all 0.2s"}}>{l}</button>
      ))}
    </div>
  );

  return(
    <div style={sh}>
      <div style={bx}>
        {m&&<div style={{width:"40px",height:"4px",background:"rgba(255,255,255,0.2)",borderRadius:"2px",margin:"0 auto 20px"}}/>}
        <button onClick={onClose} style={{position:"absolute",top:"16px",right:"16px",background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:"22px",cursor:"pointer"}}>✕</button>

        {vista==="exito"?(
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{width:"72px",height:"72px",borderRadius:"50%",background:"radial-gradient(circle,rgba(192,132,252,0.3),transparent)",border:"1px solid rgba(192,132,252,0.5)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:"32px"}}>✨</div>
            <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"22px",color:"#fff",marginBottom:"8px"}}>¡Bienvenida, {form.nombre.split(" ")[0]}!</h2>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"rgba(255,255,255,0.55)",marginBottom:"16px",lineHeight:1.6}}>El universo te ha concedido</p>
            <div style={{fontSize:"52px",fontFamily:"'Cinzel',serif",color:"#c084fc",textShadow:"0 0 30px rgba(192,132,252,0.6)",marginBottom:"4px"}}>20</div>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"rgba(255,255,255,0.6)",marginBottom:"6px"}}>créditos de bienvenida</p>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"12px",color:"rgba(255,255,255,0.35)",marginBottom:"22px"}}>⏳ Válidos durante 90 días · úsalos o perderás la energía acumulada</p>
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"13px",color:"rgba(255,255,255,0.4)",marginBottom:"24px"}}>Cada respuesta consume <strong style={{color:"#c084fc"}}>5 créditos</strong></p>
            <button onClick={()=>onOk(form,t,null)} style={{padding:"14px 28px",background:"linear-gradient(135deg,#9333ea,#c084fc)",border:"none",borderRadius:"12px",color:"#fff",fontFamily:"'Cinzel',serif",fontSize:"13px",letterSpacing:"2px",cursor:"pointer"}}>INICIAR CONSULTA</button>
          </div>

        ):vista==="login"?(
          <>
            {iconoCabecera}
            {tabs}
            <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"14px",color:"rgba(255,255,255,0.45)",marginBottom:"18px",textAlign:"center",lineHeight:1.6}}>
              Introduce tu email y recuperarás tu cuenta, tus créditos y el historial de tus consultas.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <Campo label="Tu correo electrónico" type="email" placeholder="tu@email.com" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} error={loginErr}/>
              <button onClick={handleLogin} disabled={load} style={{padding:"14px",background:load?"rgba(192,132,252,0.3)":"linear-gradient(135deg,#9333ea,#c084fc)",border:"none",borderRadius:"12px",color:"#fff",fontFamily:"'Cinzel',serif",fontSize:"13px",letterSpacing:"2px",cursor:load?"not-allowed":"pointer",marginTop:"4px"}}>
                {load?"VERIFICANDO...":"ENTRAR A MI CUENTA"}
              </button>
              <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"12px",color:"rgba(255,255,255,0.3)",textAlign:"center"}}>
                Solo necesitamos tu email — sin contraseña, sin complicaciones.
              </p>
            </div>
          </>

        ):(
          <>
            {iconoCabecera}
            {tabs}
            <div style={{padding:"8px 14px",background:"rgba(192,132,252,0.07)",border:"1px solid rgba(192,132,252,0.18)",borderRadius:"10px",marginBottom:"18px",textAlign:"center"}}>
              <span style={{fontFamily:"'Cormorant Garamond',serif",color:"#c084fc",fontSize:"13px"}}>🎁 20 créditos gratis · válidos 90 días</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"13px"}}>
              <Campo label="Nombre" placeholder="Tu nombre" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} error={err.nombre}/>
              <Campo label="Email" type="email" placeholder="tu@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} error={err.email}/>
              <Campo label="Teléfono" type="tel" placeholder="+34 600 000 000" value={form.tel} onChange={e=>setForm({...form,tel:e.target.value})} error={err.tel}/>
              <div>
                <label style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"13px",color:"rgba(255,255,255,0.5)",display:"block",marginBottom:"5px"}}>País</label>
                <select value={form.pais} onChange={e=>setForm({...form,pais:e.target.value})} style={{width:"100%",padding:"13px 15px",background:"#0d0a1a",border:err.pais?"1px solid #f87171":"1px solid rgba(192,132,252,0.2)",borderRadius:"10px",color:form.pais?"#fff":"rgba(255,255,255,0.35)",fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",outline:"none",boxSizing:"border-box",cursor:"pointer"}}>
                  <option value="" disabled>Selecciona tu país</option>
                  {PAISES.map(p=><option key={p} value={p} style={{background:"#0d0a1a",color:"#fff"}}>{p}</option>)}
                </select>
                {err.pais&&<p style={{color:"#f87171",fontSize:"12px",marginTop:"3px"}}>{err.pais}</p>}
              </div>
              <button onClick={handleRegistro} disabled={load} style={{marginTop:"4px",padding:"14px",background:load?"rgba(192,132,252,0.3)":"linear-gradient(135deg,#9333ea,#c084fc)",border:"none",borderRadius:"12px",color:"#fff",fontFamily:"'Cinzel',serif",fontSize:"13px",letterSpacing:"2px",cursor:load?"not-allowed":"pointer"}}>
                {load?"CREANDO TU CUENTA...":"CREAR MI CUENTA"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModalPago({onClose,onPago}){
  const m=useMobile();
  const[sel,setSel]=useState(2);
  const[met,setMet]=useState("stripe");
  const pack=PACKS.find(p=>p.id===sel);
  return(
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(5,3,15,0.96)",backdropFilter:"blur(16px)",display:"flex",alignItems:m?"flex-end":"center",justifyContent:"center",padding:m?0:"20px"}}>
      <div style={{background:"linear-gradient(145deg,#0d0a1a,#130d24)",border:"1px solid rgba(192,132,252,0.25)",borderRadius:m?"24px 24px 0 0":"24px",padding:m?"24px 18px 44px":"40px",width:"100%",maxWidth:m?"100%":"480px",position:"relative",maxHeight:m?"90vh":"auto",overflowY:"auto"}}>
        {m&&<div style={{width:"40px",height:"4px",background:"rgba(255,255,255,0.2)",borderRadius:"2px",margin:"0 auto 18px"}}/>}
        <button onClick={onClose} style={{position:"absolute",top:"14px",right:"14px",background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:"22px",cursor:"pointer"}}>✕</button>
        <div style={{textAlign:"center",marginBottom:"22px"}}>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.7)",textTransform:"uppercase",marginBottom:"6px"}}>Recarga tu energía</p>
          <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"22px",color:"#fff"}}>Elige tu paquete</h2>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"20px"}}>
          {PACKS.map(pk=>(
            <div key={pk.id} onClick={()=>setSel(pk.id)} style={{padding:"13px 16px",background:sel===pk.id?"rgba(192,132,252,0.1)":"rgba(255,255,255,0.03)",border:sel===pk.id?"1px solid rgba(192,132,252,0.5)":"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative"}}>
              {pk.popular&&<div style={{position:"absolute",top:"-9px",left:"50%",transform:"translateX(-50%)",background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:"100px",padding:"2px 12px",fontFamily:"'Cinzel',serif",fontSize:"9px",color:"#fff",letterSpacing:"1px",whiteSpace:"nowrap"}}>MÁS POPULAR</div>}
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <div style={{width:"18px",height:"18px",borderRadius:"50%",border:`2px solid ${sel===pk.id?"#c084fc":"rgba(255,255,255,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {sel===pk.id&&<div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#c084fc"}}/>}
                </div>
                <div>
                  <div style={{fontFamily:"'Cinzel',serif",color:"#fff",fontSize:"17px"}}>{pk.cr} créditos</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",color:"rgba(255,255,255,0.4)",fontSize:"13px"}}>{pk.label}{pk.ahorro?" · "+pk.ahorro:""}</div>
                </div>
              </div>
              <div style={{fontFamily:"'Cinzel',serif",color:sel===pk.id?"#c084fc":"rgba(255,255,255,0.7)",fontSize:"18px"}}>{pk.precio}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:"18px"}}>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"12px",letterSpacing:"2px",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",marginBottom:"10px"}}>Método de pago</p>
          <div style={{display:"flex",gap:"8px"}}>
            {[{id:"stripe",l:"💳 Tarjeta"},{id:"paypal",l:"🅿️ PayPal"},{id:"klarna",l:"🟣 Klarna"}].map(({id,l})=>(
              <button key={id} onClick={()=>setMet(id)} style={{flex:1,padding:"10px 4px",background:met===id?"rgba(192,132,252,0.15)":"rgba(255,255,255,0.03)",border:met===id?"1px solid rgba(192,132,252,0.4)":"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",color:"#fff",fontFamily:"'Cormorant Garamond',serif",fontSize:"12px",cursor:"pointer"}}>{l}</button>
            ))}
          </div>
        </div>
        <button onClick={()=>onPago(pack)} style={{width:"100%",padding:"15px",background:"linear-gradient(135deg,#9333ea,#c084fc)",border:"none",borderRadius:"14px",color:"#fff",fontFamily:"'Cinzel',serif",fontSize:"13px",letterSpacing:"2px",cursor:"pointer"}}>
          COMPLETAR PAGO · {pack?.precio}
        </button>
        <p style={{textAlign:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:"12px",color:"rgba(255,255,255,0.25)",marginTop:"12px"}}>🔒 Pago 100% seguro y encriptado</p>
      </div>
    </div>
  );
}


// ── BANNER DE AVISO DE CADUCIDAD ─────────────────────────────────────────────
function BannerCaducidad({creditos, onRecargar, compact=false}){
  const prox = proximoACaducar(creditos);
  if(!prox) return null;
  const dias = diasRestantes(prox);
  const total = creditosValidos(creditos).length;
  if(total===0 || dias > 15) return null; // Solo mostrar si quedan ≤15 días

  const urgente = dias <= 3;
  const bg = urgente
    ? "linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.08))"
    : "linear-gradient(135deg,rgba(251,191,36,0.12),rgba(251,191,36,0.06))";
  const border = urgente ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(251,191,36,0.3)";
  const color = urgente ? "#f87171" : "#fbbf24";
  const icono = urgente ? "🔴" : "⚠️";

  const msg = urgente
    ? `¡${dias===0?"Hoy":"En "+dias+(dias===1?" día":" días")} caducan tus ${total} créditos!`
    : `Tus ${total} créditos caducan en ${dias} días`;
  const sub = urgente
    ? "Úsalos antes de que el universo los reclame."
    : "Recarga o úsalos antes de los 90 días.";

  if(compact) return(
    <div style={{margin:"0 0 10px",padding:"10px 14px",background:bg,border,borderRadius:"10px",display:"flex",alignItems:"center",gap:"10px",animation:"fadeIn 0.4s ease"}}>
      <span style={{fontSize:"14px"}}>{icono}</span>
      <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"13px",color,flex:1}}>{msg} · {sub}</span>
      {onRecargar&&<button onClick={onRecargar} style={{padding:"5px 12px",background:urgente?"rgba(239,68,68,0.2)":"rgba(251,191,36,0.15)",border,borderRadius:"8px",color,fontFamily:"'Cinzel',serif",fontSize:"10px",letterSpacing:"1px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>RECARGAR</button>}
    </div>
  );

  return(
    <div style={{margin:"0 16px 12px",padding:"14px 18px",background:bg,border,borderRadius:"14px",display:"flex",alignItems:urgente?"center":"flex-start",gap:"12px",animation:"fadeIn 0.4s ease",flexWrap:"wrap"}}>
      <span style={{fontSize:"18px",flexShrink:0}}>{icono}</span>
      <div style={{flex:1,minWidth:"160px"}}>
        <p style={{fontFamily:"'Cinzel',serif",fontSize:"13px",color,marginBottom:"2px"}}>{msg}</p>
        <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"12px",color:"rgba(255,255,255,0.45)"}}>{sub}</p>
      </div>
      {onRecargar&&<button onClick={onRecargar} style={{padding:"8px 16px",background:urgente?"rgba(239,68,68,0.2)":"rgba(251,191,36,0.15)",border,borderRadius:"10px",color,fontFamily:"'Cinzel',serif",fontSize:"11px",letterSpacing:"1.5px",cursor:"pointer",flexShrink:0}}>RECARGAR</button>}
    </div>
  );
}

function Chat({usuario,t,onBack}){
  const m=useMobile();
  const hora=()=>new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});
  const[sesionId,setSesionId]=useState(null);

  // Crear sesión en Firebase al iniciar chat
  useEffect(()=>{
    const nuevaSesion={
      tarotistaid:t.id,
      cliente:{nombre:usuario.nombre,email:usuario.email,pais:usuario.pais},
      inicio:Date.now(),
      creditos:20,
    };
    const r=push(ref(db,"conversaciones"),nuevaSesion);
    setSesionId(r.key);
  },[]);
  const bienvenidas={
    1:`Bienvenida, ${usuario.nombre.split(" ")[0]}... Siento tu energía al otro lado. Las cartas ya se han movido. ¿Qué lleva tu corazón hoy?`,
    2:`${usuario.nombre.split(" ")[0]}, qué bien que hayas llegado. Las cartas tienen algo que decirte. ¿Qué situación quieres iluminar hoy?`,
    3:`${usuario.nombre.split(" ")[0]}... Respira. Estoy aquí. El universo te ha traído hasta este momento por algo. ¿Qué necesita tu alma hoy?`,
  };
  const[creditos,setCreditos]=useState(()=>crearCreditos(20)); // 20 créditos iniciales con caducidad 90 días
  const[msgs,setMsgs]=useState([{de:"t",txt:bienvenidas[t.id]||bienvenidas[1],h:hora()}]);
  const[inp,setInp]=useState("");
  const[wait,setWait]=useState(false);
  const[pago,setPago]=useState(false);
  const[err,setErr]=useState(false);
  const bot=useRef(null);
  useEffect(()=>{bot.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const send=async()=>{
    if(!inp.trim()||wait)return;
    if(creditosValidos(creditos).length<5){setPago(true);return;}
    const texto=inp;
    const nuevosMsgs=[...msgs,{de:"u",txt:texto,h:hora()}];
    setMsgs(nuevosMsgs);
    setInp("");setWait(true);setErr(false);
    try{
      // Pasamos el historial completo para que la IA tenga contexto de toda la conversación
      const respuesta=await llamarIA(t,usuario,nuevosMsgs);
      setMsgs(p=>[...p,{de:"t",txt:respuesta,h:hora()}]);
      setCreditos(p=>consumirCreditos(p,5));
    }catch(e){
      setErr(true);
      setMsgs(p=>[...p,{de:"sistema",txt:"Las cartas guardan silencio... Inténtalo de nuevo.",h:hora()}]);
    }finally{setWait(false);}
  };
  return(
    <div style={{height:"100dvh",display:"flex",flexDirection:"column",background:"linear-gradient(180deg,#05030f,#0a0618,#050310)",fontFamily:"'Cormorant Garamond',serif",overflow:"hidden"}}>
      <div style={{padding:m?"12px 14px":"14px 24px",borderBottom:"1px solid rgba(192,132,252,0.15)",background:"rgba(5,3,15,0.95)",backdropFilter:"blur(20px)",display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontSize:"22px",cursor:"pointer",padding:"4px 8px 4px 0"}}>←</button>
        <div style={{width:"38px",height:"38px",borderRadius:"50%",background:`radial-gradient(circle,${t.color}33,transparent)`,border:`1px solid ${t.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px",flexShrink:0}}>{t.icono}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"'Cinzel',serif",color:"#fff",fontSize:"15px"}}>{t.nombre}</div>
          <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.esp}</div>
        </div>
        {(()=>{
          const cv=creditosValidos(creditos);
          const n=cv.length;
          const prox=proximoACaducar(creditos);
          const dias=prox?diasRestantes(prox):0;
          return(
          <div style={{padding:"6px 11px",background:n>5?"rgba(192,132,252,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${n>5?"rgba(192,132,252,0.3)":"rgba(239,68,68,0.3)"}`,borderRadius:"100px",display:"flex",alignItems:"center",gap:"5px",flexShrink:0}}>
            <span style={{fontSize:"11px"}}>✦</span>
            <span style={{fontFamily:"'Cinzel',serif",fontSize:"14px",color:n>5?"#c084fc":"#f87171"}}>{n}</span>
            {n>0&&n<=10&&<span style={{fontSize:"10px",color:"rgba(192,132,252,0.5)",marginLeft:"1px"}}>·{dias}d</span>}
          </div>);
        })()}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:m?"14px 12px":"20px 16px",WebkitOverflowScrolling:"touch"}}>
        <div style={{maxWidth:"640px",margin:"0 auto"}}>
          {msgs.map((msg,i)=>(
            <div key={i} style={{display:"flex",justifyContent:msg.de==="u"?"flex-end":"flex-start",marginBottom:"12px",animation:"fadeIn 0.3s ease"}}>
              {msg.de==="t"&&<div style={{width:"28px",height:"28px",borderRadius:"50%",background:`radial-gradient(circle,${t.color}33,transparent)`,border:`1px solid ${t.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",marginRight:"7px",flexShrink:0,alignSelf:"flex-end"}}>{t.icono}</div>}
              {msg.de==="sistema"&&<div style={{width:"28px",height:"28px",borderRadius:"50%",background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",marginRight:"7px",flexShrink:0,alignSelf:"flex-end"}}>⚠</div>}
              <div style={{maxWidth:"80%"}}>
                <div style={{padding:m?"10px 13px":"12px 16px",
                  background:msg.de==="u"?"linear-gradient(135deg,#9333ea,#7e22ce)":msg.de==="sistema"?"rgba(239,68,68,0.08)":"rgba(255,255,255,0.05)",
                  border:msg.de==="t"?`1px solid rgba(192,132,252,0.15)`:msg.de==="sistema"?"1px solid rgba(239,68,68,0.2)":"none",
                  borderRadius:msg.de==="u"?"16px 16px 4px 16px":"4px 16px 16px 16px",color:msg.de==="sistema"?"rgba(255,100,100,0.8)":"#fff",fontSize:m?"15px":"16px",lineHeight:1.6}}>{msg.txt}</div>
                <div style={{fontSize:"11px",color:"rgba(255,255,255,0.22)",marginTop:"3px",textAlign:msg.de==="u"?"right":"left"}}>{msg.h}</div>
              </div>
            </div>
          ))}
          {wait&&<div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"12px"}}>
            <div style={{width:"28px",height:"28px",borderRadius:"50%",background:`radial-gradient(circle,${t.color}33,transparent)`,border:`1px solid ${t.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px"}}>{t.icono}</div>
            <div style={{padding:"11px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(192,132,252,0.15)",borderRadius:"4px 16px 16px 16px",display:"flex",gap:"5px",alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",background:"#c084fc",animation:`bounce 1s ${i*.2}s infinite`}}/>)}
            </div>
          </div>}
          <div ref={bot}/>
        </div>
      </div>
      <div style={{background:"rgba(5,3,15,0.97)",flexShrink:0}}>
        <BannerCaducidad creditos={creditos} onRecargar={()=>setPago(true)} compact={true}/>
      <div style={{padding:m?"10px 12px 16px":"14px 24px",borderTop:"1px solid rgba(192,132,252,0.15)"}}>
        {creditosValidos(creditos).length===0?<div style={{textAlign:"center",padding:"8px 0"}}>
          <p style={{color:"rgba(255,255,255,0.5)",fontSize:"14px",marginBottom:"10px"}}>Has agotado tus créditos</p>
          <button onClick={()=>setPago(true)} style={{padding:"12px 24px",background:"linear-gradient(135deg,#9333ea,#c084fc)",border:"none",borderRadius:"12px",color:"#fff",fontFamily:"'Cinzel',serif",fontSize:"12px",letterSpacing:"2px",cursor:"pointer"}}>RECARGAR CRÉDITOS</button>
        </div>:<>
          <div style={{display:"flex",gap:"9px",maxWidth:"640px",margin:"0 auto"}}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escribe tu pregunta..."
              style={{flex:1,padding:"13px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(192,132,252,0.2)",borderRadius:"12px",color:"#fff",fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",outline:"none"}}/>
            <button onClick={send} disabled={!inp.trim()||wait} style={{padding:"13px 16px",background:inp.trim()&&!wait?"linear-gradient(135deg,#9333ea,#c084fc)":"rgba(255,255,255,0.05)",border:"1px solid rgba(192,132,252,0.2)",borderRadius:"12px",color:"#fff",fontSize:"18px",cursor:inp.trim()&&!wait?"pointer":"not-allowed",flexShrink:0}}>→</button>
          </div>
          <p style={{textAlign:"center",fontSize:"11px",color:"rgba(255,255,255,0.2)",marginTop:"6px"}}>Cada respuesta consume 5 créditos · Quedan {creditosValidos(creditos).length}</p>
        </>}
      </div>
      {pago&&<ModalPago onClose={()=>setPago(false)} onPago={pk=>{setCreditos(p=>[...p,...crearCreditos(pk.cr)]);setPago(false);}}/>}
      </div>
    </div>
  );
}

// ── PÁGINAS ───────────────────────────────────────────────────────────────────

function PaginaInicio({ir,abrirModal,m,creditos,onMostrarRecarga}){
  const estadosTarotistas=useEstadoTarotistas();
  const isOnline=(t)=>estadosTarotistas[t.id]??t.disponible;
  const px=m?"16px":"40px";
  return(
    <div style={{position:"relative",zIndex:1,minHeight:"100vh",background:"linear-gradient(180deg,#05030f 0%,#0a0618 50%,#050310 100%)",fontFamily:"'Cormorant Garamond',serif"}}>
      <Nav pagina="inicio" ir={ir} m={m}/>
      {creditos&&<div style={{maxWidth:"1100px",margin:"0 auto",padding:"12px 16px 0"}}><BannerCaducidad creditos={creditos} onRecargar={onMostrarRecarga}/></div>}
      {/* HERO */}
      <section style={{padding:m?"56px 16px 72px":"100px 40px 120px",textAlign:"center",maxWidth:"800px",margin:"0 auto"}}>
        <div style={{display:"inline-block",padding:"7px 18px",background:"rgba(192,132,252,0.08)",border:"1px solid rgba(192,132,252,0.2)",borderRadius:"100px",marginBottom:"28px"}}>
          <span style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.8)",textTransform:"uppercase"}}>✦ Las cartas te aguardan ✦</span>
        </div>
        <h1 style={{fontFamily:"'Cinzel',serif",fontSize:m?"36px":"clamp(48px,8vw,80px)",color:"#fff",lineHeight:1.15,marginBottom:"22px"}}>
          Descubre lo que<br/>
          <span style={{background:"linear-gradient(135deg,#c084fc,#9333ea,#60a5fa)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s linear infinite"}}>el universo</span><br/>
          guarda para ti
        </h1>
        <p style={{fontSize:m?"17px":"20px",lineHeight:1.7,color:"rgba(255,255,255,0.5)",maxWidth:"520px",margin:"0 auto 44px",fontStyle:"italic"}}>
          Conecta con nuestras tarotistas expertas y recibe una guía personalizada para el amor, el trabajo y tu camino espiritual.
        </p>
        <div style={{display:"flex",gap:m?"20px":"40px",justifyContent:"center",flexWrap:"wrap"}}>
          {[["2.600+","Consultas"],["4.9★","Valoración"],["3","Especialistas"]].map(([v,l])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:m?"22px":"28px",color:"#c084fc"}}>{v}</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",letterSpacing:"1px"}}>{l}</div>
            </div>
          ))}
        </div>
      </section>
      {/* CÓMO FUNCIONA */}
      <section style={{padding:`0 ${px} 72px`,maxWidth:"900px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"36px"}}>
          <p style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.6)",textTransform:"uppercase",marginBottom:"10px"}}>Simple y transparente</p>
          <h2 style={{fontFamily:"'Cinzel',serif",fontSize:m?"26px":"36px",color:"#fff"}}>Cómo funciona</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"repeat(3,1fr)",gap:"14px"}}>
          {[{n:"01",t:"Regístrate",d:"Crea tu cuenta en segundos y recibe 20 créditos de bienvenida · válidos durante 90 días (3 meses) completamente gratis.",i:"✨"},{n:"02",t:"Elige tu guía",d:"Selecciona la tarotista que conecte con tu energía según su especialidad.",i:"🔮"},{n:"03",t:"Consulta",d:"Cada respuesta de la tarotista son 5 créditos. Recarga cuando lo necesites.",i:"☽"}].map(it=>(
            <div key={it.n} style={{padding:"24px 20px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(192,132,252,0.1)",borderRadius:"18px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:"-18px",right:"-8px",fontFamily:"'Cinzel',serif",fontSize:"64px",color:"rgba(192,132,252,0.04)",lineHeight:1}}>{it.n}</div>
              <div style={{fontSize:"26px",marginBottom:"12px"}}>{it.i}</div>
              <h3 style={{fontFamily:"'Cinzel',serif",color:"#fff",fontSize:"16px",marginBottom:"7px"}}>{it.t}</h3>
              <p style={{color:"rgba(255,255,255,0.45)",fontSize:"14px",lineHeight:1.6}}>{it.d}</p>
            </div>
          ))}
        </div>
      </section>
      {/* TAROTISTAS preview */}
      <section style={{padding:`0 ${px} 90px`,maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"40px"}}>
          <p style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.6)",textTransform:"uppercase",marginBottom:"10px"}}>Nuestras guías</p>
          <h2 style={{fontFamily:"'Cinzel',serif",fontSize:m?"28px":"42px",color:"#fff"}}>Las Tarotistas</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"repeat(3,1fr)",gap:"18px"}}>
          {TAROTISTAS.map((t,idx)=>(
            <div key={t.id} className="tc" style={{background:"linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))",border:`1px solid ${t.color}33`,borderRadius:"22px",overflow:"hidden",position:"relative",animation:`fadeIn 0.6s ease ${idx*.1+.2}s both`,cursor:"pointer"}} onClick={()=>ir("tarotistas")}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${t.color}66,transparent)`}}/>
              {m?
                <div style={{padding:"20px 16px",display:"flex",gap:"14px",background:`radial-gradient(ellipse at 0% 50%,${t.color}08,transparent 60%)`}}>
                  <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:"8px"}}>
                    <div style={{width:"68px",height:"68px",borderRadius:"50%",background:`radial-gradient(circle at 35% 35%,${t.color}33,${t.color}08)`,border:`2px solid ${t.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"30px"}}>{t.icono}</div>
                    <div style={{display:"flex",alignItems:"center",gap:"4px",padding:"3px 8px",background:isOnline(t)?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.05)",border:`1px solid ${isOnline(t)?"rgba(52,211,153,0.3)":"rgba(255,255,255,0.1)"}`,borderRadius:"100px"}}>
                      <div style={{width:"5px",height:"5px",borderRadius:"50%",background:isOnline(t)?"#34d399":"rgba(255,255,255,0.3)"}}/>
                      <span style={{fontSize:"10px",color:isOnline(t)?"#34d399":"rgba(255,255,255,0.35)",fontFamily:"'Cinzel',serif",whiteSpace:"nowrap"}}>{isOnline(t)?"Online":"Ocupada"}</span>
                    </div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:"10px",letterSpacing:"2px",color:`${t.color}99`,textTransform:"uppercase",marginBottom:"3px"}}>{t.simbolo}</div>
                    <h3 style={{fontFamily:"'Cinzel',serif",fontSize:"20px",color:"#fff",marginBottom:"2px"}}>{t.nombre}</h3>
                    <p style={{fontSize:"12px",color:`${t.color}cc`,marginBottom:"10px"}}>{t.esp}</p>
                    <p style={{color:"rgba(255,255,255,0.45)",fontSize:"13px",lineHeight:1.6,marginBottom:"12px",fontStyle:"italic"}}>"{t.bio.slice(0,100)}…"</p>
                    <button onClick={e=>{e.stopPropagation();(estadosTarotistas[t.id]??t.disponible)&&abrirModal(t);}} style={{width:"100%",padding:"11px",background:isOnline(t)?`linear-gradient(135deg,${t.color}99,${t.color}55)`:"rgba(255,255,255,0.04)",border:`1px solid ${isOnline(t)?t.color+"66":"rgba(255,255,255,0.08)"}`,borderRadius:"10px",color:isOnline(t)?"#fff":"rgba(255,255,255,0.3)",fontFamily:"'Cinzel',serif",fontSize:"11px",letterSpacing:"1.5px",cursor:isOnline(t)?"pointer":"not-allowed"}}>
                      {isOnline(t)?"INICIAR CONSULTA":"NO DISPONIBLE"}
                    </button>
                  </div>
                </div>
              :<>
                <div style={{padding:"40px 26px 26px",textAlign:"center",background:`radial-gradient(ellipse at 50% 0%,${t.color}10,transparent 60%)`,position:"relative"}}>
                  <div style={{position:"absolute",top:"14px",right:"14px",display:"flex",alignItems:"center",gap:"5px",padding:"4px 10px",background:isOnline(t)?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.05)",border:`1px solid ${isOnline(t)?"rgba(52,211,153,0.3)":"rgba(255,255,255,0.1)"}`,borderRadius:"100px"}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"50%",background:isOnline(t)?"#34d399":"rgba(255,255,255,0.3)",animation:isOnline(t)?"pulse 2s infinite":"none"}}/>
                    <span style={{fontSize:"11px",color:isOnline(t)?"#34d399":"rgba(255,255,255,0.35)",fontFamily:"'Cinzel',serif"}}>{isOnline(t)?"En línea":"Ocupada"}</span>
                  </div>
                  <div style={{width:"96px",height:"96px",borderRadius:"50%",background:`radial-gradient(circle at 35% 35%,${t.color}33,${t.color}08)`,border:`2px solid ${t.color}44`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:"42px",animation:"float 6s ease-in-out infinite"}}>{t.icono}</div>
                  <div style={{fontSize:"10px",letterSpacing:"3px",color:`${t.color}99`,textTransform:"uppercase",marginBottom:"6px"}}>{t.simbolo}</div>
                  <h3 style={{fontFamily:"'Cinzel',serif",fontSize:"23px",color:"#fff",marginBottom:"4px"}}>{t.nombre}</h3>
                  <p style={{fontSize:"13px",color:`${t.color}cc`}}>{t.esp}</p>
                </div>
                <div style={{padding:"0 22px 22px"}}>
                  <p style={{color:"rgba(255,255,255,0.45)",fontSize:"14px",lineHeight:1.7,marginBottom:"16px",fontStyle:"italic"}}>"{t.bio.slice(0,130)}…"</p>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
                      <span style={{color:"#fbbf24",fontSize:"13px"}}>{"★".repeat(5)}</span>
                      <span style={{fontFamily:"'Cinzel',serif",color:"#fff",fontSize:"14px"}}>{t.rating}</span>
                    </div>
                    <span style={{fontSize:"12px",color:"rgba(255,255,255,0.3)"}}>{t.reviews.toLocaleString()} consultas</span>
                  </div>
                  <button onClick={e=>{e.stopPropagation();(estadosTarotistas[t.id]??t.disponible)&&abrirModal(t);}} className={isOnline(t)?"btn-glow":""} style={{width:"100%",padding:"13px",background:isOnline(t)?`linear-gradient(135deg,${t.color}99,${t.color}55)`:"rgba(255,255,255,0.04)",border:`1px solid ${isOnline(t)?t.color+"66":"rgba(255,255,255,0.08)"}`,borderRadius:"12px",color:isOnline(t)?"#fff":"rgba(255,255,255,0.3)",fontFamily:"'Cinzel',serif",fontSize:"12px",letterSpacing:"2px",cursor:isOnline(t)?"pointer":"not-allowed"}}>
                    {isOnline(t)?"INICIAR CONSULTA":"NO DISPONIBLE"}
                  </button>
                </div>
              </>}
            </div>
          ))}
        </div>
      </section>
      {/* CTA */}
      <section style={{margin:`0 ${px} 90px`,padding:m?"36px 20px":"60px 40px",background:"linear-gradient(135deg,rgba(147,51,234,0.12),rgba(96,165,250,0.06))",border:"1px solid rgba(192,132,252,0.2)",borderRadius:"26px",textAlign:"center",maxWidth:"1020px",marginLeft:"auto",marginRight:"auto"}}>
        <h2 style={{fontFamily:"'Cinzel',serif",fontSize:m?"24px":"36px",color:"#fff",marginBottom:"12px"}}>Empieza gratis hoy</h2>
        <p style={{fontSize:m?"15px":"18px",color:"rgba(255,255,255,0.5)",marginBottom:"32px",fontStyle:"italic"}}>Recibe 20 créditos de bienvenida · válidos durante 90 días (3 meses) y descubre lo que el tarot tiene para ti</p>
        <div style={{display:"flex",gap:"12px",justifyContent:"center",flexDirection:m?"column":"row"}}>
          {TAROTISTAS.filter(t=>isOnline(t)).map(t=>(
            <button key={t.id} onClick={()=>abrirModal(t)} className="btn-glow" style={{padding:"13px 22px",background:"linear-gradient(135deg,#9333ea,#c084fc)",border:"none",borderRadius:"14px",color:"#fff",fontFamily:"'Cinzel',serif",fontSize:"12px",letterSpacing:"2px",cursor:"pointer"}}>
              {t.icono} Consultar con {t.nombre}
            </button>
          ))}
        </div>
      </section>
      <Footer/>
    </div>
  );
}

function PaginaTarotistas({ir,abrirModal,m}){
  const estadosTarotistas=useEstadoTarotistas();
  const isOnline=(t)=>estadosTarotistas[t.id]??t.disponible;
  const px=m?"16px":"40px";
  const[perfil,setPerfil]=useState(null);
  if(perfil){const t=perfil;return(
    <div style={{position:"relative",zIndex:1,minHeight:"100vh",background:"linear-gradient(180deg,#05030f 0%,#0a0618 60%,#050310 100%)",fontFamily:"'Cormorant Garamond',serif"}}>
      <Nav pagina="tarotistas" ir={ir} m={m}/>
      <section style={{padding:m?"48px 16px 52px":"72px 40px 80px",maxWidth:"960px",margin:"0 auto"}}>
        <button onClick={()=>setPerfil(null)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.45)",fontFamily:"'Cormorant Garamond',serif",fontSize:"16px",cursor:"pointer",marginBottom:"32px",display:"flex",alignItems:"center",gap:"6px"}}
          onMouseEnter={e=>e.currentTarget.style.color="#fff"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>← Todas las tarotistas</button>
        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"280px 1fr",gap:m?"32px":"56px",alignItems:"start"}}>
          {/* LEFT */}
          <div style={{textAlign:m?"center":"left"}}>
            <div style={{width:m?"110px":"150px",height:m?"110px":"150px",borderRadius:"50%",background:`radial-gradient(circle at 35% 35%,${t.color}44,${t.color}10)`,border:`3px solid ${t.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:m?"48px":"64px",margin:m?"0 auto 22px":"0 0 24px",animation:"float 6s ease-in-out infinite"}}>{t.icono}</div>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px",justifyContent:m?"center":"flex-start"}}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",background:isOnline(t)?"#34d399":"rgba(255,255,255,0.3)",animation:isOnline(t)?"pulse 2s infinite":"none"}}/>
              <span style={{fontSize:"13px",color:isOnline(t)?"#34d399":"rgba(255,255,255,0.4)",fontFamily:"'Cinzel',serif"}}>{isOnline(t)?"Disponible ahora":"No disponible"}</span>
            </div>
            <div style={{fontSize:"11px",letterSpacing:"3px",color:`${t.color}99`,textTransform:"uppercase",marginBottom:"6px"}}>{t.simbolo}</div>
            <h1 style={{fontFamily:"'Cinzel',serif",fontSize:m?"30px":"40px",color:"#fff",marginBottom:"4px"}}>{t.nombre}</h1>
            <p style={{fontSize:"15px",color:`${t.color}cc`,marginBottom:"22px"}}>{t.esp}</p>
            <div style={{display:"flex",gap:"12px",justifyContent:m?"center":"flex-start",marginBottom:"24px",flexWrap:"wrap"}}>
              {[["⭐",t.rating,"Valoración"],["💬",t.reviews.toLocaleString(),"Consultas"],["🕐",t.exp,"Exp."]].map(([ic,v,l])=>(
                <div key={l} style={{textAlign:"center",padding:"10px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(192,132,252,0.12)",borderRadius:"14px"}}>
                  <div style={{fontSize:"14px",marginBottom:"2px"}}>{ic}</div>
                  <div style={{fontFamily:"'Cinzel',serif",color:"#fff",fontSize:"14px"}}>{v}</div>
                  <div style={{fontSize:"11px",color:"rgba(255,255,255,0.35)"}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"24px"}}>
              {[["🃏","Carta",t.simbolo],["🌊","Elemento",t.elemento],["🪐","Planeta",t.planeta],["🕐","Horario",t.horario],["🌍","Idiomas",t.idiomas]].map(([ic,l,v])=>(
                <div key={l} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 13px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(192,132,252,0.08)",borderRadius:"10px"}}>
                  <span style={{fontSize:"13px"}}>{ic}</span>
                  <span style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",minWidth:"58px"}}>{l}</span>
                  <span style={{fontSize:"13px",color:"rgba(255,255,255,0.7)"}}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>(estadosTarotistas[t.id]??t.disponible)&&abrirModal(t)} className={isOnline(t)?"btn-glow":""} style={{width:"100%",padding:"15px",background:isOnline(t)?`linear-gradient(135deg,${t.color}cc,${t.color}77)`:"rgba(255,255,255,0.04)",border:isOnline(t)?"none":"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",color:isOnline(t)?"#fff":"rgba(255,255,255,0.3)",fontFamily:"'Cinzel',serif",fontSize:"13px",letterSpacing:"2px",cursor:isOnline(t)?"pointer":"not-allowed"}}>
              {isOnline(t)?"INICIAR CONSULTA":"NO DISPONIBLE AHORA"}
            </button>
          </div>
          {/* RIGHT */}
          <div>
            <p style={{fontSize:"12px",letterSpacing:"3px",color:`${t.color}99`,textTransform:"uppercase",marginBottom:"14px"}}>Sobre mí</p>
            <p style={{fontSize:m?"16px":"18px",lineHeight:1.8,color:"rgba(255,255,255,0.65)",fontStyle:"italic",marginBottom:"32px"}}>"{t.bio}"</p>
            <p style={{fontSize:"12px",letterSpacing:"3px",color:`${t.color}99`,textTransform:"uppercase",marginBottom:"14px"}}>Especialidades</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"32px"}}>
              {t.especialidades.map(e=><div key={e} style={{padding:"7px 14px",background:`${t.color}14`,border:`1px solid ${t.color}33`,borderRadius:"100px",fontSize:"13px",color:`${t.color}dd`}}>{e}</div>)}
            </div>
            <p style={{fontSize:"12px",letterSpacing:"3px",color:`${t.color}99`,textTransform:"uppercase",marginBottom:"14px"}}>Lo que dicen mis clientes</p>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {t.citas.map((c,i)=>(
                <div key={i} style={{padding:"18px 20px",background:"rgba(255,255,255,0.02)",border:`1px solid ${t.color}22`,borderRadius:"14px",position:"relative"}}>
                  <div style={{position:"absolute",top:"14px",left:"18px",fontSize:"28px",color:`${t.color}25`,fontFamily:"serif",lineHeight:1}}>"</div>
                  <p style={{fontSize:"15px",color:"rgba(255,255,255,0.6)",lineHeight:1.7,fontStyle:"italic",paddingTop:"6px"}}>{c.t}</p>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginTop:"10px"}}>
                    <div style={{width:"26px",height:"26px",borderRadius:"50%",background:`${t.color}22`,border:`1px solid ${t.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px"}}>{c.a[0]}</div>
                    <span style={{fontSize:"13px",color:"rgba(255,255,255,0.5)"}}>{c.a} · {c.p}</span>
                    <span style={{marginLeft:"auto",color:"#fbbf24",fontSize:"12px"}}>{"★".repeat(5)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <Footer/>
    </div>
  );}

  return(
    <div style={{position:"relative",zIndex:1,minHeight:"100vh",background:"linear-gradient(180deg,#05030f 0%,#0a0618 50%,#050310 100%)",fontFamily:"'Cormorant Garamond',serif"}}>
      <Nav pagina="tarotistas" ir={ir} m={m}/>
      <section style={{padding:m?"56px 16px 64px":"88px 40px 100px",textAlign:"center",maxWidth:"700px",margin:"0 auto"}}>
        <div style={{display:"inline-block",padding:"7px 18px",background:"rgba(192,132,252,0.08)",border:"1px solid rgba(192,132,252,0.2)",borderRadius:"100px",marginBottom:"24px"}}>
          <span style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.8)",textTransform:"uppercase"}}>✦ Nuestras guías ✦</span>
        </div>
        <h1 style={{fontFamily:"'Cinzel',serif",fontSize:m?"34px":"58px",color:"#fff",lineHeight:1.15,marginBottom:"18px"}}>
          Las guardianas<br/>
          <span style={{background:"linear-gradient(135deg,#c084fc,#9333ea,#60a5fa)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s linear infinite"}}>del arcano</span>
        </h1>
        <p style={{fontSize:m?"16px":"19px",lineHeight:1.7,color:"rgba(255,255,255,0.5)",fontStyle:"italic"}}>Tres expertas, tres caminos. Elige la guía que mejor conecte con lo que buscas.</p>
      </section>
      <section style={{padding:`0 ${px} 80px`,maxWidth:"1100px",margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"repeat(3,1fr)",gap:"22px"}}>
          {TAROTISTAS.map((t,idx)=>(
            <div key={t.id} className="tc" style={{background:"linear-gradient(160deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))",border:`1px solid ${t.color}33`,borderRadius:"26px",overflow:"hidden",position:"relative",animation:`fadeIn 0.6s ease ${idx*.12}s both`,cursor:"pointer"}} onClick={()=>setPerfil(t)}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:`linear-gradient(90deg,transparent,${t.color}77,transparent)`}}/>
              <div style={{padding:m?"28px 20px 24px":"40px 28px 28px",textAlign:"center",background:`radial-gradient(ellipse at 50% 0%,${t.color}12,transparent 65%)`,position:"relative"}}>
                <div style={{position:"absolute",top:"14px",right:"14px",display:"flex",alignItems:"center",gap:"5px",padding:"4px 10px",background:isOnline(t)?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.05)",border:`1px solid ${isOnline(t)?"rgba(52,211,153,0.3)":"rgba(255,255,255,0.1)"}`,borderRadius:"100px"}}>
                  <div style={{width:"6px",height:"6px",borderRadius:"50%",background:isOnline(t)?"#34d399":"rgba(255,255,255,0.3)",animation:isOnline(t)?"pulse 2s infinite":"none"}}/>
                  <span style={{fontSize:"10px",color:isOnline(t)?"#34d399":"rgba(255,255,255,0.35)",fontFamily:"'Cinzel',serif"}}>{isOnline(t)?"En línea":"Ocupada"}</span>
                </div>
                <div style={{width:"100px",height:"100px",borderRadius:"50%",background:`radial-gradient(circle at 35% 35%,${t.color}44,${t.color}10)`,border:`2px solid ${t.color}55`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:"44px",animation:`float ${6+idx}s ease-in-out infinite`}}>{t.icono}</div>
                <div style={{fontSize:"10px",letterSpacing:"3px",color:`${t.color}99`,textTransform:"uppercase",marginBottom:"6px"}}>{t.simbolo}</div>
                <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"26px",color:"#fff",marginBottom:"4px"}}>{t.nombre}</h2>
                <p style={{fontSize:"13px",color:`${t.color}cc`,marginBottom:"14px"}}>{t.esp}</p>
                <div style={{display:"flex",gap:"12px",justifyContent:"center"}}>
                  {[["⭐"+t.rating,"Valoración"],[t.reviews.toLocaleString(),"Consultas"],[t.exp,"Exp."]].map(([v,l])=>(
                    <div key={l} style={{textAlign:"center"}}>
                      <div style={{fontFamily:"'Cinzel',serif",color:"#fff",fontSize:"14px"}}>{v}</div>
                      <div style={{fontSize:"11px",color:"rgba(255,255,255,0.3)"}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{padding:"0 22px 22px"}}>
                <p style={{color:"rgba(255,255,255,0.45)",fontSize:"14px",lineHeight:1.7,marginBottom:"14px",fontStyle:"italic"}}>"{t.bio.slice(0,120)}…"</p>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"16px"}}>
                  {t.especialidades.slice(0,3).map(e=><span key={e} style={{padding:"4px 10px",background:`${t.color}12`,border:`1px solid ${t.color}2a`,borderRadius:"100px",fontSize:"12px",color:`${t.color}cc`}}>{e}</span>)}
                </div>
                <div style={{display:"flex",gap:"9px"}}>
                  <button onClick={e=>{e.stopPropagation();setPerfil(t);}} style={{flex:1,padding:"11px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(192,132,252,0.2)",borderRadius:"11px",color:"rgba(255,255,255,0.7)",fontFamily:"'Cinzel',serif",fontSize:"11px",letterSpacing:"1.5px",cursor:"pointer"}}>VER PERFIL</button>
                  <button onClick={e=>{e.stopPropagation();(estadosTarotistas[t.id]??t.disponible)&&abrirModal(t);}} className={isOnline(t)?"btn-glow":""} style={{flex:1,padding:"11px",background:isOnline(t)?`linear-gradient(135deg,${t.color}bb,${t.color}66)`:"rgba(255,255,255,0.03)",border:isOnline(t)?"none":"1px solid rgba(255,255,255,0.07)",borderRadius:"11px",color:isOnline(t)?"#fff":"rgba(255,255,255,0.25)",fontFamily:"'Cinzel',serif",fontSize:"11px",letterSpacing:"1.5px",cursor:isOnline(t)?"pointer":"not-allowed"}}>
                    {isOnline(t)?"CONSULTAR":"OCUPADA"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Guía rápida */}
      <section style={{padding:`0 ${px} 90px`,maxWidth:"900px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"36px"}}>
          <p style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.6)",textTransform:"uppercase",marginBottom:"10px"}}>¿No sabes cuál elegir?</p>
          <h2 style={{fontFamily:"'Cinzel',serif",fontSize:m?"22px":"32px",color:"#fff"}}>Guía rápida de elección</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"repeat(3,1fr)",gap:"14px"}}>
          {[{n:"Selene",i:"♥",c:C,ss:["Mi relación está en crisis","¿Hay futuro con alguien?","Acabo de romper con mi pareja","¿Me quieren de verdad?"]},
            {n:"Morgana",i:"✦",c:G,ss:["No avanzo en mi carrera","Quiero montar mi negocio","Tengo problemas económicos","Debo tomar una decisión laboral"]},
            {n:"Isadora",i:"☽",c:B,ss:["No encuentro mi propósito","Paso por un cambio profundo","He perdido a alguien cercano","Quiero conectar espiritualmente"]}].map(it=>(
            <div key={it.n} style={{padding:"22px 18px",background:"rgba(255,255,255,0.02)",border:`1px solid ${it.c}22`,borderRadius:"18px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"}}>
                <span style={{fontSize:"20px"}}>{it.i}</span>
                <span style={{fontFamily:"'Cinzel',serif",color:"#fff",fontSize:"16px"}}>{it.n}</span>
              </div>
              {it.ss.map(s=>(
                <div key={s} style={{display:"flex",alignItems:"flex-start",gap:"8px",marginBottom:"9px"}}>
                  <span style={{color:it.c,fontSize:"13px",marginTop:"2px",flexShrink:0}}>✓</span>
                  <span style={{fontSize:"14px",color:"rgba(255,255,255,0.55)",lineHeight:1.5}}>{s}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
      <Footer/>
    </div>
  );
}

function PaginaCreditos({ir,m}){
  const px=m?"16px":"40px";
  const[faq,setFaq]=useState(null);
  const[pago,setPago]=useState(false);
  const faqs=[
    {q:"¿Qué son los créditos?",r:"Los créditos son la moneda interna de Arcana. Cada vez que una tarotista te responde, se descuentan 5 créditos. Cuantos más tengas, más respuestas recibes."},
    {q:"¿Cuándo caducan?",r:"Los créditos caducan a los 90 días (3 meses) desde la fecha de compra o de regalo, tanto si los has usado parcialmente como si no los has tocado."},
    {q:"¿Puedo usarlos con cualquier tarotista?",r:"Sí. Son válidos con todas las tarotistas de Arcana. Puedes cambiar sin perder tu saldo."},
    {q:"¿Qué métodos de pago aceptáis?",r:"Tarjeta (Visa, Mastercard, Amex) vía Stripe, PayPal y Klarna para pago en cuotas. Todos los pagos son encriptados y 100% seguros."},
    {q:"¿Puedo pedir reembolso?",r:"Contacta con nosotros en soporte@arcana.com. Gestionamos cada caso de forma personalizada."},
  ];
  return(
    <div style={{position:"relative",zIndex:1,minHeight:"100vh",background:"linear-gradient(180deg,#05030f 0%,#0a0618 50%,#050310 100%)",fontFamily:"'Cormorant Garamond',serif"}}>
      <Nav pagina="creditos" ir={ir} m={m}/>
      <section style={{padding:m?"52px 16px 60px":"80px 40px 100px",textAlign:"center",maxWidth:"700px",margin:"0 auto"}}>
        <div style={{display:"inline-block",padding:"7px 18px",background:"rgba(192,132,252,0.08)",border:"1px solid rgba(192,132,252,0.2)",borderRadius:"100px",marginBottom:"24px"}}>
          <span style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.8)",textTransform:"uppercase"}}>✦ Sistema de créditos ✦</span>
        </div>
        <h1 style={{fontFamily:"'Cinzel',serif",fontSize:m?"32px":"54px",color:"#fff",lineHeight:1.15,marginBottom:"18px"}}>
          Recarga tu<br/>
          <span style={{background:"linear-gradient(135deg,#c084fc,#9333ea,#60a5fa)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"shimmer 4s linear infinite"}}>energía mística</span>
        </h1>
        <p style={{fontSize:m?"16px":"19px",lineHeight:1.7,color:"rgba(255,255,255,0.5)",fontStyle:"italic"}}>Elige el paquete que mejor se adapte a ti y comienza tu consulta con total libertad.</p>
      </section>
      {/* Info pills */}
      <section style={{padding:`0 ${px} 64px`,maxWidth:"860px",margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:m?"1fr 1fr":"repeat(4,1fr)",gap:"12px"}}>
          {[["🎁","20","créditos gratis al registrarte"],["💬","5","créditos por respuesta"],["⏳","90d","caducan a los 90 días (3 meses)"],["🔒","100%","pagos seguros"]].map(([ic,v,l])=>(
            <div key={l} style={{padding:m?"16px 12px":"22px 18px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(192,132,252,0.12)",borderRadius:"16px",textAlign:"center"}}>
              <div style={{fontSize:"22px",marginBottom:"8px"}}>{ic}</div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:m?"20px":"26px",color:"#c084fc",marginBottom:"5px"}}>{v}</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",lineHeight:1.4}}>{l}</div>
            </div>
          ))}
        </div>
      </section>
      {/* Paquetes */}
      <section style={{padding:`0 ${px} 72px`,maxWidth:"960px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"40px"}}>
          <p style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.6)",textTransform:"uppercase",marginBottom:"10px"}}>Elige tu paquete</p>
          <h2 style={{fontFamily:"'Cinzel',serif",fontSize:m?"26px":"38px",color:"#fff"}}>Paquetes de créditos</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:m?"1fr":"repeat(3,1fr)",gap:"18px"}}>
          {PACKS.map((pk,idx)=>(
            <div key={pk.id} style={{background:pk.popular?"linear-gradient(160deg,rgba(147,51,234,0.18),rgba(192,132,252,0.06))":"linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))",border:pk.popular?"1px solid rgba(192,132,252,0.5)":"1px solid rgba(192,132,252,0.15)",borderRadius:"24px",padding:m?"26px 20px":"34px 26px",position:"relative",overflow:"hidden",animation:`fadeIn 0.5s ease ${idx*.1}s both`}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"2px",background:pk.popular?"linear-gradient(90deg,transparent,#c084fc,transparent)":"linear-gradient(90deg,transparent,rgba(192,132,252,0.3),transparent)"}}/>
              {pk.popular&&<div style={{position:"absolute",top:"14px",right:"14px",background:"linear-gradient(135deg,#9333ea,#c084fc)",borderRadius:"100px",padding:"4px 12px",fontFamily:"'Cinzel',serif",fontSize:"9px",color:"#fff",letterSpacing:"1px"}}>MÁS POPULAR</div>}
              <div style={{marginBottom:"22px"}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:m?"40px":"50px",color:"#fff",lineHeight:1,marginBottom:"4px"}}>{pk.cr}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"15px",color:"rgba(255,255,255,0.45)",marginBottom:"8px"}}>créditos · {pk.label}</div>
                {pk.ahorro&&<div style={{display:"inline-block",padding:"3px 10px",background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",borderRadius:"100px",fontSize:"12px",color:"#34d399",fontFamily:"'Cinzel',serif"}}>{pk.ahorro}</div>}
              </div>
              <div style={{marginBottom:"24px"}}>
                {["Con cualquier tarotista","Caducan a los 90 días (3 meses)","Soporte prioritario"].map(f=>(
                  <div key={f} style={{display:"flex",alignItems:"center",gap:"9px",marginBottom:"9px"}}>
                    <div style={{width:"17px",height:"17px",borderRadius:"50%",background:"rgba(192,132,252,0.15)",border:"1px solid rgba(192,132,252,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:"10px",color:"#c084fc"}}>✓</span>
                    </div>
                    <span style={{fontSize:"14px",color:"rgba(255,255,255,0.6)"}}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:m?"30px":"36px",color:pk.popular?"#c084fc":"#fff",marginBottom:"4px"}}>{pk.precio}</div>
              <div style={{fontSize:"12px",color:"rgba(255,255,255,0.3)",marginBottom:"18px"}}>pago único · sin suscripción</div>
              <button onClick={()=>setPago(true)} className={pk.popular?"btn-glow":""} style={{width:"100%",padding:"14px",background:pk.popular?"linear-gradient(135deg,#9333ea,#c084fc)":"rgba(255,255,255,0.06)",border:pk.popular?"none":"1px solid rgba(192,132,252,0.25)",borderRadius:"14px",color:"#fff",fontFamily:"'Cinzel',serif",fontSize:"13px",letterSpacing:"2px",cursor:"pointer"}}>
                ELEGIR ESTE PAQUETE
              </button>
            </div>
          ))}
        </div>
      </section>
      {/* Métodos pago */}
      <section style={{padding:`0 ${px} 72px`,maxWidth:"860px",margin:"0 auto"}}>
        <div style={{padding:m?"26px 18px":"40px 44px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(192,132,252,0.12)",borderRadius:"22px",textAlign:"center"}}>
          <p style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.6)",textTransform:"uppercase",marginBottom:"10px"}}>Métodos de pago aceptados</p>
          <h3 style={{fontFamily:"'Cinzel',serif",fontSize:m?"18px":"24px",color:"#fff",marginBottom:"24px"}}>Paga como prefieras</h3>
          <div style={{display:"flex",gap:m?"10px":"18px",justifyContent:"center",flexWrap:"wrap",marginBottom:"20px"}}>
            {[["💳","Stripe","Tarjeta Visa, Mastercard, Amex"],["🅿️","PayPal","Cuenta PayPal o tarjeta"],["🟣","Klarna","Paga en 3 cuotas sin intereses"]].map(([ic,n,d])=>(
              <div key={n} style={{padding:m?"14px 12px":"18px 22px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(192,132,252,0.15)",borderRadius:"14px",flex:m?"1":"0 0 auto",minWidth:m?"calc(33% - 7px)":"150px"}}>
                <div style={{fontSize:"26px",marginBottom:"7px"}}>{ic}</div>
                <div style={{fontFamily:"'Cinzel',serif",color:"#fff",fontSize:"14px",marginBottom:"4px"}}>{n}</div>
                <div style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",lineHeight:1.4}}>{d}</div>
              </div>
            ))}
          </div>
          <p style={{fontSize:"13px",color:"rgba(255,255,255,0.3)"}}>🔒 Pagos seguros, encriptados con SSL y certificados PCI DSS.</p>
        </div>
      </section>
      {/* FAQ */}
      <section style={{padding:`0 ${px} 80px`,maxWidth:"720px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"36px"}}>
          <p style={{fontSize:"12px",letterSpacing:"3px",color:"rgba(192,132,252,0.6)",textTransform:"uppercase",marginBottom:"10px"}}>Preguntas frecuentes</p>
          <h2 style={{fontFamily:"'Cinzel',serif",fontSize:m?"22px":"32px",color:"#fff"}}>Todo lo que necesitas saber</h2>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"9px"}}>
          {faqs.map((f,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(192,132,252,0.12)",borderRadius:"14px",overflow:"hidden"}}>
              <button onClick={()=>setFaq(faq===i?null:i)} style={{width:"100%",padding:"18px 20px",background:"none",border:"none",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",gap:"12px"}}>
                <span style={{fontFamily:"'Cinzel',serif",fontSize:m?"13px":"15px",color:"#fff",textAlign:"left",lineHeight:1.4}}>{f.q}</span>
                <span style={{color:"#c084fc",fontSize:"20px",flexShrink:0,transition:"transform 0.3s",transform:faq===i?"rotate(45deg)":"rotate(0)"}}>+</span>
              </button>
              {faq===i&&<div style={{padding:"0 20px 18px",animation:"fadeIn 0.2s ease"}}>
                <p style={{color:"rgba(255,255,255,0.55)",fontSize:"15px",lineHeight:1.7}}>{f.r}</p>
              </div>}
            </div>
          ))}
        </div>
      </section>
      <Footer/>
      {pago&&<ModalPago onClose={()=>setPago(false)} onPago={()=>setPago(false)}/>}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const[pagina,setPagina]=useState("inicio");
  const[modal,setModal]=useState(null);
  const[chat,setChat]=useState(null);
  const[usuario,setUsuario]=useState(null);
  const[modalRecarga,setModalRecarga]=useState(false);
  const m=useMobile();

  const ir=(k)=>{setPagina(k);window.scrollTo(0,0);};
  const abrirModal=(t)=>setModal(t);

  // Créditos del usuario actual (guardados en USUARIOS_DB)
  const creditosUsuario = usuario ? (buscarUsuario(usuario.email)?.creditos || []) : null;

  // onOk del registro/login — creditosIniciales viene del login si el usuario ya existía
  const handleOk=(form, t, creditosIniciales)=>{
    const db = buscarUsuario(form.email);
    if(!db){
      // Usuario nuevo — guardar con créditos de bienvenida
      guardarUsuario(form.email, form);
    } else if(creditosIniciales){
      // Login — restaurar sus créditos tal como estaban
      USUARIOS_DB[form.email.toLowerCase()].creditos = creditosIniciales;
    }
    setUsuario(form);
    setModal(null);
    setChat(t);
  };

  if(chat&&usuario) return(
    <><style>{CSS}</style><Particles/><Orbs m={m}/>
    <Chat usuario={usuario} t={chat} onBack={()=>setChat(null)}/>
    </>
  );

  return(<>
    <style>{CSS}</style>
    <Particles/>
    <Orbs m={m}/>
    {pagina==="inicio"&&<PaginaInicio ir={ir} abrirModal={abrirModal} m={m} creditos={creditosUsuario} onMostrarRecarga={()=>setModalRecarga(true)}/>}
    {pagina==="tarotistas"&&<PaginaTarotistas ir={ir} abrirModal={abrirModal} m={m}/>}
    {pagina==="creditos"&&<PaginaCreditos ir={ir} m={m}/>}
    {modal&&<ModalRegistro t={modal} onClose={()=>setModal(null)} onOk={handleOk}/>}
    {modalRecarga&&<ModalPago onClose={()=>setModalRecarga(false)} onPago={pk=>{
      if(usuario){ const db=buscarUsuario(usuario.email); if(db) db.creditos=[...(db.creditos||[]),...crearCreditos(pk.cr)]; }
      setModalRecarga(false);
    }}/>}
  </>);
}