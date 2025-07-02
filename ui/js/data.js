// js/data.js

// 将 mockData 挂载到 window 对象，使其在全局范围内可访问
window.mockData = {
    user: {
        name: '旅行者 A',
        email: 'traveler.a@example.com',
        avatar: 'https://ui-avatars.com/api/?name=Traveler+A&background=6366F1&color=fff&size=128',
        settings: {
            futureSelfTrait: 'conscientiousness', // 责任感
            feedbackStyle: 'analytical', // 分析型
            interactionFrequency: 3, // 1-5, 中等
            privacyLevel: 'high' // high, medium, low
        }
    },
    diaryEntries: [
        {
            id: 'd1',
            title: '初探2077：赛博朋克都市的霓虹夜',
            date: '2077-10-26',
            content: '我第一次抵达了2077年的夜之城，空气中弥漫着合成食物和电子烟的味道。高耸入云的摩天大楼上，全息广告牌闪烁着刺眼的光芒，每一帧都在讲述着一个关于欲望与科技的故事。我在沃森区的小巷里找到了一家不起眼的义体医生，体验了神经接入，感觉自己仿佛与城市融为一体。这里的人们生活在贫富差距的极端，义体改造是常态，枪战和帮派冲突随处可见。虽然危险，但充满了未来感，令人着迷。',
            tags: ['赛博朋克', '未来', '夜之城', '2077'],
            emotion: 'excited', // 新增情绪标签
            theme: '未来科技' // 新增主题分类
        },
        {
            id: 'd2',
            title: '古埃及之旅：尼罗河畔的信仰与权力',
            date: '公元前1350年',
            content: '今日穿越至古埃及新王国时期，亲眼目睹了阿蒙霍特普四世（后来的阿肯那顿）的登基仪式。尼罗河畔的卡纳克神庙巍峨壮丽，空气中弥漫着香料和祭祀的烟雾。人们对法老的敬畏如同对神明。我试图理解他们对来世的执着，以及庞大的陵墓和木乃伊背后的深层信仰。与当地的农民交流，他们的生活虽然简朴，但与自然的联系却异常紧密。这个时代充满了神秘与庄严。',
            tags: ['古埃及', '历史', '法老', '尼罗河'],
            emotion: 'reflective',
            theme: '历史文明'
        },
        {
            id: 'd3',
            title: '第一次接触：与外星文明的短暂瞬间',
            date: '2342-07-15',
            content: '在伽马星系边缘的一次深空探测中，我们的小队意外接收到了一组异常的信号。经过分析，那是一种复杂的数学语言，显然不是地球文明的产物。我们尝试回传了一段友好的信息，并短暂地接收到了回应，那是一幅类似星图的图像。虽然接触时间很短，但那种震撼是无与伦B的。浩瀚宇宙中，我们并非孤单。期待下一次更深入的交流。',
            tags: ['科幻', '外星文明', '深空', '未来'],
            emotion: 'excited',
            theme: '宇宙探索'
        },
        {
            id: 'd4',
            title: '工业革命的黎明：蒸汽与变革的时代',
            date: '1780-03-20',
            content: '来到了18世纪末的英国，亲眼见证了瓦特蒸汽机的轰鸣声拉开工业革命的序幕。曼彻斯特的纺织厂里，机器的效率令人惊叹，但也感受到了工人们的辛劳。社会结构正在发生剧变，城市化进程加快，带来了新的机遇，也带来了新的问题。这是一个充满活力和矛盾的时代，科学技术的力量前所未有地改变着人类的命运。',
            tags: ['工业革命', '历史', '蒸汽机', '英国'],
            emotion: 'calm',
            theme: '社会变迁'
        }
    ],
    feedback: [
        {
            id: 'f1',
            type: 'BUG 反馈', // 用户提交的反馈，保留
            date: '2025-05-20',
            content: '日记编辑功能存在偶发性保存失败问题，点击保存后内容未更新，但无错误提示。',
            status: 'pending' // pending, resolved
        },
        {
            id: 'f2',
            type: '功能建议', // 用户提交的反馈，保留
            date: '2025-05-18',
            content: '希望增加日记的搜索和筛选功能，按日期、标签或关键词进行搜索。',
            status: 'resolved'
        },
        {
            id: 'fa1',
            type: '未来的你', // 明确是“未来的你”的反馈
            feedbackType: 'thought-provoking', // 新增：反馈类型
            date: '2025-06-03',
            content: '看到你对2077年的描述，我思考你对未来科技是抱持着兴奋还是担忧？这种对未知的探索欲，是否也反映在你当下的某个决定中？',
            status: 'read', // read, unread
            rating: 4, // 新增：用户评价 1-5星
            adjustments: '希望未来我能更直接地给出建议，而不是提问。' // 新增：用户调整反馈
        },
        {
            id: 'fa2',
            type: '未来的你',
            feedbackType: 'emotional-support',
            date: '2025-06-02',
            content: '穿越到古埃及，感受那种古老的庄严确实很震撼。请记住，即使是面对宏大的历史，你当下的每一步小小的记录和思考，都汇聚成了你独特的“时间旅行”。你的感受很重要。',
            status: 'unread',
            rating: 0,
            adjustments: ''
        },
        {
            id: 'fa3',
            type: '未来的你',
            feedbackType: 'action-oriented',
            date: '2025-06-01',
            content: '关于深空探测的计划，我建议你现在就开始储备一些基础的宇宙物理知识，以便在未来能更好地理解和参与。或许可以从量子力学入门？',
            status: 'read',
            rating: 5,
            adjustments: ''
        }
    ],
    apiDocs: [
        {
            id: 'api1',
            title: '获取所有日记条目',
            method: 'GET',
            path: '/api/v1/diary',
            description: '获取当前用户所有日记条目的列表。',
            parameters: [],
            response: `{
    "status": "success",
    "data": [
        {
            "id": "string",
            "title": "string",
            "date": "YYYY-MM-DD",
            "content": "string",
            "tags": ["string"],
            "emotion": "string",
            "theme": "string"
        }
    ]
}`
        },
        {
            id: 'api2',
            title: '创建新的日记条目',
            method: 'POST',
            path: '/api/v1/diary',
            description: '创建一个新的日记条目。',
            parameters: [
                { name: 'title', type: 'string', required: true, description: '日记标题。' },
                { name: 'date', type: 'string', required: true, description: '日记日期，格式：YYYY-MM-DD。' },
                { name: 'content', type: 'string', required: true, description: '日记内容（支持富文本HTML）。' },
                { name: 'tags', type: 'array<string>', required: false, description: '日记标签列表。' },
                { name: 'emotion', type: 'string', required: false, description: '日记情绪标签。' },
                { name: 'theme', type: 'string', required: false, description: '日记主题分类。' }
            ],
            response: `{
    "status": "success",
    "data": {
        "id": "string",
        "message": "Diary entry created successfully."
    }
}`
        },
        {
            id: 'api3',
            title: '获取单个日记条目',
            method: 'GET',
            path: '/api/v1/diary/{id}',
            description: '根据ID获取单个日记条目的详细信息。',
            parameters: [
                { name: 'id', type: 'string', required: true, description: '日记条目ID。' }
            ],
            response: `{
    "status": "success",
    "data": {
        "id": "string",
        "title": "string",
        "date": "YYYY-MM-DD",
        "content": "string",
        "tags": ["string"],
        "emotion": "string",
        "theme": "string"
    }
}`
        },
        {
            id: 'api4',
            title: '更新日记条目',
            method: 'PUT',
            path: '/api/v1/diary/{id}',
            description: '更新指定ID的日记条目。',
            parameters: [
                { name: 'id', type: 'string', required: true, description: '日记条目ID。' },
                { name: 'title', type: 'string', required: false, description: '新的日记标题。' },
                { name: 'content', type: 'string', required: false, description: '新的日记内容。' },
                { name: 'tags', type: 'array<string>', required: false, description: '新的日记标签列表。' },
                { name: 'emotion', type: 'string', required: false, description: '新的日记情绪标签。' },
                { name: 'theme', type: 'string', required: false, description: '新的日记主题分类。' }
            ],
            response: `{
    "status": "success",
    "message": "Diary entry updated successfully."
}`
        }
    ],
    memoryTimeline: [
        { id: 'm1', date: '2342-07-15', type: 'event', title: '首次接触外星文明', relatedDiaryId: 'd3', tags: ['科幻', '深空'] },
        { id: 'm2', date: '公元前1350年', type: 'event', title: '古埃及法老登基', relatedDiaryId: 'd2', tags: ['历史', '古埃及'] },
        { id: 'm3', date: '2077-10-26', type: 'event', title: '抵达夜之城', relatedDiaryId: 'd1', tags: ['赛博朋克', '未来'] },
        { id: 'm4', date: '1780-03-20', type: 'event', title: '工业革命开始', relatedDiaryId: 'd4', tags: ['工业革命'] },
        { id: 'm5', date: '2025-06-04', type: 'thought', title: '对时间旅行道德的思考', relatedDiaryId: null, tags: ['哲学', '反思'] }
    ],
    decisions: [
        {
            id: 'dec1',
            problem: '是否选择在未来城市定居，放弃地球生活？',
            date: '2077-11-01',
            analysis: '未来的你分析：定居未来城市能带来更多机遇，但意味着与过去生活的彻底割裂。',
            advice: '考虑你对稳定和变化的偏好，以及你对新环境的适应能力。',
            outcome: 'success', // success, failed, pending
            outcomeDescription: '选择定居，适应良好，发现新机遇。'
        },
        {
            id: 'dec2',
            problem: '是否投资时间旅行设备改造，提升跨时代稳定性？',
            date: '2025-06-04',
            analysis: '未来的你分析：改造设备费用高昂，但能极大提升旅行安全性。需权衡风险与收益。',
            advice: '建议详细评估现有设备的风险点，并与资深时间旅行者交流经验。',
            outcome: 'pending',
            outcomeDescription: '正在考量中。'
        }
    ],
    friends: [
        {
            id: 'fr1',
            name: '旅行者 B',
            avatar: 'https://ui-avatars.com/api/?name=Friend+B&background=06B6D4&color=fff&size=64',
            status: 'online',
            lastInteraction: '2025-06-03',
            sharedDiaries: ['d1'], // 共享的日记ID
            futureSelfFeedbackPermission: 'all' // all, selected, none
        },
        {
            id: 'fr2',
            name: '时间观察者 C',
            avatar: 'https://ui-avatars.com/api/?name=Friend+C&background=F97316&color=fff&size=64',
            status: 'offline',
            lastInteraction: '2025-05-28',
            sharedDiaries: [],
            futureSelfFeedbackPermission: 'none'
        }
    ]
};
