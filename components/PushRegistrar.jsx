'use client';
import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/lib/supabase';
import { getUser } from '@/lib/session';
import toast from 'react-hot-toast';

export default function PushRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('apk') !== '1') return; // solo en el APK

    const initPush = async () => {
      try {
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') return;

        await PushNotifications.register();
      } catch (err) {
        console.warn('Push init error:', err);
      }
    };

    PushNotifications.addListener('registration', async (token) => {
      try {
        const user = getUser();
        if (!user?.id) return;
        if (supabase) {
          await supabase.from('push_tokens').upsert({
            user_id: String(user.id),
            token: token.value,
            device: 'android'
          }, { onConflict: 'token' });
        }
      } catch (err) {
        console.warn('Error guardando token:', err);
      }
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notif) => {
      toast.success(notif.title || 'Nueva notificación');
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
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