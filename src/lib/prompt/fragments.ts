/**
 * Prompt Fragments Data
 */
import { PromptFragment, PromptFragmentGroup } from "./types";

export const FRAGMENT_GROUPS: { key: PromptFragmentGroup; label: string }[] = [
  { key: "platform", label: "电商平台" },
  { key: "product_category", label: "产品类目" },
  { key: "image_type", label: "图片类型" },
  { key: "angle", label: "拍摄角度" },
  { key: "material", label: "材质表现" },
];

export const DEFAULT_FRAGMENTS: PromptFragment[] = [
  // generation_mode
  {
    id: "conservative_enhancement",
    group: "generation_mode",
    name: "保守优化",
    description:
      "默认模式。尽量保持产品结构不变，只优化背景、光影、清晰度和商品展示效果。",
    promptFragment:
      "conservative product enhancement, use the reference image as the primary source, keep the original product structure unchanged, improve lighting, background and product presentation only, do not redesign the product",
    tags: ["默认", "结构保持", "低风险"],
    sortOrder: 1,
    enabled: true,
  },

  // generation_mode
  {
    id: "commercial_showcase",
    group: "generation_mode",
    name: "商业展示",
    description:
      "在保持主要结构的基础上，增强商品图的商业质感和展示效果。",
    promptFragment:
      "professional commercial product presentation, enhance product appeal while preserving the main product structure, improve composition, lighting and visual quality",
    tags: ["商品图", "商业质感", "中等变化"],
    sortOrder: 2,
    enabled: true,
  },

  // generation_mode
  {
    id: "creative_scene",
    group: "generation_mode",
    name: "创意场景",
    description:
      "生成更有氛围和创意的商品图，但可能对产品结构产生更大变化。",
    promptFragment:
      "creative product advertising visual, more stylized composition, stronger atmosphere and visual impact, preserve the recognizable product identity as much as possible",
    tags: ["创意", "广告感", "高变化"],
    sortOrder: 3,
    enabled: true,
  },

  // platform
  {
    id: "temu",
    group: "platform",
    name: "Temu",
    description: "适合 Temu 平台的商品图，强调移动端浏览、清晰主体、直接转化和快速决策。",
    promptFragment: "Temu-style e-commerce product image, mobile-first commercial presentation, clear product focus, clean and attractive composition, strong visual clarity, suitable for fast browsing and conversion-oriented shopping",
    tags: ["移动端", "清晰主体", "转化导向"],
    sortOrder: 1,
    enabled: true,
  },

  // platform
  {
    id: "amazon",
    group: "platform",
    name: "Amazon",
    description: "适合 Amazon 平台的商品图，强调规范、干净、主体清晰和专业商品摄影感。",
    promptFragment: "Amazon-ready product listing image, clean and compliant e-commerce composition, clear product silhouette, professional product photography, minimal distractions, high clarity, suitable for marketplace display",
    tags: ["规范主图", "专业商品摄影", "主体清晰"],
    sortOrder: 2,
    enabled: true,
  },

  // platform
  {
    id: "ozon",
    group: "platform",
    name: "Ozon",
    description: "适合 Ozon 平台的商品图，强调清晰、实用、可信赖的电商展示，适合跨境和工业类商品销售。",
    promptFragment: "Ozon-style marketplace product image, clear and practical e-commerce presentation, trustworthy product display, clean background, visible product structure and material details, suitable for cross-border marketplace shopping",
    tags: ["跨境电商", "实用展示", "结构清晰"],
    sortOrder: 3,
    enabled: true,
  },

  // platform
  {
    id: "shein",
    group: "platform",
    name: "SHEIN",
    description: "适合 SHEIN 平台的商品图，强调移动端展示、视觉吸引力、轻商业感和快速浏览体验。",
    promptFragment: "SHEIN-style product image, visually attractive mobile commerce presentation, clean but stylish composition, strong product appeal, lightweight commercial visual style, suitable for fast-scrolling shopping experience",
    tags: ["移动端", "视觉吸引", "轻商业感"],
    sortOrder: 4,
    enabled: true,
  },

  // product_category
  {
    id: "fasteners",
    group: "product_category",
    name: "紧固连接件",
    description: "适合螺丝、螺母、螺栓、垫圈、铆钉等紧固件商品图。",
    promptFragment: "precision hardware fastener, clean mechanical structure, accurate thread details, durable metal material, professional product photography",
    tags: ["螺丝", "螺母", "螺栓", "垫圈", "铆钉"],
    sortOrder: 1,
    enabled: true,
  },

  // product_category
  {
    id: "transmission_parts",
    group: "product_category",
    name: "转动与传动件",
    description: "适合转轴、轴承、齿轮、联轴器、同步轮等传动类零件。",
    promptFragment: "precision transmission component, accurate cylindrical structure, clean machined surface, visible grooves and connection details, professional industrial product photography",
    tags: ["转轴", "轴承", "齿轮", "联轴器", "同步轮"],
    sortOrder: 2,
    enabled: true,
  },

  // product_category
  {
    id: "cutting_tools",
    group: "product_category",
    name: "刀具与加工工具",
    description: "适合铣刀、钻头、车刀、刀片、锯片等加工工具。",
    promptFragment: "industrial cutting tool, sharp cutting edge, precise geometry, metallic texture, polished surface, professional product photography",
    tags: ["铣刀", "钻头", "车刀", "刀片", "锯片"],
    sortOrder: 3,
    enabled: true,
  },

  // product_category
  {
    id: "hardware_accessories",
    group: "product_category",
    name: "五金配件",
    description: "适合合页、铰链、把手、卡扣、支架、挂件等五金配件。",
    promptFragment: "hardware accessory product, clean structure, durable metal material, practical design, commercial product photography",
    tags: ["合页", "铰链", "把手", "卡扣", "支架"],
    sortOrder: 4,
    enabled: true,
  },

  // product_category
  {
    id: "mechanical_parts",
    group: "product_category",
    name: "机械结构件",
    description: "适合法兰、连接板、支撑件、滑块、导轨等机械结构零件。",
    promptFragment: "machined mechanical part, precise structure, clean edges, accurate holes and cutouts, high-quality industrial product photography",
    tags: ["法兰", "连接板", "支撑件", "滑块", "导轨"],
    sortOrder: 5,
    enabled: true,
  },

  // product_category
  {
    id: "pipe_fittings",
    group: "product_category",
    name: "管路与接头",
    description: "适合管接头、阀门、弯头、管夹、快速接头等产品。",
    promptFragment: "industrial pipe fitting or connector, accurate threaded connection, clean metal surface, functional structure, professional product photography",
    tags: ["管接头", "阀门", "弯头", "管夹", "快速接头"],
    sortOrder: 6,
    enabled: true,
  },

  // product_category
  {
    id: "electrical_hardware",
    group: "product_category",
    name: "电气五金件",
    description: "适合端子、接线片、散热片、金属外壳、屏蔽件等电气五金产品。",
    promptFragment: "electrical hardware component, clean conductive metal parts, precise terminals, compact structure, professional product photography",
    tags: ["端子", "接线片", "散热片", "金属外壳", "屏蔽件"],
    sortOrder: 7,
    enabled: true,
  },

  // product_category
  {
    id: "custom_machined_parts",
    group: "product_category",
    name: "定制加工件",
    description: "适合 CNC 加工件、非标零件、样品件、定制结构件。",
    promptFragment: "custom CNC machined part, precise manufacturing details, clean machined surface, accurate geometry, professional industrial product photography",
    tags: ["CNC", "非标件", "样品件", "定制件", "加工件"],
    sortOrder: 8,
    enabled: true,
  },

  // image_type
  {
    id: "white_main_image",
    group: "image_type",
    name: "白底主图",
    description: "适合电商平台主图，突出产品本体，背景干净。",
    promptFragment:
      "clean white-background e-commerce main image, product centered and clearly visible, accurate silhouette, clean product catalog composition, no text, no watermark, preserve product geometry and details",
    tags: ["主图", "白底", "电商"],
    sortOrder: 1,
    enabled: true,
  },

  // image_type
  {
    id: "single_product_feature_image",
    group: "image_type",
    name: "单品卖点图",
    description: "大标题区域 + 产品主体突出，适合单品推广。",
    promptFragment:
      "e-commerce feature poster layout, one main product centered and enlarged, strong headline area, short selling-point subtitle area, clean promotional composition, visually emphasize product advantages such as sharpness, durability, strength, precision or material quality, preserve product geometry and details, avoid fake readable text or unverified claims",
    tags: ["单品", "卖点", "推广"],
    sortOrder: 2,
    enabled: true,
  },

  // image_type
  {
    id: "multi_sku_lineup_image",
    group: "image_type",
    name: "多规格组合图",
    description: "多个规格或变体产品整齐排列展示。",
    promptFragment:
      "multi-SKU e-commerce lineup image, arrange multiple provided product variants in a clean row or grid, show different sizes or shapes clearly, keep each product geometry accurate, avoid inventing extra product types not present in the reference",
    tags: ["多规格", "组合", "排列"],
    sortOrder: 3,
    enabled: true,
  },

  // image_type
  {
    id: "feature_explanation_image",
    group: "image_type",
    name: "功能卖点说明图",
    description: "突出关键优势，允许标题区域和卖点块，但不生成真实文字。",
    promptFragment:
      "e-commerce feature explanation image, visually emphasize key advantages with clean callout areas, product remains the main focus, suitable for showing durability, sharpness, precision, material quality, structural strength or machining quality, allow headline areas and selling-point blocks, but do not generate fake readable text, fake numbers or unverified technical claims",
    tags: ["卖点", "说明", "版式"],
    sortOrder: 4,
    enabled: true,
  },

  // image_type
  {
    id: "detail_magnifier_image",
    group: "image_type",
    name: "局部放大说明图",
    description: "主产品 + 局部放大区域，展示关键细节。",
    promptFragment:
      "detail magnifier e-commerce image, show the main product together with one or two enlarged detail inset areas, highlight edges, threads, holes, grooves, cutting tips or connection points, preserve the exact shape and position of the original details, avoid fake text, incorrect labels or fabricated callouts",
    tags: ["局部放大", "细节", "说明"],
    sortOrder: 5,
    enabled: true,
  },

  // image_type
  {
    id: "advantage_comparison_image",
    group: "image_type",
    name: "优势对比图",
    description: "电商风格对比，突出产品优势。",
    promptFragment:
      "e-commerce advantage comparison image, compare the product's benefits against a simple generic alternative or abstract baseline, emphasize material finish, structural strength, precision, durability or detail quality, keep the original product geometry accurate, do not invent fake versions, fake numbers or unverified claims",
    tags: ["对比", "优势", "电商"],
    sortOrder: 6,
    enabled: true,
  },

  // image_type
  {
    id: "specification_info_image",
    group: "image_type",
    name: "规格信息图",
    description: "信息卡片版式，展示比例和结构，不做真实标注。",
    promptFragment:
      "specification-style e-commerce information image, show product proportions, structure and detail zones in a clean information-card composition, allow blank specification areas, do not generate numeric dimensions, measurement labels, technical annotation text or fake parameters",
    tags: ["规格", "信息", "版式"],
    sortOrder: 7,
    enabled: true,
  },

  // image_type
  {
    id: "compatible_tools_image",
    group: "image_type",
    name: "适配工具图",
    description: "产品与适配工具或设备一起展示。",
    promptFragment:
      "compatible tools e-commerce image, show the product together with clean visual panels for compatible tools or equipment, such as drill, screwdriver, pneumatic tool or machine context, keep the main product accurate, avoid fake text, fake icons or misleading compatibility claims",
    tags: ["适配", "工具", "兼容"],
    sortOrder: 8,
    enabled: true,
  },

  // image_type
  {
    id: "cnc_machining_scene_image",
    group: "image_type",
    name: "机加工场景图",
    description: "产品在 CNC 加工或机床环境中展示。",
    promptFragment:
      "application-oriented e-commerce product image in a CNC machining environment, clean machine tool setting, machining equipment subtly in the background, professional manufacturing atmosphere, product remains the main focus and its geometry stays accurate",
    tags: ["机加工", "场景", "CNC"],
    sortOrder: 9,
    enabled: true,
  },

  // image_type
  {
    id: "assembly_installation_scene_image",
    group: "image_type",
    name: "装配安装场景图",
    description: "产品在装配或安装场景中展示。",
    promptFragment:
      "application-oriented e-commerce product image in an assembly or installation context, show the product near or installed with industrial equipment, visible mounting or connection area, clean professional scene, do not invent false assembly structures",
    tags: ["装配", "安装", "场景"],
    sortOrder: 10,
    enabled: true,
  },

  // image_type
  {
    id: "maintenance_repair_scene_image",
    group: "image_type",
    name: "维修维护场景图",
    description: "产品在维修维护场景中展示。",
    promptFragment:
      "application-oriented e-commerce product image in a maintenance and repair context, organized tool area, spare parts and practical service environment, clean industrial setting, no people or hands, product remains accurate and clearly visible",
    tags: ["维修", "维护", "场景"],
    sortOrder: 11,
    enabled: true,
  },

  // image_type
  {
    id: "warehouse_supply_image",
    group: "image_type",
    name: "仓储供货图",
    description: "产品在仓储或供货场景中展示可靠性。",
    promptFragment:
      "B2B e-commerce supply image, clean industrial warehouse or supply shelf context, organized inventory atmosphere, reliable bulk supply presentation, product remains the main focus and geometry stays accurate",
    tags: ["仓储", "供货", "B2B"],
    sortOrder: 12,
    enabled: true,
  },

  // image_type
  {
    id: "quality_inspection_image",
    group: "image_type",
    name: "质检检测图",
    description: "产品在质量检测环境中展示。",
    promptFragment:
      "application-oriented e-commerce product image in a quality inspection environment, clean measurement tools or inspection setup subtly in the background, professional precision verification atmosphere, no fake measurement labels or numbers, product remains accurate and clearly visible",
    tags: ["质检", "检测", "场景"],
    sortOrder: 13,
    enabled: true,
  },

  // image_type
  {
    id: "packaging_image",
    group: "image_type",
    name: "包装展示图",
    description: "展示产品包装盒、袋或容器状态。",
    promptFragment:
      "e-commerce packaging display image, show the product with clean retail or shipping package presentation, visible box or container if provided, professional marketplace product composition, avoid fake brand text or fabricated package claims",
    tags: ["包装", "盒装", "零售"],
    sortOrder: 14,
    enabled: true,
  },

  // image_type
  {
    id: "promo_sales_image",
    group: "image_type",
    name: "促销销售图",
    description: "高冲击力促销构图，适合 Temu 风格商品图。",
    promptFragment:
      "high-impact e-commerce sales image, bold promotional composition, strong product lineup, clean selling-point blocks, energetic marketplace style, suitable for Temu-like product listing visuals, avoid fake prices, fake claims, unreadable text or misleading labels",
    tags: ["促销", "销售", "高冲击力"],
    sortOrder: 15,
    enabled: true,
  },


  // angle
  {
    id: "front_view",
    group: "angle",
    name: "正面展示",
    description: "适合展示产品轮廓和正面结构。",
    promptFragment: "front-facing product view, clear silhouette and structure",
    tags: ["正面", "轮廓", "结构"],
    sortOrder: 1,
    enabled: true,
  },

  // angle
  {
    id: "angle_45",
    group: "angle",
    name: "45度角展示",
    description: "适合展示厚度、结构和材质细节。",
    promptFragment: "45-degree product photography angle, showing depth, structure and material details",
    tags: ["45度", "立体", "结构"],
    sortOrder: 2,
    enabled: true,
  },

  // angle
  {
    id: "top_down_view",
    group: "angle",
    name: "俯视角度",
    description: "适合平放类商品、多件组合和规格展示。",
    promptFragment: "top-down view, clean composition, showing product layout and shape",
    tags: ["俯视", "平铺", "布局"],
    sortOrder: 3,
    enabled: true,
  },

  // angle
  {
    id: "side_view",
    group: "angle",
    name: "侧面展示",
    description: "适合展示长度、厚度、截面和侧面结构。",
    promptFragment: "side view, clearly showing thickness, length and structural profile",
    tags: ["侧面", "厚度", "轮廓"],
    sortOrder: 4,
    enabled: true,
  },

  // angle
  {
    id: "close_up_detail",
    group: "angle",
    name: "细节特写",
    description: "适合展示刀刃、螺纹、孔位、纹理等关键细节。",
    promptFragment: "close-up detail shot, sharp focus on key structure and material texture",
    tags: ["特写", "细节", "局部"],
    sortOrder: 5,
    enabled: true,
  },

  // angle
  {
    id: "multi_angle",
    group: "angle",
    name: "多角度展示",
    description: "适合展示多个方向、多个版本或多个角度的商品信息。",
    promptFragment: "multi-angle product presentation, showing front, side and detail views in a clean layout",
    tags: ["多角度", "多视图", "展示"],
    sortOrder: 6,
    enabled: true,
  },

  // angle
  {
    id: "exploded_view",
    group: "angle",
    name: "爆炸视图",
    description: "适合展示零件组成、装配关系和内部结构。适合概念性结构展示，但可能无法保证真实装配关系，工业精确场景需谨慎使用。",
    promptFragment: "conceptual exploded view style, showing component relationship in a clean technical presentation",
    tags: ["爆炸图", "拆解", "结构"],
    sortOrder: 7,
    enabled: true,
  },

  // angle
  {
    id: "low_angle",
    group: "angle",
    name: "仰角展示",
    description: "从下往上拍摄，增强产品的力量感和视觉冲击力。",
    promptFragment: "low angle product shot, looking upward perspective, enhanced sense of scale and presence, dramatic product presentation",
    tags: ["仰角", "冲击力", "力量感"],
    sortOrder: 8,
    enabled: true,
  },

  // material
  {
    id: "metal_texture",
    group: "material",
    name: "金属质感",
    description: "通用金属材质表达，适合大多数五金机械产品。",
    promptFragment: "realistic metallic texture, refined highlights and subtle reflections",
    tags: ["金属", "反光", "质感"],
    sortOrder: 1,
    enabled: true,
  },

  // material
  {
    id: "brushed_metal",
    group: "material",
    name: "拉丝金属",
    description: "适合表现线性拉丝纹理和高级工业表面。",
    promptFragment: "brushed metal surface, fine linear texture, premium industrial finish",
    tags: ["拉丝", "纹理", "工业"],
    sortOrder: 2,
    enabled: true,
  },

  // material
  {
    id: "polished_metal",
    group: "material",
    name: "抛光金属",
    description: "适合展示亮面金属、高光和精加工效果。",
    promptFragment: "polished metal surface, clean reflection, high-quality finish",
    tags: ["抛光", "亮面", "高光"],
    sortOrder: 3,
    enabled: true,
  },

  // material
  {
    id: "matte_metal",
    group: "material",
    name: "哑光金属",
    description: "适合低调、专业、柔和的金属表面表现。",
    promptFragment: "matte metal finish, soft reflection, refined industrial texture",
    tags: ["哑光", "低反光", "柔和"],
    sortOrder: 4,
    enabled: true,
  },

  // material
  {
    id: "black_oxide",
    group: "material",
    name: "黑色氧化",
    description: "适合黑色金属件、氧化处理件、深色工具类产品。",
    promptFragment: "black oxide metal finish, deep dark surface, subtle highlights, industrial appearance",
    tags: ["黑色", "氧化", "工具"],
    sortOrder: 5,
    enabled: true,
  },

  // material
  {
    id: "chrome_plated",
    group: "material",
    name: "镀铬效果",
    description: "适合表现明亮、反光、镜面感强的金属表面。",
    promptFragment: "chrome plated surface, bright reflective metal finish, clean highlights",
    tags: ["镀铬", "镜面", "反光"],
    sortOrder: 6,
    enabled: true,
  },

  // material
  {
    id: "cnc_machining_marks",
    group: "material",
    name: "CNC加工纹理",
    description: "适合展示切削纹路、加工细节和制造精度。",
    promptFragment: "visible CNC machining marks, precise cutting texture, clean manufactured surface",
    tags: ["CNC", "加工纹理", "制造精度"],
    sortOrder: 7,
    enabled: true,
  },

  // material
  {
    id: "precision_machining",
    group: "material",
    name: "精密加工",
    description: "强调边缘干净、尺寸准确、制造质量高。",
    promptFragment: "precision machining details, clean edges, accurate geometry, professional manufacturing quality",
    tags: ["精密", "高精度", "加工"],
    sortOrder: 8,
    enabled: true,
  },

  // material
  {
    id: "zinc_plated",
    group: "material",
    name: "镀锌表面",
    description: "适合展示镀锌件、蓝白锌、彩锌等表面处理效果。",
    promptFragment: "zinc plated metal surface, light blue-white or rainbow galvanized finish, corrosion resistant coating appearance",
    tags: ["镀锌", "蓝白锌", "防锈"],
    sortOrder: 9,
    enabled: true,
  },

  // material
  {
    id: "anodized_aluminum",
    group: "material",
    name: "阳极氧化",
    description: "适合展示阳极氧化铝件的彩色或哑光表面。",
    promptFragment: "anodized aluminum surface, smooth colored oxide layer, even matte or satin metal finish",
    tags: ["阳极氧化", "铝合金", "彩色"],
    sortOrder: 10,
    enabled: true,
  },

  // negative
  {
    id: "no_text",
    group: "negative",
    name: "无文字",
    description: "避免图片中出现文字、标题、说明标签。",
    promptFragment: "no text, no captions, no labels",
    tags: ["无文字", "不要标签", "不要说明"],
    sortOrder: 1,
    enabled: true,
  },

  // negative
  {
    id: "no_watermark",
    group: "negative",
    name: "无水印",
    description: "避免水印、logo、平台标记等元素。",
    promptFragment: "no watermark, no logo",
    tags: ["无水印", "无logo"],
    sortOrder: 2,
    enabled: true,
  },

  // negative
  {
    id: "no_deformation",
    group: "negative",
    name: "不变形",
    description: "避免产品结构、比例、形状发生明显错误。",
    promptFragment: "no deformation, preserve original geometry",
    tags: ["不变形", "结构正确", "比例正确"],
    sortOrder: 3,
    enabled: true,
  },

  // negative
  {
    id: "no_extra_parts",
    group: "negative",
    name: "无多余零件",
    description: "避免生成不存在的孔位、螺丝、刀刃、连接件等。",
    promptFragment: "no extra parts, no incorrect components",
    tags: ["无多余零件", "不加组件"],
    sortOrder: 4,
    enabled: true,
  },

  // negative
  {
    id: "clean_background",
    group: "negative",
    name: "背景干净",
    description: "避免背景杂乱、堆放过多物品、干扰主体。",
    promptFragment: "no messy background, no clutter",
    tags: ["背景干净", "无杂乱"],
    sortOrder: 5,
    enabled: true,
  },

  // negative
  {
    id: "no_people",
    group: "negative",
    name: "无人物",
    description: "避免出现人物、手、人脸或模特。",
    promptFragment: "no people, no hands, no human face",
    tags: ["无人物", "无人手", "无人脸"],
    sortOrder: 6,
    enabled: true,
  },

  // negative
  {
    id: "no_wrong_structure",
    group: "negative",
    name: "无错误结构",
    description: "避免不合理机械结构、错误齿形、错误孔位等。",
    promptFragment: "no incorrect structure, no unrealistic mechanical geometry",
    tags: ["结构正确", "无错误孔位", "无错误齿形"],
    sortOrder: 7,
    enabled: true,
  },

  // negative
  {
    id: "no_cartoon",
    group: "negative",
    name: "无卡通感",
    description: "避免插画、卡通、3D 玩具感。",
    promptFragment: "no cartoon style, no illustration style, no toy-like 3D render appearance",
    tags: ["真实摄影", "无卡通", "无插画"],
    sortOrder: 8,
    enabled: true,
  },

  // negative
  {
    id: "no_excessive_glare",
    group: "negative",
    name: "无过度反光",
    description: "避免金属过曝、反光太强导致细节丢失。",
    promptFragment: "no excessive glare, no overexposed reflections",
    tags: ["不过曝", "高光克制", "无强反光"],
    sortOrder: 9,
    enabled: true,
  },

  // negative
  {
    id: "no_typography_layout",
    group: "negative",
    name: "无文字排版",
    description: "避免出现广告海报式文字、排版、卖点标签。",
    promptFragment: "no graphic text layout, no poster typography",
    tags: ["无文字排版", "无广告字", "无卖点标签"],
    sortOrder: 10,
    enabled: true,
  },

  // negative
  {
    id: "no_redesign",
    group: "negative",
    name: "不重设计产品",
    description: "避免 AI 擅自改变产品结构、外形或功能设计。",
    promptFragment: "do not redesign the product, do not change the original product structure or functional design",
    tags: ["保持原样", "不重设计"],
    sortOrder: 11,
    enabled: true,
  },

  // negative
  {
    id: "no_hole_change",
    group: "negative",
    name: "不改变孔位",
    description: "避免孔位、安装点、连接位置被改变。",
    promptFragment: "do not change holes, mounting points or connection positions",
    tags: ["孔位", "安装点"],
    sortOrder: 12,
    enabled: true,
  },

  // negative
  {
    id: "no_blade_change",
    group: "negative",
    name: "不改变刀刃",
    description: "适合刀具类产品，避免刀刃形状、角度、槽型被改变。",
    promptFragment: "do not change cutting edges, blade geometry, flute shape or edge angles",
    tags: ["刀刃", "刀具"],
    sortOrder: 13,
    enabled: true,
  },

  // negative
  {
    id: "no_low_quality",
    group: "negative",
    name: "拒绝低质量",
    description: "避免生成模糊、低分辨率、压缩感强的图片。",
    promptFragment: "low resolution, pixelated, compressed artifacts, blurry details, noise",
    tags: ["高清", "高质量", "清晰"],
    sortOrder: 14,
    enabled: true,
  },

  // negative
  {
    id: "no_color_shift",
    group: "negative",
    name: "无色偏",
    description: "避免产品颜色发生偏移或变得不真实。",
    promptFragment: "color shift, inaccurate color, unnatural hue, oversaturated colors",
    tags: ["颜色准确", "无色偏", "真实颜色"],
    sortOrder: 15,
    enabled: true,
  },

  // negative
  {
    id: "no_fake_readable_text",
    group: "negative",
    name: "无虚假文字",
    description: "避免生成虚假可读文字、乱码、错误语言或假数字。",
    promptFragment: "no fake readable text, no gibberish words, no incorrect Chinese or English text, no fake numbers, no fabricated labels",
    tags: ["无虚假文字", "无乱码", "无假数字"],
    sortOrder: 16,
    enabled: true,
  },
  // negative
  {
    id: "no_fake_claims",
    group: "negative",
    name: "无虚假卖点",
    description: "避免生成虚假性能承诺和夸大宣传。",
    promptFragment: "no fake claims, no unverified performance claims, no exaggerated technical promises",
    tags: ["真实", "无夸大", "无虚假"],
    sortOrder: 17,
    enabled: true,
  },

  // negative
  {
    id: "no_fake_labels",
    group: "negative",
    name: "无虚假标签",
    description: "避免生成假箭头、假标注、假图标等误导元素。",
    promptFragment: "no fake labels, no incorrect arrows, no fabricated callouts, no fake icons, no misleading annotations",
    tags: ["无假标签", "无假箭头", "无误导"],
    sortOrder: 18,
    enabled: true,
  },

  // negative
  {
    id: "no_repeated_scene",
    group: "negative",
    name: "避免重复场景",
    description: "避免生成千篇一律的工厂工作台背景。",
    promptFragment: "avoid generic repetitive workbench scene, avoid identical background layout, avoid overused stock industrial setting",
    tags: ["不重复", "多样性", "不模板化"],
    sortOrder: 19,
    enabled: true,
  },

];

