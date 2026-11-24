import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones | PITHY Chatbot & Carta Digital',
  description: 'Términos oficiales de uso y permisos de PITHY Chatbot.',
};

export default function TermsPage() {
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
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Términos y Condiciones de Uso y Permisos
          </h1>
          <p className="text-sm text-stone-400 leading-relaxed">
            Reglas de uso del servicio comercial para la Carta Digital y atención por WhatsApp.
          </p>
        </div>

        {/* Content Modules */}
        <div className="space-y-6 text-sm text-stone-300 leading-relaxed">
          
          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-400" />
              1. Aceptación del Servicio
            </h2>
            <p>
              Al realizar un pedido a través de la carta web o interactuar con el bot de WhatsApp, aceptas los presentes términos y te comprometes a brindar datos de entrega verídicos.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              2. Permisos del Dispositivo
            </h2>
            <p>
              El sitio web solicita de manera voluntaria el permiso de <strong>Geolocalización (GPS)</strong> con el único fin de completar tu dirección y que el repartidor ubique tu domicilio. No rastreamos tu ubicación en segundo plano.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white">3. Moneda y Precios</h2>
            <p>
              Los precios exhibidos corresponden a la moneda oficial del país del comercio (CLP en Chile, PEN en Perú, ARS en Argentina) e incluyen los impuestos aplicables. Los pedidos se consideran confirmados una vez verificado el pago por el restaurante.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white">4. Propiedad Intelectual</h2>
            <p>
              La plataforma PITHY Chatbot, su código y sus marcas son propiedad exclusiva de <strong>Pierre Arturo Benites Solier (Devlmer)</strong>.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-stone-800 text-center text-xs text-stone-500">
          © 2026 PITHY Chatbot · Contacto legal: <span className="text-orange-400">legal@zgamersa.com</span>
        </div>

      </div>
    </div>
  );
}
