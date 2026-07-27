'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'default-no-store';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rol: '',
    avatar: '',
  });
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...userData });

  useEffect(() => {
    const userLogged = localStorage.getItem('voltech_user');
    if (userLogged) {
      const user = JSON.parse(userLogged);
      setUserData({
        nombre: user.nombre || 'Administrador',
        email: user.email || 'admin@voltech.store',
        telefono: user.telefono || '',
        rol: user.rol || 'Admin',
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.nombre || 'Admin'}&background=00d4ff&color=fff&bold=true`,
      });
      setFormData({
        nombre: user.nombre || 'Administrador',
        email: user.email || 'admin@voltech.store',
        telefono: user.telefono || '',
        rol: user.rol || 'Admin',
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${user.nombre || 'Admin'}&background=00d4ff&color=fff&bold=true`,
      });
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    if (!formData.nombre || !formData.email) {
      toast.error('Nombre y email son obligatorios');
      return;
    }

    const userLogged = localStorage.getItem('voltech_user');
    const updatedUser = {
      ...JSON.parse(userLogged),
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
    };

    localStorage.setItem('voltech_user', JSON.stringify(updatedUser));
    setUserData(formData);
    setEditMode(false);
    toast.success('Perfil actualizado correctamente');
  };

  const handleCancel = () => {
    setFormData(userData);
    setEditMode(false);
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
          <p className="text-sm text-voltech-muted mt-1">Gestiona tu información personal</p>
        </div>
        <button className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Cambiar Foto
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <User className="w-5 h-5 text-voltech-cyan" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Nombre</p>
              <p className="text-lg font-bold text-white">{userData.nombre}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-purple/20">
              <Mail className="w-5 h-5 text-voltech-purple" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Email</p>
              <p className="text-lg font-bold text-white truncate max-w-[150px]">{userData.email}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-warning/20">
              <Phone className="w-5 h-5 text-voltech-warning" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Teléfono</p>
              <p className="text-lg font-bold text-white">{userData.telefono || '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <Shield className="w-5 h-5 text-voltech-success" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Rol</p>
              <p className="text-lg font-bold text-white">{userData.rol}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información Personal */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <User className="w-5 h-5 text-voltech-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Información Personal</h3>
              <p className="text-xs text-voltech-muted">Actualiza tus datos personales</p>
            </div>
          </div>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-voltech-cyan/20 text-voltech-cyan rounded-lg text-sm hover:bg-voltech-cyan/30 transition-colors flex items-center gap-2"
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
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-voltech-surface border border-voltech-border rounded-lg text-sm text-voltech-muted hover:text-white hover:border-voltech-error transition-all flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Seguridad */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
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