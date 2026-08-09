'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Bell, Clock, MessageSquare, ShieldCheck, Save, Check, Copy, Mail, BellRing,
  MailCheck, Calendar, Smartphone, Info, RotateCcw, Lock, Eye, EyeOff, Send, Trash2
} from 'lucide-react';
import EmojiTextarea, { PLANTILLAS_WA_DEFAULT, rellenarVariables } from '@/components/EmojiTextarea';
import toast, { Toaster } from 'react-hot-toast';

const TABS = [
  { id: 'notificaciones', label: 'Notificaciones & Alertas', icon: Bell },
  { id: 'recordatorios', label: 'Recordatorios', icon: Clock },
  { id: 'plantillas', label: 'Plantillas WhatsApp', icon: MessageSquare },
  { id: 'seguridad', label: 'Seguridad', icon: ShieldCheck },
];

const CLAVES_PLANTILLA = [
  { id: 'gracias_productos', label: '\uD83D\uDC9A Gracias por su compra', vars: ['{{nombre}}', '{{productos}}', '{{monto}}'] },
  { id: 'recordatorio_productos', label: '\u23F0 Recordatorio Pago Productos', vars: ['{{nombre}}', '{{productos}}', '{{monto}}'] },
  { id: 'recordatorio_streaming', label: '\uD83D\uDCFA Recordatorio Pago Streaming', vars: ['{{nombre}}', '{{plataforma}}', '{{monto}}', '{{fecha_vence}}'] },
  { id: 'regalo_falla', label: '\uD83C\uDF81 Regalo / Falla', vars: ['{{nombre}}', '{{plataforma}}', '{{dias}}', '{{tipo}}', '{{fecha_vence}}'] },
];

// ✅ Datos de ejemplo para el preview en vivo
const EJEMPLO = {
  nombre: 'HERNAN',
  productos: '\u2022 CABLE C-C x1 = $7.00',
  monto: '7.00',
  plataforma: 'NETFLIX',
  fecha_vence: '2026-09-04',
  dias: '5',
  tipo: 'regalo',
};

// ✅ Interpreta *negrita* y _cursiva_ como WhatsApp
function formatearWA(texto) {
  return (texto || '').split('\n').map((linea, i) => (
    <p key={i} className="min-h-[1em] whitespace-pre-wrap break-words">
      {linea.split(/(\*[^*]+\*|_[^_]+_)/g).map((seg, j) => {
        if (seg.length > 2 && seg.startsWith('*') && seg.endsWith('*')) return <strong key={j}>{seg.slice(1, -1)}</strong>;
        if (seg.length > 2 && seg.startsWith('_') && seg.endsWith('_')) return <em key={j}>{seg.slice(1, -1)}</em>;
        return seg;
      })}
    </p>
  ));
}

