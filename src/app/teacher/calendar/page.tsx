"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Sun, PartyPopper, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";

interface CalendarEvent { id: string; title: string; date: string; type: "HOLIDAY"|"EVENT"|"EXAM"; }

const EC: Record<string,{bg:string;text:string;dot:string;gradient:string}> = {
  HOLIDAY:{bg:"bg-rose-50",text:"text-rose-700",dot:"bg-rose-500",gradient:"from-rose-500 to-pink-500"},
  EVENT:{bg:"bg-blue-50",text:"text-blue-700",dot:"bg-blue-500",gradient:"from-blue-500 to-indigo-500"},
  EXAM:{bg:"bg-amber-50",text:"text-amber-700",dot:"bg-amber-500",gradient:"from-amber-500 to-orange-500"},
};
const EI: Record<string,any> = { HOLIDAY:Sun, EVENT:PartyPopper, EXAM:GraduationCap };
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS=["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function TeacherCalendarPage() {
  const [mo,setMo]=useState(new Date().getMonth());
  const [yr,setYr]=useState(new Date().getFullYear());
  const [events,setEvents]=useState<CalendarEvent[]>([]);
  const [loading,setLoading]=useState(true);

  const fetch_=async()=>{setLoading(true);try{const r=await fetch(`/api/admin/calendar?month=${mo+1}&year=${yr}`);const d=await r.json();setEvents(Array.isArray(d)?d:[]);}catch{toast.error("Failed to load");}finally{setLoading(false);}};
  useEffect(()=>{fetch_();},[mo,yr]);

  const prev=()=>{if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1);};
  const next=()=>{if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1);};
  const goToday=()=>{const n=new Date();setMo(n.getMonth());setYr(n.getFullYear());};

  const fd=new Date(yr,mo,1).getDay();
  const dim=new Date(yr,mo+1,0).getDate();
  const td=new Date();
  const isToday=(d:number)=>d===td.getDate()&&mo===td.getMonth()&&yr===td.getFullYear();
  const evFor=(d:number)=>{const s=`${yr}-${String(mo+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;return events.filter(e=>e.date===s);};
  const isWknd=(d:number)=>{const dow=new Date(yr,mo,d).getDay();return dow===0||dow===6;};
  const sorted=[...events].sort((a,b)=>a.date.localeCompare(b.date));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Academic Calendar</h1>
        <p className="text-sm text-slate-500">View upcoming holidays, events, and exams.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* LEFT: Events List */}
        <div className="space-y-4 order-2 lg:order-1">
          <div className="flex flex-wrap items-center gap-4 px-1">
            {(["HOLIDAY","EVENT","EXAM"] as const).map(t=>(
              <div key={t} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${EC[t].dot}`}/>
                <span className="text-xs font-medium text-slate-500">{t.charAt(0)+t.slice(1).toLowerCase()}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                <CalendarDays size={16} className="text-blue-500"/>
                Events & Holidays — {MONTHS[mo]} {yr}
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {loading ? Array(3).fill(0).map((_,i)=>(
                <div key={i} className="px-5 py-4 animate-pulse"><div className="flex gap-3"><div className="h-10 w-10 rounded-xl bg-slate-100"/><div className="flex-1 space-y-2"><div className="h-4 w-40 bg-slate-100 rounded"/><div className="h-3 w-24 bg-slate-100 rounded"/></div></div></div>
              )) : sorted.length===0 ? (
                <div className="px-5 py-12 text-center">
                  <CalendarDays size={32} className="mx-auto text-slate-200 mb-3"/>
                  <p className="text-sm text-slate-400 font-medium">No events this month</p>
                </div>
              ) : sorted.map((ev,i)=>{
                const c=EC[ev.type]||EC.EVENT; const Icon=EI[ev.type]||CalendarDays;
                const evD=new Date(ev.date+"T00:00:00");
                return (
                  <motion.div key={ev.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/70 transition-colors">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${c.gradient} text-white flex flex-col items-center justify-center shrink-0 shadow-sm`}>
                      <span className="text-lg font-extrabold leading-none">{evD.getDate()}</span>
                      <span className="text-[8px] font-bold uppercase tracking-wider opacity-80">{evD.toLocaleDateString("en",{weekday:"short"})}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${c.text}`}><Icon size={10}/>{ev.type}</span>
                        <span className="text-[10px] text-slate-400">{evD.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: Compact Calendar */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-4 self-start">
          <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <button onClick={prev} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition-colors"><ChevronLeft size={16}/></button>
              <h2 className="text-sm font-bold text-slate-800">{MONTHS[mo]} {yr}</h2>
              <button onClick={next} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/70 transition-colors"><ChevronRight size={16}/></button>
            </div>
            <div className="px-4 py-2 border-b border-slate-50 flex justify-end">
              <button onClick={goToday} className="px-3 py-1 rounded-lg text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">Today</button>
            </div>
            <div className="grid grid-cols-7 px-3 pt-2">
              {DAYS.map((d,i)=>(<div key={d} className={`py-1.5 text-center text-[10px] font-bold uppercase tracking-wider ${i===0||i===6?"text-rose-400":"text-slate-400"}`}>{d}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 px-3 pb-3 pt-1">
              {Array(fd).fill(0).map((_,i)=><div key={`e-${i}`} className="h-10"/>)}
              {Array.from({length:dim},(_,i)=>i+1).map(day=>{
                const de=evFor(day); const wk=isWknd(day); const tH=isToday(day);
                return (
                  <div key={day} className={`h-10 rounded-lg flex flex-col items-center justify-center transition-all ${tH?"bg-blue-600 text-white shadow-md shadow-blue-200":wk?"bg-rose-50/60 text-rose-400":"text-slate-700"}`}>
                    <span className={`text-xs font-bold ${tH?"text-white":""}`}>{day}</span>
                    {de.length>0&&(<div className="flex gap-0.5 mt-0.5">
                      {de.some(e=>e.type==="HOLIDAY")&&<div className={`h-1 w-1 rounded-full ${tH?"bg-white/80":"bg-rose-500"}`}/>}
                      {de.some(e=>e.type==="EVENT")&&<div className={`h-1 w-1 rounded-full ${tH?"bg-white/80":"bg-blue-500"}`}/>}
                      {de.some(e=>e.type==="EXAM")&&<div className={`h-1 w-1 rounded-full ${tH?"bg-white/80":"bg-amber-500"}`}/>}
                    </div>)}
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-lg font-extrabold text-rose-600">{events.filter(e=>e.type==="HOLIDAY").length}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Holidays</p></div>
                <div><p className="text-lg font-extrabold text-blue-600">{events.filter(e=>e.type==="EVENT").length}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Events</p></div>
                <div><p className="text-lg font-extrabold text-amber-600">{events.filter(e=>e.type==="EXAM").length}</p><p className="text-[9px] font-bold text-slate-400 uppercase">Exams</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
