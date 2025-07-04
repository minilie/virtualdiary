// js/uiRenderer.js

// 将 UIRenderer 模块挂载到 window 对象
window.UIRenderer = ((Toast) => { // 传入 Toast 模块
    const elements = {
        appContainer: document.querySelector('.app-container'),
        sidebar: document.querySelector('.sidebar'),
        mainNav: document.querySelector('.main-nav ul'),
        userName: document.getElementById('user-name'),
        userEmail: document.getElementById('user-email'),
        userAvatar: document.getElementById('user-avatar'), // 用于懒加载
        currentSectionTitle: document.getElementById('current-section-title'),

        // 各主内容区 section
        diarySection: document.getElementById('diary-section'),
        feedbackSection: document.getElementById('feedback-section'),
        memorySection: document.getElementById('memory-section'),
        decisionSection: document.getElementById('decision-section'),
        friendsSection: document.getElementById('friends-section'),
        analyticsSection: document.getElementById('analytics-section'),
        settingsSection: document.getElementById('settings-section'),
        apiDocsSection: document.getElementById('api-docs-section'),

        // 各内容区容器
        diaryListContainer: document.getElementById('diary-list-container'),
        feedbackListContainer: document.getElementById('feedback-list-container'),
        memoryContainer: document.getElementById('memory-container'),
        decisionContainer: document.getElementById('decision-container'),
        friendsContainer: document.getElementById('friends-container'),
        analyticsContainer: document.getElementById('analytics-container'),
        settingsContainer: document.getElementById('settings-container'),
        apiDocsContainer: document.getElementById('api-docs-container'),

        // 各空状态
        diaryEmptyState: document.getElementById('diary-empty-state'),
        feedbackEmptyState: document.getElementById('feedback-empty-state'),
        memoryEmptyState: document.getElementById('memory-empty-state'),
        decisionEmptyState: document.getElementById('decision-empty-state'),
        friendsEmptyState: document.getElementById('friends-empty-state'),
        analyticsEmptyState: document.getElementById('analytics-empty-state'),
        settingsEmptyState: document.getElementById('settings-empty-state'),
        apiDocsEmptyState: document.getElementById('api-docs-empty-state'),

        // 右侧面板
        rightPanel: document.getElementById('right-panel'),
        panelTitle: document.getElementById('panel-title'),
        panelContent: document.getElementById('panel-content'),
        panelFooter: document.getElementById('panel-footer'),

        // 日记编辑模态框内的富文本编辑器模拟
        diaryForm: document.getElementById('diary-form'),
        diaryTitleInput: document.getElementById('diary-title'), // 新增：直接引用
        diaryDateInput: document.getElementById('diary-date'), // 新增：直接引用
        diaryContentEditor: document.getElementById('diary-content-editor'),
        voiceInputBtn: document.getElementById('voice-input-btn'),
        voiceStatus: document.getElementById('voice-status'),

        // 日记表单的错误信息元素 (新增)
        diaryTitleError: document.getElementById('diary-title-error'),
        diaryDateError: document.getElementById('diary-date-error'),
        diaryContentError: document.getElementById('diary-content-error'),
        diaryTitleGroup: document.getElementById('diary-title-group'),
        diaryDateGroup: document.getElementById('diary-date-group'),
        diaryContentGroup: document.getElementById('diary-content-group'),

        // 设置表单元素
        futureSelfTrait: document.getElementById('future-self-trait'),
        feedbackStyle: document.getElementById('feedback-style'),
        interactionFrequency: document.getElementById('interaction-frequency'),
        interactionFrequencyValue: document.getElementById('interaction-frequency-value'),
        privacyLevel: document.getElementById('privacy-level'),
        personalizationSettingsForm: document.getElementById('personalization-settings-form'),

        // Chart.js 容器 (新增)
        emotionChartCanvas: document.getElementById('emotionChart'),
        themeChartCanvas: document.getElementById('themeChart')
    };

    // 存储 Chart.js 实例，以便在重新渲染时销毁旧实例
    let emotionChartInstance = null;
    let themeChartInstance = null;

    /**
     * 显示或隐藏骨架屏和相关内容区域
     * @param {HTMLElement} container 骨架屏的父容器 (e.g., diaryListContainer, memoryContainer)
     * @param {string} skeletonClass 骨架屏的CSS类名 (e.g., 'diary-skeleton', 'api-docs-skeleton')
     * @param {boolean} show 是否显示骨架屏 (true) 或隐藏骨架屏 (false)
     */
    const toggleSkeleton = (container, skeletonClass, show) => {
        console.log(`toggleSkeleton: container=${container ? container.id : 'N/A'}, skeletonClass=${skeletonClass}, show=${show}`);
        if (!container) {
            console.error('toggleSkeleton: Container element is null or undefined.');
            return;
        }

        const skeleton = container.querySelector(`.${skeletonClass}`);
        if (skeleton) {
            skeleton.classList.toggle('hidden', !show);
            console.log(`Skeleton ${skeletonClass} visibility set to ${!show ? 'hidden' : 'visible'}.`);
        } else {
            console.warn(`Skeleton with class ${skeletonClass} not found in container ${container.id}.`);
        }

        // 对于某些模块，其内容区域是骨架屏的兄弟元素，需要手动管理其可见性
        // 日记列表容器会直接替换innerHTML，所以这里主要针对其他模块
        const contentAreasToManage = container.querySelectorAll('.memory-timeline-view, .memory-review-section, .decision-intro, .decision-tracker, .friend-list-area, .analytics-dashboard, .user-settings-form, .api-docs-container > .api-endpoint-card'); // 针对 API Docs 的卡片
        contentAreasToManage.forEach(area => {
            area.classList.toggle('hidden', show);
            console.log(`Content area ${area.className} visibility set to ${show ? 'hidden' : 'visible'} (based on skeleton show status).`);
        });
        
        // 针对 diaryListContainer 和 feedbackListContainer 的内容管理，因为它们通常是直接替换 innerHTML
        // 这里假设它们的内容在加载数据后会自动填充，并隐藏空状态
        if (container.id === 'diary-list-container' || container.id === 'feedback-list-container' || container.id === 'api-docs-container') {
            container.classList.toggle('hidden', show); // 如果显示骨架屏，则隐藏列表容器内容
        }
    };


    /**
     * 显示或隐藏空状态
     * @param {HTMLElement} emptyStateElement 空状态元素
     * @param {boolean} show 是否显示
     */
    const toggleEmptyState = (emptyStateElement, show) => {
        if (emptyStateElement) {
            emptyStateElement.classList.toggle('hidden', !show);
            console.log(`Empty state ${emptyStateElement.id} visibility set to ${!show ? 'hidden' : 'visible'}.`);
        } else {
            console.warn('toggleEmptyState: emptyStateElement is null or undefined.');
        }
    };

    /**
     * 渲染用户资料
     * @param {Object} user - 用户数据
     */
    const renderUserProfile = (user) => {
        if (elements.userName) elements.userName.textContent = user.name;
        if (elements.userEmail) elements.userEmail.textContent = user.email;
        if (elements.userAvatar) {
            // 设置 data-src，由懒加载处理实际加载
            elements.userAvatar.dataset.src = user.avatar;
            // 立即触发懒加载，因为头像通常是首屏可见的
            lazyLoadImages([elements.userAvatar]);
        }
        console.log('User profile elements updated.');
    };

    /**
     * 渲染导航菜单激活状态
     * @param {string} activeSection - 当前激活的 section ID (不带 -section 后缀)
     */
    const setActiveNavItem = (activeSection) => {
        if (!elements.mainNav) {
            console.error('setActiveNavItem: mainNav element not found.');
            return;
        }
        elements.mainNav.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.section === activeSection) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        // 更新主内容区标题
        const titleMap = {
            diary: '日记',
            feedback: '未来的你',
            memory: '记忆连接',
            decision: '决策辅助',
            friends: '好友',
            analytics: '数据分析',
            settings: '设置',
            'api-docs': 'API 文档'
        };
        if (elements.currentSectionTitle) {
            elements.currentSectionTitle.textContent = titleMap[activeSection] || '未知';
            console.log(`Current section title set to: ${titleMap[activeSection]}`);
        }
    };

    /**
     * 渲染日记列表
     * @param {Array} entries - 日记条目数组
     */
    const renderDiaryEntries = (entries) => {
        console.log('renderDiaryEntries called with', entries.length, 'entries.');
        if (!elements.diaryListContainer || !elements.diaryEmptyState) {
            console.error('renderDiaryEntries: Required elements not found.');
            Toast.show('错误：渲染日记列表失败，缺少DOM元素。', 'error');
            return;
        }
        
        // 隐藏骨架屏
        toggleSkeleton(elements.diaryListContainer, 'diary-skeleton', false); 
        elements.diaryListContainer.classList.remove('hidden'); // 确保容器可见

        if (entries.length === 0) {
            elements.diaryListContainer.innerHTML = ''; // 清空内容
            toggleEmptyState(elements.diaryEmptyState, true); // 显示空状态
            console.log('No diary entries, showing empty state.');
            return;
        }

        toggleEmptyState(elements.diaryEmptyState, false); // 隐藏空状态
        
        // 使用 DocumentFragment 优化 DOM 操作，并为每个卡片添加动画类
        const fragment = document.createDocumentFragment();
        entries.forEach((entry, index) => {
            const card = document.createElement('div');
            card.className = 'diary-entry-card fade-in-up'; // 添加动画类
            card.dataset.id = entry.id;
            card.style.animationDelay = `${index * 0.05}s`; // 错落动画

            card.innerHTML = `
                <div class="diary-card-header">
                    <h3 class="diary-card-title">${entry.title}</h3>
                    <span class="diary-card-date">${entry.date}</span>
                </div>
                <p class="diary-card-content">${entry.content}</p>
                <div class="diary-card-tags">
                    ${entry.tags.map(tag => `<span class="diary-tag">${tag}</span>`).join('')}
                    ${entry.emotion ? `<span class="diary-tag" style="background-color: #A78BFA; color: white;">情感: ${entry.emotion}</span>` : ''}
                    ${entry.theme ? `<span class="diary-tag" style="background-color: #EC4899; color: white;">主题: ${entry.theme}</span>` : ''}
                </div>
            `;
            fragment.appendChild(card);
        });
        
        elements.diaryListContainer.innerHTML = ''; // 清空旧内容
        elements.diaryListContainer.appendChild(fragment); // 一次性添加到 DOM
        console.log('Diary entries HTML rendered with animations.');
    };

    /**
     * 渲染反馈列表
     * @param {Array} feedbackItems - 反馈条目数组
     */
    const renderFeedback = (feedbackItems) => {
        console.log('renderFeedback called with', feedbackItems.length, 'items.');
        if (!elements.feedbackListContainer || !elements.feedbackEmptyState) {
            console.error('renderFeedback: Required elements not found.');
            Toast.show('错误：渲染反馈列表失败，缺少DOM元素。', 'error');
            return;
        }
        toggleSkeleton(elements.feedbackListContainer, 'feedback-skeleton', false);
        elements.feedbackListContainer.classList.remove('hidden'); // 确保容器可见

        if (feedbackItems.length === 0) {
            elements.feedbackListContainer.innerHTML = '';
            toggleEmptyState(elements.feedbackEmptyState, true);
            return;
        }

        toggleEmptyState(elements.feedbackEmptyState, false);
        elements.feedbackListContainer.innerHTML = feedbackItems.map(item => `
            <div class="feedback-card fade-in-up" data-id="${item.id}">
                <div class="feedback-card-header">
                    <h3 class="feedback-card-type ${item.feedbackType || item.type.toLowerCase().replace(/\s/g, '-')}">${item.type === '未来的你' ? '来自未来的你' : item.type}</h3>
                    <span class="feedback-card-date">${item.date}</span>
                </div>
                <p class="feedback-card-content">${item.content}</p>
                ${item.status ? `<span class="feedback-card-status ${item.status}">${item.status === 'pending' ? '待处理' : '已解决'}</span>` : ''}
                ${item.type === '未来的你' ? `
                    <div class="feedback-rating" data-id="${item.id}">
                        <span>评价反馈:</span>
                        ${[1, 2, 3, 4, 5].map(star => `
                            <i class="ri-star-fill star-icon ${item.rating >= star ? 'filled' : ''}" data-value="${star}"></i>
                        `).join('')}
                    </div>
                    <textarea class="feedback-rating-input" data-id="${item.id}" rows="2" placeholder="你想调整我的反馈风格或内容吗？">${item.adjustments || ''}</textarea>
                    <button class="btn btn-primary btn-sm mt-3" data-action="save-feedback-adjustment" data-id="${item.id}">保存调整</button>
                ` : ''}
            </div>
        `).join('');

        // 为反馈评价的星星添加事件监听
        // elements.feedbackListContainer.querySelectorAll('.feedback-rating .star-icon').forEach(star => {
        //     star.addEventListener('click', window.EventHandlers.handleFeedbackRating); // 使用 window.EventHandlers 访问
        // });
        // elements.feedbackListContainer.querySelectorAll('.feedback-rating-input').forEach(input => {
        //     input.addEventListener('change', window.EventHandlers.handleFeedbackAdjustmentChange); // 使用 window.EventHandlers 访问
        // });
        console.log('Feedback entries HTML rendered, event listeners re-attached.');
    };

    /**
     * 渲染记忆连接模块
     * @param {Array} memoryItems - 记忆条目数组
     * @param {Array} diaryEntries - 日记条目数组 (用于关联内容)
     */
    const renderMemoryTimeline = (memoryItems, diaryEntries) => {
        console.log('renderMemoryTimeline called.');
        if (!elements.memoryContainer || !elements.memoryEmptyState) {
            console.error('renderMemoryTimeline: Required elements not found.');
            Toast.show('错误：渲染记忆时间线失败，缺少DOM元素。', 'error');
            return;
        }
        toggleSkeleton(elements.memoryContainer, 'api-docs-skeleton', false); // 隐藏骨架屏
        
        const timelineView = elements.memoryContainer.querySelector('.memory-timeline-view');
        const reviewSection = elements.memoryContainer.querySelector('.memory-review-section');
        if (timelineView) timelineView.classList.remove('hidden');
        if (reviewSection) reviewSection.classList.remove('hidden');

        if (memoryItems.length === 0) {
            if (timelineView) timelineView.innerHTML = '';
            if (reviewSection) reviewSection.innerHTML = '';
            toggleEmptyState(elements.memoryEmptyState, true);
            return;
        }

        toggleEmptyState(elements.memoryEmptyState, false);
        const timelineHtml = memoryItems.map(item => {
            const relatedDiary = item.relatedDiaryId ? diaryEntries.find(d => d.id === item.relatedDiaryId) : null;
            return `
                <div class="timeline-item fade-in-up" data-id="${item.id}" data-diary-id="${item.relatedDiaryId || ''}">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <span class="timeline-date">${item.date}</span>
                        <p class="timeline-entry-title">${item.title}</p>
                        ${relatedDiary ? `<p class="timeline-summary">${relatedDiary.content.substring(0, 100)}...</p>` : ''}
                        <div class="diary-card-tags">
                            ${item.tags.map(tag => `<span class="timeline-tag">${tag}</span>`).join('')}
                        </div>
                        ${relatedDiary ? `<button class="btn btn-outline btn-sm mt-3" data-action="view-related-diary" data-id="${item.relatedDiaryId}">查看相关日记</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // 重新渲染整个模块内容，包含标题和结构
        elements.memoryContainer.innerHTML = `
            <div class="memory-timeline-view">
                <h3 class="memory-title">你的记忆时间线</h3>
                <div class="timeline-wrapper" id="timeline-wrapper">
                    ${timelineHtml}
                </div>
            </div>
            <div class="memory-review-section">
                <h3 class="memory-title">今日记忆回顾</h3>
                <div class="memory-review-card">
                    <p>你最近似乎对“时间”这个概念很感兴趣。回想起你在2077年的日记，你写道：“时间在这里仿佛被加速，但又被科技凝固。”</p>
                    <button class="btn btn-outline btn-sm" data-action="view-related-diary" data-id="d1">查看相关日记</button>
                </div>
            </div>
        `;
        // 确保内容区域在渲染后可见
        const newTimelineView = elements.memoryContainer.querySelector('.memory-timeline-view');
        const newReviewSection = elements.memoryContainer.querySelector('.memory-review-section');
        if (newTimelineView) newTimelineView.classList.remove('hidden');
        if (newReviewSection) newReviewSection.classList.remove('hidden');
        console.log('Memory timeline HTML rendered.');
    };

    /**
     * 渲染决策辅助模块
     * @param {Array} decisions - 决策数据数组
     */
    const renderDecisionAid = (decisions) => {
        console.log('renderDecisionAid called.');
        if (!elements.decisionContainer || !elements.decisionEmptyState) {
            console.error('renderDecisionAid: Required elements not found.');
            Toast.show('错误：渲染决策辅助失败，缺少DOM元素。', 'error');
            return;
        }
        toggleSkeleton(elements.decisionContainer, 'api-docs-skeleton', false);
        
        const decisionIntro = elements.decisionContainer.querySelector('.decision-intro');
        const decisionTracker = elements.decisionContainer.querySelector('.decision-tracker');
        if (decisionIntro) decisionIntro.classList.remove('hidden');
        if (decisionTracker) decisionTracker.classList.remove('hidden');

        if (decisions.length === 0) {
            if (decisionIntro) decisionIntro.innerHTML = '';
            if (decisionTracker) decisionTracker.innerHTML = '';
            toggleEmptyState(elements.decisionEmptyState, true);
            return;
        }

        toggleEmptyState(elements.decisionEmptyState, false);
        const decisionListHtml = decisions.map(dec => `
            <div class="decision-card fade-in-up" data-id="${dec.id}">
                <h4>${dec.problem}</h4>
                <p class="decision-outcome ${dec.outcome}">结果：${dec.outcomeDescription}</p>
                <span class="decision-date">${dec.date}</span>
                <button class="btn btn-outline btn-sm mt-3" data-action="view-decision-detail" data-id="${dec.id}">查看详情</button>
            </div>
        `).join('');

        elements.decisionContainer.innerHTML = `
            <div class="decision-intro">
                <h3 class="decision-title">决策辅助系统</h3>
                <p class="decision-description">在这里，“未来的你”将帮助你分析当前困境，提供基于历史经验和多角度的建议。</p>
                <button class="btn btn-primary" id="start-decision-aid-btn"><i class="ri-question-answer-line"></i> 描述你的困境</button>
            </div>
            <div class="decision-tracker">
                <h3 class="decision-title">你的决策记录</h3>
                <div class="decision-list" id="decision-list">
                    ${decisionListHtml}
                </div>
            </div>
        `;
        // 确保内容区域在渲染后可见
        const newDecisionIntro = elements.decisionContainer.querySelector('.decision-intro');
        const newDecisionTracker = elements.decisionContainer.querySelector('.decision-tracker');
        if (newDecisionIntro) newDecisionIntro.classList.remove('hidden');
        if (newDecisionTracker) newDecisionTracker.classList.remove('hidden');
        console.log('Decision aid HTML rendered.');
    };

    /**
     * 渲染好友系统模块
     * @param {Array} friends - 好友数据数组
     */
    const renderFriends = (friends) => {
        console.log('renderFriends called.');
        if (!elements.friendsContainer || !elements.friendsEmptyState) {
            console.error('renderFriends: Required elements not found.');
            Toast.show('错误：渲染好友列表失败，缺少DOM元素。', 'error');
            return;
        }
        toggleSkeleton(elements.friendsContainer, 'api-docs-skeleton', false);
        
        const friendListArea = elements.friendsContainer.querySelector('.friend-list-area');
        if (friendListArea) friendListArea.classList.remove('hidden');

        if (friends.length === 0) {
            if (friendListArea) friendListArea.innerHTML = '';
            toggleEmptyState(elements.friendsEmptyState, true);
            return;
        }

        toggleEmptyState(elements.friendsEmptyState, false);
        const friendListHtml = friends.map(friend => `
            <div class="friend-card fade-in-up" data-id="${friend.id}">
                <img src="" data-src="${friend.avatar}" alt="${friend.name}头像" class="friend-avatar">
                <div class="friend-info">
                    <span class="friend-name">${friend.name}</span>
                    <span class="friend-status ${friend.status}">${friend.status === 'online' ? '在线' : '离线'}</span>
                </div>
                <button class="btn btn-outline btn-sm" data-action="view-friend-interaction" data-id="${friend.id}">查看互动</button>
            </div>
        `).join('');

        elements.friendsContainer.innerHTML = `
            <div class="friend-list-area">
                <h3 class="friends-title">你的时间旅行伙伴</h3>
                <div class="friend-list" id="friend-list">
                    ${friendListHtml}
                </div>
                <button class="btn btn-primary mt-4"><i class="ri-user-add-line"></i> 添加好友</button>
            </div>
        `;
        // 确保内容区域在渲染后可见
        const newFriendListArea = elements.friendsContainer.querySelector('.friend-list-area');
        if (newFriendListArea) newFriendListArea.classList.remove('hidden');

        // 渲染好友后，触发布局中的图片懒加载
        lazyLoadImages(elements.friendsContainer.querySelectorAll('.friend-avatar'));
        console.log('Friends HTML rendered.');
    };

    /**
     * 渲染数据分析模块
     * @param {Object} analyticsData - 分析数据
     * @param {Array<Object>} diaryEntries - 原始日记数据，用于图表生成
     */
    const renderAnalytics = (analyticsData, diaryEntries) => {
        console.log('renderAnalytics called.');
        if (!elements.analyticsContainer || !elements.analyticsEmptyState || !elements.emotionChartCanvas || !elements.themeChartCanvas) {
            console.error('renderAnalytics: Required elements for analytics not found.');
            Toast.show('错误：渲染数据分析失败，缺少DOM元素。', 'error');
            return;
        }
        toggleSkeleton(elements.analyticsContainer, 'api-docs-skeleton', false);
        
        const analyticsDashboard = elements.analyticsContainer.querySelector('.analytics-dashboard');
        if (analyticsDashboard) analyticsDashboard.classList.remove('hidden');

        if (!analyticsData || diaryEntries.length === 0) {
            if (analyticsDashboard) analyticsDashboard.innerHTML = '';
            toggleEmptyState(elements.analyticsEmptyState, true);
            return;
        }

        toggleEmptyState(elements.analyticsEmptyState, false);

        // 重新设置 innerHTML 后，需要重新获取 canvas 元素，或者确保 canvas 元素是静态存在的
        // 为了 Chart.js 能正确工作，我们不直接替换整个 analyticsContainer 的 innerHTML
        // 而是只更新 Chart.js 的 canvas 部分和文本内容
        elements.analyticsContainer.querySelector('.analytics-dashboard').classList.remove('hidden'); // 确保 dashboard 可见

        // 情绪趋势分析
        const emotionCounts = {};
        diaryEntries.forEach(entry => {
            if (entry.emotion) {
                emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
            }
        });
        const emotionLabels = Object.keys(emotionCounts);
        const emotionData = Object.values(emotionCounts);

        if (emotionChartInstance) {
            emotionChartInstance.destroy(); // 销毁旧实例
        }
        emotionChartInstance = new Chart(elements.emotionChartCanvas, {
            type: 'line',
            data: {
                labels: emotionLabels,
                datasets: [{
                    label: '情绪趋势',
                    data: emotionData,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // 主题分布
        const themeCounts = {};
        diaryEntries.forEach(entry => {
            if (entry.theme) {
                themeCounts[entry.theme] = (themeCounts[entry.theme] || 0) + 1;
            }
        });
        const themeLabels = Object.keys(themeCounts);
        const themeData = Object.values(themeCounts);

        if (themeChartInstance) {
            themeChartInstance.destroy(); // 销毁旧实例
        }
        themeChartInstance = new Chart(elements.themeChartCanvas, {
            type: 'doughnut',
            data: {
                labels: themeLabels,
                datasets: [{
                    label: '主题分布',
                    data: themeData,
                    backgroundColor: [
                        'rgba(99, 102, 241, 0.8)', // primary
                        'rgba(6, 182, 212, 0.8)',  // secondary
                        'rgba(249, 115, 22, 0.8)', // accent
                        'rgba(34, 197, 94, 0.8)',  // success
                        'rgba(239, 68, 68, 0.8)'   // danger
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });

        // 确保文本内容更新
        elements.analyticsContainer.querySelector('.analytics-card h4').textContent = '情绪趋势分析'; // 确保标题存在
        elements.analyticsContainer.querySelector('.analytics-card p').textContent = analyticsData.emotionTrend || '暂无情绪趋势数据。';
        elements.analyticsContainer.querySelectorAll('.analytics-card')[1].querySelector('h4').textContent = '主题分布';
        elements.analyticsContainer.querySelectorAll('.analytics-card')[1].querySelector('p').textContent = analyticsData.themeDistribution || '暂无主题分布数据。';
        elements.analyticsContainer.querySelectorAll('.analytics-card')[2].querySelector('h4').textContent = '生活模式识别';
        elements.analyticsContainer.querySelectorAll('.analytics-card')[2].querySelector('p').textContent = analyticsData.lifePattern || '暂无生活模式识别。';

        console.log('Analytics HTML and Charts rendered.');
    };

    /**
     * 渲染设置模块
     * @param {Object} settings - 用户设置数据
     */
    const renderSettings = (settings) => {
        console.log('renderSettings called.');
        if (!elements.settingsContainer || !elements.settingsEmptyState) {
            console.error('renderSettings: Required elements not found.');
            Toast.show('错误：渲染设置失败，缺少DOM元素。', 'error');
            return;
        }
        toggleSkeleton(elements.settingsContainer, 'api-docs-skeleton', false);
        
        const userSettingsForm = elements.settingsContainer.querySelector('.user-settings-form');
        if (userSettingsForm) userSettingsForm.classList.remove('hidden');

        if (!settings) {
            if (userSettingsForm) userSettingsForm.innerHTML = '';
            toggleEmptyState(elements.settingsEmptyState, true);
            return;
        }

        toggleEmptyState(elements.settingsEmptyState, false);
        // 确保表单元素存在后再设置值
        if (elements.futureSelfTrait) elements.futureSelfTrait.value = settings.futureSelfTrait;
        if (elements.feedbackStyle) elements.feedbackStyle.value = settings.feedbackStyle;
        if (elements.interactionFrequency) {
            elements.interactionFrequency.value = settings.interactionFrequency;
            updateInteractionFrequencyValue(settings.interactionFrequency); // 更新滑动条旁边的文字
        }
        if (elements.privacyLevel) elements.privacyLevel.value = settings.privacyLevel;

        console.log('Settings form rendered.');
    };


    /**
     * 渲染 API 文档
     * @param {Array} apiDocs - API 文档数组
     */
    const renderApiDocs = (apiDocs) => {
        console.log('renderApiDocs called with', apiDocs.length, 'items.');
        if (!elements.apiDocsContainer || !elements.apiDocsEmptyState) {
            console.error('renderApiDocs: Required elements not found.');
            Toast.show('错误：渲染API文档失败，缺少DOM元素。', 'error');
            return;
        }
        toggleSkeleton(elements.apiDocsContainer, 'api-docs-skeleton', false);
        elements.apiDocsContainer.classList.remove('hidden'); // 确保容器可见

        if (apiDocs.length === 0) {
            elements.apiDocsContainer.innerHTML = '';
            toggleEmptyState(elements.apiDocsEmptyState, true);
            return;
        }

        toggleEmptyState(elements.apiDocsEmptyState, false);
        elements.apiDocsContainer.innerHTML = apiDocs.map(doc => `
            <div class="api-endpoint-card fade-in-up" data-id="${doc.id}">
                <div class="api-header">
                    <span class="api-method ${doc.method.toLowerCase()}">${doc.method}</span>
                    <code class="api-path">${doc.path}</code>
                </div>
                <p class="api-description">${doc.description}</p>
                ${doc.parameters && doc.parameters.length > 0 ? `
                    <h4 class="api-section-title">请求参数:</h4>
                    <dl class="api-param-list">
                        ${doc.parameters.map(param => `
                            <dt>${param.name} <span class="type">(${param.type})</span> ${param.required ? '<span class="required">(必填)</span>' : ''}</dt>
                            <dd>${param.description}</dd>
                        `).join('')}
                    </dl>
                ` : ''}
                <h4 class="api-section-title">响应示例:</h4>
                <div class="api-code-block">
                    <pre><code>${doc.response}</code></pre>
                </div>
            </div>
        `).join('');
        console.log('API Docs HTML rendered.');
    };

    /**
     * 更新互动频率滑动条旁边的文字
     * @param {number} value
     */
    const updateInteractionFrequencyValue = (value) => {
        const map = {
            1: '极低',
            2: '低',
            3: '中等',
            4: '高',
            5: '极高'
        };
        if (elements.interactionFrequencyValue) {
            elements.interactionFrequencyValue.textContent = map[value];
        } else {
            console.warn('updateInteractionFrequencyValue: interactionFrequencyValue element not found.');
        }
    };


    /**
     * 切换主内容区不同 section 的显示
     * @param {string} sectionId - 要显示的 section 的 ID (如 'diary-section')
     */
    const showSection = (sectionId) => {
        console.log(`showSection: Attempting to show ${sectionId}`);
        const sections = [
            elements.diarySection,
            elements.feedbackSection,
            elements.memorySection,
            elements.decisionSection,
            elements.friendsSection,
            elements.analyticsSection,
            elements.settingsSection,
            elements.apiDocsSection
        ];
        sections.forEach(section => {
            if (section) { // 确保 section 元素存在
                if (section.id === sectionId) {
                    section.classList.remove('hidden');
                    console.log(`${section.id} is now visible.`);
                } else {
                    section.classList.add('hidden');
                    console.log(`${section.id} is now hidden.`);
                }
            } else {
                console.warn(`Section element for ${sectionId} not found.`);
            }
        });
        setActiveNavItem(sectionId.replace('-section', '')); // 更新导航激活状态
    };

    /**
     * 显示右侧详情面板
     * @param {string} title - 面板标题
     * @param {string} contentHTML - 面板内容 HTML
     * @param {string} footerHTML - 面板底部按钮 HTML
     */
    const showRightPanel = (title, contentHTML, footerHTML = '') => {
        console.log(`showRightPanel: title=${title}`);
        if (elements.rightPanel) {
            elements.rightPanel.classList.remove('hidden');
            elements.rightPanel.classList.add('active'); // For mobile responsive
        }
        if (elements.panelTitle) elements.panelTitle.textContent = title;
        if (elements.panelContent) {
            elements.panelContent.innerHTML = contentHTML;
            // 右侧面板内容加载后，隐藏其内部的骨架屏
            toggleSkeleton(elements.panelContent, 'panel-skeleton', false);
        }
        if (elements.panelFooter) elements.panelFooter.innerHTML = footerHTML;
    };

    /**
     * 隐藏右侧详情面板
     */
    const hideRightPanel = () => {
        console.log('hideRightPanel called.');
        if (elements.rightPanel) {
            elements.rightPanel.classList.add('hidden');
            elements.rightPanel.classList.remove('active'); // For mobile responsive
        }
        // 清空内容，防止下次显示时旧内容闪烁
        if (elements.panelTitle) elements.panelTitle.textContent = '';
        if (elements.panelContent) elements.panelContent.innerHTML = '';
        if (elements.panelFooter) elements.panelFooter.innerHTML = '';
    };

    /**
     * 渲染日记详情表单 (用于编辑或新建) - 模态框中内容
     * 这个函数现在直接操作模态框内容中的DOM元素，而不是返回HTML字符串，因为表单结构在 index.html 中是静态的。
     * @param {Object} entry - 日记条目数据 (可选，用于编辑)
     */
    const renderDiaryForm = (entry = {}) => {
        console.log('renderDiaryForm called with entry:', entry);
        const form = elements.diaryForm; // 使用直接引用
        if (!form) {
            console.error('Diary form element not found.');
            return;
        }

        // 清除之前的错误信息和样式
        clearFormErrors();

        if (elements.diaryTitleInput) elements.diaryTitleInput.value = entry.title || '';
        if (elements.diaryDateInput) elements.diaryDateInput.value = entry.date || new Date().toISOString().split('T')[0];
        if (elements.diaryContentEditor) elements.diaryContentEditor.innerHTML = entry.content || ''; // contenteditable 使用 innerHTML
        if (form.querySelector('#diary-template')) form.querySelector('#diary-template').value = entry.template || 'free';
        if (form.querySelector('#diary-emotion')) form.querySelector('#diary-emotion').value = entry.emotion || '';
        if (form.querySelector('#diary-theme')) form.querySelector('#diary-theme').value = entry.theme || '';
        if (form.querySelector('#diary-tags')) form.querySelector('#diary-tags').value = entry.tags ? entry.tags.join(', ') : '';

        // 初始化富文本编辑器按钮
        form.querySelectorAll('.editor-btn').forEach(button => {
            button.onclick = (e) => { // 重新绑定点击事件
                e.preventDefault();
                const command = button.dataset.command;
                if (!elements.diaryContentEditor) return;
                elements.diaryContentEditor.focus(); // 确保焦点在可编辑区域

                try {
                    if (command === 'bold') {
                        document.execCommand('bold', false, null);
                    } else if (command === 'italic') {
                        document.execCommand('italic', false, null);
                    } else if (command === 'link') {
                        const url = prompt('请输入链接地址：');
                        if (url) {
                            document.execCommand('createLink', false, url);
                        }
                    } else if (command === 'image') {
                        const imageUrl = prompt('请输入图片URL：');
                        if (imageUrl) {
                            document.execCommand('insertImage', false, imageUrl);
                        }
                    } else {
                        console.warn(`Unknown editor command: ${command}`);
                    }
                } catch (error) {
                    console.error(`Error executing editor command ${command}:`, error);
                    Toast.show(`编辑器命令执行失败: ${command}`, 'error');
                }
            };
        });

        // 语音输入按钮（Web Speech API 集成）
        if (elements.voiceInputBtn) {
            elements.voiceInputBtn.onclick = null; // 避免重复绑定
            elements.voiceInputBtn.onclick = () => {
                console.log('Voice input button clicked.');
                if (!('webkitSpeechRecognition' in window)) {
                    Toast.show('抱歉，您的浏览器不支持语音输入。请使用 Chrome 浏览器。', 'warning');
                    return;
                }

                const recognition = new webkitSpeechRecognition();
                recognition.continuous = false; // 只进行一次识别
                recognition.interimResults = true; // 显示临时结果
                recognition.lang = 'zh-CN'; // 设置语言为中文普通话

                let finalTranscript = ''; // 最终识别结果
                let interimTranscript = ''; // 临时识别结果

                recognition.onstart = () => {
                    if (elements.voiceStatus) {
                        elements.voiceStatus.textContent = '聆听中...';
                        elements.voiceStatus.classList.remove('hidden');
                    }
                    elements.voiceInputBtn.disabled = true; // 禁用按钮防止重复点击
                    elements.diaryContentEditor.focus(); // 确保焦点
                    // 存储当前编辑器内容，以便在识别结束后追加
                    elements.diaryContentEditor.__originalContent = elements.diaryContentEditor.innerHTML;
                };

                recognition.onresult = (event) => {
                    interimTranscript = ''; // 重置临时结果
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }
                    // 更新编辑器内容：原始内容 + 最终结果 + 临时结果
                    if (elements.diaryContentEditor) {
                        elements.diaryContentEditor.innerHTML = (elements.diaryContentEditor.__originalContent || '') + finalTranscript + interimTranscript;
                    }
                    if (elements.voiceStatus) elements.voiceStatus.textContent = `聆听中: ${interimTranscript}`;
                };

                recognition.onend = () => {
                    if (elements.voiceStatus) {
                        elements.voiceStatus.textContent = '识别完成。';
                        setTimeout(() => elements.voiceStatus.classList.add('hidden'), 500);
                    }
                    elements.voiceInputBtn.disabled = false;
                    // 确保最终内容写入，并清除临时存储
                    if (elements.diaryContentEditor) {
                        elements.diaryContentEditor.innerHTML = (elements.diaryContentEditor.__originalContent || '') + finalTranscript;
                        elements.diaryContentEditor.__originalContent = null;
                    }
                    Toast.show('语音输入完成！', 'success');
                    console.log('Final transcript:', finalTranscript);
                };

                recognition.onerror = (event) => {
                    console.error('Speech recognition error', event.error);
                    if (elements.voiceStatus) {
                        elements.voiceStatus.textContent = `错误: ${event.error}`;
                        setTimeout(() => elements.voiceStatus.classList.add('hidden'), 2000);
                    }
                    elements.voiceInputBtn.disabled = false;
                    elements.diaryContentEditor.__originalContent = null; // 清除临时存储
                    Toast.show(`语音输入失败: ${event.error}. 请检查麦克风或权限。`, 'error');
                };

                recognition.start();
            };
        }
    };

    /**
     * 清除日记表单的错误信息和样式
     */
    const clearFormErrors = () => {
        elements.diaryTitleGroup.classList.remove('error');
        elements.diaryDateGroup.classList.remove('error');
        elements.diaryContentGroup.classList.remove('error');
        elements.diaryTitleError.classList.add('hidden');
        elements.diaryDateError.classList.add('hidden');
        elements.diaryContentError.classList.add('hidden');
    };

    /**
     * 显示日记表单的错误信息
     * @param {string} field - 字段名称 ('title', 'date', 'content')
     * @param {string} message - 错误信息
     */
    const showFormError = (field, message) => {
        const group = elements[`diary${field.charAt(0).toUpperCase() + field.slice(1)}Group`];
        const errorElement = elements[`diary${field.charAt(0).toUpperCase() + field.slice(1)}Error`];
        if (group) group.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    };

    /**
     * 懒加载图片。
     * @param {NodeListOf<HTMLImageElement>} images - 需要懒加载的图片元素集合。
     */
    const lazyLoadImages = (images) => {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) { // 确保有 data-src 属性
                            img.src = img.dataset.src;
                            img.onload = () => img.removeAttribute('data-src'); // 加载完成后移除 data-src
                        }
                        observer.unobserve(img);
                    }
                });
            });
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers that don't support IntersectionObserver
            images.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });
            Toast.show('浏览器不支持图片懒加载，已直接加载所有图片。', 'info');
        }
    };


    return {
        renderUserProfile,
        setActiveNavItem,
        renderDiaryEntries,
        renderFeedback,
        renderApiDocs,
        renderMemoryTimeline,
        renderDecisionAid,
        renderFriends,
        renderAnalytics,
        renderSettings,
        showSection,
        showRightPanel,
        hideRightPanel,
        renderDiaryForm,
        toggleSkeleton,
        toggleEmptyState,
        clearFormErrors, // 暴露给 eventHandlers
        showFormError,   // 暴露给 eventHandlers
        lazyLoadImages,  // 暴露给外部调用
        elements, // 暴露 elements 方便 eventHandlers 访问
        updateInteractionFrequencyValue // 暴露给 eventHandlers 调用
    };
})(window.Toast); // 传入全局的 Toast 模块