function PreviewWA({ texto, nombre }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-voltech-border shadow-xl h-full flex flex-col">
      <div className="bg-[#202c33] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white text-sm font-bold">
          {(nombre || 'C').charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{nombre || 'Cliente'}</p>
          <p className="text-[10px] text-emerald-400">en línea</p>
        </div>
      </div>
      <div className="bg-[#0b141a] p-4 flex-1 overflow-y-auto">
        <div className="bg-[#202c33] rounded-lg rounded-tl-none p-3 text-[13px] text-gray-200 shadow max-w-[90%]">
          {formatearWA(texto)}
          <p className="text-[9px] text-gray-500 text-right mt-2">12:00 {'\u2713\u2713'}</p>
        </div>
      </div>
    </div>
  );
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('notificaciones');
  const [mounted, setMounted] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const [config, setConfig] = useState({
    notificaciones: true,
    emailAlertas: true,
    notificacionesPush: true,
    recordatoriosStreaming: { hora: '08:00', diasAnticipacion: 2, activado: true },
    recordatoriosProductos: { hora: '09:00', frecuencia: 'diario', activado: true },
  });

  const [plantillasWa, setPlantillasWa] = useState({});
  const [scopePlantillas, setScopePlantillas] = useState('global');
  const [claveActiva, setClaveActiva] = useState('gracias_productos');
  const [borrador, setBorrador] = useState({ ...PLANTILLAS_WA_DEFAULT });

  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    try { setUsuarioActual(JSON.parse(localStorage.getItem('voltech_user') || 'null')); } catch { setUsuarioActual(null); }
    setMounted(true);
  }, []);

  const esAdmin = (usuarioActual?.rol || '').toLowerCase() === 'admin';
    const uidPropio = usuarioActual?.id || usuarioActual?.nombre || 'anon';
  const tienePropia = !!(plantillasWa?.[uidPropio]?.[claveActiva]);

  const eliminarMiPlantilla = async () => {
    if (!confirm('¿Eliminar tu plantilla propia? Volverás a usar la global.')) return;
    const copia = { ...plantillasWa };
    if (copia[uidPropio]) delete copia[uidPropio][claveActiva];
    setPlantillasWa(copia);
    if (supabase) await supabase.from('settings').upsert({ clave: 'plantillas_whatsapp', valor: copia }, { onConflict: 'clave' });
    localStorage.setItem('voltech_plantillas_whatsapp', JSON.stringify(copia));
    toast.success('Plantilla propia eliminada');
  };

  useEffect(() => {
    if (!mounted) return;
    const uid = scopePlantillas === 'global' ? 'global' : (usuarioActual?.id || usuarioActual?.nombre || 'anon');
    const propias = plantillasWa?.[uid] || {};
    setBorrador({
      gracias_productos: propias.gracias_productos ?? PLANTILLAS_WA_DEFAULT.gracias_productos,
      recordatorio_productos: propias.recordatorio_productos ?? PLANTILLAS_WA_DEFAULT.recordatorio_productos,
      recordatorio_streaming: propias.recordatorio_streaming ?? PLANTILLAS_WA_DEFAULT.recordatorio_streaming,
      regalo_falla: propias.regalo_falla ?? PLANTILLAS_WA_DEFAULT.regalo_falla,
    });
  }, [scopePlantillas, plantillasWa, mounted, usuarioActual]);

  useEffect(() => {
    const cargar = async () => {
      let configData = null;
      let plantillasData = null;
      if (supabase) {
        const [{ data: dC }, { data: dP }] = await Promise.all([
          supabase.from('settings').select('valor').eq('clave', 'configuracion_panel').maybeSingle(),
          supabase.from('settings').select('valor').eq('clave', 'plantillas_whatsapp').maybeSingle(),
        ]);
        if (dC?.valor) configData = dC.valor;
        if (dP?.valor) plantillasData = typeof dP.valor === 'string' ? JSON.parse(dP.valor) : dP.valor;
      }
      if (!configData) { const s = localStorage.getItem('voltech_config'); if (s) configData = JSON.parse(s); }
      if (!plantillasData) { const s = localStorage.getItem('voltech_plantillas_whatsapp'); if (s) plantillasData = JSON.parse(s); }
      if (configData) setConfig(prev => ({
        ...prev, ...configData,
        recordatoriosStreaming: { ...prev.recordatoriosStreaming, ...configData.recordatoriosStreaming },
        recordatoriosProductos: { ...prev.recordatoriosProductos, ...configData.recordatoriosProductos },
      }));
      if (plantillasData) setPlantillasWa(plantillasData);
    };
    cargar();
  }, []);

  const guardarTodo = async () => {
    try {
      if (supabase) {
        await supabase.from('settings').upsert({ clave: 'configuracion_panel', valor: config }, { onConflict: 'clave' });
        const uid = scopePlantillas === 'global' ? 'global' : (usuarioActual?.id || usuarioActual?.nombre || 'anon');
        const nuevo = { ...plantillasWa, [uid]: { ...borrador } };
        await supabase.from('settings').upsert({ clave: 'plantillas_whatsapp', valor: nuevo }, { onConflict: 'clave' });
        setPlantillasWa(nuevo);
        localStorage.setItem('voltech_plantillas_whatsapp', JSON.stringify(nuevo));
      }
      localStorage.setItem('voltech_config', JSON.stringify(config));
      toast.success('Cambios guardados correctamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar');
    }
  };

  const cambiarPassword = async () => {
    if (!passNueva || passNueva.length < 6) return toast.error('La nueva contraseña debe tener 6+ caracteres');
    if (passNueva !== passConfirmar) return toast.error('Las contraseñas no coinciden');
    if (!usuarioActual) return toast.error('Sesión no válida');
    if (supabase && usuarioActual.password && usuarioActual.password !== passActual) {
      return toast.error('La contraseña actual no es correcta');
    }
    if (supabase) {
      const { error } = await supabase.from('usuarios').update({ password: passNueva }).eq('id', usuarioActual.id);
      if (error) return toast.error('Error: ' + error.message);
      const u = { ...usuarioActual, password: passNueva };
      localStorage.setItem('voltech_user', JSON.stringify(u));
    }
    setPassActual(''); setPassNueva(''); setPassConfirmar('');
    toast.success('Contraseña actualizada');
  };

  const claveSel = CLAVES_PLANTILLA.find(c => c.id === claveActiva);
  const textoPreview = rellenarVariables(borrador[claveActiva] || '', EJEMPLO);

  const Switch = ({ checked, onChange, color = 'voltech-cyan' }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? `bg-${color}` : 'bg-voltech-border'}`}
      style={checked ? { backgroundColor: color === 'voltech-purple' ? '#a855f7' : color === 'voltech-success' ? '#22c55e' : '#00d4ff' } : {}}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-0.5'}`} />
    </button>
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" toastOptions={{ style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' }, success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } }, error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } } }} />

      {/* ✅ Header + Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuración del Sistema</h1>
          <p className="text-sm text-voltech-muted mt-1">Personaliza notificaciones, recordatorios y plantillas</p>
        </div>
        <button onClick={guardarTodo} className="px-5 py-2.5 bg-gradient-to-r from-voltech-purple to-voltech-success text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2">
          <Save className="w-4 h-4" /> Guardar Cambios
        </button>
      </div>

      <div className="flex gap-2 border-b border-voltech-border overflow-x-auto pb-px">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id ? 'text-voltech-cyan border-voltech-cyan' : 'text-voltech-muted border-transparent hover:text-white'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: NOTIFICACIONES ================= */}
      {activeTab === 'notificaciones' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-voltech-cyan/20"><Smartphone className="w-5 h-5 text-voltech-cyan" /></div>
                <div><p className="text-sm font-medium text-white">Push</p><p className="text-xs text-voltech-muted">{config.notificacionesPush ? 'Activadas' : 'Desactivadas'}</p></div>
              </div>
              <Switch checked={config.notificacionesPush} onChange={v => setConfig({ ...config, notificacionesPush: v })} />
            </div>
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-voltech-purple/20"><Mail className="w-5 h-5 text-voltech-purple" /></div>
                <div><p className="text-sm font-medium text-white">Email</p><p className="text-xs text-voltech-muted">{config.emailAlertas ? 'Resumen diario' : 'Sin resumen'}</p></div>
              </div>
              <Switch checked={config.emailAlertas} onChange={v => setConfig({ ...config, emailAlertas: v })} color="voltech-purple" />
            </div>
            <div className="bg-voltech-surface border border-voltech-border rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-voltech-success/20"><BellRing className="w-5 h-5 text-voltech-success" /></div>
                <div><p className="text-sm font-medium text-white">Sistema</p><p className="text-xs text-voltech-muted">{config.notificaciones ? 'Activas' : 'Inactivas'}</p></div>
              </div>
              <Switch checked={config.notificaciones} onChange={v => setConfig({ ...config, notificaciones: v })} color="voltech-success" />
            </div>
          </div>
          <div className="p-4 bg-voltech-cyan/5 border border-voltech-cyan/20 rounded-lg flex items-start gap-3">
            <Info className="w-4 h-4 text-voltech-cyan mt-0.5" />
            <p className="text-xs text-voltech-muted">Las notificaciones push aparecen en PC y celular aunque estés en otra pestaña; al hacer clic te llevan directo al panel correspondiente.</p>
          </div>
        </div>
      )}

      {/* ================= TAB 2: RECORDATORIOS ================= */}
      {activeTab === 'recordatorios' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-voltech-purple/20"><Calendar className="w-5 h-5 text-voltech-purple" /></div>
              <div><h3 className="text-lg font-bold text-white">Recordatorios Streaming</h3><p className="text-xs text-voltech-muted">Vencimiento de suscripciones</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs text-voltech-muted mb-2">Hora de aviso</label>
                <input type="time" value={config.recordatoriosStreaming.hora} onChange={e => setConfig({ ...config, recordatoriosStreaming: { ...config.recordatoriosStreaming, hora: e.target.value } })} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2">Anticipación</label>
                <select value={config.recordatoriosStreaming.diasAnticipacion} onChange={e => setConfig({ ...config, recordatoriosStreaming: { ...config.recordatoriosStreaming, diasAnticipacion: parseInt(e.target.value) } })} className="input-voltech w-full rounded-lg px-4 py-3 text-sm">
                  {[1, 2, 3, 5, 7].map(d => <option key={d} value={d}>{d} día(s) antes</option>)}
                </select></div>
            </div>
            <label className="flex items-center justify-between p-4 rounded-lg bg-voltech-dark/50 border border-voltech-border">
              <span className="text-sm text-white">Activar recordatorios</span>
              <Switch checked={config.recordatoriosStreaming.activado} onChange={v => setConfig({ ...config, recordatoriosStreaming: { ...config.recordatoriosStreaming, activado: v } })} color="voltech-purple" />
            </label>
          </div>

          <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-voltech-cyan/20"><Clock className="w-5 h-5 text-voltech-cyan" /></div>
              <div><h3 className="text-lg font-bold text-white">Recordatorios Productos</h3><p className="text-xs text-voltech-muted">Cobros pendientes</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs text-voltech-muted mb-2">Hora fija</label>
                <input type="time" value={config.recordatoriosProductos.hora} onChange={e => setConfig({ ...config, recordatoriosProductos: { ...config.recordatoriosProductos, hora: e.target.value } })} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" /></div>
              <div><label className="block text-xs text-voltech-muted mb-2">Frecuencia</label>
                <select value={config.recordatoriosProductos.frecuencia} onChange={e => setConfig({ ...config, recordatoriosProductos: { ...config.recordatoriosProductos, frecuencia: e.target.value } })} className="input-voltech w-full rounded-lg px-4 py-3 text-sm">
                  <option value="diario">Diario</option><option value="semanal">Semanal (Lunes)</option>
                </select></div>
            </div>
            <label className="flex items-center justify-between p-4 rounded-lg bg-voltech-dark/50 border border-voltech-border">
              <span className="text-sm text-white">Activar recordatorios</span>
              <Switch checked={config.recordatoriosProductos.activado} onChange={v => setConfig({ ...config, recordatoriosProductos: { ...config.recordatoriosProductos, activado: v } })} />
            </label>
          </div>

          <div className="lg:col-span-2 p-4 bg-voltech-purple/5 border border-voltech-purple/20 rounded-lg flex items-start gap-3">
            <Clock className="w-4 h-4 text-voltech-purple mt-0.5" />
            <p className="text-sm text-voltech-muted">
              <span className="text-voltech-purple font-semibold">Ejemplo:</span> si un cliente vence el 11/07 a las 5PM y configuras {config.recordatoriosStreaming.diasAnticipacion} día(s) antes a las {config.recordatoriosStreaming.hora}, recibirás la alerta el <span className="text-white font-semibold">09/07 a las {config.recordatoriosStreaming.hora}</span>.
            </p>
          </div>
        </div>
      )}

      {/* ================= TAB 3: PLANTILLAS (2 columnas) ================= */}
      {activeTab === 'plantillas' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
          {/* Editor 60% */}
          <div className="lg:col-span-3 bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-voltech-success/20"><MessageSquare className="w-5 h-5 text-voltech-success" /></div>
                <h3 className="text-lg font-bold text-white">Editor de Plantillas</h3>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setScopePlantillas('mia')} className={`px-3 py-1.5 rounded-lg text-xs ${scopePlantillas === 'mia' ? 'bg-voltech-cyan text-white' : 'bg-voltech-dark/50 text-voltech-muted'}`}>Mis plantillas</button>
                {mounted && esAdmin && (
                  <button onClick={() => setScopePlantillas('global')} className={`px-3 py-1.5 rounded-lg text-xs ${scopePlantillas === 'global' ? 'bg-voltech-purple text-white' : 'bg-voltech-dark/50 text-voltech-muted'}`}>Global (Admin)</button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {CLAVES_PLANTILLA.map(c => (
                <button key={c.id} onClick={() => setClaveActiva(c.id)} className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${claveActiva === c.id ? 'bg-voltech-cyan/20 text-voltech-cyan border border-voltech-cyan/40' : 'bg-voltech-dark/50 text-voltech-muted border border-voltech-border'}`}>
                  {c.label}
                </button>
              ))}
            </div>

            <EmojiTextarea
              value={borrador[claveActiva] || ''}
              onChange={v => setBorrador({ ...borrador, [claveActiva]: v })}
              variables={claveSel?.vars || []}
              rows={10}
            />

            {scopePlantillas === 'mia' && !tienePropia && (
              <p className="text-xs text-voltech-warning">Aún no tienes plantilla propia: se usará la global. Edita y guarda para crear la tuya.</p>
            )}
            <div className="flex gap-3">
              <button onClick={guardarTodo} className="flex-1 px-4 py-2 bg-voltech-success/20 text-voltech-success rounded-lg hover:bg-voltech-success/30 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> {scopePlantillas === 'mia' ? 'Guardar como mía' : 'Guardar Global'}</button>
              {scopePlantillas === 'mia' && tienePropia && (
                <button onClick={eliminarMiPlantilla} className="px-4 py-2 bg-voltech-error/20 text-voltech-error rounded-lg hover:bg-voltech-error/30 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Eliminar mi plantilla</button>
              )}
              <button onClick={() => setBorrador({ ...PLANTILLAS_WA_DEFAULT })} className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-voltech-muted hover:text-white flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Restaurar</button>
            </div>
          </div>

          {/* Preview 40% */}
          <div className="lg:col-span-2 space-y-3 lg:h-full flex flex-col">
            <p className="text-xs text-voltech-muted flex items-center gap-1"><Eye className="w-3 h-3" /> Vista previa en vivo (con datos de ejemplo)</p>
            <PreviewWA texto={textoPreview} nombre="Cliente" />
          </div>
        </div>
      )}

      {/* ================= TAB 4: SEGURIDAD ================= */}
      {activeTab === 'seguridad' && (
        <div className="max-w-lg bg-voltech-surface border border-voltech-border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-success/20"><ShieldCheck className="w-5 h-5 text-voltech-success" /></div>
            <div><h3 className="text-lg font-bold text-white">Cambiar Contraseña</h3><p className="text-xs text-voltech-muted">Protege tu cuenta</p></div>
          </div>
          <div>
            <label className="block text-xs text-voltech-muted mb-1">Contraseña actual</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-voltech-muted" />
              <input type={showPass ? 'text' : 'password'} value={passActual} onChange={e => setPassActual(e.target.value)} className="input-voltech w-full rounded-lg pl-10 pr-10 py-3 text-sm" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-voltech-muted">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-voltech-muted mb-1">Nueva contraseña</label>
            <input type={showPass ? 'text' : 'password'} value={passNueva} onChange={e => setPassNueva(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-voltech-muted mb-1">Confirmar nueva contraseña</label>
            <input type={showPass ? 'text' : 'password'} value={passConfirmar} onChange={e => setPassConfirmar(e.target.value)} className="input-voltech w-full rounded-lg px-4 py-3 text-sm" />
          </div>
          <button onClick={cambiarPassword} className="w-full px-4 py-2.5 bg-voltech-success/20 text-voltech-success rounded-lg hover:bg-voltech-success/30 flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Actualizar Contraseña</button>
        </div>
      )}
    </div>
  );
}