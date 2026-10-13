'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // ✅ NUEVO: Conexión a Supabase
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Save, 
  X,
  Camera,
  Lock,
  CheckCircle,
  Edit3
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function PerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // ✅ NUEVO: Estado de carga
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: '',
    avatar: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...userData });

  // ✅ ACTUALIZADO: Carga desde Supabase con fallback a localStorage
  useEffect(() => {
    const cargarPerfil = async () => {
      const localUser = getUser();
      if (!localUser || !localUser.nombre) {
        router.push('/portal');
        return;
      }      

      let dataToSet = {
        nombre: localUser.nombre || 'Administrador',
        email: localUser.email || 'admin@voltech.store',
        telefono: localUser.telefono || '',
        rol: localUser.rol || 'Admin',
        avatar: localUser.avatar || `https://ui-avatars.com/api/?name=${localUser.nombre || 'Admin'}&background=00d4ff&color=fff&bold=true`,
      };

      // Intentar obtener datos frescos de Supabase si tenemos un ID válido
      if (supabase && localUser.id && localUser.id !== 'local-1') {
        const { data, error } = await supabase
          .from('usuarios')
          .select('nombre, email, telefono, rol, avatar')
          .eq('id', localUser.id)
          .single();
        
        if (!error && data) {
          dataToSet = {
            nombre: data.nombre || dataToSet.nombre,
            email: data.email || dataToSet.email,
            telefono: data.telefono || dataToSet.telefono,
            rol: data.rol || dataToSet.rol,
            avatar: data.avatar || dataToSet.avatar,
          };
          // Actualizar sesión con los datos frescos
          setUser({ ...localUser, ...data });
        }
      }

      setUserData(dataToSet);
      setFormData(dataToSet);
      setLoading(false);
    };

    cargarPerfil();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ ACTUALIZADO: Guarda en Supabase y localStorage
  const handleSave = async () => {
    if (!formData.nombre || !formData.email) {
      toast.error('Nombre y email son obligatorios');
      return;
    }

    const localUser = getUser();
    if (!localUser) return;
    const updatedUser = {
      ...localUser,
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
    };

    // Actualizar en Supabase
    if (supabase && localUser.id && localUser.id !== 'local-1') {
      const { error } = await supabase
        .from('usuarios')
        .update({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
        })
        .eq('id', localUser.id);

      if (error) {
        toast.error('Error al actualizar en la base de datos');
        return;
      }
    }

    // Actualizar sesión (caché)
    setUser(updatedUser);
    setUserData(formData);
    setEditMode(false);
    toast.success('Perfil actualizado correctamente');
  };

  const handleCancel = () => {
    setFormData(userData);
    setEditMode(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-voltech-muted animate-pulse flex items-center gap-2">
          <User className="w-5 h-5 animate-spin" /> Cargando perfil...
        </div>
      </div>
    );
  }

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

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Mi Perfil</h1>
          <p className="text-xs sm:text-sm text-voltech-muted mt-1">Gestiona tu información personal</p>
        </div>
        <button className="w-full sm:w-auto shrink-0 justify-center px-4 py-2.5 bg-voltech-cyan/20 text-voltech-cyan rounded-xl text-xs sm:text-sm font-medium hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Cambiar Foto
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-2 rounded-lg md:rounded-lg bg-voltech-cyan/10 md:bg-voltech-cyan/20 text-voltech-cyan shrink-0 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Nombre</p>
              <p className="text-sm md:text-lg font-bold text-white mt-0.5 truncate">{userData.nombre}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-2 rounded-lg md:rounded-lg bg-voltech-purple/10 md:bg-voltech-purple/20 text-voltech-purple shrink-0 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Email</p>
              <p className="text-sm md:text-lg font-bold text-white mt-0.5 truncate">{userData.email}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-2 rounded-lg md:rounded-lg bg-voltech-warning/10 md:bg-voltech-warning/20 text-voltech-warning shrink-0 flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Teléfono</p>
              <p className="text-sm md:text-lg font-bold text-white mt-0.5 truncate">{userData.telefono || '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/60 md:bg-voltech-surface border border-slate-800/80 md:border-voltech-border rounded-2xl md:rounded-xl p-3.5 md:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-2 rounded-lg md:rounded-lg bg-voltech-success/10 md:bg-voltech-success/20 text-voltech-success shrink-0 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 md:flex-none">
              <p className="text-[11px] md:text-xs font-medium text-slate-400 md:text-voltech-muted leading-tight truncate">Rol</p>
              <p className="text-sm md:text-lg font-bold text-white mt-0.5 truncate">{userData.rol}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información Personal */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-lg bg-voltech-cyan/20 shrink-0">
              <User className="w-5 h-5 text-voltech-cyan" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">Información Personal</h3>
              <p className="text-xs text-voltech-muted truncate">Actualiza tus datos personales</p>
            </div>
          </div>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="w-full sm:w-auto shrink-0 justify-center px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-xs sm:text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Editar Perfil
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">
                <User className="w-3 h-3 inline mr-1" />
                Nombre completo *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                disabled={!editMode}
                className="input-voltech w-full rounded-lg px-4 py-3 text-sm disabled:opacity-50"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">
                <Mail className="w-3 h-3 inline mr-1" />
                Correo electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editMode}
                className="input-voltech w-full rounded-lg px-4 py-3 text-sm disabled:opacity-50"
                placeholder="email@ejemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">
                <Phone className="w-3 h-3 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                disabled={!editMode}
                className="input-voltech w-full rounded-lg px-4 py-3 text-sm disabled:opacity-50"
                placeholder="0412-1234567"
              />
            </div>

            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">
                <Shield className="w-3 h-3 inline mr-1" />
                Rol
              </label>
              <input
                type="text"
                value={userData.rol}
                disabled
                className="input-voltech w-full rounded-lg px-4 py-3 text-sm opacity-50"
              />
            </div>
          </div>

          {editMode && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
              <button
                onClick={handleCancel}
                className="w-full sm:w-auto px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Seguridad */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-voltech-success/20">
            <Lock className="w-5 h-5 text-voltech-success" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Seguridad</h3>
            <p className="text-xs text-voltech-muted">Protege tu cuenta</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <button className="w-full p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg text-left hover:border-voltech-cyan transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white group-hover:text-voltech-cyan transition-colors">Cambiar contraseña</p>
                <p className="text-xs text-voltech-muted mt-1">Actualiza tu contraseña regularmente</p>
              </div>
              <CheckCircle className="w-5 h-5 text-voltech-muted group-hover:text-voltech-cyan" />
            </div>
          </button>
          <button className="w-full p-4 bg-voltech-dark/50 border border-voltech-border rounded-lg text-left hover:border-voltech-cyan transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white group-hover:text-voltech-cyan transition-colors">Autenticación de dos factores</p>
                <p className="text-xs text-voltech-muted mt-1">Añade una capa extra de seguridad</p>
              </div>
              <CheckCircle className="w-5 h-5 text-voltech-muted group-hover:text-voltech-cyan" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}