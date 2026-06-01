# DND-create

一个面向 D&D 2024 规则的中文角色创建器。

项目已经从单页原型扩展为可用的车卡工具：玩家可以依次完成种族、职业、背景、专长、法术、属性、装备和生命值配置，查看自动汇总的角色卡，并将 HTML 角色卡打印或另存为 PDF。项目还包含一个轻量后端和管理后台，可在不修改前端源码的情况下覆盖种族、职业与背景数据。

> 本项目不是官方规则产品。规则文本、内容使用范围和最终裁定请以你使用的规则书与 DM 决定为准。

演示地址（如仍在运行）：[http://47.120.19.14:8088](http://47.120.19.14:8088)

## 已实现功能

### 玩家端

- 多角色草稿：创建、切换、重命名与删除角色，草稿自动保存在浏览器本地。
- 角色创建流程：基础信息、种族、职业、背景、专长、法术、属性、装备、生命值与最终角色卡。
- 规则联动：自动汇总种族、职业、背景和专长提供的属性、技能、护甲训练与其他选择。
- 职业进阶选择：子职业、职业技能、通用专长和部分职业特性会按等级解锁并提示补全。
- 法术系统：支持职业法术列表、种族法术、戏法、准备法术、法术详情和施法规则查阅。
- 装备选择：支持护甲、盾牌和武器选择；自动计算 AC，并提示护甲训练、盾牌训练和力量不足带来的影响。
- 生命值计算：根据职业生命骰、等级和体质调整值计算生命值。
- HTML 角色卡：生成适合打印的双页角色卡，可通过浏览器打印功能另存为 PDF。
- 自定义职业导入：可以在职业选择页导入本地 JSON 职业数据。

### 管理后台

- 管理种族、职业和背景。
- 新增自定义数据，或覆盖内置数据。
- 编辑和删除已有覆盖项。
- 将被覆盖的内置数据恢复为默认版本。
- 为种族和职业上传图片。
- 使用 SQLite 保存管理端数据。

管理后台地址：`/admin`

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 玩家端与管理端 | Vue 3、Vue Router、Vite |
| 规则数据 | JavaScript 静态模块 |
| 后端 API | Node.js、Express |
| 数据库 | SQLite、better-sqlite3 |
| 身份验证 | JWT、bcrypt |
| 文件上传 | Multer |
| 打印导出 | HTML 打印样式、浏览器打印 |

## 项目结构

```text
DND-create/
├─ public/                 # 静态资源与导入说明
├─ server/
│  ├─ index.js             # Express API、SQLite 初始化、上传服务
│  └─ package.json         # 后端依赖与启动脚本
├─ src/
│  ├─ api/                 # 前端 API 请求与覆盖数据加载
│  ├─ components/          # 通用组件
│  ├─ data/                # 内置规则数据
│  ├─ router/              # 页面路由
│  ├─ utils/               # 属性、HP、AC、进阶、PDF 等计算逻辑
│  └─ views/               # 玩家端、角色卡、打印页与管理后台
├─ test/                   # 轻量规则测试
├─ package.json            # 前端依赖与启动脚本
└─ vite.config.js          # Vite 配置与开发代理
```

## 快速开始

### 仅运行玩家端

只需要体验内置规则数据时，可以只启动前端：

```bash
npm install
npm run dev
```

浏览器打开 [http://localhost:5200](http://localhost:5200)。

后端未启动时，玩家端会继续使用 `src/data/` 中的内置数据。

### 运行完整版本

完整版本包含玩家端、管理后台和 SQLite 数据覆盖层。请分别启动后端和前端。

终端 1：

```powershell
cd server
npm install
$env:JWT_SECRET='replace-with-a-long-random-secret'
npm run dev
```

终端 2：

```powershell
npm install
$env:VITE_API_URL='http://localhost:3001'
npm run dev
```

默认地址：

| 服务 | 地址 |
| --- | --- |
| 玩家端 | [http://localhost:5200](http://localhost:5200) |
| 管理后台 | [http://localhost:5200/admin](http://localhost:5200/admin) |
| API 健康检查 | [http://localhost:3001/api/health](http://localhost:3001/api/health) |

首次启动后端时会创建默认管理员：

```text
用户名：admin
密码：admin123
```

登录管理后台后，请立即修改密码。生产环境也必须显式设置 `JWT_SECRET`。

在 macOS 或 Linux 中，可以使用以下写法设置环境变量：

```bash
JWT_SECRET='replace-with-a-long-random-secret' npm run dev
VITE_API_URL='http://localhost:3001' npm run dev
```

## 常用命令

### 前端

```bash
npm run dev       # 启动 Vite 开发服务器
npm run build     # 构建生产版本
npm run preview   # 本地预览生产构建
```

### 后端

```bash
cd server
npm run dev       # 使用 node --watch 启动开发服务器
npm start         # 启动后端服务
```

### 规则测试

```bash
node test/progression.test.mjs
node test/raceSpells.test.mjs
node test/skillProficiencies.test.mjs
```

## 角色创建流程

玩家端主要页面如下：

| 路径 | 内容 |
| --- | --- |
| `/` | 封面 |
| `/setup` | 角色草稿与基础信息 |
| `/ability-base` | 基础属性方案 |
| `/race` | 种族选择 |
| `/class` | 职业与等级选择 |
| `/background` | 背景选择 |
| `/feats` | 专长选择 |
| `/spells` | 法术选择与详情 |
| `/abilities` | 最终属性汇总 |
| `/equipment` | 护甲、盾牌与武器 |
| `/hp` | 生命值设置 |
| `/sheet` | 最终角色卡 |
| `/print` | HTML 打印角色卡 |
| `/admin` | 数据管理后台 |

角色草稿会自动写入浏览器 `localStorage`。清除浏览器站点数据会同时移除本地草稿。

## 数据设计

项目采用“内置数据 + 后端覆盖”的结构：

```text
src/data/ 内置规则数据
        │
        ├── 后端不可用：直接使用内置数据
        │
        └── 后端可用：加载 SQLite 中的覆盖项与新增项
```

这样做有两个好处：

1. 前端在没有后端时仍可独立使用。
2. DM 或维护者可以通过后台调整常用数据，而不必重新打包前端。

目前管理后台支持的类型：

- `races`：种族
- `classes`：职业
- `backgrounds`：背景

法术、专长、装备和工具等内容目前仍以 `src/data/` 中的静态模块为准。

主要规则数据文件：

| 文件 | 内容 |
| --- | --- |
| `src/data/races.js` | 种族 |
| `src/data/classes.js` | 职业、子职业与职业进阶 |
| `src/data/backgrounds.js` | 背景 |
| `src/data/originFeats.js` | 起源专长 |
| `src/data/generalFeats.js` | 通用专长 |
| `src/data/fightingStyleFeats.js` | 战斗风格专长 |
| `src/data/eldritchInvocations.js` | 魔能祈唤 |
| `src/data/spells.js` | 法术 |
| `src/data/spellRules.js` | 施法规则 |
| `src/data/armor.js` | 护甲与盾牌 |
| `src/data/weapons.js` | 武器与精通词条 |
| `src/data/tools.js` | 工具 |
| `src/data/adventuringGear.js` | 冒险装备 |

## AC 与装备计算

装备页会自动计算当前 AC：

- 穿戴轻甲时，使用护甲基础 AC 加敏捷调整值。
- 穿戴中甲时，敏捷调整值受到护甲上限限制。
- 穿戴重甲时，使用护甲固定 AC。
- 装备盾牌且角色拥有盾牌训练时，AC 增加 `+2`。
- 未穿戴护甲时，使用职业或子职业提供的无甲 AC 公式；没有特殊公式时使用 `10 + 敏捷调整值`。

装备页也会提示：

- 当前角色是否拥有对应护甲训练。
- 是否拥有盾牌训练。
- 穿戴重甲时力量是否不足。

武器选择目前用于角色卡记录。工具和冒险装备已经整理为规则数据，但尚未实现完整的商店、负重和金币结算流程。

## 打印与 PDF

项目当前推荐使用 HTML 角色卡导出：

1. 在最终角色卡页面打开打印角色卡。
2. 在 `/print` 页面点击“打印 / 另存为 PDF”。
3. 在浏览器打印窗口中选择“另存为 PDF”。

HTML 打印页会尽量保持角色卡的双页布局，比直接填写第三方 PDF 表单更稳定，也更方便后续调整样式。

## 管理后台

管理端通过 SQLite 保存数据覆盖项。常见操作：

1. 打开 `/admin`。
2. 使用管理员账户登录。
3. 选择种族、职业或背景。
4. 新增内容，或编辑内置内容生成覆盖项。
5. 对内置内容使用“恢复默认”，即可删除覆盖项并重新使用前端内置版本。

后端运行后会产生以下持久化内容：

```text
server/game-data.db
server/uploads/
```

部署时请备份这两个位置，并避免将真实数据库、上传文件和生产密钥提交到公开仓库。

## 自定义职业导入

除了管理后台，职业选择页还支持导入本地 JSON 文件。导入内容会保存在当前浏览器中，适合快速测试家庭规则。

最小示例：

```json
{
  "id": "custom-warden",
  "name": "守望者",
  "nameEn": "Warden",
  "intro": "一个用于测试的自定义职业。",
  "hitDie": 10,
  "primaryAbilities": ["力量", "感知"],
  "savingThrows": ["力量", "感知"],
  "armor": ["轻甲", "中甲", "盾牌"],
  "weapons": ["简易武器", "军用武器"],
  "skillChoices": {
    "count": 2,
    "options": ["运动", "察觉", "求生", "自然"]
  },
  "subclasses": [
    {
      "id": "guardian",
      "name": "守护者",
      "nameEn": "Guardian",
      "description": "偏向保护队友。"
    }
  ]
}
```

如未填写 `progression`，系统会为自定义职业补充常用的默认进阶选择。需要精细控制时，可以参考 `src/data/classes.js` 中内置职业的结构。

## 生产部署

前端构建：

```powershell
$env:VITE_API_URL='https://your-api.example.com'
npm run build
```

生成的静态文件位于 `dist/`。

后端启动：

```powershell
cd server
npm install --omit=dev
$env:JWT_SECRET='replace-with-a-long-random-secret'
$env:PORT='3001'
npm start
```

可以选择以下任意一种部署方式：

1. 为前端和 API 分配不同域名，并在构建前端时设置 `VITE_API_URL`。
2. 使用同域名反向代理，将 `/api` 和 `/uploads` 转发到 Node 服务。

如果启用了图片上传，必须确保 `/uploads` 可以从浏览器访问。

## 浏览器存储

玩家数据和部分本地配置保存在浏览器中：

| 键 | 用途 |
| --- | --- |
| `dndcc:drafts:v1` | 角色草稿 |
| `dndcc:activeDraftId` | 当前角色草稿 |
| `dndcc:importedClasses:v1` | 本地导入职业 |
| `dnd_admin_token` | 管理后台登录令牌 |

角色草稿目前没有同步到服务器。更换浏览器或清除站点数据前，请自行保留需要的角色信息。

## 当前边界

项目已经具备完整的基础车卡流程，但仍有一些适合继续扩展的方向：

- 为法术、专长和装备增加管理后台。
- 增加角色账户与云端草稿同步。
- 为规则计算补充更多自动化测试。
- 增加完整的金币、负重、容器和冒险装备管理。
- 继续优化移动端布局与大型规则数据的按需加载。
- 为生产环境增加更完整的权限、日志、备份和迁移方案。

## 开发说明

- 玩家端可以脱离后端独立运行。
- 后端是一个轻量的内容覆盖层，不是完整的用户系统。
- 管理后台更适合桌面端操作；玩家端可以继续逐步优化手机端体验。
- 修改规则计算时，优先将纯逻辑放在 `src/utils/` 中，并为关键分支补充测试。
