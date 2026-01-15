import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPerplexityConfig() {
  try {
    console.log('Agregando configuraciones predeterminadas de Perplexity...');

    // Configuraciones de Perplexity
    const configs = [
      {
        key: 'ai_provider',
        value: 'ollama', // Valor predeterminado
        type: 'string',
        description: 'Proveedor de IA: ollama o perplexity',
      },
      {
        key: 'perplexity_api_key',
        value: '',
        type: 'string',
        description: 'API Key para la API de Perplexity',
      },
      {
        key: 'perplexity_model',
        value: 'llama-3.1-sonar-large-128k-chat',
        type: 'string',
        description: 'Modelo de Perplexity a utilizar',
      },
      {
        key: 'perplexity_temperature',
        value: '0.7',
        type: 'number',
        description: 'Temperatura para la generación de texto de Perplexity',
      },
      {
        key: 'perplexity_max_tokens',
        value: '1024',
        type: 'number',
        description: 'Número máximo de tokens para la generación de texto de Perplexity',
      },
    ];

    for (const config of configs) {
      const existing = await prisma.systemConfig.findUnique({
        where: { key: config.key },
      });

      if (!existing) {
        await prisma.systemConfig.create({
          data: config,
        });
        console.log(`✓ Configuración agregada: ${config.key}`);
      } else {
        console.log(`- Configuración ya existe: ${config.key}`);
      }
    }

    console.log('Configuraciones de Perplexity agregadas exitosamente.');
  } catch (error) {
    console.error('Error agregando configuraciones de Perplexity:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPerplexityConfig().catch(console.error);