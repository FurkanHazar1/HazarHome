"use client";
import React, { useState, useEffect } from "react";

export default function WhatsAppButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [animationType, setAnimationType] = useState('pulse');
  
  // İşletme WhatsApp numarası (ülke kodu ile birlikte, + işareti olmadan)
  const phoneNumber = "905335191329"; // +90 533 519 13 29
  const message = "Merhaba! Ürünleriniz hakkında bilgi almak istiyorum.";
  
  // Sayfa yüklendiğinde animasyonla görünür yap
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    
    // Her 8 saniyede animasyon tipini değiştir
    const animationInterval = setInterval(() => {
      const animations = ['pulse', 'bounce', 'shake', 'wobble', 'heartbeat', 'swing'];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      setAnimationType(randomAnimation);
    }, 8000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(animationInterval);
    };
  }, []);
  
  const handleWhatsAppClick = () => {
    // WhatsApp URL'si oluştur
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Yeni sekmede aç
    window.open(whatsappUrl, '_blank');
  };

  if (!isVisible) return null;

  return (
    <div
      className="whatsapp-button"
      onClick={handleWhatsAppClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '65px',
        height: '65px',
        backgroundColor: '#25D366',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)',
        zIndex: 9999,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'scale(1.2) rotate(10deg)' : 'scale(1)',
        animation: `${animationType} 2.5s infinite, slideInUp 0.6s ease-out`,
        filter: isHovered ? 'brightness(1.1) saturate(1.2)' : 'brightness(1)',
      }}
    >
      {/* Dış halka efekti */}
      <div
        style={{
          position: 'absolute',
          width: '90px',
          height: '90px',
          border: '2px solid rgba(37, 211, 102, 0.4)',
          borderRadius: '50%',
          animation: 'ripple 3s infinite',
          top: '-12.5px',
          left: '-12.5px',
        }}
      />
      
      {/* İç halka efekti */}
      <div
        style={{
          position: 'absolute',
          width: '75px',
          height: '75px',
          border: '1px solid rgba(37, 211, 102, 0.6)',
          borderRadius: '50%',
          animation: 'ripple 3s infinite 1s',
          top: '-5px',
          left: '-5px',
        }}
      />

      {/* WhatsApp İkonu */}
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="white"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          animation: isHovered ? 'iconDance 0.8s ease-in-out' : 'iconFloat 3s ease-in-out infinite',
          transformOrigin: 'center'
        }}
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.525 3.687"/>
      </svg>
      
      {/* Hover durumunda gösterilecek tooltip */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '0',
            backgroundColor: '#333',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '12px',
            fontSize: '13px',
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            animation: 'tooltipBounceIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            zIndex: 10000,
            fontWeight: '500',
          }}
        >
          💬 WhatsApp ile iletişime geç!
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: '20px',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #333'
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(37, 211, 102, 0.7);
          }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-15px);
          }
          60% {
            transform: translateY(-8px);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        @keyframes wobble {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(-8deg); }
          30% { transform: rotate(6deg); }
          45% { transform: rotate(-4deg); }
          60% { transform: rotate(3deg); }
          75% { transform: rotate(-2deg); }
          100% { transform: rotate(0deg); }
        }
        
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.15); }
          28% { transform: scale(1); }
          42% { transform: scale(1.15); }
          70% { transform: scale(1); }
        }
        
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
        
        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(100px) scale(0.3);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes tooltipBounceIn {
          from {
            opacity: 0;
            transform: translateY(15px) scale(0.3);
          }
          50% {
            transform: translateY(-5px) scale(1.05);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes iconDance {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(0.9) rotate(-10deg); }
          50% { transform: scale(1.1) rotate(10deg); }
          75% { transform: scale(0.95) rotate(-5deg); }
        }
        
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(2deg); }
        }
        
        .whatsapp-button:hover {
          animation-play-state: running;
        }
        
        .whatsapp-button:active {
          transform: scale(0.9) !important;
          transition: transform 0.1s ease;
        }
        
        .whatsapp-button:before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #25D366, #128C7E, #25D366);
          border-radius: 50%;
          z-index: -1;
          opacity: 0;
          animation: borderGlow 4s ease-in-out infinite;
        }
        
        @keyframes borderGlow {
          0%, 100% { opacity: 0; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
