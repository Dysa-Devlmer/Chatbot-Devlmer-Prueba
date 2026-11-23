#!/bin/bash
# ==============================================================================
# SCRIPT MAESTRO DE APROVISIONAMIENTO DE TENANTS SAAS (MULTI-EMPRESA)
# Desarrollado para PITHY SaaS / Chatbot Jarvis
# Arquitectura: Single Codebase, Database-per-tenant, Nginx Reverse Proxy, PM2
# ==============================================================================

set -e

TENANT_ID="$1"
PORT="$2"
BUSINESS_NAME="${3:-Mi Negocio}"
TEMPLATE="${4:-fast_food}"
CURRENCY="${5:-S/.}"

if [ -z "$TENANT_ID" ] || [ -z "$PORT" ]; then
    echo "❌ Error de sintaxis."
    echo "Uso: ./scripts/provision-new-tenant.sh <tenant_id> <puerto> [nombre_empresa] [template] [moneda]"
    echo "Ejemplo: ./scripts/provision-new-tenant.sh burgerking 7848 \"Burger King Delivery\" fast_food S/."
    exit 1
fi

DOMAIN="${TENANT_ID}.zgamersa.com"
APP_DIR="/var/www/chatbot"

echo "===================================================================="
echo "🚀 INICIANDO APROVISIONAMIENTO EXPRESS DE TENANT SAAS"
echo "Empresa:         ${BUSINESS_NAME}"
echo "Identificador:   ${TENANT_ID}"
echo "Subdominio:      ${DOMAIN}"
echo "Puerto Interno:  ${PORT}"
echo "Plantilla:       ${TEMPLATE}"
echo "Moneda:          ${CURRENCY}"
echo "===================================================================="

cd "$APP_DIR"

# 1. Asegurar directorio de bases de datos de tenants
mkdir -p prisma/tenants

# 2. Inicializar base de datos SQLite aislada para el tenant
echo "📦 [1/5] Creando y sincronizando base de datos aislada..."
DATABASE_URL="file:./prisma/tenants/${TENANT_ID}.db" npx prisma db push --skip-generate

# 3. Sembrar datos iniciales (Admin, Empresa, Catálogo)
echo "🌱 [2/5] Sembrando datos de inicio y catálogo..."
node scripts/seed-tenant.js "${TENANT_ID}" "${BUSINESS_NAME}" "${TEMPLATE}" "${CURRENCY}"

# 4. Crear configuración de Nginx
echo "🌐 [3/5] Configurando Nginx Reverse Proxy y buffers de seguridad..."
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"

cat <<EOF > "$NGINX_CONF"
server {
    server_name ${DOMAIN};

    client_max_body_size 30M;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Buffers optimizados para sesiones NextAuth
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    listen 80;
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/chatbot.zgamersa.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chatbot.zgamersa.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
EOF

ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/${DOMAIN}"
nginx -t && systemctl reload nginx

# 5. Generar certificado SSL con Certbot (si DNS ya apunta a la IP)
echo "🔒 [4/5] Verificando / emitiendo certificado SSL Let's Encrypt..."
if certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos -m admin@zgamersa.com --redirect 2>/dev/null; then
    echo "✅ Certificado SSL emitido y activado con éxito para https://${DOMAIN}"
else
    echo "⚠️ Nota DNS: No se pudo emitir SSL automático todavía. Si estás usando Cloudflare con Proxy naranja activado, Cloudflare provee SSL Full automáticamente."
fi

# 6. Registrar y levantar el microservicio en PM2
echo "⚡ [5/5] Levantando proceso en PM2..."
PM2_NAME="tenant-${TENANT_ID}"

# Si ya existe, detenerlo y relanzarlo con el nuevo entorno
pm2 delete "$PM2_NAME" 2>/dev/null || true

DATABASE_URL="file:./prisma/tenants/${TENANT_ID}.db" \
PORT="${PORT}" \
NEXTAUTH_URL="https://${DOMAIN}" \
pm2 start npm --name "$PM2_NAME" -- start -- -p "${PORT}"

pm2 save

echo ""
echo "===================================================================="
echo "🎉 ¡NUEVO TENANT SAAS APROVISIONADO CON ÉXITO EN MENOS DE 60 SEGUNDOS!"
echo "===================================================================="
echo "🔗 URL Pública / Carta Digital: https://${DOMAIN}/menu"
echo "🔑 Panel Administrativo:        https://${DOMAIN}/admin"
echo "👤 Usuario Administrador:        admin"
echo "🔒 Contraseña Temporal:          pithy2024"
echo "📁 Base de Datos:                prisma/tenants/${TENANT_ID}.db"
echo "⚙️ Proceso PM2:                  ${PM2_NAME} (Puerto ${PORT})"
echo "===================================================================="
