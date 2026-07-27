'use client';

import { useState } from 'react';
import { Mail, Phone, Lock, CheckCircle, ArrowLeft, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

export default function RecuperarPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    metodo: 'email',
    codigo: '',
    nuevaPassword: '',
    confirmarPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Paso 1: Enviar código
  const handleEnviarCodigo = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simular envío de código
    setTimeout(() => {
      setLoading(false);
      toast.success(`Código enviado a tu ${formData.metodo === 'email' ? 'correo' : 'WhatsApp'}`);
      setStep(2);
    }, 1500);
  };

  // Paso 2: Verificar código y cambiar contraseña
  const handleCambiarPassword = (e) => {
    e.preventDefault();
    
    if (formData.nuevaPassword !== formData.confirmarPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.nuevaPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    // Simular cambio de contraseña
    setTimeout(() => {
      setLoading(false);
      toast.success('Contraseña cambiada exitosamente');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }, 1500);
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

      {/* Fondos decorativos neón */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-voltech-cyan/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-voltech-purple/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-voltech-surface border border-voltech-border rounded-2xl p-8 shadow-2xl relative z-10"
      >
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-voltech-cyan to-voltech-purple bg-clip-text text-transparent tracking-wider">
            VOLTECH
          </h1>
          <p className="text-voltech-muted text-xs tracking-[0.3em] mt-1">STORE.VE</p>
          <div className="w-16 h-0.5 bg-gradient-to-r from-voltech-cyan to-voltech-purple mx-auto mt-4 mb-3"></div>
          <p className="text-voltech-muted text-sm">
            {step === 1 ? 'Recupera tu contraseña' : 'Verifica tu identidad'}
          </p>
        </div>

        {/* Botón volver al login */}
        <Link 
          href="/login"
          className="absolute top-4 left-4 text-voltech-muted hover:text-voltech-cyan transition-colors flex items-center gap-2 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        <AnimatePresence mode="wait">
          {/* PASO 1: Ingresar email/teléfono */}
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleEnviarCodigo}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">
                  ¿Cómo quieres recuperar tu cuenta?
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label className={`cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${
                    formData.metodo === 'email' 
                      ? 'border-voltech-cyan bg-voltech-cyan/10 text-voltech-cyan' 
                      : 'border-voltech-border text-voltech-muted hover:border-voltech-muted'
                  }`}>
                    <input
                      type="radio"
                      name="metodo"
                      value="email"
                      checked={formData.metodo === 'email'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <Mail className="w-4 h-4" />
                    <span className="text-xs font-medium">Email</span>
                  </label>
                  
                  <label className={`cursor-pointer border rounded-lg p-3 flex items-center justify-center gap-2 transition-all ${
                    formData.metodo === 'whatsapp' 
                      ? 'border-voltech-cyan bg-voltech-cyan/10 text-voltech-cyan' 
                      : 'border-voltech-border text-voltech-muted hover:border-voltech-muted'
                  }`}>
                    <input
                      type="radio"
                      name="metodo"
                      value="whatsapp"
                      checked={formData.metodo === 'whatsapp'}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <Phone className="w-4 h-4" />
                    <span className="text-xs font-medium">WhatsApp</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">
                  {formData.metodo === 'email' ? 'Correo electrónico' : 'Número de WhatsApp'}
                </label>
                <div className="relative">
                  {formData.metodo === 'email' ? (
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                  ) : (
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                  )}
                  <input
                    type={formData.metodo === 'email' ? 'email' : 'tel'}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm"
                    placeholder={formData.metodo === 'email' ? 'tu@email.com' : '0412-1234567'}
                    required
                  />
                </div>
              </div>

              <div className="bg-voltech-dark/50 border border-voltech-border rounded-lg p-3">
                <p className="text-[11px] text-voltech-muted">
                  Te enviaremos un código de 6 dígitos a tu {formData.metodo === 'email' ? 'correo' : 'WhatsApp'} para verificar tu identidad.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon w-full text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Enviando código...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Enviar código de verificación
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* PASO 2: Ingresar código y nueva contraseña */}
          {step === 2 && (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleCambiarPassword}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs text-voltech-muted mb-1 ml-1">
                  Código de verificación
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleChange}
                    className="input-voltech w-full rounded-lg pl-10 pr-4 py-3 text-sm text-center tracking-widest text-lg font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-[10px] text-voltech-muted mt-1 text-center">
                  Ingresa el código de 6 dígitos que te enviamos
                </p>
              </div>

              <div className="border-t border-voltech-border pt-4">
                <label className="block text-xs text-voltech-muted mb-1 ml-1">
                  Nueva contraseña
                </label>
                <div className="relative mb-3">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="nuevaPassword"
                    value={formData.nuevaPassword}
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
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.376 13.376 0 0 0 2 12s3 7 10 7a10.43 10.43 0 0 0 3.27-.53"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>

                <label className="block text-xs text-voltech-muted mb-1 ml-1">
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-voltech-muted w-4 h-4" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmarPassword"
                    value={formData.confirmarPassword}
                    onChange={handleChange}
                    className="input-voltech w-full rounded-lg pl-10 pr-12 py-3 text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-voltech-muted hover:text-voltech-cyan transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.376 13.376 0 0 0 2 12s3 7 10 7a10.43 10.43 0 0 0 3.27-.53"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-neon w-full text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Cambiando contraseña...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Cambiar contraseña
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs text-voltech-muted hover:text-voltech-cyan transition-colors"
              >
                ← Volver al paso anterior
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}