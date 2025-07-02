// js/uiRenderer.js

// 将 UIRenderer 模块挂载到 window 对象
window.UIRenderer = (() => {
    const elements = {
        appContainer: document.querySelector('.app-container'),
        sidebar: document.querySelector('.sidebar'),
        mainNav: document.querySelector('.main-nav ul'),
        userName: document.getElementById('user-name'),
        userEmail: document.getElementById('user-email'),
        userAvatar: document.getElementById('user-avatar'),
        currentSectionTitle: document.getElementById('current-section-title'),

        // 各主内容区 section
        diarySection: document.getElementById('diary-section'),
        feedbackSection: document.getElementById('feedback-section'),
        memorySection: document.getElementById('memory-section'), // 新增
        decisionSection: document.getElementById('decision-section'), // 新增
        friendsSection: document.getElementById('friends-section'), // 新增
        analyticsSection: document.getElementById('analytics-section'), // 新增
        settingsSection: document.getElementById('settings-section'), // 新增
        apiDocsSection: document.getElementById('api-docs-section'),

        // 各内容区容器
        diaryListContainer: document.getElementById('diary-list-container'),
        feedbackListContainer: document.getElementById('feedback-list-container'),
        memoryContainer: document.getElementById('memory-container'), // 新增
        decisionContainer: document.getElementById('decision-container'), // 新增
        friendsContainer: document.getElementById('friends-container'), // 新增
        analyticsContainer: document.getElementById('analytics-container'), // 新增
        settingsContainer: document.getElementById('settings-container'), // 新增
        apiDocsContainer: document.getElementById('api-docs-container'),

        // 各空状态
        diaryEmptyState: document.getElementById('diary-empty-state'),
        feedbackEmptyState: document.getElementById('feedback-empty-state'),
        memoryEmptyState: document.getElementById('memory-empty-state'), // 新增
        decisionEmptyState: document.getElementById('decision-empty-state'), // 新增
        friendsEmptyState: document.getElementById('friends-empty-state'), // 新增
        analyticsEmptyState: document.getElementById('analytics-empty-state'), // 新增
        settingsEmptyState: document.getElementById('settings-empty-state'), // 新增
        apiDocsEmptyState: document.getElementById('api-docs-empty-state'),

        // 右侧面板
        rightPanel: document.getElementById('right-panel'),
        panelTitle: document.getElementById('panel-title'),
        panelContent: document.getElementById('panel-content'),
        panelFooter: document.getElementById('panel-footer'),

        // 日记编辑模态框内的富文本编辑器模拟 (需要确保这些元素在模态框打开时是可访问的)
        diaryForm: document.getElementById('diary-form'),
        diaryContentEditor: document.getElementById('diary-content-editor'),
        voiceInputBtn: document.getElementById('voice-input-btn'),
        voiceStatus: document.getElementById('voice-status'),

        // 设置表单元素
        futureSelfTrait: document.getElementById('future-self-trait'),
        feedbackStyle: document.getElementById('feedback-style'),
        interactionFrequency: document.getElementById('interaction-frequency'),
        interactionFrequencyValue: document.getElementById('interaction-frequency-value'),
        privacyLevel: document.getElementById('privacy-level'),
        personalizationSettingsForm: document.getElementById('personalization-settings-form')
    };

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
            skeleton.classList.toggle('hidden', !show); // 如果 show=true，则隐藏状态为false，即显示骨架屏
            console.log(`Skeleton ${skeletonClass} visibility set to ${!show ? 'hidden' : 'visible'}.`);
        } else {
            console.warn(`Skeleton with class ${skeletonClass} not found in container ${container.id}.`);
        }

        // 对于某些模块，其内容区域是骨架屏的兄弟元素，需要手动管理其可见性
        // 日记列表容器会直接替换innerHTML，所以这里主要针对其他模块
        const contentAreasToManage = container.querySelectorAll('.memory-timeline-view, .memory-review-section, .decision-intro, .decision-tracker, .friend-list-area, .analytics-dashboard, .user-settings-form');
        contentAreasToManage.forEach(area => {
            // 如果 show=true (显示骨架屏)，则隐藏内容区域
            // 如果 show=false (隐藏骨架屏)，则显示内容区域
            area.classList.toggle('hidden', show);
            console.log(`Content area ${area.className} visibility set to ${show ? 'hidden' : 'visible'} (based on skeleton show status).`);
        });
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
        if (elements.userAvatar) elements.userAvatar.src = user.avatar;
        console.log('User profile elements updated.');
    };

    /**
     * 渲染导航菜单激活状态
     * @param {string} activeSection - 当前激活的 section ID
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
            return;
        }
        // 隐藏骨架屏
        toggleSkeleton(elements.diaryListContainer, 'diary-skeleton', false); 

        if (entries.length === 0) {
            elements.diaryListContainer.innerHTML = ''; // 清空内容
            toggleEmptyState(elements.diaryEmptyState, true); // 显示空状态
            console.log('No diary entries, showing empty state.');
            return;
        }

        toggleEmptyState(elements.diaryEmptyState, false); // 隐藏空状态
        elements.diaryListContainer.innerHTML = entries.map(entry => `
            <div class="diary-entry-card" data-id="${entry.id}">
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
            </div>
        `).join('');
        console.log('Diary entries HTML rendered.');
    };

    /**
     * 渲染反馈列表
     * @param {Array} feedbackItems - 反馈条目数组
     */
    const renderFeedback = (feedbackItems) => {
        console.log('renderFeedback called with', feedbackItems.length, 'items.');
        if (!elements.feedbackListContainer || !elements.feedbackEmptyState) {
            console.error('renderFeedback: Required elements not found.');
            return;
        }
        toggleSkeleton(elements.feedbackListContainer, 'feedback-skeleton', false);
        if (feedbackItems.length === 0) {
            elements.feedbackListContainer.innerHTML = '';
            toggleEmptyState(elements.feedbackEmptyState, true);
            return;
        }

        toggleEmptyState(elements.feedbackEmptyState, false);
        elements.feedbackListContainer.innerHTML = feedbackItems.map(item => `
            <div class="feedback-card" data-id="${item.id}">
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
        // 注意：这里每次渲染都会重新添加监听器，对于大型应用，更好的做法是在 EventHandlers.js 中使用事件委托。
        elements.feedbackListContainer.querySelectorAll('.feedback-rating .star-icon').forEach(star => {
            star.addEventListener('click', EventHandlers.handleFeedbackRating);
        });
        elements.feedbackListContainer.querySelectorAll('.feedback-rating-input').forEach(input => {
            input.addEventListener('change', EventHandlers.handleFeedbackAdjustmentChange);
        });
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
            return;
        }
        toggleSkeleton(elements.memoryContainer, 'api-docs-skeleton', false); // 隐藏骨架屏
        if (memoryItems.length === 0) {
            elements.memoryContainer.innerHTML = '';
            toggleEmptyState(elements.memoryEmptyState, true);
            return;
        }

        toggleEmptyState(elements.memoryEmptyState, false);
        const timelineHtml = memoryItems.map(item => {
            const relatedDiary = item.relatedDiaryId ? diaryEntries.find(d => d.id === item.relatedDiaryId) : null;
            return `
                <div class="timeline-item" data-id="${item.id}" data-diary-id="${item.relatedDiaryId || ''}">
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
        const timelineView = elements.memoryContainer.querySelector('.memory-timeline-view');
        const reviewSection = elements.memoryContainer.querySelector('.memory-review-section');
        if (timelineView) timelineView.classList.remove('hidden');
        if (reviewSection) reviewSection.classList.remove('hidden');
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
            return;
        }
        toggleSkeleton(elements.decisionContainer, 'api-docs-skeleton', false);
        if (decisions.length === 0) {
            elements.decisionContainer.innerHTML = '';
            toggleEmptyState(elements.decisionEmptyState, true);
            return;
        }

        toggleEmptyState(elements.decisionEmptyState, false);
        const decisionListHtml = decisions.map(dec => `
            <div class="decision-card" data-id="${dec.id}">
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
        const decisionIntro = elements.decisionContainer.querySelector('.decision-intro');
        const decisionTracker = elements.decisionContainer.querySelector('.decision-tracker');
        if (decisionIntro) decisionIntro.classList.remove('hidden');
        if (decisionTracker) decisionTracker.classList.remove('hidden');
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
            return;
        }
        toggleSkeleton(elements.friendsContainer, 'api-docs-skeleton', false);
        if (friends.length === 0) {
            elements.friendsContainer.innerHTML = '';
            toggleEmptyState(elements.friendsEmptyState, true);
            return;
        }

        toggleEmptyState(elements.friendsEmptyState, false);
        const friendListHtml = friends.map(friend => `
            <div class="friend-card" data-id="${friend.id}">
                <img src="${friend.avatar}" alt="${friend.name}头像" class="friend-avatar">
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
        const friendListArea = elements.friendsContainer.querySelector('.friend-list-area');
        if (friendListArea) friendListArea.classList.remove('hidden');
        console.log('Friends HTML rendered.');
    };

    /**
     * 渲染数据分析模块
     * @param {Object} analyticsData - 分析数据
     */
    const renderAnalytics = (analyticsData) => {
        console.log('renderAnalytics called.');
        if (!elements.analyticsContainer || !elements.analyticsEmptyState) {
            console.error('renderAnalytics: Required elements not found.');
            return;
        }
        toggleSkeleton(elements.analyticsContainer, 'api-docs-skeleton', false);
        if (!analyticsData) {
            elements.analyticsContainer.innerHTML = '';
            toggleEmptyState(elements.analyticsEmptyState, true);
            return;
        }

        toggleEmptyState(elements.analyticsEmptyState, false);
        elements.analyticsContainer.innerHTML = `
            <div class="analytics-dashboard">
                <h3 class="analytics-title">你的成长报告</h3>
                <div class="analytics-card">
                    <h4>情绪趋势分析</h4>
                    <p>${analyticsData.emotionTrend || '暂无情绪趋势数据。'}</p>
                    <div class="chart-placeholder">情绪图表</div>
                </div>
                <div class="analytics-card">
                    <h4>主题分布</h4>
                    <p>${analyticsData.themeDistribution || '暂无主题分布数据。'}</p>
                    <div class="chart-placeholder">主题图表</div>
                </div>
                <div class="analytics-card">
                    <h4>生活模式识别</h4>
                    <p>${analyticsData.lifePattern || '暂无生活模式识别。'}</p>
                </div>
                <button class="btn btn-outline mt-4"><i class="ri-download-line"></i> 生成完整报告</button>
            </div>
        `;
        // 确保内容区域在渲染后可见
        const analyticsDashboard = elements.analyticsContainer.querySelector('.analytics-dashboard');
        if (analyticsDashboard) analyticsDashboard.classList.remove('hidden');
        console.log('Analytics HTML rendered.');
    };

    /**
     * 渲染设置模块
     * @param {Object} settings - 用户设置数据
     */
    const renderSettings = (settings) => {
        console.log('renderSettings called.');
        if (!elements.settingsContainer || !elements.settingsEmptyState) {
            console.error('renderSettings: Required elements not found.');
            return;
        }
        toggleSkeleton(elements.settingsContainer, 'api-docs-skeleton', false);
        if (!settings) {
            elements.settingsContainer.innerHTML = '';
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

        const userSettingsForm = elements.settingsContainer.querySelector('.user-settings-form');
        if (userSettingsForm) {
            userSettingsForm.classList.remove('hidden');
        } else {
            console.warn('user-settings-form not found within settingsContainer.');
        }
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
            return;
        }
        toggleSkeleton(elements.apiDocsContainer, 'api-docs-skeleton', false);
        if (apiDocs.length === 0) {
            elements.apiDocsContainer.innerHTML = '';
            toggleEmptyState(elements.apiDocsEmptyState, true);
            return;
        }

        toggleEmptyState(elements.apiDocsEmptyState, false);
        elements.apiDocsContainer.innerHTML = apiDocs.map(doc => `
            <div class="api-endpoint-card" data-id="${doc.id}">
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

        const titleInput = form.querySelector('#diary-title');
        const dateInput = form.querySelector('#diary-date');
        const contentEditor = form.querySelector('#diary-content-editor');
        const templateSelect = form.querySelector('#diary-template');
        const emotionSelect = form.querySelector('#diary-emotion');
        const themeInput = form.querySelector('#diary-theme');
        const tagsInput = form.querySelector('#diary-tags');
        // const idInput = form.querySelector('#diary-id'); // idInput 已经从 HTML 中删除，避免混淆

        if (titleInput) titleInput.value = entry.title || '';
        if (dateInput) dateInput.value = entry.date || new Date().toISOString().split('T')[0];
        if (contentEditor) contentEditor.innerHTML = entry.content || ''; // contenteditable 使用 innerHTML
        if (templateSelect) templateSelect.value = entry.template || 'free';
        if (emotionSelect) emotionSelect.value = entry.emotion || '';
        if (themeInput) themeInput.value = entry.theme || '';
        if (tagsInput) tagsInput.value = entry.tags ? entry.tags.join(', ') : '';
        // if (idInput) idInput.value = entry.id || '新建时自动生成'; // 仅作展示，如果不需要显示可以移除

        // 初始化富文本编辑器按钮
        form.querySelectorAll('.editor-btn').forEach(button => {
            // 避免重复绑定事件，先移除
            button.onclick = null; // 清除之前可能绑定的匿名函数
            button.onclick = (e) => {
                e.preventDefault();
                const command = button.dataset.command;
                // 确保焦点在可编辑区域
                if (contentEditor) contentEditor.focus();
                const selection = window.getSelection();
                if (!selection.rangeCount) return;

                console.log(`Executing editor command: ${command}`);
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
                    }
                } catch (error) {
                    console.error(`Error executing editor command ${command}:`, error);
                }
            };
        });

        // 语音输入按钮（占位符）
        if (elements.voiceInputBtn) {
            elements.voiceInputBtn.onclick = null; // 避免重复绑定
            elements.voiceInputBtn.onclick = () => {
                console.log('Voice input button clicked.');
                // 模拟语音输入效果
                if (elements.voiceStatus) elements.voiceStatus.classList.remove('hidden');
                setTimeout(() => {
                    if (elements.voiceStatus) elements.voiceStatus.classList.add('hidden');
                    alert('语音输入功能正在开发中...');
                    // 在实际项目中，这里会调用Web Speech API 或第三方语音识别服务
                    // if (contentEditor) contentEditor.innerHTML += " [模拟语音转文字内容]"; // 模拟添加内容
                }, 1500);
            };
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
        elements, // 暴露 elements 方便 eventHandlers 访问
        updateInteractionFrequencyValue // 暴露给 eventHandlers 调用
    };
})();
