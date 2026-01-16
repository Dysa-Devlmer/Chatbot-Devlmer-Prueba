"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAccessButton() {
  const router = useRouter();
  const [showTooltip, setShowTooltip] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Combinación de teclas: Ctrl+K o Cmd+K
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        router.push('/login');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [router]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Crear efecto ripple
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };

    setRipples([...ripples, newRipple]);

    // Remover ripple después de la animación
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    // Navegar al login
    setTimeout(() => {
      router.push('/login');
    }, 300);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Botón flotante en la esquina inferior derecha */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: showTooltip ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          zIndex: 1000,
          overflow: 'hidden',
        }}
      >
        {/* Ripples */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: '0',
              height: '0',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.6)',
              transform: 'translate(-50%, -50%)',
              animation: 'ripple 0.6s ease-out',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Icono de llave */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}
        >
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
        </svg>

        {/* Indicador de pulsación */}
        <div
          style={{
            position: 'absolute',
            inset: '-8px',
            borderRadius: '50%',
            border: '2px solid rgba(102, 126, 234, 0.3)',
            animation: showTooltip ? 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none',
          }}
        />
      </button>

      {/* Tooltip */}
      <div
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          opacity: showTooltip ? 1 : 0,
          transform: showTooltip ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
          zIndex: 999,
          whiteSpace: 'nowrap',
          border: '1px solid rgba(102, 126, 234, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Admin Panel</span>
          <kbd
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            Ctrl+K
          </kbd>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            right: '25px',
            width: '12px',
            height: '12px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            transform: 'rotate(45deg)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            borderTop: 'none',
            borderLeft: 'none',
          }}
        />
      </div>

      {/* Keyframes CSS */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.4);
          }
          50% {
            box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4), 0 0 0 8px rgba(102, 126, 234, 0);
          }
        }

        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        @keyframes ripple {
          to {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }

        button:hover {
          box-shadow: 0 12px 24px rgba(102, 126, 234, 0.5), 0 0 0 0 rgba(102, 126, 234, 0.4) !important;
        }

        button:active {
          transform: scale(0.95) !important;
        }
      `}</style>
    </>
  );
}
