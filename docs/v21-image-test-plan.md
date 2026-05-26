# v2.1 真实生图测试计划

> 状态：模板系统已冻结，本阶段只测不改。  
> 目标：验证 prompt 合成层在真实生图模型（pollinations / siliconflow / qwen 等）上的实际效果。

---

## 测试前置条件

1. 使用真实产品图/产品名称作为输入（不要用 mock 的 "Carbide Drill Bit"）
2. 固定种子或至少运行 2 次取稳定结果
3. 记录 provider、模型、尺寸、生成时间
4. 所有测试走 v2 pipeline（`/api/ai-image/v2/plan` → `/api/ai-image/generate`）

---

## 测试 1：空模板 auto — 高级主图，有设计感，不改变产品结构

### 用户输入
```
产品：一款无线蓝牙耳机（白色），型号 AirPro X3
用户目标："帮我做一张主图，更高级一点，背景可以有设计感，但不要改变产品结构。"
```

### 期望系统选择
| 维度 | 期望值 |
|------|--------|
| sourceType | `empty` |
| sourceId | `auto` |
| resolvedCreativeFreedom | `expressive` |
| resolvedPrimaryStyleWorld | `editorial_product_ad`（或 `gradient_modern_showcase`） |
| copyMode | `headline_only` 或 `headline_labels` |
| layoutType | `premium_center_product_minimal_text` |

### 最终图像应该长什么样
- 白色耳机居中或略偏置，如艺术物件般摆放
- 背景：**非纯白**，可以是浅暖灰、柔和渐变、或极淡的材质纹理
- 大字号 headline（如 "AIRPRO X3"），字间距宽，排版像杂志广告或 Apple 产品页
- 产品本身比例、结构、颜色与实物一致
- 有 generous negative space，整体呼吸感强

### 不能出现的问题
- ❌ 背景为纯白 #FFFFFF（expressive 不应强制纯白）
- ❌ 产品形状被改变（耳机变成其他造型、多出按钮、少孔）
- ❌ 文字模糊、乱码、浮在空白背景上无设计感
- ❌ 出现价格标签、Buy Now 按钮、平台水印
- ❌ 像抽象海报或插画而非产品摄影

### 验收标准
- [ ] 图像风格明显为商业产品摄影，非插画/抽象艺术
- [ ] 产品结构与输入一致
- [ ] 背景有设计感元素（渐变/纹理/材质/留白）
- [ ] 文字可读且排版专业
- [ ] 无平台水印、无 CTA 按钮

---

## 测试 2：白底主图 strict — 干净电商主图，产品完整，少量文字

### 用户输入
```
模板：tpl-white-bg-hero
产品：不锈钢保温杯（哑光黑色，500ml）
用户目标："做一张干净的电商主图，产品完整展示，少量文字。"
```

### 期望系统选择
| 维度 | 期望值 |
|------|--------|
| sourceType | `system_template` |
| sourceId | `tpl-white-bg-hero` |
| resolvedCreativeFreedom | `strict` |
| resolvedPrimaryStyleWorld | `clean_catalog` |
| copyMode | `headline_labels` |
| layoutType | `premium_center_product_minimal_text` |

### 最终图像应该长什么样
- 黑色保温杯**完整展示**，无裁切，边缘清晰
- 背景：**纯白或极浅灰**，干净无杂物
- 柔和漫射顶光，轻微接触阴影
- 标题在上方或下方（如 "500ml 真空保温杯"）
- 2-3 个短标签（如 "12h 保温"、"316 不锈钢"）
- 整体感觉：可信、货架感、中性

### 不能出现的问题
- ❌ 背景为深色/渐变/有纹理（strict 模式必须干净）
- ❌ 产品被裁切、只显示局部
- ❌ 文字过多（subheadline、feature body text 不应出现）
- ❌ 出现假规格、假数据框
- ❌ 像生活场景图（有桌面、环境、人物）

### 验收标准
- [ ] 背景为纯白或极浅中性灰
- [ ] 产品完整可见，边缘未被裁切
- [ ] 文字仅 headline + 2-3 短标签
- [ ] 无假规格、无装饰性框架
- [ ] 整体为货架级商业摄影

---

## 测试 3：白底主图 expressive — 不要纯白，要柔和渐变和高级质感

### 用户输入
```
模板：tpl-white-bg-hero
产品：机械键盘（深空灰，RGB 背光）
用户目标："做一张主图，但不要纯白背景，希望有柔和渐变和高级质感。"
```

