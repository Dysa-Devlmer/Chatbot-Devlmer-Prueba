'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Loader2 } from 'lucide-react';

export default function AIPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/business');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
        <Bot className="w-6 h-6 animate-pulse" />
      </div>
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-stone-300">
        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
        <span>Redirigiendo a Políticas & Personalidad de Atención de IA...</span>
      </div>
    </div>
  );
}
