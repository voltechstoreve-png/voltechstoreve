'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // ✅ ESTA ES LA LÍNEA QUE ARREGLA EL ERROR
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    metodoRecuperacion: 'email',
    aceptaTerminos: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = ['bg-gray-700', 'bg-voltech-error', 'bg-voltech-warning', 'bg-voltech-cyan', 'bg-voltech-success'];
  const strengthTexts = ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        toast.error('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }
      if (!formData.aceptaTerminos) {
        toast.error('Debes aceptar los términos y condiciones');
        setLoading(false);
        return;
      }
    }

    if (isLogin) {
      if (supabase) {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', formData.email)
          .eq('password', formData.password)
          .eq('activo', true)
          .single();

        if (error || !data) {
          toast.error('Credenciales incorrectas o usuario inactivo');
          setLoading(false);
          return;
        }

        localStorage.setItem('voltech_user', JSON.stringify(data));
        toast.success('¡Bienvenido de vuelta! Redirigiendo...');
        setTimeout(() => {
          window.location.href = '/panel/dashboard';
        }, 1500);
      } else {
        localStorage.setItem('voltech_user', JSON.stringify({ 
          id: 'local-1', 
          nombre: 'Administrador', 
          email: formData.email, 
          rol: 'admin' 
        }));
        toast.success('¡Bienvenido de vuelta! Redirigiendo... (Modo Local)');
        setTimeout(() => {
          window.location.href = '/panel/dashboard';
        }, 1500);
      }
    } else {
      if (supabase) {
        const { error } = await supabase.from('usuarios').insert({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          password: formData.password,
          rol: 'vendedor',
          activo: true,
          registrado: true,
          fechaRegistro: new Date().toISOString()
        });

        if (error) {
          toast.error('Error al crear la cuenta: ' + (error.message || 'El correo ya está registrado'));
          setLoading(false);
          return;
        }
      }
      
      toast.success('Solicitud enviada. Tu cuenta está pendiente de aprobación por el administrador.');
      setIsLogin(true);
      setFormData({ ...formData, password: '', confirmPassword: '' });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-voltech-dark flex items-center justify-center p-4 relative overflow-hidden">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: { background: '#12121a', color: '#fff', border: '1px solid #1e1e2e' },
          success: { iconTheme: { primary: '#00ff88', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ff3366', secondary: '#fff' } },
        }}
      />

      <div className="absolute top-0 left-0 w-96 h-96 bg-voltech-cyan/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-voltech-purple/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-voltech-surface border border-voltech-border rounded-2xl p-8 shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-voltech-cyan to-voltech-purple bg-clip-text text-transparent tracking-wider">
            VOLTECH
          </h1>
          <p className="text-voltech-muted text-xs tracking-[0.3em] mt-1">STORE.VE</p>
          <div className="w-16 h-0.5 bg-gradient-to-r from-voltech-cyan to-voltech-purple mx-auto mt-4 mb-3"></div>
          <p className="text-voltech-muted text-sm">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta nueva'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-voltech-muted mb-1 ml-1">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm"
                      placeholder="0412-1234567"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-xs text-voltech-muted mb-1 ml-1">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-voltech-muted mb-1 ml-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-voltech w-full rounded-lg pl-10 pr-12 py-3 text-sm"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-voltech-muted hover:text-voltech-cyan transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {!isLogin && formData.password && (
              <div className="mt-2">
                <div className="flex gap-1 h-1.5 mb-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 rounded-full transition-all ${
                        passwordStrength >= level ? strengthColors[passwordStrength] : 'bg-gray-800'
                      }`}
                    ></div>
                  ))}
                </div>
                <p className="text-[10px] text-voltech-muted">
                  Fortaleza: <span className="text-white">{strengthTexts[passwordStrength]}</span>
                </p>
              </div>
            )}
          </div>

          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs text-voltech-muted mb-1 ml-1">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-voltech w-full rounded-lg pl-10 pr-12 py-3 text-sm ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword ? 'error' : ''
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-voltech-muted hover:text-voltech-cyan transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-[10px] text-voltech-error mt-1 ml-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Las contraseñas no coinciden
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs text-voltech-muted mb-2 ml-1">¿Cómo recuperar tu contraseña?</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${
                    formData.metodoRecuperacion === 'email' 
                      ? 'border-voltech-cyan bg-voltech-cyan/10 text-voltech-cyan' 
                      : 'border-voltech-border text-voltech-muted hover:border-voltech-muted'
                  }`}>
                    <input
                      type="radio"
                      name="metodoRecuperacion"
                      value="email"
                      checked={formData.metodoRecuperacion === 'email'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-medium">Email</span>
                  </label>
                  
                  <label className={`cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${
                    formData.metodoRecuperacion === 'whatsapp' 
                      ? 'border-voltech-cyan bg-voltech-cyan/10 text-voltech-cyan' 
                      : 'border-voltech-border text-voltech-muted hover:border-voltech-muted'
                  }`}>
                    <input
                      type="radio"
                      name="metodoRecuperacion"
                      value="whatsapp"
                      checked={formData.metodoRecuperacion === 'whatsapp'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-medium">WhatsApp</span>
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between pt-2">
            {!isLogin ? (
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="aceptaTerminos"
                  checked={formData.aceptaTerminos}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-voltech-border bg-voltech-dark text-voltech-cyan focus:ring-voltech-cyan focus:ring-offset-0"
                />
                <span className="text-[11px] text-voltech-muted group-hover:text-white transition-colors">
                  Acepto los <span className="text-voltech-cyan underline">términos</span>
                </span>
              </label>
            ) : (
              <a href="/recuperar" className="text-[11px] text-voltech-cyan hover:underline ml-1">
                ¿Olvidaste tu contraseña?
              </a>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-neon w-full text-white font-bold py-3 rounded-lg mt-2 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {isLogin ? 'Iniciando...' : 'Creando cuenta...'}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </>
            )}
          </button>

          <div className="text-center pt-4 border-t border-voltech-border mt-6">
            <p className="text-xs text-voltech-muted">
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ ...formData, password: '', confirmPassword: '' });
                }}
                className="ml-2 text-voltech-cyan hover:underline font-semibold transition-colors"
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}