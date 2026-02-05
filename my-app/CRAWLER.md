# Dota2 天梯爬虫服务

## 架构说明

本服务采用**定时爬虫+缓存**架构，避免实时API调用导致的限流和页面加载慢的问题。

```
┌─────────────────────────────────────────────────────────────┐
│                    Railway 部署环境                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │   Next.js    │────▶│  PostgreSQL  │◀────│  Cron Job    │ │
│  │   Web App    │     │   (Cache)    │     │  (每小时)     │ │
│  └──────────────┘     └──────────────┘     └──────────────┘ │
│                              ▲                    │         │
│                              │                    ▼         │
│                              │              ┌──────────────┐ │
│                              └──────────────│ OpenDota API │ │
│                                             └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 数据流程

1. **爬虫脚本** (`scripts/crawler.ts`) 每小时运行一次
2. 爬取36名玩家的数据（基本信息、段位、胜负、最近5场比赛）
3. 数据存储到 PostgreSQL 的 `PlayerCache` 表
4. 排行榜页面从缓存读取数据，秒级加载

## 本地开发

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npx prisma generate

# 运行爬虫（测试）
npm run crawl

# 启动开发服务器
npm run dev
```

## Railway 部署步骤

### 1. 数据库迁移

```bash
# 连接 Railway 数据库并执行迁移
railway connect postgres
npx prisma migrate deploy
```

### 2. 设置定时任务 (Cron Job)

在 Railway Dashboard 中配置：

```yaml
# 方式1: 使用 Railway 原生 Cron (推荐)
# 在 Railway Dashboard -> 你的项目 -> 设置 -> Cron Jobs
# 添加: 0 * * * * (每小时执行)
# 命令: npx tsx scripts/crawler.ts

# 方式2: 使用 GitHub Actions + Railway
# 见 .github/workflows/crawler.yml
```

### 3. 环境变量

确保以下环境变量已设置：

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db"
# 可选: STEAM_API_KEY="your_steam_api_key"
```

## API 端点

| 端点 | 说明 |
|------|------|
| `GET /api/players/cached` | 获取所有36名玩家的缓存数据 |
| `GET /api/player/:steamId` | 获取单个玩家的实时数据（原有API） |

## 爬虫数据字段

```typescript
interface PlayerCache {
  steamId: string;         // Steam ID
  accountId: string;       // Dota2 Account ID
  name: string;            // 中文名称（如"思Kirara"）
  personaname: string;     // Steam昵称
  avatar: string;          // 头像URL
  rankTier: number;        // 段位 (如 35 = 中军5星)
  competitiveRank: string; // 天梯分数
  win: number;             // 胜场
  lose: number;            // 负场
  winRate: number;         // 胜率
  totalGames: number;      // 总场次
  estimatedMmr: number;    // 估算MMR
  recentMatches: Array;    // 最近5场比赛
  lastUpdated: DateTime;   // 更新时间
}
```

## 常见问题

### Q: 爬虫运行频率?
A: 每小时运行一次，爬取全部36名玩家数据。

### Q: 页面展示的数据有多新?
A: 取决于上次爬虫运行时间，最长不超过1小时。

### Q: 可以手动触发爬虫吗?
A: 可以，在 Railway Dashboard 中点击 Cron Job 的 "Run Now" 按钮，或在本地运行 `npm run crawl`。

### Q: 如果 OpenDota API 限流怎么办?
A: 爬虫会间隔500ms请求每个玩家，避免触发限流。如果失败会记录日志并在下次运行时重试。

## 监控

- Railway Dashboard 可查看 Cron Job 执行日志
- 爬虫日志包含每个玩家的处理结果
- 失败次数过多会返回非零退出码，Railway 会标记为失败
