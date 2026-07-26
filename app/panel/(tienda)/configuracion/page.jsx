'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Shield,
  Save,
  Check,
  Mail,
  BellRing,
  MailCheck,
  Clock,
  Calendar,
  Smartphone,
  DollarSign,
  Info
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({
    notificaciones: true,
    emailAlertas: true,
    notificacionesPush: true,
    recordatoriosStreaming: {
      hora: '08:00',
      diasAnticipacion: 2,
      activado: true
    },
    recordatoriosProductos: {
      hora: '09:00',
      frecuencia: 'diario',
      activado: true
    },
    comisiones: {
      porcentaje: 5,
      minimoRetiro: 50,
      metodoPago: 'pago_movil'
    }
  });

  useEffect(() => {
    const savedConfig = localStorage.getItem('voltech_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(prev => ({
        ...prev,
        ...parsed,
        recordatoriosStreaming: { ...prev.recordatoriosStreaming, ...parsed.recordatoriosStreaming },
        recordatoriosProductos: { ...prev.recordatoriosProductos, ...parsed.recordatoriosProductos },
        comisiones: { ...prev.comisiones, ...parsed.comisiones }
      }));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('voltech_config', JSON.stringify(config));
    toast.success('Configuración guardada correctamente');
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
          <h1 className="text-2xl font-bold text-white">Configuración</h1>
          <p className="text-sm text-voltech-muted mt-1">Personaliza tu experiencia y notificaciones</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-gradient-to-r from-voltech-cyan to-voltech-purple text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-voltech-cyan/30 transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Guardar Configuración
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-cyan/20">
              <Bell className="w-5 h-5 text-voltech-cyan" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Notificaciones</p>
              <p className="text-lg font-bold text-white">{config.notificaciones ? 'Activas' : 'Inactivas'}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-purple/20">
              <Mail className="w-5 h-5 text-voltech-purple" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Email Alertas</p>
              <p className="text-lg font-bold text-white">{config.emailAlertas ? 'Activas' : 'Inactivas'}</p>
            </div>
          </div>
        </div>
        <div className="bg-voltech-surface border border-voltech-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-voltech-success/20">
              <Smartphone className="w-5 h-5 text-voltech-success" />
            </div>
            <div>
              <p className="text-xs text-voltech-muted">Push Notifications</p>
              <p className="text-lg font-bold text-white">{config.notificacionesPush ? 'Activas' : 'Inactivas'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notificaciones Generales */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-voltech-cyan/20">
            <BellRing className="w-5 h-5 text-voltech-cyan" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Notificaciones Generales</h3>
            <p className="text-xs text-voltech-muted">Configura cómo quieres recibir alertas</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-lg bg-voltech-dark/50 border border-voltech-border hover:border-voltech-cyan/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-voltech-cyan/20">
                <Bell className="w-5 h-5 text-voltech-cyan" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Notificaciones push</p>
                <p className="text-xs text-voltech-muted">Recibe alertas en tiempo real (incluso con la app cerrada)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.notificacionesPush}
              onChange={(e) => setConfig({ ...config, notificacionesPush: e.target.checked })}
              className="w-5 h-5 rounded border-voltech-border bg-voltech-dark text-voltech-cyan"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-lg bg-voltech-dark/50 border border-voltech-border hover:border-voltech-cyan/50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-voltech-purple/20">
                <MailCheck className="w-5 h-5 text-voltech-purple" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Alertas por email</p>
                <p className="text-xs text-voltech-muted">Recibe resumen diario</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={config.emailAlertas}
              onChange={(e) => setConfig({ ...config, emailAlertas: e.target.checked })}
              className="w-5 h-5 rounded border-voltech-border bg-voltech-dark text-voltech-cyan"
            />
          </label>
        </div>
      </div>

      {/* Recordatorios Streaming */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-voltech-purple/20">
            <Calendar className="w-5 h-5 text-voltech-purple" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Recordatorios Streaming</h3>
            <p className="text-xs text-voltech-muted">Alertas de vencimiento de suscripciones</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-voltech-muted mb-2">Hora de recordatorio</label>
              <input
                type="time"
                value={config.recordatoriosStreaming.hora}
                onChange={(e) => setConfig({
                  ...config,
                  recordatoriosStreaming: { ...config.recordatoriosStreaming, hora: e.target.value }
                })}
                className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-2">Días de anticipación</label>
              <select
                value={config.recordatoriosStreaming.diasAnticipacion}
                onChange={(e) => setConfig({
                  ...config,
                  recordatoriosStreaming: { ...config.recordatoriosStreaming, diasAnticipacion: parseInt(e.target.value) }
                })}
                className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
              >
                <option value={1}>1 día antes</option>
                <option value={2}>2 días antes</option>
                <option value={3}>3 días antes</option>
                <option value={5}>5 días antes</option>
                <option value={7}>7 días antes</option>
              </select>
            </div>
          </div>
          
          <div className="p-4 bg-voltech-purple/5 border border-voltech-purple/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-voltech-purple mt-0.5" />
              <div>
                <p className="text-sm text-voltech-muted">
                  <span className="text-voltech-purple font-semibold">Ejemplo:</span> Si un cliente vence el 11/07 a las 5PM y configuras 2 días antes a las 8:00 AM, 
                  recibirás la alerta el <span className="text-white font-semibold">09/07 a las 8:00 AM</span>
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-center justify-between p-4 rounded-lg bg-voltech-dark/50 border border-voltech-border hover:border-voltech-purple/50 cursor-pointer transition-colors">
            <div>
              <p className="text-sm font-medium text-white">Activar recordatorios</p>
              <p className="text-xs text-voltech-muted">Recibir alertas de vencimientos próximos</p>
            </div>
            <input
              type="checkbox"
              checked={config.recordatoriosStreaming.activado}
              onChange={(e) => setConfig({
                ...config,
                recordatoriosStreaming: { ...config.recordatoriosStreaming, activado: e.target.checked }
              })}
              className="w-5 h-5 rounded border-voltech-border bg-voltech-dark text-voltech-purple"
            />
          </label>
        </div>
      </div>

      {/* Recordatorios Productos */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-voltech-cyan/20">
            <Clock className="w-5 h-5 text-voltech-cyan" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Recordatorios Ventas Productos</h3>
            <p className="text-xs text-voltech-muted">Alertas de cobros pendientes</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-voltech-muted mb-2">Hora fija de recordatorio</label>
              <input
                type="time"
                value={config.recordatoriosProductos.hora}
                onChange={(e) => setConfig({
                  ...config,
                  recordatoriosProductos: { ...config.recordatoriosProductos, hora: e.target.value }
                })}
                className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-voltech-muted mb-2">Frecuencia</label>
              <select
                value={config.recordatoriosProductos.frecuencia}
                onChange={(e) => setConfig({
                  ...config,
                  recordatoriosProductos: { ...config.recordatoriosProductos, frecuencia: e.target.value }
                })}
                className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
              >
                <option value="diario">Diario</option>
                <option value="semanal">Semanal (Lunes)</option>
              </select>
            </div>
          </div>

          <label className="flex items-center justify-between p-4 rounded-lg bg-voltech-dark/50 border border-voltech-border hover:border-voltech-cyan/50 cursor-pointer transition-colors">
            <div>
              <p className="text-sm font-medium text-white">Activar recordatorios</p>
              <p className="text-xs text-voltech-muted">Recordatorio diario de cobros pendientes</p>
            </div>
            <input
              type="checkbox"
              checked={config.recordatoriosProductos.activado}
              onChange={(e) => setConfig({
                ...config,
                recordatoriosProductos: { ...config.recordatoriosProductos, activado: e.target.checked }
              })}
              className="w-5 h-5 rounded border-voltech-border bg-voltech-dark text-voltech-cyan"
            />
          </label>
        </div>
      </div>

      {/* Configuración de Comisiones */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-voltech-success/20">
            <DollarSign className="w-5 h-5 text-voltech-success" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Comisiones y Referidos</h3>
            <p className="text-xs text-voltech-muted">Configura porcentajes de comisión para tu socio</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-voltech-muted mb-2">Porcentaje de comisión (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={config.comisiones.porcentaje}
              onChange={(e) => setConfig({
                ...config,
                comisiones: { ...config.comisiones, porcentaje: parseFloat(e.target.value) }
              })}
              className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
              placeholder="Ej: 5"
            />
            <p className="text-xs text-voltech-muted mt-1">Porcentaje que recibirá tu socio por cada venta</p>
          </div>
          <div>
            <label className="block text-xs text-voltech-muted mb-2">Mínimo para retirar ($)</label>
            <input
              type="number"
              step="10"
              min="0"
              value={config.comisiones.minimoRetiro}
              onChange={(e) => setConfig({
                ...config,
                comisiones: { ...config.comisiones, minimoRetiro: parseFloat(e.target.value) }
              })}
              className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
              placeholder="Ej: 50"
            />
            <p className="text-xs text-voltech-muted mt-1">Monto mínimo acumulado para retirar comisiones</p>
          </div>
          <div>
            <label className="block text-xs text-voltech-muted mb-2">Método de pago</label>
            <select
              value={config.comisiones.metodoPago}
              onChange={(e) => setConfig({
                ...config,
                comisiones: { ...config.comisiones, metodoPago: e.target.value }
              })}
              className="input-voltech w-full rounded-lg px-4 py-3 text-sm"
            >
              <option value="pago_movil">Pago Móvil</option>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
              <option value="binance">Binance</option>
            </select>
          </div>
        </div>

        <div className="p-4 bg-voltech-success/5 border border-voltech-success/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-voltech-success mt-0.5" />
            <div>
              <p className="text-sm text-voltech-muted">
                <span className="text-voltech-success font-semibold">Consejo:</span> Como tú eres el único inversionista, 
                puedes configurar un % menor (3-5%) para motivar a tu socio sin afectar tu rentabilidad. 
                Las comisiones se calculan automáticamente sobre cada venta que él realice.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Seguridad */}
      <div className="bg-voltech-surface border border-voltech-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-voltech-success/20">
            <Shield className="w-5 h-5 text-voltech-success" />
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
              <Check className="w-5 h-5 text-voltech-muted group-hover:text-voltech-cyan" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}