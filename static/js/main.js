// main.js - 主要页面交互功能
document.addEventListener('DOMContentLoaded', function() {
    // FAQ展开收起功能
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.closest('.faq-item');
            const answer = faqItem.querySelector('.faq-answer');
            const toggleIcon = this.querySelector('.faq-toggle i');

            // 切换展开状态
            faqItem.classList.toggle('active');

            // 更新图标
            if (faqItem.classList.contains('active')) {
                toggleIcon.classList.remove('fa-chevron-down');
                toggleIcon.classList.add('fa-chevron-up');
                answer.style.display = 'block';
            } else {
                toggleIcon.classList.remove('fa-chevron-up');
                toggleIcon.classList.add('fa-chevron-down');
                answer.style.display = 'none';
            }
        });
    });

    // 搜索功能
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn && searchInput) {
        // 按钮点击搜索
        searchBtn.addEventListener('click', performSearch);

        // 回车键搜索
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // 搜索建议
        searchInput.addEventListener('input', debounce(function() {
            const query = searchInput.value.trim();
            if (query.length > 2) {
                fetchSearchSuggestions(query);
            }
        }, 300));
    }

    // 分类卡片点击
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            if (category) {
                window.location.href = `/categories?category=${category}`;
            }
        });
    });

    // 流程步骤点击
    document.querySelectorAll('.process-step').forEach(step => {
        step.addEventListener('click', function() {
            const stepNumber = this.querySelector('.step-number').textContent;
            showStepDetail(stepNumber);
        });
    });

    // 提问表单提交
    const askForm = document.getElementById('askForm');
    if (askForm) {
        askForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const title = document.getElementById('title').value.trim();
            const content = document.getElementById('content').value.trim();
            const category = document.getElementById('category').value;
            const email = document.getElementById('email').value.trim();

            // 验证输入
            if (!title) {
                showAlert('请输入问题标题', 'error');
                return;
            }

            if (!content) {
                showAlert('请输入问题详情', 'error');
                return;
            }

            if (!category) {
                showAlert('请选择问题分类', 'error');
                return;
            }

            if (email && !validateEmail(email)) {
                showAlert('请输入有效的邮箱地址', 'error');
                return;
            }

            // 显示加载状态
            const submitBtn = askForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
            submitBtn.disabled = true;

            // 发送请求
            fetch('/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'title': title,
                    'content': content,
                    'category': category,
                    'email': email
                })
            })
            .then(response => response.text())
            .then(html => {
                if (html.includes('提交成功')) {
                    showAlert('问题提交成功！我们将在24小时内回复。', 'success');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                } else {
                    showAlert('提交失败，请稍后重试', 'error');
                }
            })
            .catch(error => {
                console.error('提交错误:', error);
                showAlert('提交过程中发生错误，请稍后重试', 'error');
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }

    // 相关问题查看更多
    const loadMoreBtn = document.querySelector('.load-more-related');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            const currentCount = document.querySelectorAll('.related-question').length;
            loadMoreRelatedQuestions(currentCount);
        });
    }
});

// 执行搜索
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const query = searchInput.value.trim();
    if (!query) {
        showAlert('请输入搜索关键词', 'warning');
        return;
    }

    window.location.href = `/categories?search=${encodeURIComponent(query)}`;
}

// 获取搜索建议
function fetchSearchSuggestions(query) {
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            displaySearchSuggestions(data.results);
        })
        .catch(error => {
            console.error('获取搜索建议失败:', error);
        });
}

// 显示搜索建议
function displaySearchSuggestions(suggestions) {
    const searchBox = document.querySelector('.search-box');
    let suggestionsContainer = document.querySelector('.search-suggestions');

    // 移除现有的建议
    if (suggestionsContainer) {
        suggestionsContainer.remove();
    }

    if (suggestions.length === 0) {
        return;
    }

    // 创建建议容器
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'search-suggestions';

    // 添加建议项
    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement('a');
        suggestionItem.href = `/detail/${suggestion.id}`;
        suggestionItem.className = 'search-suggestion-item';
        suggestionItem.innerHTML = `
            <div class="suggestion-title">${suggestion.title}</div>
            <div class="snippet">${suggestion.answer}</div>
            <div class="suggestion-meta">分类: ${suggestion.category}</div>
        `;
        suggestionsContainer.appendChild(suggestionItem);
    });

    // 添加到搜索框下方
    searchBox.appendChild(suggestionsContainer);
}

// 显示步骤详情
function showStepDetail(stepNumber) {
    const stepDetails = {
        1: "研究比赛规则、时间、要求。重点关注比赛官方网站和学校创新创业学院通知。",
        2: "关注通知、准备报名材料。注意报名截止时间，提前准备所需材料。",
        3: "寻找队友、确定分工。寻找不同专业背景的队友，形成优势互补。",
        4: "联系指导老师、确定方向。提前了解老师研究方向，准备好项目构思。",
        5: "头脑风暴、确定项目方向。选题要兼具创新性和可行性，避免过大或过小。",
        6: "申报书、PPT等材料准备。突出项目创新点和团队优势，注意格式规范。",
        7: "预演答辩、优化展示。多次演练，控制时间，准备好问答环节。",
        8: "提交材料、参加比赛。提前提交，留出修改时间，注意备份。"
    };

    const stepTitles = [
        '了解比赛',
        '报名信息',
        '组建团队',
        '邀请导师',
        '确定选题',
        '撰写材料',
        '模拟答辩',
        '最终提交'
    ];

    const detail = stepDetails[stepNumber];
    const title = stepTitles[stepNumber - 1];

    if (detail && title) {
        showModal(title, detail);
    }
}

// 显示模态框
function showModal(title, content) {
    // 移除现有的模态框
    const existingModal = document.querySelector('.custom-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>${content}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-close-btn">关闭</button>
            </div>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(modal);

    // 显示动画
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    // 关闭按钮事件
    modal.querySelectorAll('.modal-close, .modal-close-btn, .modal-overlay').forEach(el => {
        el.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    });
}

// 加载更多相关问题
function loadMoreRelatedQuestions(offset) {
    const questionId = document.querySelector('.question-detail')?.dataset?.id;
    if (!questionId) return;

    fetch(`/api/question/${questionId}/related?offset=${offset}`)
        .then(response => response.json())
        .then(data => {
            if (data.questions.length > 0) {
                appendRelatedQuestions(data.questions);
            } else {
                document.querySelector('.load-more-related').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('加载相关问题失败:', error);
        });
}

// 添加相关问题
function appendRelatedQuestions(questions) {
    const container = document.querySelector('.related-questions');

    questions.forEach(question => {
        const questionElement = document.createElement('a');
        questionElement.href = `/detail/${question.id}`;
        questionElement.className = 'related-question';
        questionElement.innerHTML = `
            <h5>${question.title}</h5>
            <p>${question.preview}</p>
            <span class="related-meta">${question.views}次浏览</span>
        `;
        container.appendChild(questionElement);
    });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 邮箱验证函数
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 显示提示消息
function showAlert(message, type = 'info') {
    // 移除现有的提示消息
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    // 创建新的提示消息
    const alert = document.createElement('div');
    alert.className = `custom-alert alert-${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button class="alert-close">&times;</button>
    `;

    // 添加到页面
    document.body.appendChild(alert);

    // 显示动画
    setTimeout(() => {
        alert.classList.add('show');
    }, 10);

    // 关闭按钮事件
    alert.querySelector('.alert-close').addEventListener('click', () => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    });

    // 自动消失
    if (type !== 'error') {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }
}