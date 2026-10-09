Vault Pet 1.2.5 的简体中文汉化版，修订 1。

- 覆盖原版全部界面词条，含设置、小屋、商店、背包、服装、玩具、每日任务、161 个成就、邻居、工坊和统计。
- 共 2,171 个中文 UI 词条、108 类共 247 条宠物台词，并本地化动画提示牌、日期和数字。
- 保留 English、한국어，新增“简体中文”和“跟随 Obsidian”。已有手动语言不会被覆盖。
- 保持插件 ID `vault-pet`、存档结构、物品与成就 ID、成长/金币规则不变。
- 原版 34 项测试与新增 9 项测试全部通过（43/43）；独立 Chrome 渲染检查 31 项通过。

**下载附件 `vault-pet-zh-cn.zip`，不要下载自动生成的 Source code ZIP。**

覆盖安装：先关闭 Vault Pet 并退出 Obsidian，完整备份 `.obsidian/plugins/vault-pet/`；解压安装 ZIP，将 `vault-pet/` 内的程序文件覆盖到原插件目录，**保留原 `data.json` 和所有存档备份**。重启后在插件设置或小屋设置中选择“简体中文”或“跟随 Obsidian”。现有英文/韩文存档不会自动更改语言。

从上游 1.2.5 覆盖时，原猫咪的名字、等级、金币、物品与成就继续使用。安装包不含存档。`manifest.json` 仍为 1.2.5；汉化修订号由 Release 标签标识。以后安装官方更新可能覆盖汉化。

验证范围：使用合成数据验证页面渲染和宿主交互，未在真实 Obsidian 笔记库中覆盖安装；未逐一完成所有小游戏流程。完整说明见仓库 README 和本地化验收文档。

基于 Elliott Park 的 [obsidian-vault-pet](https://github.com/elliott-json-park/obsidian-vault-pet)，上游提交 `83c119f5f78270095835f39598733c41e65ff768`，保留 MIT 版权声明。
