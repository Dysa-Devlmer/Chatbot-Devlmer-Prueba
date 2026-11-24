import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad | PITHY Chatbot & Carta Digital',
  description: 'Política oficial de privacidad y tratamiento de datos personales de PITHY Chatbot.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#141312] text-stone-200 font-sans selection:bg-orange-500 selection:text-white py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <Link 
            href="/menu"
            className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Carta Digital</span>
          </Link>
          <span className="text-xs text-stone-500 font-mono">Actualizado: 24/11/2026</span>
        </div>

        {/* Title Block */}
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Política de Privacidad y Tratamiento de Datos Personales
          </h1>
          <p className="text-sm text-stone-400 leading-relaxed">
            En <strong>PITHY Chatbot</strong> y comercios asociados, nos comprometemos con la total transparencia y seguridad de los datos personales de nuestros usuarios y comensales.
          </p>
        </div>

        {/* Content Modules */}
        <div className="space-y-6 text-sm text-stone-300 leading-relaxed">
          
          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              1. Alcance y Normativas Cumplidas
            </h2>
            <p>
              Esta política aplica a todos los pedidos y consultas realizadas a través de nuestra <strong>Carta Digital Web (PWA)</strong> y nuestro canal oficial de <strong>WhatsApp Business Cloud API</strong>. Cumplimos con los marcos normativos vigentes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-stone-400 pl-2">
              <li><strong>Chile:</strong> Ley N° 19.628 sobre Protección de la Vida Privada.</li>
              <li><strong>Perú:</strong> Ley N° 29733 de Protección de Datos Personales.</li>
              <li><strong>Argentina:</strong> Ley N° 25.326 de Protección de los Datos Personales.</li>
              <li><strong>Meta Platforms:</strong> Requerimientos de Privacidad para WhatsApp Business API.</li>
            </ul>
          </section>

          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              2. Datos que Recopilamos
            </h2>
            <p>Recopilamos únicamente los datos mínimos indispensables para atender tu pedido:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                <strong className="text-white block mb-1">Nombre y WhatsApp</strong>
                Para identificar tu orden y notificarte el estado de cocina y despacho.
              </div>
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                <strong className="text-white block mb-1">Dirección y GPS Voluntario</strong>
                Calle, número de casa/dpto y coordenadas satelitales (solo si pulsas &quot;Detectar mi GPS&quot;) para que el repartidor llegue a tu puerta.
              </div>
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                <strong className="text-white block mb-1">Correo Electrónico</strong>
                Utilizado exclusivamente para emitir y enviarte la copia de tu Boleta o Factura Electrónica.
              </div>
              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800">
                <strong className="text-white block mb-1">Notas de Voz por WhatsApp</strong>
                Procesadas en memoria con IA exclusivamente para transcribir el texto de tu pedido. No se almacenan biométricos.
              </div>
            </div>
          </section>

          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-400" />
              3. Protección de Datos Financieros
            </h2>
            <p>
              <strong>NO recopilamos ni almacenamos números completos de tarjetas de crédito o débito</strong>. Los pagos se realizan mediante transferencias bancarias directas del cliente o mediante terminal físico de cobro (POS móvil) al recibir en puerta.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white">4. Derechos ARCO y Contacto</h2>
            <p>
              Puedes solicitar en cualquier momento la eliminación o rectificación de tus datos personales enviando un correo a:
            </p>
            <p className="font-mono text-orange-400 text-xs">privacidad@zgamersa.com</p>
          </section>

        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-stone-800 text-center text-xs text-stone-500">
          © 2026 PITHY Chatbot · Desarrollado por Pierre Arturo Benites Solier (Devlmer) · Todos los derechos reservados.
        </div>

      </div>
    </div>
  );
}