### 期望系统选择
| 维度 | 期望值 |
|------|--------|
| sourceType | `system_template` |
| sourceId | `tpl-white-bg-hero` |
| resolvedCreativeFreedom | `expressive` |
| resolvedPrimaryStyleWorld | `editorial_product_ad` 或 `gradient_modern_showcase`（**不应是 clean_catalog**） |
| copyMode | `headline_labels` |
| layoutType | `premium_center_product_minimal_text` |

### 最终图像应该长什么样
- 机械键盘居中，按键结构清晰
- 背景：**柔和渐变**（如雾蓝到暖灰、或浅紫到米白），非纯白
- 可能有 subtle 的地面反射或环境光晕
- 标题大字（如 "MECHANICAL MASTER"）
- 2-3 个短标签（如 "RGB 背光"、"热插拔轴体"）
- 整体感觉：杂志广告风、Apple 产品页级别、有高级感

### 不能出现的问题
- ❌ 背景为纯白 #FFFFFF（用户明确拒绝）
- ❌ prompt 中出现 "must be pure white" / "禁止渐变" 等残留约束
- ❌ 产品形状改变（键帽变成圆形、布局错乱）
- ❌ 背景过于花哨（粒子、星空、抽象图案）
- ❌ 文字模糊或排版像低端广告

### 验收标准
- [ ] 背景为柔和渐变或材质感，非纯白
- [ ] prompt 中无 "must be pure white" / "禁止渐变" 残留
- [ ] 产品结构与输入一致
- [ ] 文字排版专业，有设计感
- [ ] 整体风格偏向高端杂志广告

---

## 测试 4：功能卖点图 — 耐用、锋利、精密加工，不像说明书

### 用户输入
```
模板：tpl-feature-explanation
产品：陶瓷刀具套装（黑色刀身，白色手柄）
卖点：
1. 氧化锆陶瓷刀刃 / 锋利度是钢的 10 倍
2. 不生锈不氧化 / 无需磨刀
3. 轻量化设计 / 仅 65g
4. 人体工学手柄 / 防滑握持

用户目标："做一张功能卖点图，突出耐用、锋利、精密加工，但不要像普通说明书。"
```

### 期望系统选择
| 维度 | 期望值 |
|------|--------|
| sourceType | `system_template` |
| sourceId | `tpl-feature-explanation` |
| resolvedCreativeFreedom | `balanced` |
| resolvedPrimaryStyleWorld | `light_technical` |
| copyMode | `feature_cards` |
| layoutType | `hero_right_product_left_features` 或类似 |

### 最终图像应该长什么样
- 陶瓷刀**完整清晰**，占据画面一侧（左侧或右侧），是最大视觉元素
- 另一侧垂直排列 3-4 个卖点卡片
- 卡片风格：**glassmorphism、flat card、rounded panel**（由 StyleWorld 决定）
- 背景：浅灰或纯白，有 subtle 的层次感
- 卖点文字配合简洁图标（如闪电、盾牌、羽毛）
- 整体感觉：像 **Apple 产品页 / Stripe 技术页**，不像 CAD 图或说明书

### 不能出现的问题
- ❌ 像说明书（密密麻麻的文字、表格、规格框）
- ❌ 出现 CAD 式蓝色细线标注、测量箭头
- ❌ 产品被裁切或过小
- ❌ 卡片无设计感（纯白方块+黑字）
- ❌ 出现假数据、假规格

### 验收标准
- [ ] 产品完整且为画面最大视觉元素
- [ ] 卖点用卡片/面板形式呈现，有设计感
- [ ] 无 CAD 式标注、无表格、无说明书排版
- [ ] 背景浅灰或纯白，有 subtle 层次
- [ ] 整体风格偏向技术产品页

---

## 测试 5：高端质感图 — 暗色、电影感、少文字

### 用户输入
```
模板：tpl-premium-luxury
产品：智能手表（钛金属表壳，蓝宝石镜面）
用户目标："做一张高级感产品图，可以暗色、电影感、少文字。"
```

### 期望系统选择
| 维度 | 期望值 |
|------|--------|
| sourceType | `system_template` |
| sourceId | `tpl-premium-luxury` |
| resolvedCreativeFreedom | `expressive` |
| resolvedPrimaryStyleWorld | `soft_premium` 或 `material_stage` |
| copyMode | `headline_only` |
| layoutType | `premium_center_product_minimal_text` |

