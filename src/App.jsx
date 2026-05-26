import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push } from "firebase/database";

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

// ── CREDENCIALES (en producción estarían en Firebase Auth) ────────────────────
const CREDS = {
  "selene@arcana.es":   { pass:"selene2025",  rol:"tarotista", id:1, nombre:"Selene" },
  "morgana@arcana.es":  { pass:"morgana2025", rol:"tarotista", id:2, nombre:"Morgana" },
  "isadora@arcana.es":  { pass:"isadora2025", rol:"tarotista", id:3, nombre:"Isadora" },
  "admin@arcana.es":    { pass:"admin2025",   rol:"admin",     id:0, nombre:"Admin" },
};

// ── DATOS SIMULADOS ───────────────────────────────────────────────────────────

// ── HORARIOS (mismo sistema que la web del cliente) ───────────────────────────
const HORARIOS = {
  1: { humano:[9,17],  ia:[17,23] },
  2: { humano:[10,18], ia:[18,23] },
  3: { humano:[11,19], ia:[19,22] },
};
function getEstadoActual(id){
  const h = new Date().getHours();
  const ho = HORARIOS[id];
  if(!ho) return "offline";
  if(h >= ho.humano[0] && h < ho.humano[1]) return "humana";
  if(h >= ho.ia[0]     && h < ho.ia[1])     return "ia";
  return "offline";
}

const TAROTISTAS_INFO = {
  1:{ nombre:"Selene",  color:"#c084fc", icono:"♥", esp:"Amor & Relaciones" },
  2:{ nombre:"Morgana", color:"#34d399", icono:"✦", esp:"Trabajo & Dinero" },
  3:{ nombre:"Isadora", color:"#60a5fa", icono:"☽", esp:"Espiritualidad" },
};

function generarConversaciones(){
  const nombres = ["María G.","Carlos P.","Ana Sofía","Roberto F.","Elena B.","Valentina R.","Javier M.","Laura S.","Pedro A.","Carmen V.","Isabel T.","Miguel Á."];
  const paises  = ["España","México","Argentina","Colombia","Chile","Perú"];
  const msgs = [
    ["Hola, necesito consejo sobre mi relación","Las cartas muestran un período de reflexión importante…","¿Y si me alejo un tiempo?","El Ermitaño sugiere precisamente eso…","Gracias, me ha ayudado mucho"],
    ["Estoy pensando en cambiar de trabajo","Veo en tu tirada mucha energía de cambio…","¿Crees que es el momento?","El Carro indica que sí, tienes la fuerza…","Perfecto, me animas a dar el paso"],
    ["¿Cómo está mi energía estos días?","La Luna está muy presente en tu lectura…","Me siento algo perdida","Es normal, estás en un período de transición…","¿Qué debería hacer?"],
    ["Tengo una decisión importante que tomar","Las cartas muestran dos caminos claros…","¿Cuál me recomiendas?","El corazón ya sabe la respuesta…","Sí, creo que tienes razón"],
  ];
  const convs = [];
  let id = 1;
  for(let tid=1; tid<=3; tid++){
    const count = tid===1?5:tid===2?4:3;
    for(let i=0;i<count;i++){
      const msgsSet = msgs[i%msgs.length];
      const nombre = nombres[(tid*5+i)%nombres.length];
      const ahora = Date.now() - Math.random()*7*24*60*60*1000;
      const mensajes = msgsSet.map((txt,mi)=>({
        id:mi+1,
        de: mi%2===0?"cliente":"tarotista",
        txt,
        hora: new Date(ahora - (msgsSet.length-mi)*8*60000).toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}),
        fecha: new Date(ahora - (msgsSet.length-mi)*8*60000).toLocaleDateString("es-ES",{day:"numeric",month:"short"}),
        porIA: mi%2===1 && i<2, // primeras convs tienen respuestas IA
      }));
      convs.push({
        id: id++,
        tarotistaid: tid,
        cliente:{ nombre, pais:paises[i%paises.length], email:`${nombre.toLowerCase().replace(/[^a-z]/g,"")}@email.com`, creditos:20-i*5 },
        mensajes,
        ultimoMsg: mensajes[mensajes.length-1],
        sinLeer: i===0?2:0,
        activa: i<2,
      });
    }
  }
  return convs;
}

const CONVERSACIONES_INIT = generarConversaciones();

// ── ESTILOS ───────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a0f;font-family:'Inter',sans-serif;color:#fff;overflow:hidden}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
input{-webkit-appearance:none}
`;

const D = {
  bg:     "#0a0a0f",
  panel:  "#0f0f18",
  card:   "#141420",
  border: "rgba(255,255,255,0.07)",
  purple: "#7c3aed",
  violet: "#9333ea",
  lilac:  "#c084fc",
  soft:   "rgba(255,255,255,0.45)",
  muted:  "rgba(255,255,255,0.2)",
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
function timeAgo(convs){
  const last = convs.mensajes[convs.mensajes.length-1];
  return last.hora;
}

function Avatar({nombre, color, size=36, icono}){
  return(
    <div style={{width:size,height:size,borderRadius:"50%",background:`radial-gradient(circle,${color}30,${color}10)`,border:`1.5px solid ${color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,color,flexShrink:0}}>
      {icono||nombre[0]}
    </div>
  );
}

