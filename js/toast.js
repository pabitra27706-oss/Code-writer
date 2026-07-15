/* =============================================
   TOAST.JS — Beautiful notification system
   Replaces all alert() / confirm() calls
   ============================================= */

const Toast = (function() {
  
  let container = null;
  
  const ICONS = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    loading: '⏳',
    copy: '📋',
    save: '💾',
    rec: '🎬'
  };
  
  function init() {
    if (container) return;
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  
  /**
   * Show a toast notification
   * @param {string} message
   * @param {string} type — 'info' | 'success' | 'warning' | 'error'
   * @param {number} duration — ms, 0 = persistent
   * @param {string} title — optional bold title
   */
  function show(message, type = 'info', duration = 3500, title = '') {
    if (!container) init();
    
    const icon = ICONS[type] || ICONS.info;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">
                ${title ? `<strong>${title}</strong>` : ''}
                ${message}
            </span>
            <button class="toast-close" aria-label="Close">×</button>
            ${duration > 0 ? `<div class="toast-progress" style="animation-duration:${duration}ms"></div>` : ''}
        `;
    
    container.appendChild(toast);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      dismiss(toast);
    });
    
    // Auto dismiss
    let timer = null;
    if (duration > 0) {
      timer = setTimeout(() => dismiss(toast), duration);
    }
    
    // Pause on hover
    toast.addEventListener('mouseenter', () => {
      if (timer) clearTimeout(timer);
      const bar = toast.querySelector('.toast-progress');
      if (bar) bar.style.animationPlayState = 'paused';
    });
    
    toast.addEventListener('mouseleave', () => {
      if (duration > 0) {
        timer = setTimeout(() => dismiss(toast), 1000);
        const bar = toast.querySelector('.toast-progress');
        if (bar) bar.style.animationPlayState = 'running';
      }
    });
    
    return toast;
  }
  
  function dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast-out');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 280);
  }
  
  function dismissAll() {
    if (!container) return;
    const toasts = container.querySelectorAll('.toast');
    toasts.forEach(dismiss);
  }
  
  // Convenience methods
  function success(msg, title, duration) {
    return show(msg, 'success', duration || 3000, title);
  }
  
  function error(msg, title, duration) {
    return show(msg, 'error', duration || 5000, title);
  }
  
  function warning(msg, title, duration) {
    return show(msg, 'warning', duration || 4000, title);
  }
  
  function info(msg, title, duration) {
    return show(msg, 'info', duration || 3500, title);
  }
  
  function loading(msg) {
    return show(msg, 'loading', 0);
  }
  
  /**
   * Show a confirm dialog replacement
   * Returns a Promise<boolean>
   */
  function confirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
                position: fixed; inset: 0; z-index: 10000;
                background: rgba(0,0,0,0.6);
                backdrop-filter: blur(4px);
                display: flex; align-items: center;
                justify-content: center;
            `;
      
      overlay.innerHTML = `
                <div style="
                    background: #161b22;
                    border: 1px solid #30363d;
                    border-radius: 12px;
                    padding: 24px 28px;
                    max-width: 380px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    font-family: Inter, sans-serif;
                ">
                    <h3 style="
                        margin: 0 0 10px;
                        font-size: 15px;
                        color: #e6edf3;
                        font-weight: 600;
                    ">${title}</h3>
                    <p style="
                        margin: 0 0 20px;
                        font-size: 13px;
                        color: #8b949e;
                        line-height: 1.5;
                    ">${message}</p>
                    <div style="display:flex; gap:10px; justify-content:flex-end;">
                        <button id="confirmNo" style="
                            padding: 8px 18px;
                            background: #21262d;
                            border: 1px solid #30363d;
                            border-radius: 8px;
                            color: #8b949e;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            font-family: inherit;
                        ">Cancel</button>
                        <button id="confirmYes" style="
                            padding: 8px 18px;
                            background: #f85149;
                            border: 1px solid #f85149;
                            border-radius: 8px;
                            color: #fff;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            font-family: inherit;
                        ">Continue</button>
                    </div>
                </div>
            `;
      
      document.body.appendChild(overlay);
      
      overlay.querySelector('#confirmYes').addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(true);
      });
      
      overlay.querySelector('#confirmNo').addEventListener('click', () => {
        document.body.removeChild(overlay);
        resolve(false);
      });
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
          resolve(false);
        }
      });
    });
  }
  
  return {
    init,
    show,
    dismiss,
    dismissAll,
    success,
    error,
    warning,
    info,
    loading,
    confirm
  };
  
})();