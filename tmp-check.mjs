import * as whatsapp from './src/lib/whatsapp'
console.log(Object.getOwnPropertyDescriptor(whatsapp, 'downloadWhatsAppMedia'))
try {
  whatsapp.downloadWhatsAppMedia = () => {}
  console.log('assigned')
} catch (e) {
  console.error(e)
}
