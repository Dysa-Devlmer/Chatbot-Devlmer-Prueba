import { NextRequest, NextResponse } from 'next/server';
import { HorariosService, ConfigHorarios } from '@/lib/horarios';
import { apiLogger, logError } from '@/lib/logger';

// GET /api/admin/business/hours - Obtener configuración de horarios y estado en tiempo real
export async function GET() {
  try {
    const config = HorariosService.cargarConfig();
    const status = HorariosService.estaAbierto();
    const formattedSchedule = HorariosService.formatearHorarioSemanal(config);

    return NextResponse.json({
      success: true,
      config,
      status: {
        abierto: status.abierto,
        modo: status.modo,
        mensaje: status.mensaje || null,
        diaActual: status.diaActual,
        horaActual: status.horaActual,
        horarioHoy: status.horarioHoy,
      },
      formattedSchedule,
    });
  } catch (error) {
    logError(apiLogger, error, { stage: 'get-business-hours' });
    return NextResponse.json(
      { success: false, error: 'Error al obtener horarios del negocio' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/business/hours - Guardar configuración de horarios
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { horarios, mensajes, configuracion } = body;

    const currentConfig = HorariosService.cargarConfig();

    const updatedConfig: ConfigHorarios = {
      horarios: {
        ...currentConfig.horarios,
        ...(horarios || {}),
        dias_semana: {
          ...currentConfig.horarios.dias_semana,
          ...(horarios?.dias_semana || {}),
        },
      },
      mensajes: {
        ...currentConfig.mensajes,
        ...(mensajes || {}),
      },
      configuracion: {
        ...currentConfig.configuracion,
        ...(configuracion || {}),
      },
    };

    const saved = HorariosService.guardarConfig(updatedConfig);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: 'No se pudo guardar la configuración de horarios' },
        { status: 500 }
      );
    }

    const status = HorariosService.estaAbierto();
    const formattedSchedule = HorariosService.formatearHorarioSemanal(updatedConfig);

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      status: {
        abierto: status.abierto,
        modo: status.modo,
        mensaje: status.mensaje || null,
        diaActual: status.diaActual,
        horaActual: status.horaActual,
        horarioHoy: status.horarioHoy,
      },
      formattedSchedule,
    });
  } catch (error) {
    logError(apiLogger, error, { stage: 'update-business-hours' });
    return NextResponse.json(
      { success: false, error: 'Error al actualizar horarios del negocio' },
      { status: 500 }
    );
  }
}
