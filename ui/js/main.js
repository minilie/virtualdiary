// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initializing application.');

    // 确保所有依赖模块已加载
    if (window.UIRenderer && window.Modal && window.Toast && window.EventHandlers && window.mockData) {
        // 1. 初始化 UI 渲染器，显示用户资料
        UIRenderer.renderUserProfile(mockData.user);
        console.log('User profile rendered.');

        // 2. 初始化事件处理器
        EventHandlers.init();
        console.log('Event handlers initialized.');

        // 3. 处理前端路由：根据 URL hash 显示对应 section
        const initialHash = window.location.hash.substring(1);
        const initialSection = initialHash || 'diary'; // 默认显示日记

        UIRenderer.showSection(`${initialSection}-section`);
        UIRenderer.setActiveNavItem(initialSection); // 激活导航栏对应项

        // 4. 首次加载数据并渲染对应 section
        EventHandlers.loadAndRenderSection(initialSection);
        console.log(`Initial section set and data loaded for: ${initialSection}`);

        // 5. 设置日期选择器默认值
        const today = new Date().toISOString().split('T')[0]; // 获取 YYYY-MM-DD 格式
        const diaryDatePicker = document.getElementById('diary-date-picker');
        if (diaryDatePicker) {
            diaryDatePicker.value = today;
            console.log(`Date picker set to: ${today}`);
        } else {
            console.warn('diary-date-picker element not found.');
        }

        // 6. 监听浏览器前进/后退事件 (popstate)
        window.addEventListener('popstate', (event) => {
            const sectionFromState = event.state ? event.state.section : (window.location.hash.substring(1) || 'diary');
            console.log(`[main.js] Popstate event: Navigating to ${sectionFromState}`);
            UIRenderer.showSection(`${sectionFromState}-section`);
            UIRenderer.setActiveNavItem(sectionFromState);
            EventHandlers.loadAndRenderSection(sectionFromState);
            UIRenderer.hideRightPanel(); // popstate 时关闭右侧面板
        });

    } else {
        console.error('One or more required JavaScript modules (UIRenderer, Modal, Toast, EventHandlers, mockData) not found. Check js/*.js loading and export.');
    }
});