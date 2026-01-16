/**
 * AuthService
 *
 * Servicio de autenticación con lógica de negocio para:
 * - Login/logout
 * - Validación de credenciales
 * - Gestión de sesiones
 * - Actualización de perfil
 */

import { authRepository, SafeAdminProfile } from '@/repositories/AuthRepository'
import { hashPassword, verifyPassword } from '@/utils/security'
import { authLogger } from '@/lib/logger'
import { AuthenticationError } from '@/middleware/validation'

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  username: string
  password: string
}

/**
 * Resultado de autenticación exitosa
 */
export interface AuthResult {
  admin: SafeAdminProfile
  token?: string // Para JWT en futuro
}

/**
 * Datos para actualizar perfil
 */
export interface UpdateProfileData {
  name?: string
  email?: string
  phone?: string
  company?: string
  role?: string
  timezone?: string
  language?: string
  theme?: string
  accentColor?: string
}

/**
 * Datos para cambiar password
 */
export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

/**
 * Servicio de autenticación
 */
export class AuthService {
  /**
   * Autenticar usuario con username y password
   *
   * @throws AuthenticationError si las credenciales son inválidas
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { username, password } = credentials

    authLogger.info('Login attempt', { username })

    // Buscar admin por username
    const admin = await authRepository.findByUsername(username)

    if (!admin) {
      authLogger.warn('Login failed: user not found', { username })
      throw new AuthenticationError('Invalid username or password')
    }

    // Verificar password
    const isPasswordValid = await verifyPassword(password, admin.password)

    if (!isPasswordValid) {
      authLogger.warn('Login failed: invalid password', { username })
      throw new AuthenticationError('Invalid username or password')
    }

    authLogger.info('Login successful', { username, adminId: admin.id })

    // Obtener perfil público (sin password)
    const publicProfile = await authRepository.getPublicProfile(admin.id)

    if (!publicProfile) {
      throw new Error('Failed to retrieve admin profile')
    }

    return {
      admin: publicProfile,
      // TODO: Generar JWT token aquí cuando implementemos JWT
    }
  }

  /**
   * Validar credenciales sin crear sesión
   * Útil para verificación antes de operaciones sensibles
   */
  async validateCredentials(
    credentials: LoginCredentials
  ): Promise<boolean> {
    try {
      await this.login(credentials)
      return true
    } catch {
      return false
    }
  }

  /**
   * Obtener perfil del admin por ID
   */
  async getProfile(adminId: string): Promise<SafeAdminProfile | null> {
    return authRepository.getPublicProfile(adminId)
  }

  /**
   * Actualizar perfil del admin
   */
  async updateProfile(
    adminId: string,
    data: UpdateProfileData
  ): Promise<SafeAdminProfile> {
    authLogger.info('Updating admin profile', { adminId })

    // Validar que el email no esté en uso por otro admin
    if (data.email) {
      const existingAdmin = await authRepository.findByEmail(data.email)
      if (existingAdmin && existingAdmin.id !== adminId) {
        throw new Error('Email already in use')
      }
    }

    const updated = await authRepository.update(adminId, data)

    authLogger.info('Profile updated successfully', { adminId })

    return updated
  }

  /**
   * Cambiar password del admin
   *
   * @throws AuthenticationError si el password actual es incorrecto
   */
  async changePassword(
    adminId: string,
    data: ChangePasswordData
  ): Promise<void> {
    authLogger.info('Password change attempt', { adminId })

    // Obtener admin actual
    const admin = await authRepository.findById(adminId)

    if (!admin) {
      throw new Error('Admin not found')
    }

    // Verificar password actual
    const isCurrentPasswordValid = await verifyPassword(
      data.currentPassword,
      admin.password
    )

    if (!isCurrentPasswordValid) {
      authLogger.warn('Password change failed: invalid current password', { adminId })
      throw new AuthenticationError('Current password is incorrect')
    }

    // Validar que el nuevo password sea diferente
    if (data.currentPassword === data.newPassword) {
      throw new Error('New password must be different from current password')
    }

    // Hashear nuevo password
    const hashedPassword = await hashPassword(data.newPassword)

    // Actualizar en BD
    await authRepository.updatePassword(adminId, hashedPassword)

    authLogger.info('Password changed successfully', { adminId })
  }

  /**
   * Actualizar avatar del admin
   */
  async updateAvatar(adminId: string, avatarUrl: string): Promise<void> {
    authLogger.info('Updating avatar', { adminId })
    await authRepository.updateAvatar(adminId, avatarUrl)
  }

  /**
   * Actualizar configuración de notificaciones
   */
  async updateNotificationSettings(
    adminId: string,
    settings: {
      emailNewMessage?: boolean
      emailDailyReport?: boolean
      pushNewMessage?: boolean
      pushMentions?: boolean
      soundEnabled?: boolean
      desktopNotifications?: boolean
    }
  ): Promise<SafeAdminProfile> {
    authLogger.info('Updating notification settings', { adminId })
    return authRepository.updateNotificationSettings(adminId, settings)
  }

  /**
   * Actualizar tema y preferencias visuales
   */
  async updateThemeSettings(
    adminId: string,
    settings: {
      theme?: string
      accentColor?: string
      language?: string
    }
  ): Promise<SafeAdminProfile> {
    authLogger.info('Updating theme settings', { adminId })
    return authRepository.updateThemeSettings(adminId, settings)
  }

  /**
   * Crear nuevo admin (para setup inicial o multi-admin en futuro)
   */
  async createAdmin(data: {
    username: string
    password: string
    name: string
    email: string
  }): Promise<SafeAdminProfile> {
    authLogger.info('Creating new admin', { username: data.username })

    // Verificar que username no exista
    if (await authRepository.usernameExists(data.username)) {
      throw new Error('Username already exists')
    }

    // Verificar que email no exista
    if (await authRepository.emailExists(data.email)) {
      throw new Error('Email already exists')
    }

    // Hashear password
    const hashedPassword = await hashPassword(data.password)

    // Crear admin
    const admin = await authRepository.create({
      username: data.username,
      password: hashedPassword,
      name: data.name,
      email: data.email,
    })

    authLogger.info('Admin created successfully', { adminId: admin.id })

    // Retornar perfil público
    const publicProfile = await authRepository.getPublicProfile(admin.id)

    if (!publicProfile) {
      throw new Error('Failed to retrieve created admin profile')
    }

    return publicProfile
  }

  /**
   * Logout (por ahora solo logging, en futuro invalidar JWT)
   */
  async logout(adminId: string): Promise<void> {
    authLogger.info('Admin logged out', { adminId })
    // TODO: Invalidar JWT token cuando lo implementemos
  }
}

/**
 * Instancia singleton del servicio
 */
export const authService = new AuthService()
