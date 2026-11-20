const notes1 = 'Delivery Av. Defensores del Morro 820 Dpto 402 - Pago con Tarjeta POS - Tocar timbre 402';
const notes2 = 'Delivery a: San Genaro, Chorrillos - Pago contraentrega en efectivo';
const notes3 = 'Delivery a Urb. Los Cedros Mz D Lt 12, Chorrillos - Pago con Yape';

function cleanDeliveryAddress(notes) {
  const parts = notes.split(/[-–|•\n]/).map(p => p.trim());
  for (const p of parts) {
    if (/^delivery/i.test(p)) {
      let addr = p.replace(/^delivery\s*:?\s*/i, '').trim();
      addr = addr.replace(/^(?:a|en|para)\s*:\s*/i, '').replace(/^(?:a|en|para)\s+/i, '').trim();
      return addr;
    }
  }
  return null;
}

console.log('1:', cleanDeliveryAddress(notes1));
console.log('2:', cleanDeliveryAddress(notes2));
console.log('3:', cleanDeliveryAddress(notes3));
