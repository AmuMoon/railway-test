#!/bin/bash
# Railway 爬虫设置脚本
# 在项目根目录运行: bash scripts/setup-railway-cron.sh

echo "🚀 Dota2 爬虫 Railway 设置助手"
echo "================================"
echo ""

# 检查 Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI 未安装"
    echo "请先安装: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI 已安装"

# 检查登录状态
if ! railway whoami &> /dev/null; then
    echo "🔑 请先登录 Railway"
    railway login
fi

echo "✅ 已登录 Railway"
echo ""

# 显示当前项目
echo "📁 当前项目:"
railway status
echo ""

# 提供设置选项
echo "请选择设置方式:"
echo "1) 使用 Railway 原生 Cron (推荐)"
echo "2) 使用 GitHub Actions"
echo "3) 跳过，只显示说明"
echo ""
read -p "请输入选项 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📋 Railway 原生 Cron 设置步骤:"
        echo "--------------------------------"
        echo "1. 打开 Railway Dashboard:"
        echo "   https://railway.com/dashboard"
        echo ""
        echo "2. 选择你的项目，进入 Settings"
        echo ""
        echo "3. 找到 'Cron Jobs' 部分，点击 'Add Cron Job'"
        echo ""
        echo "4. 填写以下信息:"
        echo "   - Schedule: 0 * * * *  (每小时)"
        echo "   - Command: npx tsx scripts/crawler.ts"
        echo ""
        echo "5. 点击 'Save' 保存"
        echo ""
        echo "✅ 完成！爬虫将每小时自动运行"
        ;;
    2)
        echo ""
        echo "📋 GitHub Actions 设置步骤:"
        echo "---------------------------"
        echo "1. 在 GitHub 仓库设置中添加 Secret:"
        echo "   - 名称: DATABASE_URL"
        echo "   - 值: 你的 Railway PostgreSQL 连接字符串"
        echo ""
        echo "2. 获取连接字符串的方法:"
        echo "   railway connect postgres"
        echo "   或从 Railway Dashboard -> PostgreSQL -> Connect 复制"
        echo ""
        echo "3. 推送 .github/workflows/crawler.yml 到仓库"
        echo ""
        echo "4. GitHub Actions 将自动每小时运行爬虫"
        echo ""
        echo "✅ 完成！"
        ;;
    3)
        echo ""
        echo "📚 请参考 CRAWLER.md 获取详细说明"
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "📖 其他有用命令:"
echo "----------------"
echo "手动运行爬虫:    npx tsx scripts/crawler.ts"
echo "查看日志:        railway logs"
echo "数据库迁移:      npx prisma migrate deploy"
echo "测试API:         curl http://localhost:3000/api/players/cached"
