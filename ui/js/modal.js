// js/modal.js

// 将 Modal 模块挂载到 window 对象
window.Modal = (() => {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalFooter = document.getElementById('modal-footer');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    /**
     * 打开模态框
     * @param {string} title - 模态框标题
     * @param {string} contentHTML - 模态框内容 HTML (如果模态框内容是固定结构，这里可以传空字符串)
     * @param {Array<Object>} buttons - 底部按钮数组 [{text, class, handler}]
     */
    const openModal = (title, contentHTML, buttons = []) => {
        console.log(`[Modal] Opening modal with title: ${title}`);
        if (modalTitle) modalTitle.textContent = title;
        // 如果 contentHTML 不为空，则更新模态框内容；否则不改变已有的HTML结构（如日记表单）
        if (contentHTML) modalContent.innerHTML = contentHTML;
        if (modalFooter) modalFooter.innerHTML = ''; // 清空旧按钮

        buttons.forEach(btnConfig => {
            const button = document.createElement('button');
            button.className = btnConfig.class || 'btn';
            button.textContent = btnConfig.text;
            if (btnConfig.handler && typeof btnConfig.handler === 'function') {
                button.addEventListener('click', btnConfig.handler);
            }
            if (modalFooter) modalFooter.appendChild(button);
        });

        // 核心修正：在添加 active 类之前，先移除 hidden 类
        if (modalOverlay) {
            modalOverlay.classList.remove('hidden'); // <-- 新增这一行
            modalOverlay.classList.add('active');
        }
        
        // 添加一个短暂的延迟以确保 CSS 动画生效
        setTimeout(() => {
            if (modalContainer) {
                modalContainer.style.opacity = '1';
                modalContainer.style.transform = 'translateY(0)';
            }
        }, 10);
    };

    /**
     * 关闭模态框
     */
    const closeModal = () => {
        console.log('[Modal] Closing modal.');
        if (modalContainer) {
            modalContainer.style.opacity = '0';
            modalContainer.style.transform = 'translateY(20px)';
        }
        setTimeout(() => {
            if (modalOverlay) {
                modalOverlay.classList.remove('active');
                modalOverlay.classList.add('hidden'); // <-- 新增这一行：关闭时重新添加 hidden 类
            }
            // 清空内容，防止下次打开时旧内容闪烁
            if (modalTitle) modalTitle.textContent = '';
            // modalContent.innerHTML = ''; // 注意：这里不应该清空，因为日记表单是固定在HTML中的
            if (modalFooter) modalFooter.innerHTML = '';
        }, 200); // 与 CSS transition-duration 保持一致
    };

    // 初始化关闭按钮的事件监听
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    // 点击背景关闭模态框
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });
    }

    return {
        openModal,
        closeModal
    };
})();
