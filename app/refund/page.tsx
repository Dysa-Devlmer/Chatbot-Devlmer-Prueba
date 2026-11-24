import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Política de Reembolso y Cancelación | PITHY Chatbot',
  description: 'Política oficial de devoluciones y reembolsos para pedidos gastronómicos.',
};

export default function RefundPage() {
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
            <RefreshCw className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Política de Reembolsos, Cancelaciones y Devoluciones
          </h1>
          <p className="text-sm text-stone-400 leading-relaxed">
            Procedimiento claro y justo para la cancelación y compensación de órdenes gastronómicas.
          </p>
        </div>

        {/* Content Modules */}
        <div className="space-y-6 text-sm text-stone-300 leading-relaxed">
          
          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              1. Naturaleza de los Alimentos Preparados
            </h2>
            <p>
              Por estrictas normas de salubridad y seguridad higiénica, los alimentos preparados y bebidas son bienes perecederos de consumo inmediato. No se admiten devoluciones de productos abiertos o manipulados, excepto por causas de defecto comprobado o error del restaurante.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              2. Plazos para Cancelar tu Orden
            </h2>
            <p>
              Puedes cancelar tu pedido y recibir el <strong>100% de tu dinero</strong> dentro de los primeros <strong>5 minutos</strong> de enviada la orden, siempre que la cocina no haya comenzado la cocción de los platos. Una vez que la orden pasa a cocina o se encuentra en ruta con el repartidor, no es posible cancelar la comanda.
            </p>
          </section>

          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white">3. Casos Válidos de Reembolso o Reenvío</h2>
            <ul className="list-disc list-inside space-y-1 text-xs text-stone-300 pl-2">
              <li><strong>Pedido Incompleto o Erróneo:</strong> Si falta un producto o se entregó un plato distinto al solicitado.</li>
              <li><strong>Defecto de Empaque o Calidad:</strong> Si el producto llega en malas condiciones debido al traslado.</li>
              <li><strong>Demora Excesiva Injustificada:</strong> Retraso superior a 45 minutos sobre el tiempo informado sin justificación.</li>
            </ul>
          </section>

          <section className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
            <h2 className="text-base font-bold text-white">4. Medios y Plazos de Devolución</h2>
            <p>
              Una vez aprobado el reclamo, los reembolsos por transferencia bancaria (CuentaRUT, Yape, Plin o CBU) se acreditan en un plazo de <strong>1 a 24 horas hábiles</strong>.
            </p>
            <p className="text-xs text-stone-400">
              Para reportar cualquier inconveniente con tu pedido, escribe al WhatsApp oficial del local o a: <span className="text-orange-400 font-mono">pagos@zgamersa.com</span>
            </p>
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
