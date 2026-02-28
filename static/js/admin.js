// 管理员页面JavaScript - 修复版本
document.addEventListener('DOMContentLoaded', function() {
    console.log('管理员页面加载完成');

    // 初始化标签页
    const tabs = document.querySelectorAll('.admin-tab');
    const tabContents = document.querySelectorAll('.admin-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;

            // 更新标签页状态
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // 显示对应内容
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // 用户提问筛选
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const status = this.dataset.status;

            // 更新按钮状态
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // 筛选问题
            const questions = document.querySelectorAll('.user-question-item');
            questions.forEach(question => {
                if (status === 'all') {
                    question.style.display = 'block';
                } else {
                    const questionStatus = question.dataset.status;
                    question.style.display = questionStatus === status ? 'block' : 'none';
                }
            });
        });
    });

    // FAQ表单提交按钮
    const submitFaqBtn = document.getElementById('submit-faq');
    if (submitFaqBtn) {
        submitFaqBtn.addEventListener('click', function(e) {
            e.preventDefault();
            submitFAQ();
        });
    }

    // FAQ表单重置按钮
    const resetFaqBtn = document.getElementById('reset-faq');
    if (resetFaqBtn) {
        resetFaqBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetFAQForm();
        });
    }

    // 事件委托处理动态生成的内容
    document.addEventListener('click', function(e) {
        // 回复按钮
        if (e.target.closest('.reply-btn')) {
            const questionId = e.target.closest('.reply-btn').dataset.id;
            openReplyModal(questionId);
        }

        // 删除用户问题
        if (e.target.closest('.delete-question-btn')) {
            const questionId = e.target.closest('.delete-question-btn').dataset.id;
            deleteUserQuestion(questionId);
        }

        // 删除FAQ问题
        if (e.target.closest('.delete-faq-btn')) {
            const questionId = e.target.closest('.delete-faq-btn').dataset.id;
            deleteFAQ(questionId);
        }

        // 编辑FAQ问题
        if (e.target.closest('.edit-faq-btn')) {
            const questionId = e.target.closest('.edit-faq-btn').dataset.id;
            openEditFAQModal(questionId);
        }
    });
});

// 提交FAQ表单
function submitFAQ() {
    const title = document.getElementById('faq-title').value.trim();
    const content = document.getElementById('faq-content').value.trim();
    const answer = document.getElementById('faq-answer').value.trim();
    const categoryId = document.getElementById('faq-category').value;
    const isFeatured = document.getElementById('faq-featured').checked;

    console.log('提交FAQ数据:', {title, content, answer, categoryId, isFeatured});

    // 验证输入
    if (!title) {
        alert('请输入问题标题');
        return;
    }
    if (!content) {
        alert('请输入问题描述');
        return;
    }
    if (!answer) {
        alert('请输入问题解答');
        return;
    }
    if (!categoryId) {
        alert('请选择分类');
        return;
    }

    // 显示加载状态
    const submitBtn = document.getElementById('submit-faq');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
    submitBtn.disabled = true;

    // 发送请求
    fetch('/api/admin/add_question', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            content: content,
            answer: answer,
            category_id: parseInt(categoryId),
            is_featured: isFeatured
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络请求失败');
        }
        return response.json();
    })
    .then(data => {
        console.log('提交响应:', data);
        if (data.success) {
            alert('问题添加成功！');
            resetFAQForm();
            // 刷新FAQ列表
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            alert('添加失败: ' + (data.message || data.error || '未知错误'));
        }
    })
    .catch(error => {
        console.error('提交失败:', error);
        alert('提交过程中发生错误: ' + error.message);
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

// 重置FAQ表单
function resetFAQForm() {
    document.getElementById('faq-title').value = '';
    document.getElementById('faq-content').value = '';
    document.getElementById('faq-answer').value = '';
    document.getElementById('faq-category').value = '';
    document.getElementById('faq-featured').checked = false;
    console.log('FAQ表单已重置');
}

// 打开回复模态框
function openReplyModal(questionId) {
    console.log('打开回复模态框:', questionId);

    // 从页面中获取问题详情
    const questionElement = document.querySelector(`[data-id="${questionId}"]`);
    if (!questionElement) {
        alert('找不到问题信息');
        return;
    }

    const title = questionElement.querySelector('.user-question-header h4').textContent;
    const content = questionElement.querySelector('.user-question-content p').textContent;
    const existingAnswer = questionElement.querySelector('.question-answer p')?.textContent || '';

    // 创建模态框
    const modalHtml = `
        <div class="modal">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h4>回复用户提问</h4>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="question-preview">
                        <h5>问题标题：${escapeHtml(title)}</h5>
                        <p>${escapeHtml(content)}</p>
                    </div>
                    <div class="form-group">
                        <label for="reply-content">回复内容 *</label>
                        <textarea id="reply-content" rows="6" placeholder="请输入回复内容...">${escapeHtml(existingAnswer)}</textarea>
                    </div>
                    <input type="hidden" id="reply-question-id" value="${questionId}">
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="submit-reply">提交回复</button>
                    <button class="btn btn-secondary close-modal">取消</button>
                </div>
            </div>
        </div>
    `;

    // 插入模态框
    const modalContainer = document.getElementById('modal-container') || createModalContainer();
    modalContainer.innerHTML = modalHtml;

    // 绑定事件
    const modal = modalContainer.querySelector('.modal');
    modal.querySelectorAll('.close-modal, .modal-overlay').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
    });

    // 提交回复按钮
    modal.querySelector('#submit-reply').addEventListener('click', function() {
        submitReply(questionId);
    });

    // 显示模态框
    modal.style.display = 'flex';
}

