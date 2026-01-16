import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const EMBEDDINGS_SERVICE_URL = process.env.EMBEDDINGS_SERVICE_URL || 'http://localhost:8001';

/**
 * POST /api/learning/search
 * Buscar conversaciones similares usando búsqueda semántica
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, n_results = 5, filter_helpful } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query es requerida' },
        { status: 400 }
      );
    }

    // Llamar al servicio de embeddings
    const response = await fetch(`${EMBEDDINGS_SERVICE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        n_results,
        filter_helpful,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Embeddings service error:', error);
      return NextResponse.json(
        { error: 'Error en búsqueda semántica', details: error },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      results: data.results || [],
      query: data.query,
      total_found: data.total_found || 0,
    });
  } catch (error) {
    console.error('Error searching:', error);

    // Si el servicio de embeddings no está disponible, retornar vacío
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json({
        success: true,
        results: [],
        query: '',
        total_found: 0,
        warning: 'Servicio de embeddings no disponible',
      });
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/learning/search
 * Buscar con query string
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const n_results = parseInt(searchParams.get('n') || '5');
    const filter_helpful = searchParams.get('helpful');

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'Query debe tener al menos 2 caracteres',
      });
    }

    // Llamar al servicio de embeddings
    const response = await fetch(`${EMBEDDINGS_SERVICE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        n_results,
        filter_helpful: filter_helpful === 'true' ? true : filter_helpful === 'false' ? false : undefined,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        results: [],
        warning: 'Servicio de búsqueda no disponible',
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      results: data.results || [],
      query: data.query,
      total_found: data.total_found || 0,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json({
      success: true,
      results: [],
      warning: 'Error en búsqueda',
    });
  }
}
