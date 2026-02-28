from flask import Flask, render_template, request, jsonify, redirect, url_for, flash,send_from_directory
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Category, Question, UserQuestion, ProcessStep
from config import Config
from datetime import datetime  # 添加这行
# 在文件顶部添加
from flask_login import current_user, login_required
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__,static_folder='static',static_url_path='/static')
app.config.from_object(Config)

# 初始化扩展
db.init_app(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# 初始化数据库
with app.app_context():
    db.create_all()

    # 插入初始数据（如果表为空）
    if Category.query.count() == 0:
        categories = [
            Category(name='基础知识', slug='basic', description='零基础能否参加？比赛区别？对保研、奖学金的影响？',
                     icon='fa-question-circle'),
            Category(name='团队与组队', slug='team', description='团队人数、分工、找队友方法、组长与组员区别',
                     icon='fa-users'),
            Category(name='指导老师', slug='mentor', description='如何寻找指导老师、联系方法、需要准备的材料',
                     icon='fa-chalkboard-teacher'),
            Category(name='选题与创新', slug='topic', description='没有想法怎么办、选题大小把控、创新点寻找',
                     icon='fa-lightbulb'),
            Category(name='申报与材料', slug='application', description='申报书撰写技巧、重点内容、被刷原因',
                     icon='fa-file-alt'),
            Category(name='流程与时间', slug='process', description='比赛时间安排、占用时间、流程时长',
                     icon='fa-project-diagram'),
            Category(name='成果与获奖', slug='result', description='论文、专利要求、实物实验要求、获奖难度',
                     icon='fa-trophy'),
            Category(name='其他问题', slug='other', description='对考研/工作的帮助、经费设备问题、跨专业项目',
                     icon='fa-comments'),
        ]
        db.session.bulk_save_objects(categories)

    if Question.query.count() == 0:
        questions = [
            Question(
                title='零基础、没做过科研，能参加大创/挑战杯吗？',
                content='零基础、没做过科研，能参加大创/挑战杯吗？',
                answer='当然可以！很多获奖项目团队都是从零开始的。建议：1) 寻找有经验的队友或指导老师；2) 从校级比赛开始积累经验；3) 参加学校组织的培训讲座；4) 查阅往年优秀作品学习。关键是要有学习热情和坚持的毅力。',
                category_id=1,
                views=245,
                is_featured=True
            ),
            Question(
                title='大创、挑战杯、互联网+到底有什么区别？',
                content='大创、挑战杯、互联网+到底有什么区别？',
                answer='1) <strong>大创（大学生创新创业训练计划）</strong>：更偏重科研训练和过程培养，周期较长（1-2年），结题需要成果；<br>2) <strong>挑战杯</strong>：分为"课外学术科技作品竞赛"和"创业计划竞赛"，更注重学术性和创新性；<br>3) <strong>互联网+</strong>：更侧重创业实践和商业模式，要求项目有市场前景和落地可能性。',
                category_id=1,
                views=189,
                is_featured=True
            ),
            Question(
                title='团队一般几个人？分工怎么分？',
                content='团队一般几个人？分工怎么分？',
                answer='通常3-5人最为合适。常见分工：<br>1) <strong>项目负责人</strong>：统筹全局，把握进度，对外联络；<br>2) <strong>技术核心</strong>：负责核心技术实现，实验/开发；<br>3) <strong>市场调研</strong>：负责市场分析，用户调研，商业模式；<br>4) <strong>文案与设计</strong>：负责申报书撰写，PPT制作，视觉设计；<br>5) <strong>财务与后勤</strong>：负责预算，物资，会议记录等。可以根据项目特点灵活调整。',
                category_id=2,
                views=176,
                is_featured=True
            ),
            Question(
                title='怎么找指导老师？直接去问吗？',
                content='怎么找指导老师？直接去问吗？',
                answer='是的，可以直接联系，但需要做好准备工作：<br>1) <strong>前期准备</strong>：了解老师的研究方向，阅读相关论文；<br>2) <strong>初步构思</strong>：有一个初步的项目想法，哪怕不成熟；<br>3) <strong>礼貌联系</strong>：通过邮件或课后时间，简要介绍自己和项目想法；<br>4) <strong>展现诚意</strong>：表达学习热情和坚持的决心。大部分老师都愿意指导学生。',
                category_id=3,
                views=203,
                is_featured=True
            ),
        ]
        db.session.bulk_save_objects(questions)

    if ProcessStep.query.count() == 0:
        steps = [
            ProcessStep(step_number=1, title='了解比赛', description='研究比赛规则、时间、要求', icon='fa-search',
                        tips='重点关注比赛官方网站和学校创新创业学院通知'),
            ProcessStep(step_number=2, title='报名信息', description='关注通知、准备报名材料', icon='fa-edit',
                        tips='注意报名截止时间，提前准备所需材料'),
            ProcessStep(step_number=3, title='组建团队', description='寻找队友、确定分工', icon='fa-users',
                        tips='寻找不同专业背景的队友，形成优势互补'),
            ProcessStep(step_number=4, title='邀请导师', description='联系指导老师、确定方向',
                        icon='fa-chalkboard-teacher', tips='提前了解老师研究方向，准备好项目构思'),
            ProcessStep(step_number=5, title='确定选题', description='头脑风暴、确定项目方向', icon='fa-lightbulb',
                        tips='选题要兼具创新性和可行性，避免过大或过小'),
            ProcessStep(step_number=6, title='撰写材料', description='申报书、PPT等材料准备', icon='fa-file-alt',
                        tips='突出项目创新点和团队优势，注意格式规范'),
            ProcessStep(step_number=7, title='模拟答辩', description='预演答辩、优化展示', icon='fa-comments',
                        tips='多次演练，控制时间，准备好问答环节'),
            ProcessStep(step_number=8, title='最终提交', description='提交材料、参加比赛', icon='fa-paper-plane',
                        tips='提前提交，留出修改时间，注意备份'),
        ]
        db.session.bulk_save_objects(steps)

    db.session.commit()


# 路由定义
@app.route('/')
def index():
    try:
        # 获取推荐问题
        featured_questions = Question.query.filter_by(is_featured=True).order_by(Question.views.desc()).limit(10).all()

        # 获取所有分类
        categories = Category.query.all()

        # 为每个分类添加问题计数
        for category in categories:
            category.question_count = Question.query.filter_by(category_id=category.id).count()

        # 获取流程步骤
        process_steps = ProcessStep.query.order_by(ProcessStep.step_number).all()

        # 打印调试信息
        print(f"DEBUG - categories变量名: {len(categories)}条数据")
        print(f"DEBUG - featured_questions变量名: {len(featured_questions)}条数据")
        print(f"DEBUG - process_steps变量名: {len(process_steps)}条数据")

        print(
            f"DEBUG: 加载了{len(featured_questions)}个推荐问题，{len(categories)}个分类，{len(process_steps)}个流程步骤")

        return render_template('index.html',
                               featured_questions=featured_questions,
                               categories=categories,
                               process_steps=process_steps)
    except Exception as e:
        print(f"ERROR: index路由错误: {e}")
        return render_template('index.html',
                               featured_questions=[],
                               categories=[],
                               process_steps=[])


@app.route('/guests')
def guests():
    """科创榜样页面"""
    return render_template('guests.html')

@app.route('/categories')
def categories():
    category_slug = request.args.get('category', '')
    search_query = request.args.get('search', '')

    categories_list = Category.query.all()

    # 打印调试信息
    print(f"分类页面 - 分类数量: {len(categories_list)}")
    print(f"分类页面 - 当前分类: {category_slug}")

    # 为每个分类添加问题计数
    for category in categories_list:
        category.faq_questions = Question.query.filter_by(category_id=category.id).all()
        category.question_count = len(category.faq_questions)
        print(f"分类: {category.name}, 问题数: {category.question_count}")

    if category_slug:
        category = Category.query.filter_by(slug=category_slug).first()
        if category:
            questions = Question.query.filter_by(category_id=category.id).all()
            print(f"分类'{category.name}'的问题数量: {len(questions)}")
        else:
            questions = []
            print(f"未找到分类: {category_slug}")
    else:
        questions = Question.query.all()
        print(f"所有问题数量: {len(questions)}")

    return render_template('categories.html',
                           categories=categories_list,
                           questions=questions,
                           current_category=category_slug,
                           search_query=search_query)

@app.route('/process_guide')
def process_guide():
    process_steps = ProcessStep.query.order_by(ProcessStep.step_number).all()
    return render_template('process_guide.html', process_steps=process_steps)


@app.route('/api/admin/edit_process_step/<int:step_id>', methods=['PUT'])
@login_required
def api_edit_process_step(step_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'error': '无权限操作'}), 403

    data = request.get_json()
    step = ProcessStep.query.get_or_404(step_id)

    try:
        if 'title' in data:
            step.title = data['title']
        if 'description' in data:
            step.description = data['description']
        if 'tips' in data:
            step.tips = data['tips']

        db.session.commit()
        return jsonify({'success': True, 'message': '流程步骤更新成功'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/categories')
def api_categories():
    categories = Category.query.all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'slug': c.slug,
        'description': c.description,
        'icon': c.icon
    } for c in categories])