export function getAllFragments(): PromptFragment[] {
  return DEFAULT_FRAGMENTS.filter((f) => f.enabled).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

export function getFragmentsByGroup(
  group: PromptFragmentGroup
): PromptFragment[] {
  return getAllFragments().filter((f) => f.group === group);
}

export function getFragmentById(id: string): PromptFragment | undefined {
  return DEFAULT_FRAGMENTS.find((f) => f.id === id && f.enabled);
}

export function getFragmentsByIds(ids: string[]): PromptFragment[] {
  const map = new Map(DEFAULT_FRAGMENTS.map((f) => [f.id, f]));
  return ids
    .map((id) => map.get(id))
    .filter((f): f is PromptFragment => f !== undefined && f.enabled);
}

// ─── Size options (moved from rules.ts) ─────────────────────────────

export const SIZE_OPTIONS = [
  { value: "1:1", label: "方图 1:1", width: 1024, height: 1024 },
  { value: "3:4", label: "竖图 3:4", width: 768, height: 1024 },
  { value: "2:3", label: "竖图 2:3", width: 683, height: 1024 },
  { value: "16:9", label: "横图 16:9", width: 1024, height: 576 },
];

// ─── Template library filter options (moved from rules.ts) ──────────

export interface TemplateFilterOption {
  id: string;
  label: string;
}

export const TEMPLATE_CATEGORY_OPTIONS: TemplateFilterOption[] = [
  { id: "all", label: "全部" },
  { id: "white-bg", label: "白底主图" },
  { id: "metal", label: "金属质感" },
  { id: "structure", label: "结构细节" },
  { id: "scene", label: "应用场景" },
  { id: "comparison", label: "对比图" },
  { id: "custom", label: "自定义" },
];

export const TEMPLATE_STYLE_OPTIONS: TemplateFilterOption[] = [
  { id: "all", label: "全部" },
  { id: "showcase", label: "展台橱窗" },
  { id: "nature", label: "自然景观" },
  { id: "festival", label: "节日氛围" },
  { id: "architecture", label: "人文建筑" },
  { id: "abstract", label: "抽象概念" },
  { id: "indoor", label: "室内空间" },
];

export const TEMPLATE_TYPE_OPTIONS: TemplateFilterOption[] = [
  { id: "all", label: "全部" },
  { id: "prompt", label: "Prompt 模板" },
  { id: "background", label: "背景模板" },
  { id: "image-text", label: "图文模板" },
];

export const TEMPLATE_SOURCE_OPTIONS = [
  { id: "all", label: "全部" },
  { id: "mine", label: "我的模板" },
  { id: "favorites", label: "收藏模板" },
];

export function getEnabledOptions(
  key: "templateCategory" | "templateStyle" | "templateType"
): TemplateFilterOption[] {
  switch (key) {
    case "templateCategory":
      return TEMPLATE_CATEGORY_OPTIONS;
    case "templateStyle":
      return TEMPLATE_STYLE_OPTIONS;
    case "templateType":
      return TEMPLATE_TYPE_OPTIONS;
    default:
      return [];
  }
}
