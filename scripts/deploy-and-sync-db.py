import paramiko

password = open(r'C:\Users\zeNk0\Desktop\pw.md').read().strip()
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('64.176.21.229', port=22, username='root', password=password, timeout=10)

cmds = [
    'cd /var/www/chatbot && git pull origin main',
    'cd /var/www/chatbot && npm run build',
    'pm2 restart chatbot'
]

for cmd in cmds:
    print('=== ' + cmd + ' ===')
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print('ERR:', err)

print("=== Sincronizando Base de Datos de Producción a Local ===")
sftp = client.open_sftp()
sftp.get('/var/www/chatbot/prisma/dev.db', r'E:\prueba\prisma\dev.db')
sftp.close()
print("Base de datos sincronizada exitosamente en E:\\prueba\\prisma\\dev.db")

client.close()
