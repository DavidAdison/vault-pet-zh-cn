# Vault Pet 汉化版

为 Obsidian 插件 **Vault Pet** 增加完整的简体中文（`zh-CN`）本地化。

本项目基于 [Elliott Park 的官方项目](https://github.com/elliott-json-park/obsidian-vault-pet)，保留英语、韩语、原插件 ID 和存档结构。不是官方中文版，也不是另一个独立宠物插件。

**上游基线：1.2.5 · `83c119f5f78270095835f39598733c41e65ff768`。** 原版说明见 [README.upstream.md](README.upstream.md)，原作者版权与 MIT 许可证见 [LICENSE](LICENSE)。

## 下载

打开 [Releases](https://github.com/DavidAdison/vault-pet-zh-cn/releases/latest)，下载附件 **`vault-pet-zh-cn.zip`**。不要把 GitHub 自动生成的 `Source code.zip` 当成安装包。

发布标签使用 `v1.2.5-zh-CN.1` 等形式；为保持与上游存档及插件识别兼容，`manifest.json` 中的 ID 仍为 `vault-pet`，插件版本仍为 `1.2.5`。汉化版修订号以 Release 标签为准。

## 覆盖安装并保留猫咪数据

1. 在 Obsidian 的“设置 → 第三方插件”中关闭 Vault Pet，然后退出 Obsidian，避免旧进程在覆盖时写回文件。
2. **完整备份** `<你的笔记库>/.obsidian/plugins/vault-pet/`，尤其是 `data.json`、`data.backup.json` 和已有的 `data.broken-*.json`。
3. 解压 `vault-pet-zh-cn.zip`，把其中 `vault-pet/` 目录里的程序文件复制到原来的 `.obsidian/plugins/vault-pet/`，覆盖 `main.js`、`manifest.json`、`styles.css` 及随包字体资源。
4. **保留原来的 `data.json` 和全部存档备份；不要删除整个插件目录，不要新建另一个插件 ID。安装包不包含任何宠物存档。**
5. 重新打开 Obsidian，启用 Vault Pet，在插件设置或“小屋 → 设置 → 语言”中选择 **简体中文**，或选择 **跟随 Obsidian**。

从上游 **1.2.5** 覆盖到本汉化版时，不需要迁移存档。宠物名字、等级、金币、服装、背包、任务、成就、统计和文件夹设置沿用原记录；语言切换不会重置猫咪。已有手动英语、韩语选择不会被强制改成中文。

新安装默认跟随 Obsidian：简体中文标识（`zh`、`zh-CN`、`zh-Hans` 等）使用中文，韩语使用韩语，其余语言沿用英语回退。繁体中文暂不提供专门翻译。更改 Obsidian 语言并重启后会重新识别；若宿主无需重启就改变语言，插件也会在下一次每分钟检查时更新。

恢复原版时，先关闭并退出 Obsidian，再用原版程序文件覆盖；保留数据文件。若需要同时恢复以前的进度，可在退出 Obsidian后还原事先备份的整个目录。

**注意：** 上游 0.x 到 1.x 本身有重新开始成长的迁移行为，本汉化版不改变该行为；不能据此承诺跨大版本保留旧宠物。通过社区插件更新到未来的官方版本可能覆盖汉化程序，请保留本项目下载地址。

## 汉化内容

- 插件设置、命令面板、状态栏、右键交互菜单、通知和错误提示。
- 首页、商店、背包、衣橱、毛色、正餐、零食、玩具和玩法说明。
- 每日任务、全部 161 个现有成就、等级及经验值说明。
- 邻居档案、趣事、对话、交换和送礼，宝物与制作工坊。
- 统计、热力图、账本、分享卡、日期、数字及时间显示。
- 宠物对话气泡、时段和稀有台词，以及动画中的文字提示牌。

中文资源共 **2,171 个 UI 词条**（覆盖原版全部 2,080 个键，含新增语言/错误提示和动画文字），**108 类台词、247 条台词**。保留占位符、分段和随机机制，沿用所有物品/成就 ID。不会翻译用户自定义名字、笔记或文件夹名称，也不会改写历史存档中已经保存的自由文本。

## 源码、构建与测试

项目使用原生 JavaScript，无生产 npm 依赖。需要 Node.js 22 或更高版本：

```sh
node scripts/build.js
node tests/run.js
node scripts/package.js
```

先构建再测试，因为测试会加载生成的 `main.js` 验证宿主和 iframe 中的中文资源。`main.js`、`styles.css` 均由源文件生成，不直接手工修改。

打包输出位于 `dist/`，包含安装 ZIP、三个独立安装文件及 SHA-256 校验文件。

可选浏览器检查（仅使用合成数据，不接触真实笔记库）：

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/browser-smoke.js
```

也可以通过环境变量 `VP_BROWSER_CHANNEL=chrome` 或 `msedge` 使用已安装的浏览器。截图输出在 `.test-output/`，不会提交真实存档。

目前验证：**43/43 项 Node.js 测试通过；31 项 Chrome 浏览器冒烟检查通过**，覆盖八个主页面、商店/背包子页、首次引导、语言切换、窄侧栏、深色主题和宠物气泡。浏览器检查验证渲染器与模拟宿主，不等同于真实 Obsidian 端到端测试；本项目未覆盖或操作维护者日常笔记库中的插件。

国际化结构及验收记录见 [docs/LOCALIZATION.zh-CN.md](docs/LOCALIZATION.zh-CN.md)。

## 反馈与致谢

汉化问题请提交到[本仓库 Issues](https://github.com/DavidAdison/vault-pet-zh-cn/issues)。基础插件、像素猫和游戏系统由 **Elliott Park** 开发。感谢原作者以 MIT 许可证开放源码；本项目保留原版权声明。Pretendard 字体按其随附的 SIL Open Font License 分发。
