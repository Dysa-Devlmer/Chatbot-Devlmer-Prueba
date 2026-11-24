/**
 * Utilidades para formateo y validación de RUT chileno (Rol Único Tributario / RUN)
 * Estándar: XX.XXX.XXX-K o X.XXX.XXX-K
 */

/**
 * Limpia y formatea un RUT chileno en tiempo real con puntos, guión y K en mayúscula.
 * Ejemplos:
 *  "11111111k"    -> "11.111.111-K"
 *  "25484075 - 0" -> "25.484.075-0"
 *  "7654321k"     -> "7.654.321-K"
 *  "11.111.111-k" -> "11.111.111-K"
 */
export function formatChileanRut(value: string | null | undefined): string {
  if (!value) return '';

  // Limpiar caracteres no válidos (solo dígitos y k/K)
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  if (clean.length === 1) return clean;

  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);

  // Formatear cuerpo con separador de miles '.'
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}

/**
 * Valida si un RUT chileno tiene el formato y dígito verificador matemáticamente correcto (Módulo 11)
 */
export function validateChileanRut(rut: string | null | undefined): boolean {
  if (!rut) return false;
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 8 || clean.length > 9) return false;

  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let expectedDv = '';
  if (remainder === 11) expectedDv = '0';
  else if (remainder === 10) expectedDv = 'K';
  else expectedDv = remainder.toString();

  return dv === expectedDv;
}

/**
 * Extrae el número de cuenta sugerido para Banco Estado (CuentaRUT),
 * que por normativa bancaria chilena corresponde al RUT sin puntos ni dígito verificador.
 * Ej: "25.484.075-0" -> "25484075"
 */
export function extractCuentaRutNumber(rut: string | null | undefined): string {
  if (!rut) return '';
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length <= 1) return '';
  return clean.slice(0, -1);
}
