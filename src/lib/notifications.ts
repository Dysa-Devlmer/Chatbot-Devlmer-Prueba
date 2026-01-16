/**
 * Sistema de Notificaciones en Tiempo Real
 * - Notificaciones push del navegador
 * - Sonido de alerta
 * - Badge de contador
 */

export class NotificationService {
  private static permission: NotificationPermission = 'default';
  private static audio: HTMLAudioElement | null = null;
  private static lastNotifiedMessageId: string | null = null;

  /**
   * Inicializa el servicio de notificaciones
   */
  static async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Verificar soporte de notificaciones
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    // Solicitar permiso si no está definido
    if (Notification.permission === 'default') {
      this.permission = await Notification.requestPermission();
    } else {
      this.permission = Notification.permission;
    }

    // Precargar sonido de notificación
    this.initAudio();

    return this.permission === 'granted';
  }

  /**
   * Inicializa el audio de notificación
   */
  private static initAudio(): void {
    if (typeof window === 'undefined') return;

    // Crear elemento de audio con sonido base64 (beep corto)
    this.audio = new Audio();
    // Sonido de notificación simple (beep)
    this.audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Onp+fm5qUkoN0ZVtZYHR/jpmfn5uXkoyBeG1iW1xkeIaSmZqZlZGLgHRoYF5bYGp3hJCXmJeUkIt/c2liXltfZ3WCjpWXlpOQin5xaGJeXF5mbniEj5SUk5CMinxxaGJeXF9nb3mFkJSUk5CPi35yaWRgXmBocHuGkZWVlJKQjIB1bGVhX2FpdH2IkpWVlJKQjIF2bmdjYWNqdn+JkpWVlJKQjIF2bmdjYWNqdn+JkpWVlJKQjIF2bmdjYWNqdn+JkpWVlJKQjIF2bmdjYWNqdoA=';
    this.audio.volume = 0.5;
  }

  /**
   * Solicita permiso para notificaciones
   */
  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!('Notification' in window)) {
      return false;
    }

    this.permission = await Notification.requestPermission();
    return this.permission === 'granted';
  }

  /**
   * Verifica si las notificaciones están permitidas
   */
  static isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  /**
   * Obtiene el estado del permiso
   */
  static getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined') return 'default';
    return Notification.permission;
  }

  /**
   * Muestra una notificación de nuevo mensaje
   */
  static async showMessageNotification(data: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    messageId?: string;
    onClick?: () => void;
  }): Promise<void> {
    // Evitar notificaciones duplicadas
    if (data.messageId && data.messageId === this.lastNotifiedMessageId) {
      return;
    }
    this.lastNotifiedMessageId = data.messageId || null;

    // Reproducir sonido
    this.playSound();

    // Mostrar notificación del navegador
    if (this.permission === 'granted') {
      try {
        const notification = new Notification(data.title, {
          body: data.body,
          icon: data.icon || '/icon-192.png',
          tag: data.tag || 'new-message',
          badge: '/icon-192.png',
          requireInteraction: false,
          silent: true, // Usamos nuestro propio sonido
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          data.onClick?.();
        };

        // Auto-cerrar después de 5 segundos
        setTimeout(() => notification.close(), 5000);
      } catch (error) {
        console.error('Error mostrando notificación:', error);
      }
    }
  }

  /**
   * Reproduce el sonido de notificación
   */
  static playSound(): void {
    if (this.audio) {
      this.audio.currentTime = 0;
      this.audio.play().catch(() => {
        // Ignorar errores de autoplay (requiere interacción del usuario)
      });
    }
  }

  /**
   * Actualiza el título de la página con el contador de no leídos
   */
  static updatePageTitle(unreadCount: number, baseTitle: string = 'PITHY Admin'): void {
    if (typeof document === 'undefined') return;

    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }
  }

  /**
   * Actualiza el favicon con badge de notificación
   */
  static updateFavicon(hasUnread: boolean): void {
    if (typeof document === 'undefined') return;

    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) {
      // Por ahora solo cambiamos entre iconos (se puede mejorar con canvas)
      link.href = hasUnread ? '/favicon-notification.ico' : '/favicon.ico';
    }
  }

  /**
   * Muestra notificación de nuevo mensaje entrante
   */
  static notifyNewMessage(
    senderName: string,
    messagePreview: string,
    messageId: string,
    onClick?: () => void
  ): void {
    this.showMessageNotification({
      title: `💬 ${senderName}`,
      body: messagePreview.length > 100 ? messagePreview.slice(0, 100) + '...' : messagePreview,
      tag: 'incoming-message',
      messageId,
      onClick,
    });
  }

  /**
   * Muestra notificación de conversación en modo manual
   */
  static notifyManualModeRequired(
    senderName: string,
    onClick?: () => void
  ): void {
    this.showMessageNotification({
      title: `👤 Atención requerida`,
      body: `${senderName} necesita atención personalizada`,
      tag: 'manual-mode',
      onClick,
    });
  }
}

export default NotificationService;