### 最终图像应该长什么样
- 智能手表在画面中心略低于中点， generous negative space 环绕
- 背景：**深黑 void**、雾蓝、酒红、金属灰或柔和渐变（由 StyleWorld 决定）
- 戏剧性 rim light，产品边缘有暖色高光
- 文字**极少**：仅一个 headline（如 "TITANIUM"）或完全无字
- 有 satin reflection、材质光泽
- 整体感觉：**奢华、静默、电影感**，如高端珠宝或音响品牌广告

### 不能出现的问题
- ❌ 文字过多（feature labels、bottom info、panels）
- ❌ 背景为纯白/浅灰（与暗色电影感冲突）
- ❌ 产品被裁切
- ❌ 出现多个产品或生活场景元素
- ❌ 像普通电商主图（明亮、信息密集）

### 验收标准
- [ ] 背景为暗色或深色渐变，非纯白
- [ ] 文字仅 headline 或完全无字
- [ ] 产品有戏剧性光影和材质光泽
- [ ] 无多余信息元素（标签、按钮、面板）
- [ ] 整体风格为高端奢侈品广告级别

---

## 测试 6：详情/材质图 — 突出材质、精密、高级感，允许合理局部裁切

### 用户输入
```
模板：tpl-macro-detail
产品：钛合金机械表带（拉丝表面，蝴蝶扣）
用户目标："做一张产品材质细节图，展示表面纹理和精密加工，可以局部裁切。"
```

### 期望系统选择
| 维度 | 期望值 |
|------|--------|
| sourceType | `system_template` |
| sourceId | `tpl-macro-detail` |
| resolvedCreativeFreedom | —（旧模板未迁移 configV2，按旧逻辑） |
| layoutType | `technical_callout_with_insets` |

### 最终图像应该长什么样
- 表带**局部特写**：仅展示 40-60% 产品，dramatic crop
- 关键边缘（拉丝纹理、蝴蝶扣结构）穿过画面中心
- 背景：**近纯黑**，无杂物
- 单束硬暖侧光（camera-left 45°），强 specular highlight 揭示表面纹理
- 浅景深，焦点在纹理最清晰处
- 可选 1-2 个圆形细节放大插图（magnified insets），带 hairline 边框
- 标题在黑色负空间中（如 "BRUSHED TITANIUM"）
- 整体感觉：**微距摄影、材质广告、精密工艺展示**

### 不能出现的问题
- ❌ 产品完整展示（此场景应允许裁切）
- ❌ 背景为白/浅灰（与微距暗调冲突）
- ❌ 文字过多（仅允许 headline）
- ❌ 虚构细节（不存在的纹理、结构）
- ❌ 像普通产品图（完整展示、均匀照明）

### 验收标准
- [ ] 产品仅展示 40-60%，dramatic crop
- [ ] 背景近纯黑，无杂物
- [ ] 硬暖侧光 + 强 specular highlight 展示纹理
- [ ] 浅景深，焦点在纹理处
- [ ] 可选细节放大插图（对应真实结构）
- [ ] 文字仅 headline

---

## 测试执行流程

```
1. 用户在前端选择模板 / 输入目标 → 前端 POST /api/ai-image/v2/plan
2. 后端返回 3 个 CreativePlan（每个含 imageGenerationPrompt）
3. 用户选择其中 1-3 个方案 → 前端 POST /api/ai-image/generate
4. 记录：provider、模型、尺寸、种子、耗时
5. 人工审查输出图像 vs 本测试计划的"应该长什么样"
6. 记录问题 → 如为 prompt 问题，反馈给 prompt 合成层；如为模型能力问题，记录为已知限制
```

## 问题记录表（测试时填写）

| 测试项 | 图像编号 | 通过/不通过 | 问题描述 | 问题类型 |
|--------|---------|------------|---------|---------|
| T1 空模板 auto | | | | |
| T2 白底 strict | | | | |
| T3 白底 expressive | | | | |
| T4 功能卖点 | | | | |
| T5 高端质感 | | | | |
| T6 详情/材质 | | | | |

**问题类型分类：**
- `P` = Prompt 问题（prompt 描述不准/冲突/遗漏）
- `M` = 模型能力问题（prompt 正确但模型理解偏差）
- `R` = Runtime 问题（pipeline 执行错误）
- `U` = UI/UX 问题（前端展示或交互问题）
