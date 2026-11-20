import paramiko

password = open(r'C:\Users\zeNk0\Desktop\pw.md').read().strip()
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect('64.176.21.229', port=22, username='root', password=password, timeout=10)

sftp = client.open_sftp()
with sftp.file('/var/www/chatbot/check_db.js', 'w') as f:
    f.write('''
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const convs = await prisma.conversation.findMany({ 
    include: { user: true, messages: { take: 3, orderBy: { timestamp: 'desc' } } },
    orderBy: { startedAt: 'desc' }, 
    take: 5 
  });
  console.log('CONVERSATIONS ENCONTRADAS:', convs.length);
  for (const c of convs) {
    console.log(`- Conv ID: ${c.id} | User: ${c.user.phoneNumber} (${c.user.name}) | Status: ${c.status} | Mode: ${c.botMode} | StartedAt: ${c.startedAt}`);
    for (const m of c.messages) {
      console.log(`    [${m.direction}] ${m.timestamp.toISOString()}: ${m.content.slice(0, 80)}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
''')
sftp.close()

stdin, stdout, stderr = client.exec_command('cd /var/www/chatbot && node check_db.js && rm check_db.js')
print(stdout.read().decode())
print("ERR:", stderr.read().decode())

client.close()
