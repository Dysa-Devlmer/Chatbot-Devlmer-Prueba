import paramiko

password = open(r'C:\Users\zeNk0\Desktop\pw.md').read().strip()
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('64.176.21.229', port=22, username='root', password=password, timeout=10)

sftp = client.open_sftp()
sftp.put(r'E:\prueba\scripts\clean-orders.js', '/var/www/chatbot/clean-orders.js')
sftp.close()

stdin, stdout, stderr = client.exec_command('cd /var/www/chatbot && node clean-orders.js && rm clean-orders.js')
print(stdout.read().decode())
print("ERR:", stderr.read().decode())

client.close()
