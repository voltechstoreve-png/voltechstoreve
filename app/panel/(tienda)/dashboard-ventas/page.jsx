'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { usePermissions } from '@/app/context/PermissionsContext';
import { 
  Users, Plus, Edit, Trash2, X, Shield, UserCheck, UserX, 
  Copy, Check, Search, AlertCircle, Mail, Phone, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

// ✅ FUNCIÓN PARA GENERAR UUID VÁLIDO
const generarUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function EquipoPage() {
  const { tienePermiso, esAdmin, esSocio, usuarioActual } = usePermissions();
  const [miembros, setMiembros] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInvitationLink, setShowInvitationLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: 'vendedor',
    activo: true,
  });

  useEffect(() => {
    cargarMiembros();
  }, []);

  const cargarMiembros = async () => {
    setLoading(true);
    let miembrosData = [];

    // 1. Intentar cargar desde Supabase
    if (supabase) {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('fechaRegistro', { ascending: false });
      
      if (!error && data && data.length > 0) {
        miembrosData = data;
      }
    }

    // 2. Fallback a localStorage
    if (miembrosData.length === 0) {
      const equipoGuardado = localStorage.getItem('voltech_equipo');
      if (equipoGuardado) {
        miembrosData = JSON.parse(equipoGuardado);
      } else {
        miembrosData = [{ 
          id: generarUUID(), 
          nombre: 'Administrador', 
          email: 'admin@voltech.store', 
          telefono: '', 
          rol: 'admin', 
          activo: true,
          aprobado: true,
          registrado: true,
          password: 'admin123'
        }];
      }
    }

    setMiembros(miembrosData);
    setLoading(false);
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
    const token = generarUUID();
    return `${window.location.origin}/registro?token=${token}`;
  };

  const emailExiste = (email, excludeId = null) => {
    return miembros.some(m => 
      m.email?.toLowerCase() === email.toLowerCase() && m.id !== excludeId
    );
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

    const nuevoMiembro = {
      id: generarUUID(), // ✅ UUID válido
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      rol: formData.rol,
      activo: formData.activo,
      aprobado: true,
      registrado: false,
      password: passwordAleatorio,
      linkInvitacion: linkInvitacion,
      notificado: false,
      fechaRegistro: new Date().toISOString(),
    };

    // Guardar en Supabase
    if (supabase) {
      const { error } = await supabase.from('usuarios').insert([nuevoMiembro]);
      if (error) {
        toast.error('Error al guardar: ' + error.message);
        return;
      }
    }

    const miembrosActualizados = [...miembros, nuevoMiembro];
    setMiembros(miembrosActualizados);
    localStorage.setItem('voltech_equipo', JSON.stringify(miembrosActualizados));

    toast.success(`Miembro agregado. Contraseña: ${passwordAleatorio}`);
    setFormData({ nombre: '', email: '', telefono: '', rol: 'vendedor', activo: true });
    setEditingId(null);
  };

  const actualizarMiembro = async (id) => {
    if (!formData.nombre || !formData.email) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    if (emailExiste(formData.email, id)) {
      toast.error('Este correo electrónico ya está siendo usado');
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
          activo: formData.activo,
        })
        .eq('id', id);

      if (error) {
        toast.error('Error al actualizar: ' + error.message);
        return;
      }
    }

    const miembrosActualizados = miembros.map(m =>
      m.id === id ? { ...m, ...formData } : m
    );
    setMiembros(miembrosActualizados);
    localStorage.setItem('voltech_equipo', JSON.stringify(miembrosActualizados));
    toast.success('Miembro actualizado correctamente');
    setEditingId(null);
    setFormData({ nombre: '', email: '', telefono: '', rol: 'vendedor', activo: true });
  };

  const eliminarMiembro = async (id) => {
    const miembro = miembros.find(m => m.id === id);
    
    // Proteger al último admin
    if (miembro?.rol === 'admin' && miembros.filter(m => m.rol === 'admin').length === 1) {
      toast.error('No se puede eliminar al último administrador');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar este miembro?')) return;

    if (supabase) {
      const { error } = await supabase.from('usuarios').delete().eq('id', id);
      if (error) {
        toast.error('Error al eliminar: ' + error.message);
        return;
      }
    }

    const miembrosActualizados = miembros.filter(m => m.id !== id);
    setMiembros(miembrosActualizados);
    localStorage.setItem('voltech_equipo', JSON.stringify(miembrosActualizados));
    toast.success('Miembro eliminado');
  };

  const toggleActivo = async (id) => {
    const miembro = miembros.find(m => m.id === id);
    const nuevoEstado = !miembro.activo;

    if (supabase) {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: nuevoEstado })
        .eq('id', id);
      
      if (error) {
        toast.error('Error al actualizar estado');
        return;
      }
    }

    const miembrosActualizados = miembros.map(m =>
      m.id === id ? { ...m, activo: nuevoEstado } : m
    );
    setMiembros(miembrosActualizados);
    localStorage.setItem('voltech_equipo', JSON.stringify(miembrosActualizados));
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

  const miembrosFiltrados = miembros.filter(m =>
    m.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalActivos = miembros.filter(m => m.activo).length;
  const totalInactivos = miembros.filter(m => !m.activo).length;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipo</h1>
          <p className="text-sm text-voltech-muted mt-1">Gestiona los miembros de tu equipo y sus permisos</p>
        </div>
        {tienePermiso('puedeCrearUsuarios') && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowInvitationLink(!showInvitationLink)}
              className="px-4 py-2 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-cyan transition-all flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Link de Invitación
            </button>
            {!editingId && (
              <button
                onClick={() => setEditingId('new')}
                className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Miembro
              </button>
            )}
          </div>
        )}
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
        {editingId && tienePermiso('puedeEditarUsuarios') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-voltech-surface border border-voltech-border rounded-xl p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">
              {editingId === 'new' ? 'Agregar Nuevo Miembro' : 'Editar Miembro'}
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
                />
              </div>
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Rol</label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
                >
                  <option value="admin">Administrador</option>
                  <option value="socio">Socio</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="logistica">Logística</option>
                  <option value="marketing">Marketing</option>
                </select>
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
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => editingId === 'new' ? guardarMiembro() : actualizarMiembro(editingId)}
                className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {editingId === 'new' ? 'Guardar' : 'Guardar Cambios'}
              </button>
              <button
                onClick={cancelarEdicion}
                className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"
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
              <p className="text-xl font-bold text-white">{miembros.length}</p>
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
      </div>

      <div className="bg-voltech-surface border border-voltech-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-voltech-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-voltech-muted" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-voltech w-full rounded-lg pl-10 pr-4 py-2 text-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-voltech-dark border-b border-voltech-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Miembro</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Contacto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Rol</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-voltech-muted">Estado</th>
                {tienePermiso('puedeEditarUsuarios') && (
                  <th className="text-right px-4 py-3 text-xs font-semibold text-voltech-muted">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {miembrosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={tienePermiso('puedeEditarUsuarios') ? 5 : 4} className="text-center py-12 text-voltech-muted">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay miembros registrados</p>
                  </td>
                </tr>
              ) : (
                miembrosFiltrados.map((miembro) => (
                  <tr key={miembro.id} className="border-b border-voltech-border hover:bg-voltech-border/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-voltech-cyan to-voltech-purple flex items-center justify-center text-white font-bold">
                          {miembro.nombre?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{miembro.nombre}</p>
                          <p className="text-xs text-voltech-muted">{miembro.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-voltech-muted">{miembro.telefono || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        miembro.rol === 'admin' ? 'bg-voltech-purple/20 text-voltech-purple' :
                        miembro.rol === 'socio' ? 'bg-voltech-warning/20 text-voltech-warning' :
                        'bg-voltech-cyan/20 text-voltech-cyan'
                      }`}>
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
                    {tienePermiso('puedeEditarUsuarios') && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => editarMiembro(miembro)}
                            className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-cyan transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarMiembro(miembro.id)}
                            className="p-2 rounded-lg hover:bg-voltech-border text-voltech-muted hover:text-voltech-error transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}