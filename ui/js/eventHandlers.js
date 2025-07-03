// js/eventHandlers.js

// 将 EventHandlers 模块挂载到 window 对象
// 同时通过参数接收 UIRenderer 和 Modal，避免直接依赖全局变量，增加模块化程度
window.EventHandlers = ((UIRenderer, Modal, mockData) => { // 接收 UIRenderer, Modal, mockData
    const elements = UIRenderer.elements; // 获取 UIRenderer 暴露的 DOM 元素

    /**
     * 处理导航点击事件
     * @param {Event} event
     */
    const handleNavClick = (event) => {
        event.preventDefault();
        const navItem = event.target.closest('.nav-item');
        if (navItem) {
            const section = navItem.dataset.section;
            console.log(`[EventHandlers] Nav item clicked: ${section}`);
            UIRenderer.showSection(`${section}-section`);
            UIRenderer.hideRightPanel(); // 切换主区域时关闭右侧面板

            // 重新加载数据并显示骨架屏
            switch (section) {
                case 'diary':
                    UIRenderer.toggleSkeleton(elements.diaryListContainer, 'diary-skeleton', true);
                    setTimeout(() => {
                        UIRenderer.renderDiaryEntries(mockData.diaryEntries);
                    }, 800);
                    break;
                case 'feedback':
                    UIRenderer.toggleSkeleton(elements.feedbackListContainer, 'feedback-skeleton', true);
                    setTimeout(() => {
                        UIRenderer.renderFeedback(mockData.feedback);
                    }, 800);
                    break;
                case 'memory':
                    UIRenderer.toggleSkeleton(elements.memoryContainer, 'api-docs-skeleton', true); // 复用 api-docs-skeleton 类，如果需要可以专门创建 memory-skeleton
                    setTimeout(() => {
                        UIRenderer.renderMemoryTimeline(mockData.memoryTimeline, mockData.diaryEntries);
                    }, 800);
                    break;
                case 'decision':
                    UIRenderer.toggleSkeleton(elements.decisionContainer, 'api-docs-skeleton', true); // 复用 api-docs-skeleton 类
                    setTimeout(() => {
                        UIRenderer.renderDecisionAid(mockData.decisions);
                    }, 800);
                    break;
                case 'friends':
                    UIRenderer.toggleSkeleton(elements.friendsContainer, 'api-docs-skeleton', true); // 复用 api-docs-skeleton 类
                    setTimeout(() => {
                        UIRenderer.renderFriends(mockData.friends);
                    }, 800);
                    break;
                case 'analytics':
                    UIRenderer.toggleSkeleton(elements.analyticsContainer, 'api-docs-skeleton', true); // 复用 api-docs-skeleton 类
                    setTimeout(() => {
                        const analyticsData = {
                            emotionTrend: '你最近的情绪波动较大，需关注压力管理。',
                            themeDistribution: '主要关注未来科技和历史文明。',
                            lifePattern: '规律的作息有助于提升日记质量。'
                        };
                        UIRenderer.renderAnalytics(analyticsData);
                    }, 800);
                    break;
                case 'settings':
                    UIRenderer.toggleSkeleton(elements.settingsContainer, 'api-docs-skeleton', true); // 复用 api-docs-skeleton 类
                    setTimeout(() => {
                        UIRenderer.renderSettings(mockData.user.settings);
                    }, 800);
                    break;
                case 'api-docs':
                    UIRenderer.toggleSkeleton(elements.apiDocsContainer, 'api-docs-skeleton', true);
                    setTimeout(() => {
                        UIRenderer.renderApiDocs(mockData.apiDocs);
                    }, 800);
                    break;
                default:
                    console.warn(`[EventHandlers] Unhandled section: ${section}`);
            }
        } else {
            console.warn('[EventHandlers] Nav item not found for click event.');
        }
    };

    /**
     * 处理日记卡片点击事件 (显示详情)
     * @param {Event} event
     */
    const handleDiaryCardClick = (event) => {
        const card = event.target.closest('.diary-entry-card');
        if (card) {
            const id = card.dataset.id;
            const entry = mockData.diaryEntries.find(e => e.id === id);
            if (entry) {
                console.log(`[EventHandlers] Diary card clicked: ID=${id}, Title="${entry.title}"`);
                // 显示骨架屏
                UIRenderer.toggleSkeleton(elements.panelContent, 'panel-skeleton', true);
                UIRenderer.showRightPanel('日记详情', ''); // 先显示空内容和骨架屏

                setTimeout(() => { // 模拟加载详情
                    const panelContent = `
                        <h4 style="font-size: var(--font-size-xl); margin-bottom: var(--spacing-3); color: var(--color-primary-dark);">${entry.title}</h4>
                        <p style="font-size: var(--font-size-sm); color: var(--color-text-lighter); margin-bottom: var(--spacing-4);">日期: ${entry.date}</p>
                        <div style="white-space: pre-wrap; font-size: var(--font-size-md); color: var(--color-text-dark); margin-bottom: var(--spacing-5);">${entry.content}</div>
                        <div class="diary-card-tags">
                            ${entry.tags.map(tag => `<span class="diary-tag">${tag}</span>`).join('')}
                            ${entry.emotion ? `<span class="diary-tag" style="background-color: #A78BFA; color: white;">情感: ${entry.emotion}</span>` : ''}
                            ${entry.theme ? `<span class="diary-tag" style="background-color: #EC4899; color: white;">主题: ${entry.theme}</span>` : ''}
                        </div>
                    `;
                    const panelFooter = `
                        <button class="btn btn-outline" data-action="edit-diary" data-id="${entry.id}">编辑</button>
                        <button class="btn btn-danger" data-action="delete-diary" data-id="${entry.id}">删除</button>
                    `;
                    UIRenderer.showRightPanel('日记详情', panelContent, panelFooter);
                    console.log(`[EventHandlers] Diary details for ${id} rendered in right panel.`);
                }, 500);
            } else {
                console.warn(`[EventHandlers] Diary entry with ID ${id} not found.`);
            }
        }
    };

    /**
     * 处理右侧面板内的按钮点击 (编辑/删除日记，查看记忆/决策/好友详情)
     * @param {Event} event
     */
    const handleRightPanelButtonClick = (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        const action = target.dataset.action;
        const id = target.dataset.id;
        console.log(`[EventHandlers] Right panel button clicked: Action=${action}, ID=${id}`);

        if (action === 'edit-diary') {
            const entry = mockData.diaryEntries.find(e => e.id === id);
            if (entry) {
                Modal.openModal('编辑日记', '', [ // contentHTML 为空，因为表单结构是静态的
                    { text: '取消', class: 'btn btn-outline', handler: Modal.closeModal },
                    { text: '保存', class: 'btn btn-primary', handler: () => handleSaveDiary(id) }
                ]);
                UIRenderer.renderDiaryForm(entry); // 填充表单数据
            }
        } else if (action === 'delete-diary') {
            Modal.openModal('删除日记', `<p style="text-align: center; color: var(--color-text-dark); font-size: var(--font-size-md);">确定要删除这篇日记吗？此操作无法撤销。</p>`, [
                { text: '取消', class: 'btn btn-outline', handler: Modal.closeModal },
                { text: '删除', class: 'btn btn-danger', handler: () => handleDeleteDiary(id) }
            ]);
        } else if (action === 'view-related-diary') { // 来自记忆模块的“查看相关日记”
            const entry = mockData.diaryEntries.find(e => e.id === id);
            if (entry) {
                UIRenderer.showSection('diary-section'); // 切换到日记模块
                // 暂时不自动打开右侧面板，因为需要重新渲染日记列表再点击
                // 实际应用中，可以高亮显示该日记卡片，或直接打开右侧面板显示详情
                alert(`正在跳转到日记: "${entry.title}"`);
                UIRenderer.hideRightPanel(); // 关闭当前面板
            }
        } else if (action === 'view-decision-detail') { // 来自决策模块的“查看详情”
            const decision = mockData.decisions.find(d => d.id === id);
            if (decision) {
                const detailContent = `
                    <h4>问题描述:</h4>
                    <p>${decision.problem}</p>
                    <h4>"未来的你"分析:</h4>
                    <p>${decision.analysis}</p>
                    <h4>建议:</h4>
                    <p>${decision.advice}</p>
                    <h4>决策结果:</h4>
                    <p class="decision-outcome ${decision.outcome}">结果：${decision.outcomeDescription}</p>
                    <span class="decision-date">记录于: ${decision.date}</span>
                `;
                UIRenderer.showRightPanel('决策详情', detailContent, `<button class="btn btn-primary" data-action="track-decision-outcome" data-id="${decision.id}">更新结果</button>`);
            }
        } else if (action === 'view-friend-interaction') { // 来自好友模块的“查看互动”
            const friend = mockData.friends.find(f => f.id === id);
            if (friend) {
                const interactionContent = `
                    <div style="display: flex; align-items: center; gap: var(--spacing-3); margin-bottom: var(--spacing-4);">
                        <img src="${friend.avatar}" alt="${friend.name}头像" class="friend-avatar" style="width: 60px; height: 60px;">
                        <div>
                            <h4 style="margin: 0; font-size: var(--font-size-xl);">${friend.name}</h4>
                            <span style="font-size: var(--font-size-sm); color: var(--color-text-light);">上次互动: ${friend.lastInteraction}</span>
                        </div>
                    </div>
                    <p>这是与 ${friend.name} 的“未来评论”互动记录摘要。</p>
                    <p>共享日记数量：${friend.sharedDiaries.length}</p>
                    <p>未来人格评论权限：${friend.futureSelfFeedbackPermission === 'all' ? '全部可见' : friend.futureSelfFeedbackPermission === 'selected' ? '部分可见' : '不可见'}</p>
                    <button class="btn btn-primary mt-4">发送未来评论</button>
                `;
                UIRenderer.showRightPanel(`${friend.name} 的互动`, interactionContent);
            }
        }
    };

    /**
     * 处理“新建日记”按钮点击
     */
    const handleAddDiaryEntry = () => {
        console.log('[EventHandlers] handleAddDiaryEntry: New diary entry button clicked. Attempting to open modal.'); // 关键日志
        Modal.openModal('新建日记', '', [ // contentHTML 为空，因为表单结构是静态的
            { text: '取消', class: 'btn btn-outline', handler: Modal.closeModal },
            { text: '创建', class: 'btn btn-primary', handler: () => handleSaveDiary() }
        ]);
        UIRenderer.renderDiaryForm(); // 渲染空表单
        UIRenderer.hideRightPanel(); // 打开模态框时关闭右侧面板
        console.log('[EventHandlers] handleAddDiaryEntry: Modal open call and form render initiated.'); // 关键日志
    };

    /**
     * 保存/更新日记逻辑
     * @param {string} id - 日记ID (可选，如果存在则为更新)
     */
    const handleSaveDiary = (id = null) => {
        console.log(`[EventHandlers] Saving diary entry: ID=${id || 'new'}`);
        const form = elements.diaryForm; // 从模态框获取表单
        if (!form) {
            console.error('[EventHandlers] Diary form not found for saving.');
            alert('日记表单未找到，无法保存！');
            return;
        }
        const title = form.querySelector('#diary-title').value;
        const date = form.querySelector('#diary-date').value;
        const content = form.querySelector('#diary-content-editor').innerHTML; // 获取富文本内容
        const template = form.querySelector('#diary-template').value;
        const emotion = form.querySelector('#diary-emotion').value;
        const theme = form.querySelector('#diary-theme').value;
        const tags = form.querySelector('#diary-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);

        if (!title || !date || !content) {
            alert('标题、日期和内容不能为空！');
            console.warn('[EventHandlers] Validation failed: Title, Date, or Content is empty.');
            return;
        }

        if (id) {
            // 更新现有日记
            const index = mockData.diaryEntries.findIndex(e => e.id === id);
            if (index !== -1) {
                mockData.diaryEntries[index] = { ...mockData.diaryEntries[index], title, date, content, tags, emotion, theme, template };
                console.log(`[EventHandlers] Updated diary entry ${id}:`, mockData.diaryEntries[index]);
            } else {
                console.error(`[EventHandlers] Diary entry with ID ${id} not found for update.`);
            }
        } else {
            // 创建新日记
            const newId = 'd' + (mockData.diaryEntries.length + 1); // 简单ID生成
            const newEntry = { id: newId, title, date, content, tags, emotion, theme, template };
            mockData.diaryEntries.unshift(newEntry); // 添加到最前面
            console.log('[EventHandlers] Created new diary entry:', newEntry);
        }

        // 重新渲染日记列表
        UIRenderer.renderDiaryEntries(mockData.diaryEntries);
        Modal.closeModal();
        UIRenderer.hideRightPanel(); // 确保更新/创建后关闭面板
        console.log('[EventHandlers] Diary saved, modal closed, panel hidden.');
    };

    /**
     * 删除日记逻辑
     * @param {string} id - 日记ID
     */
    const handleDeleteDiary = (id) => {
        console.log(`[EventHandlers] Deleting diary entry: ID=${id}`);
        mockData.diaryEntries = mockData.diaryEntries.filter(e => e.id !== id);
        UIRenderer.renderDiaryEntries(mockData.diaryEntries);
        Modal.closeModal();
        UIRenderer.hideRightPanel(); // 删除后关闭面板
    };

    /**
     * 处理反馈评分
     * @param {Event} event
     */
    const handleFeedbackRating = (event) => {
        const star = event.target;
        const feedbackCardId = star.closest('.feedback-rating').dataset.id;
        const rating = parseInt(star.dataset.value);

        console.log(`[EventHandlers] Feedback rating: ID=${feedbackCardId}, Rating=${rating}`);

        const feedbackItem = mockData.feedback.find(f => f.id === feedbackCardId);
        if (feedbackItem) {
            feedbackItem.rating = rating;
            // 重新渲染反馈部分，以更新星星显示状态
            UIRenderer.renderFeedback(mockData.feedback);
        } else {
            console.warn(`[EventHandlers] Feedback item with ID ${feedbackCardId} not found for rating.`);
        }
    };

    /**
     * 处理反馈调整内容变化
     * @param {Event} event
     */
    const handleFeedbackAdjustmentChange = (event) => {
        const input = event.target;
        const feedbackCardId = input.dataset.id;
        const adjustmentText = input.value;

        console.log(`[EventHandlers] Feedback adjustment changed: ID=${feedbackCardId}, Text="${adjustmentText}"`);

        const feedbackItem = mockData.feedback.find(f => f.id === feedbackCardId);
        if (feedbackItem) {
            feedbackItem.adjustments = adjustmentText;
        } else {
            console.warn(`[EventHandlers] Feedback item with ID ${feedbackCardId} not found for adjustment.`);
        }
    };

    /**
     * 处理保存反馈调整按钮点击
     * @param {Event} event
     */
    const handleSaveFeedbackAdjustment = (event) => {
        const btn = event.target;
        const feedbackCardId = btn.dataset.id;
        const feedbackItem = mockData.feedback.find(f => f.id === feedbackCardId);
        if (feedbackItem) {
            // 模拟保存到后端
            console.log(`[EventHandlers] Saving feedback adjustment for ${feedbackCardId}:`, feedbackItem);
            alert('反馈调整已保存！');
        } else {
            console.warn(`[EventHandlers] Feedback item with ID ${feedbackCardId} not found for saving adjustment.`);
        }
    };


    /**
     * 处理设置表单提交
     * @param {Event} event
     */
    const handleSettingsSubmit = (event) => {
        event.preventDefault();
        console.log('[EventHandlers] Settings form submitted.');
        if (elements.futureSelfTrait) mockData.user.settings.futureSelfTrait = elements.futureSelfTrait.value;
        if (elements.feedbackStyle) mockData.user.settings.feedbackStyle = elements.feedbackStyle.value;
        if (elements.interactionFrequency) mockData.user.settings.interactionFrequency = parseInt(elements.interactionFrequency.value);
        if (elements.privacyLevel) mockData.user.settings.privacyLevel = elements.privacyLevel.value;

        alert('设置已保存！');
        console.log('[EventHandlers] New settings saved:', mockData.user.settings);
    };


    /**
     * 初始化所有事件监听器
     */
    const init = () => {
        console.log('[EventHandlers] EventHandlers.init called.'); // 关键日志

        // 侧边栏导航点击
        if (elements.mainNav) {
            elements.mainNav.addEventListener('click', handleNavClick);
            console.log('[EventHandlers] Main navigation click listener attached.');
        } else {
            console.error('[EventHandlers] Main navigation element not found. Cannot attach listener.');
        }


        // 新建日记按钮点击
        const addDiaryBtn = document.getElementById('add-diary-entry-btn');
        if (addDiaryBtn) {
            addDiaryBtn.addEventListener('click', handleAddDiaryEntry);
            console.log('[EventHandlers] "新建日记" button listener attached to #add-diary-entry-btn.'); // 关键日志
        } else {
            console.warn('[EventHandlers] "新建日记" button #add-diary-entry-btn not found. Cannot attach listener.'); // 关键日志
        }
        const emptyStateAddBtn = document.getElementById('empty-state-add-btn');
        if (emptyStateAddBtn) {
            emptyStateAddBtn.addEventListener('click', handleAddDiaryEntry);
            console.log('[EventHandlers] "写下第一篇日记" button listener attached to #empty-state-add-btn.'); // 关键日志
        } else {
            console.warn('[EventHandlers] "写下第一篇日记" button #empty-state-add-btn not found. Cannot attach listener.'); // 关键日志
        }

        // 日记卡片点击 (事件委托)
        if (elements.diaryListContainer) {
            elements.diaryListContainer.addEventListener('click', handleDiaryCardClick);
            console.log('[EventHandlers] Diary list container click listener attached.');
        }

        // 关闭右侧面板按钮
        const closeRightPanelBtn = document.getElementById('close-right-panel');
        if (closeRightPanelBtn) closeRightPanelBtn.addEventListener('click', UIRenderer.hideRightPanel);

        // 右侧面板内的按钮点击 (事件委托)
        if (elements.rightPanel) elements.rightPanel.addEventListener('click', handleRightPanelButtonClick);

        // 监听日期选择器变化 (仅在日记模块中有效)
        const diaryDatePicker = document.getElementById('diary-date-picker');
        if (diaryDatePicker) {
            diaryDatePicker.addEventListener('change', (event) => {
                const selectedDate = event.target.value;
                console.log(`[EventHandlers] Date picker changed to: ${selectedDate}`);
                // 过滤日记条目，只显示选中日期的日记
                const filteredEntries = mockData.diaryEntries.filter(entry => entry.date === selectedDate);
                UIRenderer.renderDiaryEntries(filteredEntries);
                if (filteredEntries.length === 0) {
                    UIRenderer.toggleEmptyState(elements.diaryEmptyState, true);
                    if (elements.diaryEmptyState) {
                        elements.diaryEmptyState.querySelector('.empty-message').textContent = `在 ${selectedDate} 还没有日记哦！`;
                    }
                } else {
                    UIRenderer.toggleEmptyState(elements.diaryEmptyState, false);
                }
            });
        }

        // 注册反馈模块的事件委托，处理评分和保存调整
        if (elements.feedbackListContainer) {
            // 对保存调整按钮添加委托监听
            elements.feedbackListContainer.addEventListener('click', (event) => {
                const saveBtn = event.target.closest('button[data-action="save-feedback-adjustment"]');
                if (saveBtn) {
                    handleSaveFeedbackAdjustment(event);
                }
                // 星星评分的点击事件已在 renderFeedback 中直接添加，因为星星是动态生成的
                // 如果要使用委托，可以这样：
                // const star = event.target.closest('.star-icon');
                // if (star) { handleFeedbackRating(event); }
            });
            // 调整输入框的 onChange 事件已在 renderFeedback 中直接添加
            // 如果要使用委托，可以这样：
            // elements.feedbackListContainer.addEventListener('change', (event) => {
            //     const input = event.target.closest('.feedback-rating-input');
            //     if (input) { handleFeedbackAdjustmentChange(event); }
            // });
        }


        // 注册设置模块的表单提交事件
        if (elements.personalizationSettingsForm) {
            elements.personalizationSettingsForm.addEventListener('submit', handleSettingsSubmit);
            // 初始化滑动条旁边的值显示
            if (elements.interactionFrequency) {
                elements.interactionFrequency.addEventListener('input', (e) => {
                    UIRenderer.updateInteractionFrequencyValue(e.target.value);
                });
            }
        }

        // 记忆连接模块的事件委托
        if (elements.memoryContainer) {
            elements.memoryContainer.addEventListener('click', handleRightPanelButtonClick);
        }
        // 决策辅助模块的事件委托
        if (elements.decisionContainer) { // 注意：“描述你的困境”按钮在 decisionsContainer 内部。
            elements.decisionContainer.addEventListener('click', (event) => {
                const startBtn = event.target.closest('#start-decision-aid-btn');
                if (startBtn) {
                    alert('描述您的困境功能待实现，请通过新建日记记录困境。');
                    // 这里可以添加逻辑来打开一个用于问题描述的模态框
                } else {
                    handleRightPanelButtonClick(event); // 用于处理容器内的其他按钮
                }
            });
        }
        if (elements.friendsContainer) {
            elements.friendsContainer.addEventListener('click', handleRightPanelButtonClick);
            // 示例：“添加好友”按钮
            elements.friendsContainer.addEventListener('click', (event) => {
                if (event.target.textContent.includes('添加好友')) {
                    alert('添加好友功能待实现！');
                }
            });
        }
        if (elements.analyticsContainer) {
            elements.analyticsContainer.addEventListener('click', (event) => {
                if (event.target.textContent.includes('生成完整报告')) {
                    alert('生成完整报告功能待实现！');
                }
            });
        }
    };

    return {
        init,
        // 暴露一些可能需要从外部调用的函数，例如反馈评分
        handleFeedbackRating,
        handleFeedbackAdjustmentChange
    };
})(window.UIRenderer, window.Modal, window.mockData); // 传入全局的 UIRenderer 和 Modal, mockData