@app.route('/api/admin/stats')
@login_required
def api_admin_stats():
    if not current_user.is_admin:
        return jsonify({'error': '无权限访问'}), 403

    total_questions = Question.query.count()
    total_user_questions = UserQuestion.query.count()
    pending_questions = UserQuestion.query.filter_by(status='pending').count()
    answered_questions = UserQuestion.query.filter_by(status='answered').count()

    return jsonify({
        'total_questions': total_questions,
        'total_user_questions': total_user_questions,
        'pending_questions': pending_questions,
        'answered_questions': answered_questions
    })
@app.route('/detail/<int:question_id>')
def detail(question_id):
    question = Question.query.get_or_404(question_id)
    # 增加浏览量
    question.views += 1
    db.session.commit()

    related_questions = Question.query.filter(
        Question.category_id == question.category_id,
        Question.id != question.id
    ).order_by(Question.views.desc()).limit(5).all()

    return render_template('detail.html',
                           question=question,
                           related_questions=related_questions)


@app.route('/ask', methods=['GET', 'POST'])
def ask():
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()
        category = request.form.get('category', 'other')
        email = request.form.get('email', '').strip()

        if not title or not content:
            flash('请填写问题标题和内容', 'error')
            return redirect(url_for('ask'))

        # 创建用户提问
        user_question = UserQuestion(
            title=title,
            content=content,
            category=category,
            user_email=email,
            user_id=current_user.id if current_user.is_authenticated else None
        )

        db.session.add(user_question)
        db.session.commit()

        flash('问题提交成功！我们将在24小时内回复。', 'success')
        return redirect(url_for('index'))

    categories = Category.query.all()
    return render_template('ask.html', categories=categories)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            flash('登录成功！', 'success')
            next_page = request.args.get('next')
            return redirect(next_page or url_for('index'))
        else:
            flash('用户名或密码错误', 'error')

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()
        confirm_password = request.form.get('confirm_password', '').strip()
        secret_key = request.form.get('secret_key', '').strip()

        # 验证
        if not username or not email or not password:
            flash('请填写所有必填字段', 'error')
            return redirect(url_for('register'))

        if password != confirm_password:
            flash('两次输入的密码不一致', 'error')
            return redirect(url_for('register'))

        # 检查用户名和邮箱是否已存在
        if User.query.filter_by(username=username).first():
            flash('用户名已存在', 'error')
            return redirect(url_for('register'))

        if User.query.filter_by(email=email).first():
            flash('邮箱已存在', 'error')
            return redirect(url_for('register'))

        # 创建用户
        is_admin = (secret_key == app.config['ADMIN_SECRET_KEY'])
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            is_admin=is_admin
        )

        db.session.add(user)
        db.session.commit()

        flash('注册成功！' + ('您已成为管理员。' if is_admin else ''), 'success')
        return redirect(url_for('login'))

    return render_template('register.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('已退出登录', 'info')
    return redirect(url_for('index'))


@app.route('/admin')
@login_required
def admin():
    if not current_user.is_admin:
        flash('需要管理员权限', 'error')
        return redirect(url_for('index'))

    # 获取数据
    user_questions = UserQuestion.query.order_by(UserQuestion.created_at.desc()).all()
    faq_questions = Question.query.order_by(Question.created_at.desc()).all()
    categories = Category.query.all()

    return render_template('admin.html',
                           user_questions=user_questions,
                           faq_questions=faq_questions,
                           categories=categories)


# API 路由
@app.route('/api/admin/add_question', methods=['POST'])
@login_required
def api_add_question():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '需要管理员权限'}), 403

    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': '无效的请求数据'}), 400

        # 验证必需字段
        required_fields = ['title', 'content', 'answer', 'category_id']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'success': False, 'message': f'缺少必需字段: {field}'}), 400

        question = Question(
            title=data['title'],
            content=data['content'],
            answer=data['answer'],
            category_id=data['category_id'],
            is_featured=data.get('is_featured', False)
        )

        db.session.add(question)
        db.session.commit()

        return jsonify({'success': True, 'message': '问题添加成功', 'id': question.id})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/delete_user_question/<int:question_id>', methods=['DELETE'])
