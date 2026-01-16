// Sistema de gestión de horarios para el chatbot
import fs from 'fs';
import path from 'path';

interface HorarioDia {
  abierto: boolean;
  apertura: string | null;
  cierre: string | null;
}

interface ConfigHorarios {
  horarios: {
    habilitado: boolean;
    zona_horaria: string;
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
   * Carga la configuración de horarios
   */
  private static cargarConfig(): ConfigHorarios {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf-8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Error cargando config-horarios.json:', error);
      // Retornar configuración por defecto
      return {
        horarios: {
          habilitado: false,
          zona_horaria: 'America/Santiago',
          dias_semana: {
            lunes: { abierto: true, apertura: '09:00', cierre: '18:00' },
            martes: { abierto: true, apertura: '09:00', cierre: '18:00' },
            miercoles: { abierto: true, apertura: '09:00', cierre: '18:00' },
            jueves: { abierto: true, apertura: '09:00', cierre: '18:00' },
            viernes: { abierto: true, apertura: '09:00', cierre: '18:00' },
            sabado: { abierto: true, apertura: '10:00', cierre: '14:00' },
            domingo: { abierto: false, apertura: null, cierre: null }
          }
        },
        mensajes: {
          fuera_de_horario: '🕐 Estamos cerrados en este momento. Te responderemos cuando abramos.',
          proximo_a_cerrar: 'Cerraremos pronto.',
          recien_abierto: '¡Ya estamos disponibles!'
        },
        configuracion: {
          avisar_antes_de_cerrar_minutos: 15,
          mensaje_bienvenida_al_abrir: false,
          pausar_ai_fuera_horario: false
        }
      };
    }
  }

  /**
   * Obtiene el día de la semana en español
   */
  private static obtenerDiaSemana(fecha: Date): keyof ConfigHorarios['horarios']['dias_semana'] {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
    return dias[fecha.getDay()];
  }

  /**
   * Convierte una hora string (HH:MM) a minutos desde medianoche
   */
  private static horaAMinutos(hora: string): number {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }

  /**
   * Verifica si el local está abierto en este momento
   */
  static estaAbierto(): {
    abierto: boolean;
    mensaje?: string;
    config: ConfigHorarios;
  } {
    const config = this.cargarConfig();

    // Si el sistema de horarios está deshabilitado, siempre está "abierto"
    if (!config.horarios.habilitado) {
      return { abierto: true, config };
    }

    const ahora = new Date();
    const diaSemana = this.obtenerDiaSemana(ahora);
    const horarioDia = config.horarios.dias_semana[diaSemana];

    // Si el día está marcado como cerrado
    if (!horarioDia.abierto || !horarioDia.apertura || !horarioDia.cierre) {
      return {
        abierto: false,
        mensaje: config.mensajes.fuera_de_horario,
        config
      };
    }

    // Obtener hora actual en minutos
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    const horaApertura = this.horaAMinutos(horarioDia.apertura);
    const horaCierre = this.horaAMinutos(horarioDia.cierre);

    // Verificar si está dentro del horario
    // Manejar horarios que cruzan medianoche (ej: 9:00 - 3:00)
    const cruzaMedianoche = horaCierre < horaApertura;
    const dentroHorario = cruzaMedianoche
      ? (horaActual >= horaApertura || horaActual < horaCierre)
      : (horaActual >= horaApertura && horaActual < horaCierre);

    if (dentroHorario) {
      // Verificar si está próximo a cerrar
      const minutosParaCierre = cruzaMedianoche && horaActual < horaCierre
        ? horaCierre - horaActual // Estamos en la madrugada antes del cierre
        : cruzaMedianoche
        ? (24 * 60 - horaActual) + horaCierre // Estamos antes de medianoche
        : horaCierre - horaActual; // Horario normal
      if (minutosParaCierre <= config.configuracion.avisar_antes_de_cerrar_minutos) {
        return {
          abierto: true,
          mensaje: config.mensajes.proximo_a_cerrar.replace('{minutos}', minutosParaCierre.toString()),
          config
        };
      }

      return { abierto: true, config };
    }

    // Fuera de horario
    return {
      abierto: false,
      mensaje: config.mensajes.fuera_de_horario,
      config
    };
  }

  /**
   * Obtiene el horario formateado para mostrar
   */
  static obtenerHorarioFormateado(): string {
    const config = this.cargarConfig();
    let texto = '📅 **Horario de Atención:**\n\n';

    const dias = Object.entries(config.horarios.dias_semana);
    for (const [dia, horario] of dias) {
      const diaCapitalizado = dia.charAt(0).toUpperCase() + dia.slice(1);
      if (horario.abierto && horario.apertura && horario.cierre) {
        texto += `${diaCapitalizado}: ${horario.apertura} - ${horario.cierre}\n`;
      } else {
        texto += `${diaCapitalizado}: Cerrado\n`;
      }
    }

    return texto;
  }

  /**
   * Verifica si debe pausar la IA fuera de horario
   */
  static debePausarIA(): boolean {
    const estado = this.estaAbierto();
    return !estado.abierto && estado.config.configuracion.pausar_ai_fuera_horario;
  }
}
