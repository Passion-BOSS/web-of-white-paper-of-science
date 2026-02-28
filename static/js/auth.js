// 用户认证相关功能

document.addEventListener('DOMContentLoaded', function() {
    // 登录表单验证
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!username || !password) {
                showAlert('请输入用户名和密码', 'error');
                return;
            }

            // 显示加载状态
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
            submitBtn.disabled = true;

            // 发送登录请求
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'username': username,
                    'password': password
                })
            })
            .then(response => response.text())
            .then(html => {
                // 检查是否重定向
                if (html.includes('登录成功')) {
                    window.location.href = '/';
                } else {
                    // 解析错误信息
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const flashMessage = doc.querySelector('.flash-error');
                    if (flashMessage) {
                        showAlert(flashMessage.textContent.trim(), 'error');
                    } else {
                        showAlert('登录失败，请检查用户名和密码', 'error');
                    }
                }
            })
            .catch(error => {
                console.error('登录错误:', error);
                showAlert('登录过程中发生错误，请稍后重试', 'error');
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }

    // 注册表单验证
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirm_password').value.trim();
            const secretKey = document.getElementById('secret_key').value.trim();

            // 验证输入
            if (!username || !email || !password || !confirmPassword) {
                showAlert('请填写所有必填字段', 'error');
                return;
            }

            if (username.length < 3 || username.length > 20) {
                showAlert('用户名长度应为3-20个字符', 'error');
                return;
            }

            if (!validateEmail(email)) {
                showAlert('请输入有效的邮箱地址', 'error');
                return;
            }

            if (password.length < 6) {
                showAlert('密码长度至少为6个字符', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showAlert('两次输入的密码不一致', 'error');
                return;
            }

            // 显示加载状态
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 注册中...';
            submitBtn.disabled = true;

            // 发送注册请求
            fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'username': username,
                    'email': email,
                    'password': password,
                    'confirm_password': confirmPassword,
                    'secret_key': secretKey
                })
            })
            .then(response => response.text())
            .then(html => {
                if (html.includes('注册成功')) {
                    showAlert('注册成功！正在跳转到登录页面...', 'success');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else {
                    // 解析错误信息
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const flashMessage = doc.querySelector('.flash-error');
                    if (flashMessage) {
                        showAlert(flashMessage.textContent.trim(), 'error');
                    } else {
                        showAlert('注册失败，请稍后重试', 'error');
                    }
                }
            })
            .catch(error => {
                console.error('注册错误:', error);
                showAlert('注册过程中发生错误，请稍后重试', 'error');
            })
            .finally(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }

    // 密码可见性切换
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // 显示/隐藏管理员密钥字段
    const showSecretKeyCheckbox = document.getElementById('showSecretKey');
    if (showSecretKeyCheckbox) {
        showSecretKeyCheckbox.addEventListener('change', function() {
            const secretKeyField = document.getElementById('secretKeyField');
            if (secretKeyField) {
                secretKeyField.style.display = this.checked ? 'block' : 'none';
            }
        });
    }
});

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

// 验证表单输入
function validateForm(formData) {
    const errors = [];

    if (!formData.username) {
        errors.push('请输入用户名');
    }

    if (!formData.email) {
        errors.push('请输入邮箱');
    } else if (!validateEmail(formData.email)) {
        errors.push('请输入有效的邮箱地址');
    }

    if (!formData.password) {
        errors.push('请输入密码');
    } else if (formData.password.length < 6) {
        errors.push('密码长度至少为6个字符');
    }

    if (formData.password !== formData.confirmPassword) {
        errors.push('两次输入的密码不一致');
    }

    return errors;
}

// 显示加载状态
function showLoading(element) {
    element.disabled = true;
    const originalText = element.innerHTML;
    element.dataset.originalText = originalText;
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
    return originalText;
}

// 隐藏加载状态
function hideLoading(element, originalText) {
    element.disabled = false;
    element.innerHTML = originalText;
}

// 检查用户登录状态
function checkAuthStatus() {
    fetch('/api/auth/status')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                updateUIForLoggedInUser(data.user);
            } else {
                updateUIForGuest();
            }
        })
        .catch(error => {
            console.error('检查登录状态失败:', error);
        });
}

// 更新用户界面（已登录）
function updateUIForLoggedInUser(user) {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <span class="user-welcome">欢迎, ${user.username}</span>
            <a href="/logout" class="btn btn-outline">
                <i class="fas fa-sign-out-alt"></i>退出
            </a>
        `;
    }
}

// 更新用户界面（游客）
function updateUIForGuest() {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons) {
        authButtons.innerHTML = `
            <a href="/login" class="btn btn-outline">
                <i class="fas fa-sign-in-alt"></i>登录
            </a>
            <a href="/register" class="btn btn-primary">
                <i class="fas fa-user-plus"></i>注册
            </a>
        `;
    }
}

// 登出
function logout() {
    fetch('/logout')
        .then(response => {
            if (response.ok) {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('登出失败:', error);
            showAlert('登出失败，请刷新页面重试', 'error');
        });
}