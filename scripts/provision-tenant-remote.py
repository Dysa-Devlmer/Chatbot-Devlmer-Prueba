#!/usr/bin/env python3
"""
Aprovisionador Remoto de Tenants SaaS para PITHY / Chatbot Jarvis
Permite ejecutar el aprovisionamiento de nuevos clientes en el VPS con un solo comando.
Uso: python scripts/provision-tenant-remote.py <tenant_id> <puerto> [nombre_empresa] [template] [moneda]
"""

import sys
import paramiko

def main():
    if len(sys.argv) < 3:
        print("❌ Uso: python scripts/provision-tenant-remote.py <tenant_id> <puerto> [nombre_empresa] [template] [moneda]")
        print("Ejemplo: python scripts/provision-tenant-remote.py lapasion 7848 \"La Pasión Broaster\" fast_food S/.")
        sys.exit(1)

    tenant_id = sys.argv[1].lower().strip()
    port = sys.argv[2].strip()
    business_name = sys.argv[3] if len(sys.argv) > 3 else "Mi Negocio SaaS"
    template = sys.argv[4] if len(sys.argv) > 4 else "fast_food"
    currency = sys.argv[5] if len(sys.argv) > 5 else "S/."

    print(f"🚀 Conectando a VPS 64.176.21.229 para aprovisionar tenant '{tenant_id}'...")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    pw = open('C:/Users/zeNk0/Desktop/pw.md').read().strip()
    ssh.connect('64.176.21.229', username='root', password=pw)

    # Subir scripts actualizados al VPS
    sftp = ssh.open_sftp()
    print("📤 Sincronizando scripts de aprovisionamiento en el VPS...")
    sftp.put('E:/prueba/scripts/seed-tenant.js', '/var/www/chatbot/scripts/seed-tenant.js')
    sftp.put('E:/prueba/scripts/provision-new-tenant.sh', '/var/www/chatbot/scripts/provision-new-tenant.sh')
    sftp.close()

    # Dar permisos de ejecución
    ssh.exec_command('chmod +x /var/www/chatbot/scripts/provision-new-tenant.sh')

    # Ejecutar aprovisionamiento
    cmd = f'bash /var/www/chatbot/scripts/provision-new-tenant.sh "{tenant_id}" "{port}" "{business_name}" "{template}" "{currency}"'
    print(f"⚙️ Ejecutando comando en el VPS: {cmd}\n")

    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    for line in iter(stdout.readline, ""):
        print(line, end="")

    err = stderr.read().decode()
    if err and "warning" not in err.lower() and "notice" not in err.lower():
        print("STDERR:", err)

    ssh.close()

if __name__ == "__main__":
    main()
