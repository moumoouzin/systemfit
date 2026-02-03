import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useDebugLogger = () => {
  const location = useLocation();

  useEffect(() => {
      // console.log('🌐 PAGE NAVIGATION:', {
      //   pathname: location.pathname,
      //   search: location.search,
      //   hash: location.hash,
      //   timestamp: new Date().toISOString()
      // });
    }, [location]);

  // Log de cliques em botões
  useEffect(() => {
    const logButtonClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      console.log('🖱️ CLICK EVENT:', {
        target: target.tagName,
        isButton: target.tagName === 'BUTTON' || !!target.closest('button'),
        defaultPrevented: event.defaultPrevented,
        bubbles: event.bubbles,
        cancelable: event.cancelable,
        timestamp: new Date().toISOString(),
        pathname: location.pathname
      });
      
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.closest('button') as HTMLButtonElement;
        console.log('🖱️ BUTTON CLICKED:', {
          text: button?.textContent?.trim(),
          className: button?.className,
          disabled: button?.disabled,
          type: button?.type,
          hasOnClick: button?.onclick !== null,
          timestamp: new Date().toISOString(),
          pathname: location.pathname
        });
      }
    };

    // Adicionar listener em capture phase para detectar se eventos estão sendo interceptados
    const logButtonClickCapture = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        console.log('🎯 BUTTON CLICK CAPTURE:', {
          phase: 'capture',
          defaultPrevented: event.defaultPrevented,
          timestamp: new Date().toISOString()
        });
      }
    };

    document.addEventListener('click', logButtonClick);
    document.addEventListener('click', logButtonClickCapture, true); // capture phase
    
    return () => {
      document.removeEventListener('click', logButtonClick);
      document.removeEventListener('click', logButtonClickCapture, true);
    };
  }, [location.pathname]);

  // Detectar se há algo bloqueando eventos
  useEffect(() => {
    const originalStopPropagation = Event.prototype.stopPropagation;
    Event.prototype.stopPropagation = function() {
      if (this.type === 'click') {
        console.log('🛑 EVENT STOPPED:', {
          type: this.type,
          target: (this.target as HTMLElement)?.tagName,
          currentTarget: (this.currentTarget as HTMLElement)?.tagName,
          timestamp: new Date().toISOString()
        });
      }
      return originalStopPropagation.call(this);
    };

    return () => {
      Event.prototype.stopPropagation = originalStopPropagation;
    };
  }, []);

  // Log de mudanças de visibilidade
  useEffect(() => {
    const logVisibilityChange = () => {
      console.log('👁️ VISIBILITY CHANGE:', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        timestamp: new Date().toISOString(),
        pathname: location.pathname
      });
    };

    const logFocusChange = () => {
      console.log('🎯 FOCUS CHANGE:', {
        hasFocus: document.hasFocus(),
        timestamp: new Date().toISOString(),
        pathname: location.pathname
      });
    };

    document.addEventListener('visibilitychange', logVisibilityChange);
    window.addEventListener('focus', logFocusChange);
    window.addEventListener('blur', logFocusChange);

    return () => {
      document.removeEventListener('visibilitychange', logVisibilityChange);
      window.removeEventListener('focus', logFocusChange);
      window.removeEventListener('blur', logFocusChange);
    };
  }, [location.pathname]);

  // Log de erros JavaScript
  useEffect(() => {
    const logError = (event: ErrorEvent) => {
      console.error('💥 JAVASCRIPT ERROR:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        timestamp: new Date().toISOString(),
        pathname: location.pathname
      });
    };

    const logUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('💥 UNHANDLED PROMISE REJECTION:', {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString(),
        pathname: location.pathname
      });
    };

    window.addEventListener('error', logError);
    window.addEventListener('unhandledrejection', logUnhandledRejection);

    return () => {
      window.removeEventListener('error', logError);
      window.removeEventListener('unhandledrejection', logUnhandledRejection);
    };
  }, [location.pathname]);
};