@login_required
def delete_user_question(question_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'error': '无权限操作'}), 403

    question = UserQuestion.query.get_or_404(question_id)

    try:
        db.session.delete(question)
        db.session.commit()
        return jsonify({'success': True, 'message': '删除成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/delete_question/<int:question_id>', methods=['DELETE'])
@login_required
def api_delete_question(question_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'error': '无权限操作'}), 403

    try:
        question = Question.query.get_or_404(question_id)
        db.session.delete(question)
        db.session.commit()
        return jsonify({'success': True, 'message': 'FAQ删除成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
@app.route('/api/admin/answer_user_question/<int:question_id>', methods=['POST'])
@login_required
def api_answer_user_question(question_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': '需要管理员权限'})

    data = request.get_json()
    user_question = UserQuestion.query.get_or_404(question_id)

    try:
        user_question.answer = data['answer']
        user_question.status = 'answered'
        user_question.admin_id = current_user.id
        user_question.answered_at = datetime.utcnow()

        db.session.commit()

        return jsonify({'success': True, 'message': '回答提交成功'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


@app.route('/api/search')
def api_search():
    query = request.args.get('q', '')

    if not query:
        return jsonify({'results': []})

    questions = Question.query.filter(
        Question.title.ilike(f'%{query}%') |
        Question.content.ilike(f'%{query}%') |
        Question.answer.ilike(f'%{query}%')
    ).order_by(Question.views.desc()).limit(10).all()

    results = []
    for q in questions:
        results.append({
            'id': q.id,
            'title': q.title,
            'answer': q.answer[:100] + '...' if len(q.answer) > 100 else q.answer,
            'category': q.category_ref.name if q.category_ref else '未知分类',
            'views': q.views
        })

    return jsonify({'results': results})


# 添加以下路由到app.py

@app.route('/api/admin/user_questions')
@login_required
def api_admin_user_questions():
    if not current_user.is_admin:
        return jsonify({'error': '无权限访问'}), 403

    user_questions = UserQuestion.query.order_by(UserQuestion.created_at.desc()).all()

    return jsonify({
        'questions': [{
            'id': q.id,
            'title': q.title,
            'content': q.content,
            'category': q.category,
            'status': q.status,
            'user_email': q.user_email,
            'answer': q.answer or '',
            'created_at': q.created_at.strftime('%Y-%m-%d %H:%M'),
            'answered_at': q.answered_at.strftime('%Y-%m-%d %H:%M') if q.answered_at else None
        } for q in user_questions]
    })


@app.route('/api/admin/faq_questions')
@login_required
def api_admin_faq_questions():
    if not current_user.is_admin:
        return jsonify({'error': '无权限访问'}), 403

    faq_questions = Question.query.order_by(Question.created_at.desc()).all()

    return jsonify({
        'questions': [{
            'id': q.id,
            'title': q.title,
            'category_name': q.category.name if q.category else '未知',
            'views': q.views,
            'is_featured': q.is_featured
        } for q in faq_questions]
    })

@app.route('/api/admin/questions')
@login_required
def api_admin_questions():
    if not current_user.is_admin:
        return jsonify({'error': '无权限访问'}), 403

    status = request.args.get('status', 'all')
    category = request.args.get('category', 'all')
    page = request.args.get('page', 1, type=int)

    # 查询用户提问
    query = UserQuestion.query

    if status != 'all':
        query = query.filter_by(status=status)

    if category != 'all':
        query = query.filter_by(category=category)

    questions = query.order_by(UserQuestion.created_at.desc()).all()

    return jsonify({
        'questions': [{
            'id': q.id,
            'title': q.title,
            'content': q.content,
            'category': q.category,
            'status': q.status,
            'user_email': q.user_email,
            'answer': q.answer,
            'created_at': q.created_at.strftime('%Y-%m-%d %H:%M'),
            'answered_at': q.answered_at.strftime('%Y-%m-%d %H:%M') if q.answered_at else None
        } for q in questions],
        'total': len(questions)
    })


@app.route('/api/admin/question/<int:question_id>')
@login_required
def api_get_question(question_id):
    if not current_user.is_admin:
        return jsonify({'error': '无权限访问'}), 403

    question = Question.query.get_or_404(question_id)

    return jsonify({
        'id': question.id,
        'title': question.title,
        'content': question.content,
        'answer': question.answer,
        'category_id': question.category_id,
        'is_featured': question.is_featured
    })


@app.route('/api/admin/edit_question/<int:question_id>', methods=['PUT'])
@login_required
def api_edit_question(question_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'error': '无权限操作'}), 403

    question = Question.query.get_or_404(question_id)
    data = request.get_json()

    try:
        if 'title' in data:
            question.title = data['title']
        if 'content' in data:
            question.content = data['content']
        if 'answer' in data:
            question.answer = data['answer']
        if 'category_id' in data:
            question.category_id = data['category_id']
        if 'is_featured' in data:
            question.is_featured = data['is_featured']

        db.session.commit()
        return jsonify({'success': True, 'message': '修改保存成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/user_question/<int:question_id>')
@login_required
def get_user_question(question_id):
    if not current_user.is_admin:
        return jsonify({'error': '无权限访问'}), 403

    question = UserQuestion.query.get_or_404(question_id)
    return jsonify({  # 直接返回数据，不要嵌套'question'键
        'id': question.id,
        'title': question.title,
        'content': question.content,
        'answer': question.answer or '',
        'status': question.status
    })

@app.route('/api/admin/reply_question/<int:question_id>', methods=['POST'])
@login_required
def reply_user_question(question_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'error': '无权限操作'}), 403

    data = request.get_json()
    question = UserQuestion.query.get_or_404(question_id)

    try:
        question.answer = data.get('answer', '')
        question.status = 'answered'
        question.answered_at = datetime.now()
        db.session.commit()

        return jsonify({'success': True, 'message': '回复成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/admin/faq_question/<int:question_id>')
@login_required
def get_faq_question(question_id):
    if not current_user.is_admin:
        return jsonify({'error': '无权限访问'}), 403

    question = Question.query.get_or_404(question_id)
    return jsonify({
        'id': question.id,
        'title': question.title,
        'content': question.content,
        'answer': question.answer,
        'category_id': question.category_id,
        'is_featured': question.is_featured
    })

@app.route('/api/admin/edit_faq/<int:question_id>', methods=['PUT'])
@login_required
def edit_faq(question_id):
    if not current_user.is_admin:
        return jsonify({'success': False, 'error': '无权限操作'}), 403

    data = request.get_json()
    question = Question.query.get_or_404(question_id)

    try:
        question.title = data.get('title', question.title)
        question.content = data.get('content', question.content)
        question.answer = data.get('answer', question.answer)
        question.category_id = data.get('category_id', question.category_id)
        question.is_featured = data.get('is_featured', question.is_featured)
        question.updated_at = datetime.now()

        db.session.commit()
        return jsonify({'success': True, 'message': 'FAQ修改成功'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/guest/inbox', methods=['GET', 'POST'])
def guest_inbox():
    """游客查询回复的入口"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        category = request.form.get('category', '')

        if not email:
            flash('请输入邮箱地址', 'error')
            return redirect(url_for('guest_inbox'))

        # 查询该邮箱的所有问题和回复
        query = UserQuestion.query.filter_by(user_email=email)

        # 如果选择了分类，则添加分类筛选
        if category:
            query = query.filter_by(category=category)

        user_questions = query.order_by(UserQuestion.created_at.desc()).all()

        return render_template('guest_inbox.html',
                               email=email,
                               questions=user_questions,
                               has_searched=True)

    return render_template('guest_inbox.html', has_searched=False)

@app.route('/guest/question/<int:question_id>')
def guest_question_detail(question_id):
    """游客查看问题详情"""
    question = UserQuestion.query.get_or_404(question_id)
    return render_template('guest_question_detail.html', question=question)


@app.route('/api/admin/toggle_featured/<int:question_id>', methods=['POST'])
@login_required
def toggle_featured(question_id):
    """切换问题的推荐状态"""
    if not current_user.is_admin:
        return jsonify({'success': False, 'error': '无权限操作'}), 403

    try:
        question = Question.query.get_or_404(question_id)

        # 切换推荐状态
        question.is_featured = not question.is_featured
        question.updated_at = datetime.now()
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'已{"取消" if not question.is_featured else "设为"}推荐',
            'is_featured': question.is_featured
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
if __name__ == '__main__':
    app.run(debug=True)