// 提交回复
function submitReply(questionId) {
    const answer = document.getElementById('reply-content').value.trim();

    if (!answer) {
        alert('请输入回复内容');
        return;
    }

    const submitBtn = document.getElementById('submit-reply');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
    submitBtn.disabled = true;

    fetch(`/api/admin/answer_user_question/${questionId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: answer })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('回复提交成功！');
            // 关闭模态框
            const modal = document.querySelector('.modal');
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
            // 刷新页面
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            alert('回复失败: ' + (data.message || data.error || '未知错误'));
        }
    })
    .catch(error => {
        console.error('回复失败:', error);
        alert('回复过程中发生错误: ' + error.message);
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

// 删除用户问题
function deleteUserQuestion(questionId) {
    if (!confirm('确定要删除这个问题吗？此操作不可撤销。')) {
        return;
    }

    fetch(`/api/admin/delete_user_question/${questionId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('问题删除成功！');
            // 刷新页面
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            alert('删除失败: ' + (data.message || data.error || '未知错误'));
        }
    })
    .catch(error => {
        console.error('删除失败:', error);
        alert('删除过程中发生错误: ' + error.message);
    });
}

// 删除FAQ问题
function deleteFAQ(questionId) {
    if (!confirm('确定要删除这个FAQ吗？此操作不可撤销。')) {
        return;
    }

    fetch(`/api/admin/delete_question/${questionId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('FAQ删除成功！');
            // 刷新页面
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            alert('删除失败: ' + (data.message || data.error || '未知错误'));
        }
    })
    .catch(error => {
        console.error('删除失败:', error);
        alert('删除过程中发生错误: ' + error.message);
    });
}

// 创建模态框容器
function createModalContainer() {
    const container = document.createElement('div');
    container.id = 'modal-container';
    document.body.appendChild(container);
    return container;
}
// 打开编辑FAQ模态框
function openEditFAQModal(questionId) {
    console.log('打开编辑FAQ模态框:', questionId);

    // 首先获取问题数据
    fetch(`/api/admin/faq_question/${questionId}`)
        .then(response => response.json())
        .then(data => {
            console.log('获取到的问题数据:', data);
            showEditFAQModal(data);
        })
        .catch(error => {
            console.error('获取问题数据失败:', error);
            alert('获取问题数据失败: ' + error.message);
        });
}

// 显示编辑FAQ模态框
function showEditFAQModal(question) {
    console.log('显示编辑模态框:', question);

    // 创建模态框HTML
    const modalHtml = `
        <div class="modal">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h4>编辑FAQ问题</h4>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="edit-faq-title">问题标题 *</label>
                        <input type="text" id="edit-faq-title" value="${escapeHtml(question.title || '')}" placeholder="请输入问题标题">
                    </div>

                    <div class="form-group">
                        <label for="edit-faq-content">问题描述 *</label>
                        <textarea id="edit-faq-content" rows="3" placeholder="请输入问题描述">${escapeHtml(question.content || '')}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="edit-faq-answer">问题解答 *</label>
                        <textarea id="edit-faq-answer" rows="6" placeholder="请输入详细解答，支持HTML格式">${escapeHtml(question.answer || '')}</textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="edit-faq-category">分类 *</label>
                            <select id="edit-faq-category">
                                <option value="">选择分类</option>
                                ${getCategoriesOptions(question.category_id)}
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="edit-faq-featured">推荐状态</label>
                            <div class="checkbox-group">
                                <input type="checkbox" id="edit-faq-featured" ${question.is_featured ? 'checked' : ''}>
                                <label for="edit-faq-featured">设为推荐问题</label>
                            </div>
                        </div>
                    </div>

                    <input type="hidden" id="edit-faq-id" value="${question.id}">
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" id="save-edit-faq">保存修改</button>
                    <button class="btn btn-secondary close-modal">取消</button>
                </div>
            </div>
        </div>
    `;

    // 插入模态框
    const modalContainer = document.getElementById('modal-container') || createModalContainer();
    modalContainer.innerHTML = modalHtml;

    // 绑定事件
    const modal = modalContainer.querySelector('.modal');
    modal.querySelectorAll('.close-modal, .modal-overlay').forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
        });
    });

    // 保存修改按钮
    modal.querySelector('#save-edit-faq').addEventListener('click', function() {
        saveFAQEdit(question.id);
    });

    // 显示模态框
    modal.style.display = 'flex';

    // 加载分类选项
    loadCategoriesForEdit();
}

// 加载分类选项
function loadCategoriesForEdit() {
    fetch('/api/categories')
        .then(response => response.json())
        .then(categories => {
            const select = document.getElementById('edit-faq-category');
            if (select && categories.length > 0) {
                // 清空现有选项（除了第一个）
                while (select.options.length > 1) {
                    select.remove(1);
                }

                // 添加分类选项
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => console.error('加载分类失败:', error));
}

// 生成分类选项HTML
function getCategoriesOptions(selectedCategoryId) {
    // 这里暂时返回空字符串，通过JS动态加载
    return '';
}

// 保存FAQ编辑
function saveFAQEdit(questionId) {
    const title = document.getElementById('edit-faq-title').value.trim();
    const content = document.getElementById('edit-faq-content').value.trim();
    const answer = document.getElementById('edit-faq-answer').value.trim();
    const categoryId = document.getElementById('edit-faq-category').value;
    const isFeatured = document.getElementById('edit-faq-featured').checked;

    // 验证输入
    if (!title) {
        alert('请输入问题标题');
        return;
    }
    if (!content) {
        alert('请输入问题描述');
        return;
    }
    if (!answer) {
        alert('请输入问题解答');
        return;
    }
    if (!categoryId) {
        alert('请选择分类');
        return;
    }

    const saveBtn = document.getElementById('save-edit-faq');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
    saveBtn.disabled = true;

    fetch(`/api/admin/edit_faq/${questionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            content: content,
            answer: answer,
            category_id: parseInt(categoryId),
            is_featured: isFeatured
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('编辑保存响应:', data);
        if (data.success) {
            alert('修改保存成功！');
            // 关闭模态框
            const modal = document.querySelector('.modal');
            modal.style.display = 'none';
            setTimeout(() => modal.remove(), 300);
            // 刷新页面
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            alert('保存失败: ' + (data.message || data.error || '未知错误'));
        }
    })
    .catch(error => {
        console.error('保存失败:', error);
        alert('保存过程中发生错误: ' + error.message);
    })
    .finally(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    });
}

// HTML转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
