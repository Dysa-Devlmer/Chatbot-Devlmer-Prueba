"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { NotificationService } from '@/lib/notifications';

interface Message {
  id: string;
  content: string;
  direction: string;
  timestamp: string;
  user?: {
    name: string | null;
    phoneNumber: string;
  };
}

interface UseNotificationsOptions {
  enabled?: boolean;
  soundEnabled?: boolean;
  onNewMessage?: (message: Message) => void;
}

interface UseNotificationsReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  unreadCount: number;
  soundEnabled: boolean;
  requestPermission: () => Promise<boolean>;
  setSoundEnabled: (enabled: boolean) => void;
  setUnreadCount: (count: number) => void;
  notifyNewMessage: (message: Message) => void;
  clearNotifications: () => void;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { enabled = true, soundEnabled: initialSoundEnabled = true, onNewMessage } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(initialSoundEnabled);
  const lastMessageIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  // Inicializar servicio de notificaciones
  useEffect(() => {
    if (typeof window === 'undefined' || initializedRef.current) return;

    const init = async () => {
      const supported = 'Notification' in window;
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        await NotificationService.init();
      }

      // Cargar preferencia de sonido
      const savedSound = localStorage.getItem('notifications_sound');
      if (savedSound !== null) {
        setSoundEnabled(savedSound === 'true');
      }

      initializedRef.current = true;
    };

    init();
  }, []);

  // Actualizar título de la página
  useEffect(() => {
    NotificationService.updatePageTitle(unreadCount);
  }, [unreadCount]);

  // Solicitar permiso
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    const granted = await NotificationService.requestPermission();
    setPermission(granted ? 'granted' : 'denied');
    return granted;
  }, [isSupported]);

  // Cambiar estado de sonido
  const handleSetSoundEnabled = useCallback((newEnabled: boolean) => {
    setSoundEnabled(newEnabled);
    localStorage.setItem('notifications_sound', String(newEnabled));
  }, []);

  // Notificar nuevo mensaje
  const notifyNewMessage = useCallback((message: Message) => {
    if (!enabled) return;

    // Evitar notificaciones duplicadas
    if (message.id === lastMessageIdRef.current) return;
    lastMessageIdRef.current = message.id;

    // Solo notificar mensajes entrantes
    if (message.direction !== 'inbound') return;

    const senderName = message.user?.name || message.user?.phoneNumber || 'Usuario';

    // Reproducir sonido si está habilitado
    if (soundEnabled) {
      NotificationService.playSound();
    }

    // Mostrar notificación del navegador
    if (permission === 'granted') {
      NotificationService.notifyNewMessage(
        senderName,
        message.content,
        message.id,
        () => {
          onNewMessage?.(message);
        }
      );
    }

    // Incrementar contador
    setUnreadCount((prev) => prev + 1);
  }, [enabled, soundEnabled, permission, onNewMessage]);

  // Limpiar notificaciones
  const clearNotifications = useCallback(() => {
    setUnreadCount(0);
    NotificationService.updatePageTitle(0);
  }, []);

  return {
    isSupported,
    permission,
    unreadCount,
    soundEnabled,
    requestPermission,
    setSoundEnabled: handleSetSoundEnabled,
    setUnreadCount,
    notifyNewMessage,
    clearNotifications,
  };
}

export default useNotifications;
