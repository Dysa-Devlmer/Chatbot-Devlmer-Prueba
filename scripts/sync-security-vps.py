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

client.close()
