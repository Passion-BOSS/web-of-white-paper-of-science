#!/usr/bin/env python3
"""
科创白皮书应用启动文件
确保所有依赖正确安装和初始化
"""

import os
import sys

# 检查依赖
try:
    from flask import Flask
    from flask_sqlalchemy import SQLAlchemy
    from flask_login import LoginManager
    import werkzeug

    print("✓ 所有依赖已正确安装")
except ImportError as e:
    print(f"✗ 依赖缺失: {e}")
    print("请运行: pip install -r requirements_fixed.txt")
    sys.exit(1)

# 导入应用
from app import app, db

if __name__ == '__main__':
    with app.app_context():
        # 创建数据库表
        db.create_all()
        print("✓ 数据库表已创建")

        # 插入初始数据（如果需要）
        from models import Category, Question, ProcessStep, User
        from werkzeug.security import generate_password_hash

        # 检查并插入默认分类
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
            for category in categories:
                db.session.add(category)
            db.session.commit()
            print("✓ 分类数据已插入")

        # 检查并插入默认问题
        if Question.query.count() == 0:
            basic_category = Category.query.filter_by(slug='basic').first()
            if basic_category:
                questions = [
                    Question(
                        title='零基础、没做过科研，能参加大创/挑战杯吗？',
                        content='零基础、没做过科研，能参加大创/挑战杯吗？',
                        answer='当然可以！很多获奖项目团队都是从零开始的。建议：1) 寻找有经验的队友或指导老师；2) 从校级比赛开始积累经验；3) 参加学校组织的培训讲座；4) 查阅往年优秀作品学习。关键是要有学习热情和坚持的毅力。',
                        category_id=basic_category.id,
                        views=245,
                        is_featured=True
                    ),
                    Question(
                        title='大创、挑战杯、互联网+到底有什么区别？',
                        content='大创、挑战杯、互联网+到底有什么区别？',
                        answer='1) <strong>大创（大学生创新创业训练计划）</strong>：更偏重科研训练和过程培养，周期较长（1-2年），结题需要成果；<br>2) <strong>挑战杯</strong>：分为"课外学术科技作品竞赛"和"创业计划竞赛"，更注重学术性和创新性；<br>3) <strong>互联网+</strong>：更侧重创业实践和商业模式，要求项目有市场前景和落地可能性。',
                        category_id=basic_category.id,
                        views=189,
                        is_featured=True
                    ),
                ]
                for question in questions:
                    db.session.add(question)
                db.session.commit()
                print("✓ 问题数据已插入")

        # 检查并创建管理员用户
        if User.query.filter_by(username='admin').first() is None:
            admin_user = User(
                username='admin',
                email='admin@kcbps.dlut.edu.cn',
                password_hash=generate_password_hash('admin123'),
                is_admin=True
            )
            db.session.add(admin_user)
            db.session.commit()
            print("✓ 管理员用户已创建 (用户名: admin, 密码: admin123)")

    # 运行应用
    print("\n🚀 科创白皮书应用启动中...")
    print("🌐 访问地址: http://localhost:5000")
    print("👑 管理员账号: admin / admin123")
    print("🔑 管理员注册秘钥: kcbps")
    print("\n按 Ctrl+C 停止应用")

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )