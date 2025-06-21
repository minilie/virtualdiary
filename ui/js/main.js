// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initializing application.');
    // 1. 初始化 UI 渲染器，显示用户资料和默认视图 (日记)
    // 确保 UIRenderer 和 mockData 已经通过 window.UIRenderer 和 window.mockData 暴露
    if (window.UIRenderer && window.mockData) {
        UIRenderer.renderUserProfile(mockData.user);
        console.log('User profile rendered.');

        UIRenderer.showSection('diary-section'); // 默认显示日记
        console.log('Default section set to diary-section.');

        // 2. 模拟数据加载并渲染日记
        // 确保在渲染日记前显示骨架屏
        UIRenderer.toggleSkeleton(UIRenderer.elements.diaryListContainer, 'diary-skeleton', true);
        console.log('Diary skeleton displayed.');

        setTimeout(() => {
            console.log('Simulating data load for diary entries...');
            UIRenderer.renderDiaryEntries(mockData.diaryEntries);
            console.log('Diary entries rendered.');
        }, 1000); // 模拟网络请求延迟

        // 3. 初始化事件处理器
        // 确保 EventHandlers 已经通过 window.EventHandlers 暴露
        if (window.EventHandlers) {
            EventHandlers.init();
            console.log('Event handlers initialized.');
        } else {
            console.error('EventHandlers module not found. Check js/eventHandlers.js loading and export.');
        }


        // 可选：设置日期选择器默认值
        const today = new Date().toISOString().split('T')[0]; // 获取 YYYY-MM-DD 格式
        const diaryDatePicker = document.getElementById('diary-date-picker');
        if (diaryDatePicker) { // 确保元素存在
            diaryDatePicker.value = today;
            console.log(`Date picker set to: ${today}`);
        } else {
            console.warn('diary-date-picker element not found.');
        }
    } else {
        console.error('UIRenderer or mockData modules not found. Check js/uiRenderer.js, js/data.js loading and export.');
    }
});
