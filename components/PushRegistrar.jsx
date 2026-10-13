'use client';
import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/session';
import toast from 'react-hot-toast';

export default function PushRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // ✅ 1. Detectar si estamos en entorno nativo (Capacitor)
    const isCapacitor = !!(window).capacitor;
    
    if (!isCapacitor) {
      console.log('📱 Entorno web detectado. Notificaciones push desactivadas (solo funcionan en APK).');
      return; // Salimos temprano para evitar errores en el navegador
    }

    const initPush = async () => {
      try {
        console.log('🔔 Solicitando permisos de notificación...');
        const permResult = await PushNotifications.requestPermissions();
        
        if (permResult.receive !== 'granted') {
          console.warn('⚠️ Permisos de notificación denegados:', permResult);
          return;
        }

        console.log('✅ Permisos concedidos. Registrando dispositivo...');
        await PushNotifications.register();
      } catch (err) {
        console.error('❌ Error inicializando push (verifica que el APK esté bien firmado):', err);
        toast.error('Error al configurar notificaciones en este dispositivo.');
      }
    };

    PushNotifications.addListener('registration', async (token) => {
      console.log('✅ Token de push registrado exitosamente:', token.value);
      try {
        const user = getUser();
        if (!user?.id) {
          console.log('⚠️ Usuario no logueado, no se guarda el token.');
          return;
        }
        if (supabase) {
          const { error } = await supabase.from('push_tokens').upsert({
            user_id: String(user.id),
            token: token.value,
            device: 'android'
          }, { onConflict: 'token' });
          
          if (error) console.error('❌ Error guardando token en Supabase:', error);
          else console.log('✅ Token guardado en Supabase correctamente');
        }
      } catch (err) {
        console.error('❌ Error guardando token:', err);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('❌ Error de registro de push (Falta google-services.json o configuración):', err);
      toast.error('Error de configuración de notificaciones.');
    });

    PushNotifications.addListener('pushNotificationReceived', (notif) => {
      console.log('🔔 Notificación recibida en foreground:', notif);
      toast.success(notif.title || 'Nueva notificación', { description: notif.body });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('🔔 Notificación abierta por el usuario:', action);
      const url = action.notification?.data?.url;
      if (url) window.location.href = url;
    });

    initPush();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  return null;
}
