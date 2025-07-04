// js/toast.js

/**
 * Toast 通知模块
 * 用于在屏幕右上角显示短暂的通知消息
 */
window.Toast = (() => {
    const toastContainer = document.getElementById('toast-container');
    const defaultDuration = 3000; // 默认显示时间 3 秒

    if (!toastContainer) {
        console.error('Toast container #toast-container not found in DOM. Toast notifications will not work.');
        return { show: () => {} }; // 返回一个空函数避免错误
    }

    /**
     * 显示一个 Toast 通知
     * @param {string} message - 通知内容
     * @param {string} type - 通知类型 ('success', 'error', 'warning', 'info')
     * @param {number} [duration] - 显示时长 (毫秒), 默认为 defaultDuration
     */
    const show = (message, type = 'info', duration = defaultDuration) => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert'); // 提升可访问性
        toast.setAttribute('aria-live', 'polite'); // 屏幕阅读器会朗读此内容
        
        const iconClasses = {
            success: 'ri-checkbox-circle-fill',
            error: 'ri-error-warning-fill',
            warning: 'ri-alert-fill',
            info: 'ri-information-fill'
        };

        toast.innerHTML = `
            <i class="toast-icon ${iconClasses[type] || 'ri-information-fill'} ${type}"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="关闭通知"><i class="ri-close-line"></i></button>
        `;

        toastContainer.appendChild(toast);

        // 强制回流以确保动画生效
        void toast.offsetWidth;

        toast.classList.add('show');

        // 关闭按钮事件
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => hide(toast));

        // 自动隐藏
        const timer = setTimeout(() => {
            hide(toast);
        }, duration);

        // 鼠标移入时暂停计时，移出时恢复
        toast.addEventListener('mouseenter', () => clearTimeout(timer));
        toast.addEventListener('mouseleave', () => {
            setTimeout(() => { // 短暂延迟后恢复，防止鼠标快速进出导致问题
                hide(toast);
            }, duration / 2); // 恢复时只给一半时间，防止长时间停留后立即消失
        });

        console.log(`[Toast] Showing: ${type} - ${message}`);
    };

    /**
     * 隐藏一个 Toast 通知
     * @param {HTMLElement} toastElement - 要隐藏的 Toast DOM 元素
     */
    const hide = (toastElement) => {
        if (!toastElement) return;
        toastElement.classList.remove('show');
        toastElement.classList.add('hide'); // 添加 hide 类触发动画

        // 动画结束后移除元素
        toastElement.addEventListener('transitionend', () => {
            if (toastElement.parentNode) {
                toastElement.parentNode.removeChild(toastElement);
            }
        }, { once: true }); // 确保事件只触发一次
    };

    return {
        show,
    };
})();