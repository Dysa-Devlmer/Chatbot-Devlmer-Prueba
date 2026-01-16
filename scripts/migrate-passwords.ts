/**
 * Script de Migración de Passwords a bcrypt
 *
 * Este script migra todas las contraseñas en texto plano de AdminProfile
 * a hashes bcrypt seguros.
 *
 * IMPORTANTE: Ejecutar solo UNA VEZ
 *
 * Uso:
 *   npx tsx scripts/migrate-passwords.ts
 */

import { prisma } from '../src/lib/prisma'
import { hashPassword } from '../src/utils/security'

interface MigrationStats {
  total: number
  migrated: number
  alreadyHashed: number
  failed: number
}

/**
 * Detectar si un string es un hash bcrypt
 * Los hashes bcrypt empiezan con $2a$, $2b$ o $2y$
 */
function isBcryptHash(password: string): boolean {
  return /^\$2[aby]\$/.test(password)
}

/**
 * Migrar passwords a bcrypt
 */
async function migratePasswords(): Promise<MigrationStats> {
  console.log('🔐 Iniciando migración de passwords a bcrypt...\n')

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    alreadyHashed: 0,
    failed: 0,
  }

  try {
    // Obtener todos los admins
    const admins = await prisma.adminProfile.findMany({
      select: {
        id: true,
        username: true,
        password: true,
      },
    })

    stats.total = admins.length

    console.log(`📊 Total de admins encontrados: ${stats.total}\n`)

    if (stats.total === 0) {
      console.log('⚠️  No hay admins para migrar')
      return stats
    }

    // Migrar cada admin
    for (const admin of admins) {
      console.log(`Procesando: ${admin.username} (${admin.id})`)

      // Verificar si ya está hasheado
      if (isBcryptHash(admin.password)) {
        console.log(`  ✅ Ya tiene hash bcrypt (saltado)\n`)
        stats.alreadyHashed++
        continue
      }

      try {
        // Guardar password original (para debug)
        const originalPassword = admin.password

        // Hashear password
        console.log(`  🔒 Hasheando password...`)
        const hashedPassword = await hashPassword(originalPassword)

        // Actualizar en BD
        await prisma.adminProfile.update({
          where: { id: admin.id },
          data: { password: hashedPassword },
        })

        console.log(`  ✅ Password migrado exitosamente`)
        console.log(`  📝 Original: ${originalPassword}`)
        console.log(`  🔐 Hash: ${hashedPassword.substring(0, 30)}...\n`)

        stats.migrated++
      } catch (error) {
        console.error(`  ❌ Error migrando password:`, error)
        stats.failed++
      }
    }

    // Resumen
    console.log('═'.repeat(60))
    console.log('📊 RESUMEN DE MIGRACIÓN')
    console.log('═'.repeat(60))
    console.log(`Total de admins:        ${stats.total}`)
    console.log(`✅ Migrados:            ${stats.migrated}`)
    console.log(`⏭️  Ya hasheados:        ${stats.alreadyHashed}`)
    console.log(`❌ Fallidos:            ${stats.failed}`)
    console.log('═'.repeat(60))

    if (stats.migrated > 0) {
      console.log('\n✅ Migración completada exitosamente')
      console.log('\n⚠️  IMPORTANTE: Guarda las credenciales originales si las necesitas:')
      console.log('   - Revisa los logs arriba para ver los passwords originales')
      console.log('   - Actualiza tus archivos .env si usas ADMIN_PASSWORD')
    }

    if (stats.failed > 0) {
      console.log('\n⚠️  Algunos passwords fallaron al migrar. Revisa los errores arriba.')
    }

    return stats
  } catch (error) {
    console.error('❌ Error crítico durante la migración:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Punto de entrada
 */
async function main() {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║     MIGRACIÓN DE PASSWORDS A BCRYPT                        ║')
  console.log('║     Sistema: PITHY Chatbot                                 ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('\n')

  // Confirmación de seguridad
  console.log('⚠️  ADVERTENCIA:')
  console.log('   Este script modificará passwords en la base de datos.')
  console.log('   Asegúrate de tener un backup antes de continuar.\n')

  // En producción, podrías añadir una confirmación interactiva aquí
  // Por ahora, ejecutamos directamente

  try {
    const stats = await migratePasswords()

    // Exit code según resultado
    if (stats.failed > 0) {
      process.exit(1) // Error
    } else {
      process.exit(0) // Éxito
    }
  } catch (error) {
    console.error('\n❌ Migración fallida:', error)
    process.exit(1)
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main()
}

export { migratePasswords, isBcryptHash }
