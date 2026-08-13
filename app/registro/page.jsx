'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Package, User, Mail, Phone, Lock, Eye, EyeOff, 
  CheckCircle, AlertCircle, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

function RegistroContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invitationValid, setInvitationValid] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const validarInvitacion = async () => {
      const token = searchParams.get('token');
      const invite = searchParams.get('invite');

      // ✅ CORRECCIÓN: Si es el link general, mostrar formulario vacío
      if (invite === 'voltech' && !token) {
        setInvitationValid(true);
        setInvitationData(null);
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          password: '',
          confirmPassword: '',
        });
        return;
      }

      if (token) {
        let miembroPendiente = null;

        // 1. Intentar validar en Supabase primero
        if (supabase) {
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .ilike('linkInvitacion', `%${token}%`)
            .single();
          
          if (!error && data) {
            miembroPendiente = data;
          }
        }

        // 2. Fallback a localStorage
        if (!miembroPendiente) {
          const equipoGuardado = localStorage.getItem('voltech_equipo');
          if (equipoGuardado) {
            const equipo = JSON.parse(equipoGuardado);
            miembroPendiente = equipo.find(m => 
              m.linkInvitacion && m.linkInvitacion.includes(token)
            );
          }
        }

        if (miembroPendiente) {
          setInvitationValid(true);
          setInvitationData(miembroPendiente);
          setFormData({
            nombre: miembroPendiente.nombre || '',
            email: miembroPendiente.email || '',
            telefono: miembroPendiente.telefono || '',
            password: '',
            confirmPassword: '',
          });
        } else {
          toast.error('Link de invitación inválido o expirado');
        }
      } else {
        toast.error('No se encontró un link de invitación válido');
      }
    };
    
    validarInvitacion();
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegistro = async () => {
    if (!formData.nombre || !formData.email || !formData.password) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    const emailLower = formData.email.toLowerCase();

    // Validación de correo duplicado
    if (supabase) {
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', emailLower)
        .single();
      
      if (existingUser && (!invitationData || existingUser.id !== invitationData.id)) {
        toast.error('Este correo electrónico ya está registrado');
        return;
      }
    }

    const userData = {
      nombre: formData.nombre,
      email: emailLower,
      telefono: formData.telefono,
      password: formData.password,
      rol: invitationData ? invitationData.rol : 'vendedor',
      activo: true,
      aprobado: true,
      registrado: true,
      fechaRegistro: new Date().toISOString()
    };

    if (supabase) {
      let error;
      if (invitationData && invitationData.id) {
        const { error: updateError } = await supabase
          .from('usuarios')
          .update(userData)
          .eq('id', invitationData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert([userData])
          .select()
          .single();
        error = insertError;
      }

      if (error) {
        toast.error('Error al registrar: ' + error.message);
        return;
      }
    }

    // Respaldo en localStorage
    const equipoGuardado = localStorage.getItem('voltech_equipo');
    let equipo = equipoGuardado ? JSON.parse(equipoGuardado) : [];

    if (invitationData) {
      equipo = equipo.map(m => 
        m.id === invitationData.id ? { ...m, ...userData } : m
      );
    } else {
      equipo.push({
        id: `user-${Date.now()}`,
        ...userData
      });
    }

    localStorage.setItem('voltech_equipo', JSON.stringify(equipo));
    localStorage.setItem('voltech_user', JSON.stringify({
      nombre: formData.nombre,
      email: emailLower,
      rol: userData.rol
    }));

    toast.success('¡Registro exitoso! Bienvenido a VOLTECH');
    setTimeout(() => {
      router.push('/panel/dashboard');
    }, 1500);
  };

  if (!invitationValid) {
    return (
      <div className="min-h-screen bg-voltech-dark flex items-center justify-center p-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-2xl p-4 sm:p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-voltech-error mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Invitación Inválida</h1>
          <p className="text-xs sm:text-sm text-voltech-muted mb-6">El link de invitación no es válido o ha expirado.</p>
          <button
            onClick={() => router.push('/login')}
            className="w-full btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
          >
            Ir al Login
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-voltech-dark flex items-center justify-center p-4">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
          success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
        }}
      />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="hidden md:flex flex-col justify-center items-center p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-voltech-cyan to-voltech-purple rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-voltech-cyan to-voltech-purple bg-clip-text text-transparent mb-4">
              VOLTECH STORE
            </h1>
            <p className="text-voltech-muted mb-8">
              Únete a nuestro equipo y comienza a gestionar tu tienda de manera profesional
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-voltech-muted">
                <CheckCircle className="w-5 h-5 text-voltech-success" />
                <span>Gestiona productos y ventas</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-voltech-muted">
                <CheckCircle className="w-5 h-5 text-voltech-success" />
                <span>Control de inventario en tiempo real</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-voltech-surface border border-voltech-border rounded-2xl p-4 sm:p-8">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              {invitationData ? 'Completa tu Registro' : 'Crear Cuenta'}
            </h2>
            <p className="text-xs sm:text-sm text-voltech-muted">
              {invitationData 
                ? 'Tu invitación está lista. Verifica tus datos y crea tu contraseña.' 
                : 'Regístrate para unirte al equipo de VOLTECH'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Nombre completo *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-voltech-muted" />
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="input-voltech w-full rounded-lg pl-11 pr-4 py-3 text-sm"
                  placeholder="Tu nombre completo"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Correo electrónico *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-voltech-muted" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-voltech w-full rounded-lg pl-11 pr-4 py-3 text-sm"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-voltech-muted" />
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="input-voltech w-full rounded-lg pl-11 pr-4 py-3 text-sm"
                  placeholder="0412-1234567"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Contraseña *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-voltech-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-voltech w-full rounded-lg pl-11 pr-12 py-3 text-sm"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-voltech-muted hover:text-voltech-cyan transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-voltech-muted mb-2 ml-1">Confirmar contraseña *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-voltech-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-voltech w-full rounded-lg pl-11 pr-4 py-3 text-sm"
                  placeholder="Confirma tu contraseña"
                />
              </div>
            </div>

            <button
              onClick={handleRegistro}
              className="w-full btn-neon text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-6"
            >
              {invitationData ? 'Completar Registro' : 'Crear Cuenta'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-voltech-dark flex items-center justify-center p-4">
        <div className="text-white text-xl font-bold animate-pulse">Cargando registro...</div>
      </div>
    }>
      <RegistroContent />
    </Suspense>
  );
}