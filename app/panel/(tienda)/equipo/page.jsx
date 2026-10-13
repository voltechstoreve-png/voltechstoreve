'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Plus, Edit, Trash2, X, Shield, UserCheck, UserX, Copy, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '@/components/CustomSelect';
import toast, { Toaster } from 'react-hot-toast';

export default function EquipoPage() {
  const [equipo, setEquipo] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'vendedor',
    activo: true,
  });
  const [showInvitationLink, setShowInvitationLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const userLogged = localStorage.getItem('voltech_user');
    if (userLogged) {
      setCurrentUser(JSON.parse(userLogged));
    }
    cargarEquipo();
  }, []);

  const cargarEquipo = async () => {
    if (supabase) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('fecharegistro', { ascending: false });
      
      if (!error && data) {
        setEquipo(data);
        localStorage.setItem('voltech_equipo', JSON.stringify(data));
      } else {
        console.warn('Error cargando equipo:', error?.message);
        cargarDesdeLocal();
      }
    } else {
      cargarDesdeLocal();
    }
  };

  const cargarDesdeLocal = () => {
    const equipoGuardado = localStorage.getItem('voltech_equipo');
    if (equipoGuardado) {
      setEquipo(JSON.parse(equipoGuardado));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const generarPasswordAleatorio = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generarLinkInvitacion = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return `${window.location.origin}/registro?token=${token}`;
  };

  const emailExiste = (email, excludeId = null) => {
    return equipo.some(m => m.email.toLowerCase() === email.toLowerCase() && m.id !== excludeId);
  };

  // ✅ CORRECCIÓN 1: Función dedicada para limpiar el formulario al agregar
  const handleNuevoMiembro = () => {
    setEditingId('new');
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      rol: 'vendedor',
      activo: true,
    });
  };

  const guardarMiembro = async () => {
    if (!formData.nombre || !formData.email) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    if (emailExiste(formData.email)) {
      toast.error('Este correo electrónico ya está registrado');
      return;
    }

    const passwordAleatorio = generarPasswordAleatorio();
    const linkInvitacion = generarLinkInvitacion();
    const nuevoMiembroData = { 
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      rol: formData.rol,
      activo: false,
      aprobado: false,
      password: passwordAleatorio,
      linkInvitacion: linkInvitacion,
      notificado: false,
      registrado: false,
      fechaRegistro: new Date().toISOString()
    };
    
    if (supabase) {
      const { data, error } = await supabase.from('usuarios').insert([nuevoMiembroData]).select().single();
      if (!error && data) {
        setEquipo(prev => [data, ...prev]);
        toast.success('Miembro creado. Link de invitación generado.');
        setTimeout(() => toast.success(`Contraseña temporal: ${passwordAleatorio}`), 1000);
      } else {
        toast.error('Error al guardar: ' + error.message);
        return;
      }
    } else {
      const nuevoMiembro = { ...nuevoMiembroData, id: Date.now() };
      const equipoActualizado = [...equipo, nuevoMiembro];
      setEquipo(equipoActualizado);
      localStorage.setItem('voltech_equipo', JSON.stringify(equipoActualizado));
      toast.success('Miembro agregado (Modo Local).');
    }
    
    setFormData({ nombre: '', email: '', telefono: '', rol: 'vendedor', activo: true });
    setEditingId(null);
  };

  const actualizarMiembro = async (id) => {
    if (!formData.nombre || !formData.email) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    if (emailExiste(formData.email, id)) {
      toast.error('Este correo electrónico ya está siendo usado por otro miembro');
      return;
    }

    if (supabase) {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          rol: formData.rol,
          activo: formData.activo
        })
        .eq('id', id);

      if (!error) {
        setEquipo(prev => prev.map(m => m.id === id ? { ...m, ...formData } : m));
        toast.success('Miembro actualizado');
      } else {
        toast.error('Error al actualizar: ' + error.message);
        return;
      }
    } else {
      const equipoActualizado = equipo.map(m => m.id === id ? { ...m, ...formData } : m);
      setEquipo(equipoActualizado);
      localStorage.setItem('voltech_equipo', JSON.stringify(equipoActualizado));
      toast.success('Miembro actualizado (Modo Local)');
    }
    
    setEditingId(null);
    setFormData({ nombre: '', email: '', telefono: '', rol: 'vendedor', activo: true });
  };

  const toggleActivo = async (id) => {
    const miembro = equipo.find(m => m.id === id);
    const nuevoEstado = !miembro.activo;

    if (supabase) {
      const { error } = await supabase.from('usuarios').update({ activo: nuevoEstado }).eq('id', id);
      if (!error) {
        setEquipo(prev => prev.map(m => m.id === id ? { ...m, activo: nuevoEstado } : m));
      } else {
        toast.error('Error al actualizar estado');
        return;
      }
    } else {
      const equipoActualizado = equipo.map(m => m.id === id ? { ...m, activo: nuevoEstado } : m);
      setEquipo(equipoActualizado);
      localStorage.setItem('voltech_equipo', JSON.stringify(equipoActualizado));
    }
  };

  // ✅ CORRECCIÓN 3: Función de aprobación mejorada con manejo de errores
  const aprobarMiembro = async (id) => {
    const miembro = equipo.find(m => m.id === id);
    if (!miembro) {
      toast.error('Miembro no encontrado');
      return;
    }

    try {
      if (supabase) {
        const { error } = await supabase
          .from('usuarios')
          .update({ 
            aprobado: true, 
            activo: true 
          })
          .eq('id', id);
        
        if (error) {
          console.error('Error Supabase:', error);
          toast.error('Error al aprobar: ' + error.message);
          return;
        }
      }
      
      setEquipo(prev => prev.map(m => 
        m.id === id ? { ...m, aprobado: true, activo: true } : m
      ));
      
      const equipoActualizado = equipo.map(m => 
        m.id === id ? { ...m, aprobado: true, activo: true } : m
      );
      localStorage.setItem('voltech_equipo', JSON.stringify(equipoActualizado));
      
      toast.success(`${miembro.nombre} aprobado exitosamente`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error inesperado al aprobar');
    }
  };

  // ✅ CORRECCIÓN 2: Solo bloquea la eliminación del admin PRINCIPAL
  const eliminarMiembro = async (id) => {
    const miembro = equipo.find(m => m.id === id);
    
    // Solo bloquear si es el admin principal (el primero o marcado como tal)
    if (miembro.esAdminPrincipal || (miembro.rol === 'admin' && equipo.filter(m => m.rol === 'admin').length === 1)) {
      toast.error('No se puede eliminar al administrador principal del sistema');
      return;
    }
    
    if (confirm(`¿Estás seguro de eliminar a ${miembro.nombre}?`)) {
      if (supabase) {
        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        if (!error) {
          setEquipo(prev => prev.filter(m => m.id !== id));
          toast.success('Miembro eliminado de la base de datos');
        } else {
          toast.error('Error al eliminar: ' + error.message);
        }
      } else {
        const equipoActualizado = equipo.filter(m => m.id !== id);
        setEquipo(equipoActualizado);
        localStorage.setItem('voltech_equipo', JSON.stringify(equipoActualizado));
        toast.success('Miembro eliminado (Modo Local)');
      }
    }
  };

  const copiarLink = () => {
    const link = `${window.location.origin}/registro?invite=voltech`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const editarMiembro = (miembro) => {
    setEditingId(miembro.id);
    setFormData({
      nombre: miembro.nombre,
      email: miembro.email,
      telefono: miembro.telefono || '',
      rol: miembro.rol,
      activo: miembro.activo,
    });
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setFormData({ nombre: '', email: '', telefono: '', rol: 'vendedor', activo: true });
  };

  const totalActivos = equipo.filter(m => m.activo).length;
  const totalInactivos = equipo.filter(m => !m.activo).length;
  const pendientesAprobacion = equipo.filter(m => !m.aprobado && m.rol !== 'admin').length;

  return (
    <div className="space-y-6">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
          success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="flex-1 min-w-0 pr-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Equipo</h1>
          <p className="text-xs sm:text-sm text-voltech-muted mt-1">Gestiona los miembros de tu equipo y sus permisos</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowInvitationLink(!showInvitationLink)}
            className="w-full sm:w-auto shrink-0 justify-center text-xs py-2 px-3 border border-slate-700 rounded-xl bg-voltech-surface border-voltech-border text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Link de Invitación
          </button>
          {!editingId && (
            <button
              onClick={handleNuevoMiembro}
              className="w-full sm:w-auto shrink-0 justify-center text-xs py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Miembro
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showInvitationLink && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden"
          >
            <div className="p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Link de Invitación General</h3>
              <p className="text-xs text-voltech-muted mb-3">
                Comparte este link con las personas que quieras que se registren en tu equipo
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/registro?invite=voltech`}
                  className="input-voltech flex-1 rounded-lg px-4 py-2 text-sm font-mono"
                />
                <button
                  onClick={copiarLink}
                  className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">
              {editingId === 'new' ? 'Agregar Nuevo Miembro' : 'Editar Información del Miembro'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre *</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                  placeholder="0412-1234567"
                />
              </div>
              <div>
                <CustomSelect
                  label="Rol"
                  name="rol"
                  value={formData.rol}
                  onChange={(v) => setFormData({ ...formData, rol: v })}
                  options={[
                    { value: 'admin', label: 'Administrador' },
                    { value: 'socio', label: 'Socio' },
                    { value: 'vendedor', label: 'Vendedor' },
                    { value: 'logistica', label: 'Logística' },
                    { value: 'marketing', label: 'Marketing' }
                  ]}
                  placeholder="Selecciona rol"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan"
              />
              <span className="text-sm text-voltech-muted">Miembro activo</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-4">
              <button
                onClick={() => editingId === 'new' ? guardarMiembro() : actualizarMiembro(editingId)}
                className="w-full sm:w-auto flex-1 justify-center text-xs sm:text-sm font-semibold py-2.5 px-4 rounded-xl btn-neon text-white flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editingId === 'new' ? 'Guardar y Generar Link' : 'Guardar Cambios'}
              </button>
              <button
                onClick={cancelarEdicion}
                className="w-full sm:w-auto text-xs py-2.5 px-4 justify-center bg-voltech-surface border border-voltech-border rounded-xl text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <Users className="w-5 h-5 text-voltech-cyan" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Total Miembros</p>
              <p className="text-xl font-bold text-white">{equipo.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <UserCheck className="w-5 h-5 text-voltech-success" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Activos</p>
              <p className="text-xl font-bold text-white">{totalActivos}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-error/20">
              <UserX className="w-5 h-5 text-voltech-error" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Inactivos</p>
              <p className="text-xl font-bold text-white">{totalInactivos}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20">
              <AlertCircle className="w-5 h-5 text-voltech-warning" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Pendientes</p>
              <p className="text-xl font-bold text-white">{pendientesAprobacion}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vista para Pantallas Móviles (< md) */}
      <div className="block md:hidden space-y-3">
        {equipo.map((miembro) => (
          <div key={miembro.id} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {miembro.nombre.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate">{miembro.nombre}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{miembro.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {editingId === miembro.id ? (
                  <>
                    <button onClick={() => actualizarMiembro(miembro.id)} className="p-1.5 text-emerald-400 hover:text-emerald-300"><Check size={16}/></button>
                    <button onClick={cancelarEdicion} className="p-1.5 text-rose-400 hover:text-rose-300"><X size={16}/></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => editarMiembro(miembro)} className="p-1.5 text-slate-400 hover:text-white"><Edit size={16}/></button>
                    <button onClick={() => eliminarMiembro(miembro.id)} className="p-1.5 text-slate-400 hover:text-rose-400"><Trash2 size={16}/></button>
                  </>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/40 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Contacto:</span>
                <span className="text-slate-200 font-mono">{miembro.telefono || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Rol:</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${
                  miembro.rol === 'admin' ? 'bg-indigo-500/20 text-indigo-300' :
                  miembro.rol === 'socio' ? 'bg-amber-500/20 text-amber-300' :
                  miembro.rol === 'vendedor' ? 'bg-cyan-500/20 text-cyan-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {miembro.rol}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Estado:</span>
                <button
                  onClick={() => toggleActivo(miembro.id)}
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] ${
                    miembro.activo 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {miembro.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
              <div>
                <span className="text-slate-400 block">Aprobación:</span>
                {miembro.rol === 'admin' && miembro.esAdminPrincipal ? (
                  <span className="text-indigo-400 font-medium">★ Principal</span>
                ) : miembro.aprobado ? (
                  <span className="text-emerald-400 font-medium">✓ Aprobado</span>
                ) : (
                  <button
                    onClick={() => aprobarMiembro(miembro.id)}
                    className="text-amber-400 font-medium hover:text-amber-300"
                  >
                    ⏳ Aprobar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vista Tabla Tradicional para Desktop (>= md) */}
      <div className="hidden md:block bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-voltech-dark border-b border-voltech-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Miembro</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Contacto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Rol</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Aprobación</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Notificación</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {equipo.map((miembro) => (
              <tr key={miembro.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold">
                      {miembro.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{miembro.nombre}</p>
                      <p className="text-xs text-voltech-muted">{miembro.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-voltech-muted">{miembro.telefono || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 w-fit ${
                    miembro.rol === 'admin' ? 'bg-voltech-purple/20 text-voltech-purple' :
                    miembro.rol === 'socio' ? 'bg-voltech-warning/20 text-voltech-warning' :
                    miembro.rol === 'vendedor' ? 'bg-voltech-cyan/20 text-voltech-cyan' :
                    'bg-voltech-success/20 text-voltech-success'
                  }`}>
                    <Shield className="w-3 h-3" />
                    {miembro.rol}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActivo(miembro.id)}
                    className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
                      miembro.activo 
                        ? 'bg-voltech-success/20 text-voltech-success hover:bg-voltech-success/30' 
                        : 'bg-voltech-error/20 text-voltech-error hover:bg-voltech-error/30'
                    } transition-colors`}
                  >
                    {miembro.activo ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                    {miembro.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {miembro.rol === 'admin' && miembro.esAdminPrincipal ? (
                    <span className="text-xs text-voltech-success flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Principal
                    </span>
                  ) : miembro.aprobado ? (
                    <span className="text-xs text-voltech-success flex items-center gap-1">
                      <Check className="w-3 h-3" /> Aprobado
                    </span>
                  ) : (
                    <button
                      onClick={() => aprobarMiembro(miembro.id)}
                      className="text-xs px-2 py-1 rounded-full bg-voltech-warning/20 text-voltech-warning hover:bg-voltech-warning/30 transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" /> Aprobar
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  {miembro.notificado ? (
                    <span className="text-xs text-voltech-success flex items-center gap-1">
                      <Check className="w-3 h-3" /> Enviada
                    </span>
                  ) : (
                    <span className="text-xs text-voltech-muted">Pendiente</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {editingId === miembro.id ? (
                      <>
                        <button
                          onClick={() => actualizarMiembro(miembro.id)}
                          className="p-2 rounded-lg bg-voltech-success/20 text-voltech-success hover:bg-voltech-success/30 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          className="p-2 rounded-lg bg-voltech-error/20 text-voltech-error hover:bg-voltech-error/30 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => editarMiembro(miembro)}
                          className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => eliminarMiembro(miembro.id)}
                          className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}