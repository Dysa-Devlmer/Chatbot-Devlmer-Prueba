// Sistema de gestión de horarios y disponibilidad para el negocio y chatbot
import fs from 'fs';
import path from 'path';

export interface HorarioDia {
  abierto: boolean;
  apertura: string | null; // Formato "HH:mm"
  cierre: string | null;   // Formato "HH:mm"
}

export interface ConfigHorarios {
  horarios: {
    habilitado: boolean;
    zona_horaria: string;
    modo_manual: 'auto' | 'abierto_forzado' | 'cerrado_forzado';
    dias_semana: {
      lunes: HorarioDia;
      martes: HorarioDia;
      miercoles: HorarioDia;
      jueves: HorarioDia;
      viernes: HorarioDia;
      sabado: HorarioDia;
      domingo: HorarioDia;
    };
  };
  mensajes: {
    fuera_de_horario: string;
    proximo_a_cerrar: string;
    recien_abierto: string;
  };
  configuracion: {
    avisar_antes_de_cerrar_minutos: number;
    mensaje_bienvenida_al_abrir: boolean;
    pausar_ai_fuera_horario: boolean;
  };
}

export class HorariosService {
  private static configPath = path.join(process.cwd(), 'config-horarios.json');

  /**
   * Carga la configuración de horarios desde config-horarios.json con fallback seguro
   */
  static cargarConfig(): ConfigHorarios {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(configData);
        // Asegurar campos requeridos
        if (!parsed.horarios.modo_manual) {
          parsed.horarios.modo_manual = 'auto';
        }
        if (!parsed.horarios.zona_horaria) {
          parsed.horarios.zona_horaria = 'America/Lima';
        }
        return parsed;
      }
    } catch (error) {
      console.error('Error cargando config-horarios.json:', error);
    }

    // Configuración por defecto si no existe o falla
    return {
      horarios: {
        habilitado: true,
        zona_horaria: 'America/Lima',
        modo_manual: 'auto',
        dias_semana: {
          lunes: { abierto: true, apertura: '12:00', cierre: '23:30' },
          martes: { abierto: true, apertura: '12:00', cierre: '23:30' },
          miercoles: { abierto: true, apertura: '12:00', cierre: '23:30' },
          jueves: { abierto: true, apertura: '12:00', cierre: '23:30' },
          viernes: { abierto: true, apertura: '12:00', cierre: '01:00' },
          sabado: { abierto: true, apertura: '12:00', cierre: '01:00' },
          domingo: { abierto: true, apertura: '12:00', cierre: '23:00' }
        }
      },
      mensajes: {
        fuera_de_horario: '🌙 *¡Hola! En este momento nos encontramos fuera de nuestro horario de atención.*\n\n⏰ *Nuestro horario es:*\n{horario}\n\n📖 Puedes revisar nuestra carta digital y promociones aquí:\n👉 {link_carta}\n\nDéjanos tu mensaje y te responderemos a primera hora al abrir. ¡Muchas gracias por tu preferencia! 🙌🍔',
        proximo_a_cerrar: '⚠️ *Aviso de Cocina:* Cerraremos en {minutos} minutos. Si deseas ordenar, por favor indícanos tu pedido ahora.',
        recien_abierto: '👋 ¡Hola! Ya estamos abiertos y listos para atenderte con las mejores promociones. ¿Qué se te antoja hoy?'
      },
      configuracion: {
        avisar_antes_de_cerrar_minutos: 15,
        mensaje_bienvenida_al_abrir: true,
        pausar_ai_fuera_horario: true
      }
    };
  }

  /**
   * Guarda la configuración de horarios en config-horarios.json
   */
  static guardarConfig(nuevaConfig: ConfigHorarios): boolean {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(nuevaConfig, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error('Error guardando config-horarios.json:', error);
      return false;
    }
  }

  /**
   * Obtiene la fecha, día y hora actual en la zona horaria configurada
   */
  private static obtenerFechaEnZona(zona: string = 'America/Lima'): {
    diaSemana: keyof ConfigHorarios['horarios']['dias_semana'];
    horaActualMinutos: number;
    horaStr: string;
  } {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: zona,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      let weekdayStr = '';
      let hourStr = '0';
      let minStr = '0';
      for (const p of parts) {
        if (p.type === 'weekday') weekdayStr = p.value.toLowerCase();
        if (p.type === 'hour') hourStr = p.value;
        if (p.type === 'minute') minStr = p.value;
      }
      let hourNum = parseInt(hourStr, 10);
      if (hourNum === 24) hourNum = 0;
      const minNum = parseInt(minStr, 10);

      const mapDias: Record<string, keyof ConfigHorarios['horarios']['dias_semana']> = {
        sun: 'domingo',
        mon: 'lunes',
        tue: 'martes',
        wed: 'miercoles',
        thu: 'jueves',
        fri: 'viernes',
        sat: 'sabado'
      };

      const diaSemana = mapDias[weekdayStr.slice(0, 3)] || 'lunes';
      const horaActualMinutos = hourNum * 60 + minNum;
      const horaStr = `${String(hourNum).padStart(2, '0')}:${String(minNum).padStart(2, '0')}`;

      return { diaSemana, horaActualMinutos, horaStr };
    } catch (e) {
      const now = new Date();
      const dias: (keyof ConfigHorarios['horarios']['dias_semana'])[] = [
        'domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'
      ];
      return {
        diaSemana: dias[now.getDay()],
        horaActualMinutos: now.getHours() * 60 + now.getMinutes(),
        horaStr: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      };
    }
  }

  /**
   * Convierte "HH:mm" a minutos del día
   */
  private static horaAMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Formatea un horario amigable para mensajes
   */
  static formatearHorarioSemanal(config?: ConfigHorarios): string {
    const cfg = config || this.cargarConfig();
    const nombresDias: Record<string, string> = {
      lunes: 'Lunes',
      martes: 'Martes',
      miercoles: 'Miércoles',
      jueves: 'Jueves',
      viernes: 'Viernes',
      sabado: 'Sábado',
      domingo: 'Domingo'
    };

    let lineas: string[] = [];
    for (const [diaKey, hor] of Object.entries(cfg.horarios.dias_semana)) {
      const nombre = nombresDias[diaKey] || diaKey;
      if (hor.abierto && hor.apertura && hor.cierre) {
        lineas.push(`• ${nombre}: ${hor.apertura} a ${hor.cierre}`);
      } else {
        lineas.push(`• ${nombre}: Cerrado`);
      }
    }
    return lineas.join('\n');
  }

  /**
   * Construye el mensaje final de fuera de horario reemplazando variables dinámicas
   */
  private static formatearMensajeFueraHorario(mensajeBase: string, config: ConfigHorarios): string {
    const horarioFormateado = this.formatearHorarioSemanal(config);
    const linkCarta = 'https://chatbot.zgamersa.com/menu';

    return mensajeBase
      .replace(/{horario}/g, horarioFormateado)
      .replace(/{link_carta}/g, linkCarta);
  }

  /**
   * Verifica si el negocio está abierto en este instante
   */
  static estaAbierto(): {
    abierto: boolean;
    modo: 'auto' | 'abierto_forzado' | 'cerrado_forzado';
    mensaje?: string;
    diaActual: string;
    horaActual: string;
    horarioHoy?: string;
    config: ConfigHorarios;
  } {
    const config = this.cargarConfig();
    const modoManual = config.horarios.modo_manual || 'auto';
    const { diaSemana, horaActualMinutos, horaStr } = this.obtenerFechaEnZona(config.horarios.zona_horaria);
    const horarioDia = config.horarios.dias_semana[diaSemana];

    let horarioHoyStr = 'Cerrado hoy';
    if (horarioDia?.abierto && horarioDia.apertura && horarioDia.cierre) {
      horarioHoyStr = `${horarioDia.apertura} - ${horarioDia.cierre}`;
    }

    // 1. Si los horarios están completamente desactivados, siempre se atiende
    if (!config.horarios.habilitado) {
      return {
        abierto: true,
        modo: 'auto',
        diaActual: diaSemana,
        horaActual: horaStr,
        horarioHoy: horarioHoyStr,
        config
      };
    }

    // 2. Si el administrador forzó "Abierto"
    if (modoManual === 'abierto_forzado') {
      return {
        abierto: true,
        modo: 'abierto_forzado',
        diaActual: diaSemana,
        horaActual: horaStr,
        horarioHoy: horarioHoyStr,
        config
      };
    }

    // 3. Si el administrador forzó "Cerrado"
    if (modoManual === 'cerrado_forzado') {
      return {
        abierto: false,
        modo: 'cerrado_forzado',
        mensaje: this.formatearMensajeFueraHorario(config.mensajes.fuera_de_horario, config),
        diaActual: diaSemana,
        horaActual: horaStr,
        horarioHoy: horarioHoyStr,
        config
      };
    }

    // 4. Modo Automático: Evaluar según el día y la hora
    if (!horarioDia || !horarioDia.abierto || !horarioDia.apertura || !horarioDia.cierre) {
      return {
        abierto: false,
        modo: 'auto',
        mensaje: this.formatearMensajeFueraHorario(config.mensajes.fuera_de_horario, config),
        diaActual: diaSemana,
        horaActual: horaStr,
        horarioHoy: horarioHoyStr,
        config
      };
    }

    const horaApertura = this.horaAMinutos(horarioDia.apertura);
    const horaCierre = this.horaAMinutos(horarioDia.cierre);

    // Cruce de medianoche (ej: 18:00 a 03:00)
    const cruzaMedianoche = horaCierre < horaApertura;
    const dentroHorario = cruzaMedianoche
      ? (horaActualMinutos >= horaApertura || horaActualMinutos < horaCierre)
      : (horaActualMinutos >= horaApertura && horaActualMinutos < horaCierre);

    if (dentroHorario) {
      // Verificar si está próximo a cerrar
      const minutosParaCierre = cruzaMedianoche && horaActualMinutos < horaCierre
        ? horaCierre - horaActualMinutos
        : cruzaMedianoche
        ? (24 * 60 - horaActualMinutos) + horaCierre
        : horaCierre - horaActualMinutos;

      if (minutosParaCierre > 0 && minutosParaCierre <= config.configuracion.avisar_antes_de_cerrar_minutos) {
        return {
          abierto: true,
          modo: 'auto',
          mensaje: config.mensajes.proximo_a_cerrar.replace('{minutos}', minutosParaCierre.toString()),
          diaActual: diaSemana,
          horaActual: horaStr,
          horarioHoy: horarioHoyStr,
          config
        };
      }

      return {
        abierto: true,
        modo: 'auto',
        diaActual: diaSemana,
        horaActual: horaStr,
        horarioHoy: horarioHoyStr,
        config
      };
    }

    // Fuera de horario
    return {
      abierto: false,
      modo: 'auto',
      mensaje: this.formatearMensajeFueraHorario(config.mensajes.fuera_de_horario, config),
      diaActual: diaSemana,
      horaActual: horaStr,
      horarioHoy: horarioHoyStr,
      config
    };
  }

  /**
   * Determina si se debe pausar la IA cuando el local está cerrado
   */
  static debePausarIA(): boolean {
    const estado = this.estaAbierto();
    return !estado.abierto && estado.config.configuracion.pausar_ai_fuera_horario;
  }
}