function Badge({n}){
  if(!n) return null;
  return <div style={{minWidth:"18px",height:"18px",borderRadius:"9px",background:D.violet,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:"700",padding:"0 4px"}}>{n}</div>;
}

function StatusDot({online}){
  return <div style={{width:"8px",height:"8px",borderRadius:"50%",background:online?"#34d399":"rgba(255,255,255,0.2)",animation:online?"pulse 2s infinite":"none",flexShrink:0}}/>;
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function PantallaLogin({onLogin}){
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[err,setErr]=useState("");
  const[load,setLoad]=useState(false);

  const handleLogin=()=>{
    setErr("");
    const cred = CREDS[email.toLowerCase()];
    if(!cred||cred.pass!==pass){ setErr("Email o contraseña incorrectos"); return; }
    setLoad(true);
    setTimeout(()=>{ setLoad(false); onLogin(cred,email); },900);
  };

  const inpStyle={width:"100%",padding:"13px 15px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#fff",fontSize:"15px",outline:"none",boxSizing:"border-box",fontFamily:"Inter,sans-serif"};

  return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`radial-gradient(ellipse at 50% 0%,rgba(124,58,237,0.15),transparent 60%),${D.bg}`}}>
      <div style={{width:"100%",maxWidth:"380px",padding:"20px"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:"40px"}}>
          <div style={{fontSize:"32px",marginBottom:"12px"}}>🔮</div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:"22px",color:"#fff",letterSpacing:"4px",marginBottom:"4px"}}>ARCANA</div>
          <div style={{fontSize:"12px",color:D.soft,letterSpacing:"2px"}}>PANEL INTERNO</div>
        </div>

        {/* Form */}
        <div style={{background:D.card,border:`1px solid ${D.border}`,borderRadius:"18px",padding:"32px"}}>
          <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"18px",color:"#fff",marginBottom:"6px"}}>Acceso restringido</h2>
          <p style={{fontSize:"13px",color:D.soft,marginBottom:"28px"}}>Solo para el equipo de Arcana</p>

          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <div>
              <label style={{fontSize:"12px",color:D.soft,display:"block",marginBottom:"6px",fontWeight:"500",letterSpacing:"0.5px"}}>EMAIL</label>
              <input type="email" placeholder="tu@arcana.es" value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={inpStyle}/>
            </div>
            <div>
              <label style={{fontSize:"12px",color:D.soft,display:"block",marginBottom:"6px",fontWeight:"500",letterSpacing:"0.5px"}}>CONTRASEÑA</label>
              <input type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={inpStyle}/>
            </div>

            {err&&<div style={{padding:"10px 14px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:"8px",fontSize:"13px",color:"#f87171"}}>{err}</div>}

            <button onClick={handleLogin} disabled={load} style={{padding:"13px",background:load?"rgba(124,58,237,0.4)":"linear-gradient(135deg,#7c3aed,#9333ea)",border:"none",borderRadius:"10px",color:"#fff",fontSize:"14px",fontWeight:"600",cursor:load?"not-allowed":"pointer",marginTop:"4px",letterSpacing:"0.5px"}}>
              {load?"Verificando...":"Entrar al panel"}
            </button>
          </div>

          <div style={{marginTop:"24px",padding:"14px",background:"rgba(255,255,255,0.03)",borderRadius:"10px"}}>
            <p style={{fontSize:"11px",color:D.muted,marginBottom:"8px",fontWeight:"600",letterSpacing:"1px"}}>ACCESOS DE PRUEBA</p>
            {Object.entries(CREDS).map(([em,cr])=>(
              <div key={em} style={{display:"flex",justifyContent:"space-between",marginBottom:"4px",cursor:"pointer"}} onClick={()=>{setEmail(em);setPass(cr.pass);}}>
                <span style={{fontSize:"11px",color:D.soft}}>{em}</span>
                <span style={{fontSize:"11px",color:D.muted}}>·</span>
                <span style={{fontSize:"11px",color:D.muted}}>{cr.pass}</span>
              </div>
            ))}
            <p style={{fontSize:"10px",color:D.muted,marginTop:"6px"}}>Pulsa una fila para rellenar automáticamente</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SIDEBAR ───────────────────────────────────────────────────────────────────
function Sidebar({sesion,convs,convActiva,setConvActiva,online,setOnline,seccion,setSeccion}){
  const misConvs = sesion.rol==="admin" ? convs : convs.filter(c=>c.tarotistaid===sesion.id);
  const sinLeer = misConvs.reduce((acc,c)=>acc+c.sinLeer,0);

  const navItems = sesion.rol==="admin"
    ? [{k:"conversaciones",l:"Conversaciones",i:"💬"},{k:"estadisticas",l:"Estadísticas",i:"📊"},{k:"tarotistas",l:"Tarotistas",i:"👥"},{k:"clientes",l:"Clientes",i:"🌙"}]
    : [{k:"conversaciones",l:"Mis consultas",i:"💬"},{k:"estadisticas",l:"Mi actividad",i:"📊"}];

  const ti = TAROTISTAS_INFO[sesion.id];

  return(
    <div style={{width:"260px",flexShrink:0,height:"100vh",background:D.panel,borderRight:`1px solid ${D.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"20px 18px",borderBottom:`1px solid ${D.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"}}>
          <div style={{fontSize:"16px"}}>🔮</div>
          <div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"13px",color:"#fff",letterSpacing:"2px"}}>ARCANA</div>
            <div style={{fontSize:"10px",color:D.soft,letterSpacing:"1px"}}>{sesion.rol==="admin"?"PANEL ADMIN":"PANEL TAROTISTA"}</div>
          </div>
        </div>

        {/* Perfil */}
        <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",background:"rgba(255,255,255,0.04)",borderRadius:"10px"}}>
          <Avatar nombre={sesion.nombre} color={ti?.color||D.violet} size={34} icono={ti?.icono}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:"13px",fontWeight:"600",color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sesion.nombre}</div>
            <div style={{fontSize:"11px",color:D.soft}}>{sesion.rol==="admin"?"Administradora":ti?.esp}</div>
          </div>
        </div>

        {/* Estado horario + toggle manual — solo tarotistas */}
        {sesion.rol==="tarotista"&&(()=>{
          const estado=getEstadoActual(sesion.id);
          const colorEstado=estado==="humana"?"#34d399":estado==="ia"?"#fbbf24":"rgba(255,255,255,0.3)";
          const labelEstado=estado==="humana"?"Tu turno · Responde tú":estado==="ia"?"Turno IA · Responde automático":"Fuera de horario";
          return(<>
            <div style={{marginTop:"10px",padding:"9px 12px",background:"rgba(255,255,255,0.03)",border:`1px solid rgba(255,255,255,0.07)`,borderRadius:"10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px"}}>
                <div style={{width:"7px",height:"7px",borderRadius:"50%",background:colorEstado,flexShrink:0}}/>
                <span style={{fontSize:"12px",color:colorEstado,fontWeight:"600"}}>{labelEstado}</span>
              </div>
              <p style={{fontSize:"10px",color:"rgba(255,255,255,0.3)",marginLeft:"14px"}}>
                {estado==="humana"?`Horario humano: ${HORARIOS[sesion.id]?.humano[0]}:00–${HORARIOS[sesion.id]?.humano[1]}:00`:
                 estado==="ia"?`Horario IA: ${HORARIOS[sesion.id]?.ia[0]}:00–${HORARIOS[sesion.id]?.ia[1]}:00`:
                 "Sin cobertura ahora mismo"}
              </p>
            </div>
            <div style={{marginTop:"8px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",background:online?"rgba(52,211,153,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${online?"rgba(52,211,153,0.2)":"rgba(255,255,255,0.07)"}`,borderRadius:"10px",cursor:"pointer"}} onClick={()=>setOnline(!online)}>
              <span style={{fontSize:"12px",color:online?"#34d399":"rgba(255,255,255,0.4)"}}>Override manual: {online?"Conectada":"Desconectada"}</span>
              <div style={{width:"32px",height:"18px",borderRadius:"9px",background:online?"#34d399":"rgba(255,255,255,0.15)",position:"relative"}}>
                <div style={{position:"absolute",top:"2px",left:online?"16px":"2px",width:"14px",height:"14px",borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
              </div>
            </div>
          </>);
        })()}
      </div>

      {/* Nav */}
      <nav style={{padding:"12px 10px",borderBottom:`1px solid ${D.border}`}}>
        {navItems.map(({k,l,i})=>(
          <button key={k} onClick={()=>{setSeccion(k);setConvActiva(null);}} style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"9px 10px",background:seccion===k?"rgba(124,58,237,0.15)":"transparent",border:`1px solid ${seccion===k?"rgba(124,58,237,0.3)":"transparent"}`,borderRadius:"8px",color:seccion===k?"#c084fc":"rgba(255,255,255,0.5)",fontSize:"13px",fontWeight:seccion===k?"600":"400",cursor:"pointer",marginBottom:"2px",textAlign:"left",transition:"all 0.2s"}}>
            <span style={{fontSize:"14px"}}>{i}</span>
            <span style={{flex:1}}>{l}</span>
            {k==="conversaciones"&&sinLeer>0&&<Badge n={sinLeer}/>}
          </button>
        ))}
      </nav>

      {/* Lista de conversaciones */}
      {seccion==="conversaciones"&&(
        <div style={{flex:1,overflowY:"auto",padding:"8px"}}>
          {/* Admin: agrupar por tarotista */}
          {sesion.rol==="admin"&&[1,2,3].map(tid=>{
            const tConvs = convs.filter(c=>c.tarotistaid===tid);
            const ti2 = TAROTISTAS_INFO[tid];
            return(
              <div key={tid} style={{marginBottom:"8px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 8px",marginBottom:"4px"}}>
                  <span style={{fontSize:"11px",color:ti2.color}}>{ti2.icono}</span>
                  <span style={{fontSize:"11px",fontWeight:"600",color:ti2.color,letterSpacing:"1px",textTransform:"uppercase"}}>{ti2.nombre}</span>
                  <span style={{fontSize:"10px",color:D.muted,marginLeft:"auto"}}>{tConvs.length} clientes</span>
                </div>
                {tConvs.map(conv=>(<ConvItem key={conv.id} conv={conv} activa={convActiva?.id===conv.id} onClick={()=>setConvActiva(conv)}/>))}
              </div>
            );
          })}
          {/* Tarotista: sus convs directamente */}
          {sesion.rol==="tarotista"&&misConvs.map(conv=>(<ConvItem key={conv.id} conv={conv} activa={convActiva?.id===conv.id} onClick={()=>setConvActiva(conv)}/>))}
          {misConvs.length===0&&<p style={{fontSize:"13px",color:D.muted,textAlign:"center",padding:"24px 12px"}}>Sin conversaciones aún</p>}
        </div>
      )}
    </div>
  );
}

function ConvItem({conv,activa,onClick}){
  const last = conv.mensajes[conv.mensajes.length-1];
  const ti = TAROTISTAS_INFO[conv.tarotistaid];
  return(
    <div onClick={onClick} style={{padding:"10px",borderRadius:"8px",background:activa?"rgba(124,58,237,0.12)":"transparent",border:`1px solid ${activa?"rgba(124,58,237,0.3)":"transparent"}`,cursor:"pointer",marginBottom:"2px",transition:"all 0.15s"}}>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
        <Avatar nombre={conv.cliente.nombre} color={ti.color} size={30}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:"13px",fontWeight:conv.sinLeer?"600":"400",color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{conv.cliente.nombre}</span>
            <span style={{fontSize:"10px",color:D.muted,flexShrink:0,marginLeft:"4px"}}>{last.hora}</span>
          </div>
          <div style={{fontSize:"11px",color:D.soft}}>{conv.cliente.pais} · {conv.cliente.creditos} créditos</div>
        </div>
        {conv.sinLeer>0&&<Badge n={conv.sinLeer}/>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
        {last.porIA&&<span style={{fontSize:"9px",padding:"1px 5px",background:"rgba(251,191,36,0.15)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:"4px",color:"#fbbf24",flexShrink:0}}>IA</span>}
        <p style={{fontSize:"12px",color:D.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{last.de==="tarotista"?"Tú: ":""}{last.txt}</p>
      </div>
    </div>
  );
}

// ── CHAT INTERNO ──────────────────────────────────────────────────────────────
function ChatInterno({conv,sesion,online,onEnviar}){
  const[inp,setInp]=useState("");
  const bot=useRef(null);
  const ti = TAROTISTAS_INFO[conv.tarotistaid];
  const soloLectura = sesion.rol==="admin";

  useEffect(()=>{ bot.current?.scrollIntoView({behavior:"smooth"}); },[conv.mensajes]);

  const enviar=()=>{
    if(!inp.trim()||soloLectura)return;
    onEnviar(conv.id, inp);
    setInp("");
  };

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"14px 20px",borderBottom:`1px solid ${D.border}`,background:D.panel,display:"flex",alignItems:"center",gap:"12px",flexShrink:0}}>
        <Avatar nombre={conv.cliente.nombre} color={ti.color} size={38}/>
        <div style={{flex:1}}>
          <div style={{fontSize:"15px",fontWeight:"600",color:"#fff"}}>{conv.cliente.nombre}</div>
          <div style={{fontSize:"12px",color:D.soft}}>{conv.cliente.pais} · {conv.cliente.email}</div>
        </div>
        {/* Info cliente */}
        <div style={{display:"flex",gap:"8px"}}>
          {[
            {l:"Créditos",v:conv.cliente.creditos,c:conv.cliente.creditos>5?"#c084fc":"#f87171"},
            {l:"Mensajes",v:conv.mensajes.filter(m=>m.de==="cliente").length,c:"rgba(255,255,255,0.6)"},
          ].map(({l,v,c})=>(
            <div key={l} style={{padding:"6px 12px",background:"rgba(255,255,255,0.04)",border:`1px solid ${D.border}`,borderRadius:"8px",textAlign:"center"}}>
              <div style={{fontSize:"16px",fontWeight:"700",color:c,fontFamily:"'Cinzel',serif"}}>{v}</div>
              <div style={{fontSize:"10px",color:D.muted}}>{l}</div>
            </div>
          ))}
        </div>
        {sesion.rol==="tarotista"&&!online&&(
          <div style={{padding:"6px 12px",background:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:"8px",fontSize:"11px",color:"#fbbf24"}}>
            ⚡ IA activa
          </div>
        )}
      </div>

      {/* Mensajes */}
      <div style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:"12px"}}>
        {conv.mensajes.map((msg,i)=>{
          const esTarotista = msg.de==="tarotista";
          return(
            <div key={i} style={{display:"flex",justifyContent:esTarotista?"flex-end":"flex-start",animation:"fadeIn 0.3s ease"}}>
              {!esTarotista&&<Avatar nombre={conv.cliente.nombre} color={ti.color} size={28} style={{marginRight:"8px",alignSelf:"flex-end"}}/>}
              <div style={{maxWidth:"72%",marginLeft:esTarotista?0:"8px",marginRight:esTarotista?"0":"0"}}>
                {msg.porIA&&esTarotista&&(
                  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"3px"}}>
                    <span style={{fontSize:"9px",padding:"2px 7px",background:"rgba(251,191,36,0.12)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:"4px",color:"#fbbf24",letterSpacing:"0.5px"}}>Respondido por IA</span>
                  </div>
                )}
                <div style={{padding:"11px 15px",background:esTarotista?`linear-gradient(135deg,${ti.color}cc,${ti.color}88)`:"rgba(255,255,255,0.06)",border:esTarotista?"none":`1px solid ${D.border}`,borderRadius:esTarotista?"16px 16px 4px 16px":"4px 16px 16px 16px",color:"#fff",fontSize:"14px",lineHeight:1.65}}>
                  {msg.txt}
                </div>
                <div style={{fontSize:"10px",color:D.muted,marginTop:"3px",textAlign:esTarotista?"right":"left"}}>{msg.fecha} · {msg.hora}</div>
              </div>
            </div>
          );
        })}
        <div ref={bot}/>
      </div>

      {/* Input */}
      <div style={{padding:"14px 20px",borderTop:`1px solid ${D.border}`,background:D.panel,flexShrink:0}}>
        {soloLectura?(
          <p style={{textAlign:"center",fontSize:"13px",color:D.muted,padding:"8px"}}>Vista de administración — solo lectura</p>
        ):(
          <>
            <div style={{display:"flex",gap:"10px"}}>
              <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviar();}}}
                placeholder={online?"Escribe tu respuesta... (Enter para enviar)":"La IA está respondiendo mientras descansas. Activa tu disponibilidad para responder tú."}
                disabled={!online} rows={2}
                style={{flex:1,padding:"12px 15px",background:online?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.02)",border:`1px solid ${online?D.border:"rgba(255,255,255,0.04)"}`,borderRadius:"10px",color:online?"#fff":D.muted,fontSize:"14px",outline:"none",resize:"none",lineHeight:1.5,fontFamily:"Inter,sans-serif",cursor:online?"auto":"not-allowed"}}/>
              <button onClick={enviar} disabled={!inp.trim()||!online}
                style={{padding:"12px 18px",background:inp.trim()&&online?`linear-gradient(135deg,${ti.color}cc,${ti.color}88)`:"rgba(255,255,255,0.05)",border:"none",borderRadius:"10px",color:"#fff",fontSize:"18px",cursor:inp.trim()&&online?"pointer":"not-allowed",flexShrink:0,alignSelf:"flex-end",transition:"all 0.2s"}}>→</button>
            </div>
            {!online&&<p style={{fontSize:"11px",color:"rgba(251,191,36,0.6)",marginTop:"6px",textAlign:"center"}}>⚡ Activa tu disponibilidad en el menú lateral para responder manualmente</p>}
          </>
        )}
      </div>
    </div>
  );
}

// ── PANEL DERECHO — FICHA CLIENTE ─────────────────────────────────────────────
function FichaCliente({conv}){
  const ti = TAROTISTAS_INFO[conv.tarotistaid];
  const msgIA = conv.mensajes.filter(m=>m.porIA).length;
  const msgHumano = conv.mensajes.filter(m=>m.de==="tarotista"&&!m.porIA).length;

  return(
    <div style={{width:"230px",flexShrink:0,height:"100vh",background:D.panel,borderLeft:`1px solid ${D.border}`,overflowY:"auto",padding:"18px 14px"}}>
      <p style={{fontSize:"11px",fontWeight:"600",color:D.muted,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"14px"}}>Ficha del cliente</p>

      <div style={{textAlign:"center",marginBottom:"18px"}}>
        <Avatar nombre={conv.cliente.nombre} color={ti.color} size={52} style={{margin:"0 auto 10px"}}/>
        <div style={{width:"52px",height:"52px",borderRadius:"50%",background:`radial-gradient(circle,${ti.color}30,${ti.color}10)`,border:`2px solid ${ti.color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",color:ti.color,margin:"0 auto 10px"}}>{conv.cliente.nombre[0]}</div>
        <div style={{fontSize:"15px",fontWeight:"600",color:"#fff"}}>{conv.cliente.nombre}</div>
        <div style={{fontSize:"12px",color:D.soft}}>{conv.cliente.pais}</div>
      </div>

      {[
        {l:"Email",v:conv.cliente.email,small:true},
        {l:"Tarotista",v:`${ti.icono} ${ti.nombre}`},
        {l:"Créditos restantes",v:conv.cliente.creditos,color:conv.cliente.creditos>5?"#c084fc":"#f87171"},
        {l:"Total mensajes",v:conv.mensajes.length},
        {l:"Resp. humanas",v:msgHumano,color:"#34d399"},
        {l:"Resp. por IA",v:msgIA,color:"#fbbf24"},
      ].map(({l,v,color,small})=>(
        <div key={l} style={{padding:"10px 0",borderBottom:`1px solid ${D.border}`}}>
          <div style={{fontSize:"10px",color:D.muted,fontWeight:"600",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"3px"}}>{l}</div>
          <div style={{fontSize:small?"12px":"14px",color:color||"#fff",fontWeight:color?"600":"400",wordBreak:"break-all"}}>{v}</div>
        </div>
      ))}

      <div style={{marginTop:"14px",padding:"10px",background:"rgba(255,255,255,0.03)",border:`1px solid ${D.border}`,borderRadius:"8px"}}>
        <p style={{fontSize:"10px",color:D.muted,fontWeight:"600",letterSpacing:"1px",marginBottom:"6px"}}>SISTEMA HÍBRIDO</p>
        <div style={{display:"flex",gap:"4px",alignItems:"center",marginBottom:"4px"}}>
          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399"}}/>
          <span style={{fontSize:"11px",color:"rgba(255,255,255,0.5)"}}>Humana: {msgHumano} resp.</span>
        </div>
        <div style={{display:"flex",gap:"4px",alignItems:"center"}}>
          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#fbbf24"}}/>
          <span style={{fontSize:"11px",color:"rgba(255,255,255,0.5)"}}>IA: {msgIA} resp.</span>
        </div>
      </div>
    </div>
  );
}

// ── ESTADÍSTICAS ──────────────────────────────────────────────────────────────
function PanelEstadisticas({convs,sesion}){
  const misConvs = sesion.rol==="admin" ? convs : convs.filter(c=>c.tarotistaid===sesion.id);
  const totalMsgs = misConvs.reduce((a,c)=>a+c.mensajes.length,0);
  const msgIA = misConvs.reduce((a,c)=>a+c.mensajes.filter(m=>m.porIA).length,0);
  const msgHuman = misConvs.reduce((a,c)=>a+c.mensajes.filter(m=>m.de==="tarotista"&&!m.porIA).length,0);
  const creditosTotal = misConvs.reduce((a,c)=>a+(20-c.cliente.creditos),0);

  const stats = [
    {l:"Clientes activos",v:misConvs.length,i:"🌙",c:"#c084fc"},
    {l:"Mensajes totales",v:totalMsgs,i:"💬",c:"#60a5fa"},
    {l:"Resp. humanas",v:msgHuman,i:"👩",c:"#34d399"},
    {l:"Resp. por IA",v:msgIA,i:"⚡",c:"#fbbf24"},
    {l:"Créditos usados",v:creditosTotal,i:"✦",c:"#c084fc"},
    {l:"% IA vs total",v:`${totalMsgs>0?Math.round((msgIA/(msgIA+msgHuman||1))*100):0}%`,i:"🔄",c:"#f87171"},
  ];

  return(
    <div style={{flex:1,padding:"28px",overflowY:"auto"}}>
      <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"18px",color:"#fff",marginBottom:"6px"}}>{sesion.rol==="admin"?"Estadísticas globales":"Mi actividad"}</h2>
      <p style={{fontSize:"13px",color:D.soft,marginBottom:"28px"}}>Resumen de la plataforma Arcana</p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"14px",marginBottom:"32px"}}>
        {stats.map(({l,v,i,c})=>(
          <div key={l} style={{padding:"20px",background:D.card,border:`1px solid ${D.border}`,borderRadius:"14px"}}>
            <div style={{fontSize:"24px",marginBottom:"10px"}}>{i}</div>
            <div style={{fontFamily:"'Cinzel',serif",fontSize:"28px",color:c,marginBottom:"4px"}}>{v}</div>
            <div style={{fontSize:"12px",color:D.soft}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Solo admin: breakdown por tarotista */}
      {sesion.rol==="admin"&&(
        <>
          <h3 style={{fontFamily:"'Cinzel',serif",fontSize:"15px",color:"#fff",marginBottom:"16px"}}>Por tarotista</h3>
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {[1,2,3].map(tid=>{
              const tc = convs.filter(c=>c.tarotistaid===tid);
              const tMsgs = tc.reduce((a,c)=>a+c.mensajes.length,0);
              const tIA = tc.reduce((a,c)=>a+c.mensajes.filter(m=>m.porIA).length,0);
              const ti2 = TAROTISTAS_INFO[tid];
              const pct = tMsgs>0?Math.round((tIA/tMsgs)*100):0;
              return(
                <div key={tid} style={{padding:"16px 20px",background:D.card,border:`1px solid ${D.border}`,borderRadius:"12px",display:"flex",alignItems:"center",gap:"14px"}}>
                  <Avatar nombre={ti2.nombre} color={ti2.color} size={38} icono={ti2.icono}/>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                      <span style={{fontSize:"14px",fontWeight:"600",color:"#fff"}}>{ti2.nombre}</span>
                      <span style={{fontSize:"12px",color:D.soft}}>{tc.length} clientes · {tMsgs} msgs</span>
                    </div>
                    <div style={{height:"4px",background:"rgba(255,255,255,0.08)",borderRadius:"2px",overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${ti2.color},#fbbf24)`,borderRadius:"2px",transition:"width 0.5s ease"}}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
                      <span style={{fontSize:"10px",color:"#34d399"}}>{tMsgs-tIA} humanas</span>
                      <span style={{fontSize:"10px",color:"#fbbf24"}}>{tIA} IA ({pct}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Advertencia híbrido */}
      <div style={{marginTop:"24px",padding:"16px 18px",background:"rgba(124,58,237,0.08)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"12px"}}>
        <p style={{fontSize:"12px",fontWeight:"600",color:"#c084fc",marginBottom:"4px"}}>🔄 Sistema híbrido activo</p>
        <p style={{fontSize:"12px",color:D.soft,lineHeight:1.6}}>La IA responde automáticamente cuando la tarotista está en modo "Descansando". El cliente no nota la diferencia. Las respuestas de la IA aparecen marcadas en amarillo solo en este panel.</p>
      </div>
    </div>
  );
}

// ── PANEL TAROTISTAS (ADMIN) ──────────────────────────────────────────────────
function PanelTarotistas({convs}){
  return(
    <div style={{flex:1,padding:"28px",overflowY:"auto"}}>
      <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"18px",color:"#fff",marginBottom:"6px"}}>Gestión de tarotistas</h2>
      <p style={{fontSize:"13px",color:D.soft,marginBottom:"28px"}}>Estado y actividad de cada tarotista</p>
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        {[1,2,3].map(tid=>{
          const ti2 = TAROTISTAS_INFO[tid];
          const tc = convs.filter(c=>c.tarotistaid===tid);
          const cred = Object.entries(CREDS).find(([,v])=>v.id===tid);
          return(
            <div key={tid} style={{padding:"22px",background:D.card,border:`1px solid ${D.border}`,borderRadius:"16px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"16px"}}>
                <Avatar nombre={ti2.nombre} color={ti2.color} size={48} icono={ti2.icono}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:"16px",fontWeight:"600",color:"#fff",marginBottom:"2px"}}>{ti2.nombre}</div>
                  <div style={{fontSize:"12px",color:ti2.color}}>{ti2.esp}</div>
                </div>
                <div style={{fontSize:"12px",color:D.muted,background:"rgba(255,255,255,0.04)",padding:"6px 12px",borderRadius:"8px"}}>
                  {cred?.[0]}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px"}}>
                {[
                  {l:"Clientes",v:tc.length,c:ti2.color},
                  {l:"Mensajes",v:tc.reduce((a,c)=>a+c.mensajes.length,0),c:"rgba(255,255,255,0.7)"},
                  {l:"Sin leer",v:tc.reduce((a,c)=>a+c.sinLeer,0),c:"#f87171"},
                ].map(({l,v,c})=>(
                  <div key={l} style={{padding:"12px",background:"rgba(255,255,255,0.03)",border:`1px solid ${D.border}`,borderRadius:"10px",textAlign:"center"}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:"22px",color:c,marginBottom:"2px"}}>{v}</div>
                    <div style={{fontSize:"11px",color:D.muted}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PANEL CLIENTES (ADMIN) ────────────────────────────────────────────────────
function PanelClientes({convs}){
  const[busqueda,setBusqueda]=useState("");
  const todos = convs.filter(c=>!busqueda||c.cliente.nombre.toLowerCase().includes(busqueda.toLowerCase())||c.cliente.pais.toLowerCase().includes(busqueda.toLowerCase()));

  return(
    <div style={{flex:1,padding:"28px",overflowY:"auto"}}>
      <h2 style={{fontFamily:"'Cinzel',serif",fontSize:"18px",color:"#fff",marginBottom:"6px"}}>Todos los clientes</h2>
      <p style={{fontSize:"13px",color:D.soft,marginBottom:"20px"}}>Base de datos de clientes de la plataforma</p>
      <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por nombre o país..."
        style={{width:"100%",maxWidth:"360px",padding:"11px 15px",background:"rgba(255,255,255,0.04)",border:`1px solid ${D.border}`,borderRadius:"10px",color:"#fff",fontSize:"14px",outline:"none",marginBottom:"18px",boxSizing:"border-box"}}/>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {todos.map(conv=>{
          const ti2=TAROTISTAS_INFO[conv.tarotistaid];
          return(
            <div key={conv.id} style={{padding:"14px 18px",background:D.card,border:`1px solid ${D.border}`,borderRadius:"12px",display:"flex",alignItems:"center",gap:"12px"}}>
              <Avatar nombre={conv.cliente.nombre} color={ti2.color} size={36}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <span style={{fontSize:"14px",fontWeight:"600",color:"#fff"}}>{conv.cliente.nombre}</span>
                  <span style={{fontSize:"11px",color:D.muted}}>·</span>
                  <span style={{fontSize:"12px",color:D.soft}}>{conv.cliente.pais}</span>
                </div>
                <div style={{fontSize:"11px",color:D.muted,marginTop:"2px"}}>{conv.cliente.email}</div>
              </div>
              <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                <span style={{fontSize:"11px",padding:"3px 8px",background:`${ti2.color}18`,border:`1px solid ${ti2.color}33`,borderRadius:"6px",color:ti2.color}}>{ti2.icono} {ti2.nombre}</span>
                <span style={{fontSize:"13px",fontWeight:"700",color:conv.cliente.creditos>5?"#c084fc":"#f87171",fontFamily:"'Cinzel',serif"}}>{conv.cliente.creditos} cr.</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── APP PANEL ─────────────────────────────────────────────────────────────────
export default function AppPanel(){
  const[sesion,setSesion]=useState(null);
  const[convs,setConvs]=useState(CONVERSACIONES_INIT);

  // Escuchar conversaciones reales de Firebase en tiempo real
  useEffect(()=>{
    const r=ref(db,"conversaciones");
    const unsub=onValue(r,snap=>{
      if(!snap.exists()) return;
      const data=snap.val();
      const reales=Object.entries(data)
        .filter(([,conv])=>conv.cliente&&conv.cliente.email) // solo convs reales
        .map(([id,conv])=>{
          const mensajesObj=conv.mensajes||{};
          const mensajes=Object.values(mensajesObj).sort((a,b)=>(a.ts||0)-(b.ts||0));
          const ultimoMsg=mensajes[mensajes.length-1]||{de:"u",txt:"Sin mensajes",hora:"--"};
          return{
            id,
            tarotistaid:conv.tarotistaid||1,
            cliente:{
              nombre:conv.cliente.nombre||"Cliente",
              pais:conv.cliente.pais||"",
              email:conv.cliente.email||"",
              creditos:conv.creditos||20,
            },
            mensajes,
            ultimoMsg,
            sinLeer:mensajes.filter(m=>m.de==="u").length,
            activa:true,
          };
        });
      // Mostrar convs reales + simuladas de demo
      setConvs([...CONVERSACIONES_INIT, ...reales]);
    });
    return()=>unsub();
  },[]);
  const[convActiva,setConvActiva]=useState(null);
  const[online,setOnline]=useState(true);

  // Sincronizar estado online con Firebase cuando cambia
  const toggleOnline=(nuevoEstado)=>{
    setOnline(nuevoEstado);
    if(sesion){
      set(ref(db,`estados/${sesion.id}`), nuevoEstado);
    }
  };
  const[seccion,setSeccion]=useState("conversaciones");

  const handleEnviar=(convId, texto)=>{
    const hora=new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"});
    const fecha=new Date().toLocaleDateString("es-ES",{day:"numeric",month:"short"});
    const nuevoMsg={de:"tarotista",txt:texto,h:hora,hora,fecha,porIA:false,ts:Date.now()};
    // Guardar en Firebase — tanto IDs de Firebase como claves email-tarotista
    push(ref(db,`conversaciones/${convId}/mensajes`),{...nuevoMsg}).catch(()=>{});
    setConvs(prev=>prev.map(c=>{
      if(c.id!==convId)return c;
      return{...c,mensajes:[...c.mensajes,nuevoMsg],sinLeer:0};
    }));
    setConvActiva(prev=>prev?.id===convId?{...prev,mensajes:[...prev.mensajes,nuevoMsg],sinLeer:0}:prev);
  };

  if(!sesion) return(<><style>{CSS}</style><PantallaLogin onLogin={(cred,email)=>setSesion({...cred,email})}/></>);

  return(
    <><style>{CSS}</style>
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:D.bg}}>
      <Sidebar sesion={sesion} convs={convs} convActiva={convActiva} setConvActiva={setConvActiva} online={online} setOnline={toggleOnline} seccion={seccion} setSeccion={setSeccion}/>

      {/* Contenido principal */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {seccion==="conversaciones"&&convActiva?(
          <>
            <ChatInterno conv={convActiva} sesion={sesion} online={online} onEnviar={handleEnviar}/>
            <FichaCliente conv={convActiva}/>
          </>
        ):seccion==="conversaciones"&&!convActiva?(
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"12px"}}>
            <div style={{fontSize:"40px"}}>🔮</div>
            <p style={{fontFamily:"'Cinzel',serif",fontSize:"16px",color:D.soft}}>Selecciona una conversación</p>
            <p style={{fontSize:"13px",color:D.muted}}>Elige un cliente del panel izquierdo para ver el chat</p>
          </div>
        ):seccion==="estadisticas"?(
          <PanelEstadisticas convs={convs} sesion={sesion}/>
        ):seccion==="tarotistas"&&sesion.rol==="admin"?(
          <PanelTarotistas convs={convs}/>
        ):seccion==="clientes"&&sesion.rol==="admin"?(
          <PanelClientes convs={convs}/>
        ):null}
      </div>
    </div>
    </>
  );
}