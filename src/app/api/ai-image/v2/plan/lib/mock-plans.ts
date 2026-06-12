import type {
  ProductAnalysis,
  CreativePlan,
  ImageSetPlan,
  PlanArchetype,
  CopyBlock,
  VisualComplexity,
  InformationDensity,
} from "@/app/ai-image/v2/types";
import { detectCopySource } from "./copy-source";
import { buildLayoutOverlay } from "./layout-overlay";
import { buildPlanSummaryPrompt, buildImageGenerationPrompt } from "./prompt-builders";

// ── Product-type-aware copy engine ────────────────────────────────

type ProductCategory = "cutting_tool" | "key_hardware" | "bearing" | "fastener" | "fixture" | "machined_part" | "general";

function detectCategory(productType: string): ProductCategory {
  const p = productType.toLowerCase();
  if (p.includes("cut") || p.includes("mill") || p.includes("drill") || p.includes("blade") || p.includes("tool")) return "cutting_tool";
  if (p.includes("key") || p.includes("hardware") || p.includes("lock")) return "key_hardware";
  if (p.includes("bearing") || p.includes("rotate") || p.includes("bushing")) return "bearing";
  if (p.includes("fastener") || p.includes("screw") || p.includes("bolt") || p.includes("nut") || p.includes("connector")) return "fastener";
  if (p.includes("clamp") || p.includes("fixture") || p.includes("jig") || p.includes("vise")) return "fixture";
  if (p.includes("machined") || p.includes("sheet") || p.includes("metal part") || p.includes("custom part")) return "machined_part";
  return "general";
}

interface CopySet {
  headlines: string[];
  subheadlines: string[];
  featurePoints: { title: string; body: string; iconHint: string }[];
  technicalPoints: { title: string; body: string; iconHint: string }[];
  bottomInfo: string[];
}

function copyForCategory(cat: ProductCategory): CopySet {
  const sets: Record<ProductCategory, CopySet> = {
    cutting_tool: {
      headlines: [
        "SMOOTH CHIP FLOW",
        "ENGINEERED FOR STEEL",
        "DRY CUT ALUMINUM",
        "PRECISION FLUTE DESIGN",
        "CLEAN CUT EVERY TIME",
        "OPTIMIZED FOR SPEED",
        "ALUMINUM MACHINING EXPERT",
        "CHIP FREE CUTTING",
        "STABLE DEEP SLOT",
      ],
      subheadlines: [
        "Optimized flute geometry delivers efficient chip evacuation across a wide range of cutting speeds and depths",
        "Advanced edge geometry is engineered for stable, predictable machining performance under demanding production conditions",
        "Built specifically for high-speed dry cutting without coolant, reducing workshop mess and saving operating costs",
        "Reinforced core structure maintains rigidity during aggressive feeds, delivering cleaner walls and extended tool life",
      ],
      featurePoints: [
        { title: "FAST CHIP REMOVAL", body: "Optimized flute geometry clears chips rapidly, preventing buildup and maintaining consistent cutting performance even during deep slotting operations in aluminum and steel", iconHint: "wind" },
        { title: "LESS HEAT BUILD-UP", body: "Advanced edge geometry reduces friction and thermal stress, enabling stable dry machining without coolant for cleaner workshop environments and reduced operating costs", iconHint: "temperature" },
        { title: "HIGH FEED EFFICIENCY", body: "Engineered cutting edge supports aggressive feed rates while delivering superior surface finish, reducing cycle time in high-volume production environments without sacrificing quality", iconHint: "chart" },
        { title: "SHARP CUTTING EDGE", body: "Precision-ground edge geometry maintains consistent cutting performance through extended use, delivering repeatable results shift after shift in demanding production environments", iconHint: "target" },
        { title: "STABLE CHIP EVACUATION", body: "Carefully calculated flute spacing and helix angle work together to move chips away from the cutting zone quickly, preventing recutting and protecting surface finish quality", iconHint: "wind" },
        { title: "BETTER SURFACE FINISH", body: "Consistent edge quality and stable cutting dynamics produce smooth machined surfaces that meet tight tolerance requirements without additional finishing operations", iconHint: "spark" },
      ],
      technicalPoints: [
        { title: "OPTIMIZED HELIX ANGLE", body: "35-degree helix design balances axial and radial cutting forces for smooth entry, reduced chatter, and extended tool life in aluminum machining applications", iconHint: "gear" },
        { title: "REINFORCED CORE DESIGN", body: "Thickened central core maintains structural stability under heavy radial loads, preventing deflection and ensuring dimensional accuracy in deep cuts", iconHint: "shield" },
        { title: "PRECISE FLUTE PROFILE", body: "Computer-modeled flute geometry is engineered for consistent chip formation and evacuation across the full recommended speed and feed range", iconHint: "target" },
        { title: "CONTROLLED EDGE PREP", body: "Micro-honed cutting edge balances sharpness with durability, resisting micro-chipping while maintaining the aggressive cutting action needed for efficient material removal", iconHint: "gear" },
      ],
      bottomInfo: ["STABLE CUTTING PERFORMANCE", "EXTENDED TOOL LIFE", "SUPERIOR SURFACE FINISH", "DRY MACHINING READY"],
    },
    key_hardware: {
      headlines: [
        "SECURE FIT",
        "SMOOTH TURNING",
        "DURABLE METAL BODY",
        "PRECISE CUT PROFILE",
        "EVERYDAY RELIABILITY",
        "SOLID CONSTRUCTION",
        "TRUSTED PERFORMANCE",
      ],
      subheadlines: [
        "Engineered for consistent, reliable performance in daily industrial and commercial use",
        "Precision-machined from quality material for perfect compatibility with standard hardware systems",
        "Designed to withstand repeated stress cycles while maintaining smooth, predictable operation over time",
      ],
      featurePoints: [
        { title: "STRONGER GRIP", body: "Enhanced contact surface geometry provides a secure hold that resists slipping under torque, ensuring reliable engagement in critical fastening applications", iconHint: "shield" },
        { title: "SMOOTH OPERATION", body: "Precision-machined surfaces eliminate binding and sticking during insertion and rotation, delivering fluid motion that reduces operator fatigue during extended use", iconHint: "wind" },
        { title: "DURABLE BUILD", body: "Quality metal construction resists deformation and wear under repeated stress cycles, maintaining consistent performance in high-frequency industrial environments", iconHint: "shield" },
        { title: "PRECISE FIT", body: "Exact dimensional tolerances ensure reliable compatibility with standard mating components, eliminating play and ensuring consistent engagement every time", iconHint: "target" },
        { title: "RELIABLE ENGAGEMENT", body: "Engineered profile maintains consistent contact across the full engagement depth, distributing load evenly and preventing premature wear at contact points", iconHint: "shield" },
        { title: "EVERYDAY RELIABILITY", body: "Proven design delivers consistent results in real-world conditions, from assembly lines to maintenance workshops, without unexpected failure or degradation", iconHint: "check" },
      ],
      technicalPoints: [
        { title: "ACCURATE PROFILE", body: "CNC-machined to exact specifications with tight dimensional control, ensuring seamless compatibility and consistent fit with standard hardware counterparts", iconHint: "target" },
        { title: "QUALITY MATERIAL", body: "Solid metal construction throughout with no weak points or hollow sections, providing uniform strength and resistance to mechanical stress across the entire body", iconHint: "shield" },
        { title: "CONSISTENT HARDNESS", body: "Heat-treated to achieve balanced hardness that resists surface deformation while maintaining enough ductility to avoid brittle failure under impact", iconHint: "shield" },
      ],
      bottomInfo: ["RELIABLE FIT GUARANTEED", "LONG SERVICE LIFE", "SMOOTH ACTION", "QUALITY MATERIAL"],
    },
    bearing: {
      headlines: [
        "SMOOTH ROTATION",
        "LOW FRICTION",
        "STABLE SUPPORT",
        "PRECISION FIT",
        "QUIET MOTION",
        "EFFICIENT POWER",
        "RELIABLE LOAD HANDLING",
      ],
      subheadlines: [
        "Engineered for consistent rotational performance with minimized energy loss and heat generation",
        "Optimized internal geometry reduces friction while maintaining stable support under varying loads and speeds",
        "Precision-manufactured races and rolling elements deliver exact tolerances for seamless assembly and long service life",
      ],
      featurePoints: [
        { title: "SMOOTH ROTATION", body: "Precision-ground races and rolling elements work together to deliver consistent, low-resistance motion that reduces power consumption and improves overall system efficiency", iconHint: "wind" },
        { title: "LOW FRICTION", body: "Optimized internal geometry and quality lubrication retention minimize contact resistance, resulting in efficient power transfer and significantly reduced heat generation during continuous operation", iconHint: "temperature" },
        { title: "STABLE SUPPORT", body: "Engineered load distribution maintains reliable radial and axial support across the full operating envelope, preventing shaft deflection and maintaining alignment under dynamic loads", iconHint: "shield" },
        { title: "PRECISION FIT", body: "Manufactured to exact dimensional tolerances with tight roundness control, ensuring seamless press-fit installation and maintaining critical shaft-to-housing clearances", iconHint: "target" },
        { title: "QUIET MOTION", body: "Consistent internal clearances and precision-matched components eliminate vibration and noise, making this bearing ideal for applications where acoustic performance matters", iconHint: "wind" },
        { title: "EFFICIENT POWER", body: "Low-friction design translates more input power to useful work rather than heat, improving overall system efficiency and reducing cooling requirements in compact assemblies", iconHint: "chart" },
      ],
      technicalPoints: [
        { title: "BALANCED DESIGN", body: "Computer-optimized internal geometry distributes loads evenly across all rolling elements, preventing individual component overload and extending collective service life", iconHint: "target" },
        { title: "SEALED PROTECTION", body: "Integrated contact seals keep abrasive contaminants out while retaining lubrication inside the bearing cavity, maintaining performance in dusty or wet industrial environments", iconHint: "shield" },
        { title: "EVEN LOAD DISTRIBUTION", body: "Precision-matched race curvature and rolling element diameter ensure each ball or roller carries its share of the load, preventing localized fatigue and premature failure", iconHint: "target" },
      ],
      bottomInfo: ["STABLE ROTATION", "LOW NOISE OPERATION", "EXTENDED SERVICE LIFE", "EFFICIENT PERFORMANCE"],
    },
    fastener: {
      headlines: [
        "SECURE LOCKING",
        "STRONG CONNECTION",
        "CLEAN THREADS",
        "EASY INSTALLATION",
        "STABLE HOLD",
        "RELIABLE FASTENING",
        "PRECISION THREADS",
      ],
      subheadlines: [
        "Reliable fastening engineered for critical industrial applications where joint integrity is paramount",
        "Precision threads deliver consistent torque response and predictable clamp load for repeatable assembly quality",
        "Designed to maintain clamp force under vibration, thermal cycling, and dynamic loading without loosening",
      ],
      featurePoints: [
        { title: "SECURE LOCKING", body: "Engineered thread profile and material properties work together to resist loosening under vibration and dynamic loading, maintaining joint integrity in critical applications", iconHint: "shield" },
        { title: "CLEAN THREADS", body: "Precision-rolled or cut threads provide smooth, burr-free engagement that eliminates galling and cross-threading, ensuring reliable installation even in blind or recessed holes", iconHint: "gear" },
        { title: "STRONG CONNECTION", body: "Optimized shank diameter and thread engagement length maintain consistent clamp force under operational loads, preventing joint separation and maintaining assembly stiffness", iconHint: "shield" },
        { title: "EASY INSTALLATION", body: "Chamfered lead-in and consistent thread form allow smooth starting and accurate driving, reducing installation time and eliminating the need for thread-chasing preparation", iconHint: "tool" },
        { title: "STABLE HOLD", body: "Engineered friction characteristics between mating threads maintain consistent preload over time, resisting self-loosening caused by thermal expansion and vibration cycles", iconHint: "shield" },
        { title: "RELIABLE ENGAGEMENT", body: "Consistent thread pitch and profile accuracy ensure predictable torque-to-tension relationship, enabling repeatable assembly with standard torque tools", iconHint: "target" },
      ],
      technicalPoints: [
        { title: "PRECISE THREAD FORM", body: "Threads manufactured to tight pitch diameter and flank angle tolerances, ensuring consistent engagement depth and clamp load across large production batches", iconHint: "gear" },
        { title: "CONTROLLED TORQUE", body: "Engineered thread friction characteristics provide a predictable torque-tension curve, allowing accurate preload setting with standard torque wrenches without special lubricants", iconHint: "target" },
        { title: "UNIFORM HARDNESS", body: "Controlled heat treatment produces consistent hardness from thread crest to shank center, preventing thread stripping while maintaining enough ductility to absorb installation stress", iconHint: "shield" },
      ],
      bottomInfo: ["RELIABLE HOLD GUARANTEED", "EASY INSTALLATION", "STRONG CONNECTION", "PRECISION THREADS"],
    },
    fixture: {
      headlines: [
        "FIRM CLAMPING",
        "ACCURATE POSITIONING",
        "STABLE SETUP",
        "QUICK ADJUSTMENT",
        "SOLID HOLD",
        "PRECISION CLAMPING",
        "RIGID CONSTRUCTION",
      ],
      subheadlines: [
        "Precision clamping system designed for machining, assembly, and inspection applications requiring repeatability",
        "Stable positioning maintains accuracy through cutting forces, vibration, and thermal changes during extended operations",
        "Rigid construction absorbs and distributes clamping loads without distortion, protecting both workpiece and machine accuracy",
      ],
      featurePoints: [
        { title: "FIRM CLAMPING", body: "High-force clamping mechanism holds workpieces securely without slip or chatter, maintaining position integrity even under aggressive cutting forces and vibration", iconHint: "shield" },
        { title: "ACCURATE POSITIONING", body: "Precision-ground locating surfaces and repeatable clamping geometry enable consistent setup-to-setup accuracy, reducing scrap and eliminating trial cuts", iconHint: "target" },
        { title: "STABLE SETUP", body: "Rigid body construction minimizes deflection and vibration transmission during machining, protecting surface finish and dimensional accuracy in precision operations", iconHint: "shield" },
        { title: "QUICK ADJUSTMENT", body: "Smooth-operating adjustment mechanism enables fast repositioning between operations, reducing changeover time and increasing productive machine utilization", iconHint: "tool" },
        { title: "RIGID CONSTRUCTION", body: "Heavy-duty body material and optimized cross-section maintain structural integrity under maximum rated clamping force, preventing jaw lift or base distortion", iconHint: "shield" },
        { title: "EVEN PRESSURE", body: "Parallel jaw faces distribute clamping force uniformly across the workpiece contact area, preventing distortion on thin-walled or delicate parts while maintaining secure hold", iconHint: "target" },
      ],
      technicalPoints: [
        { title: "PARALLEL JAWS", body: "Precision-ground jaw faces maintained parallel within tight tolerances, ensuring even pressure distribution that prevents workpiece distortion while maximizing contact area", iconHint: "target" },
        { title: "RIGID BODY", body: "Finite-element-optimized body geometry maintains stiffness under combined clamping and cutting forces, preserving both workpiece position and machine tool accuracy", iconHint: "shield" },
        { title: "PRECISE GUIDE", body: "Hardened guide surfaces maintain jaw alignment through thousands of clamping cycles, preventing jaw lift and ensuring consistent repeatability over the fixture's service life", iconHint: "target" },
      ],
      bottomInfo: ["SECURE HOLD", "PRECISE SETUP", "STABLE PERFORMANCE", "RIGID CONSTRUCTION"],
    },
    machined_part: {
      headlines: [
        "CNC MACHINED FINISH",
        "CLEAN EDGES",
        "ACCURATE HOLE POSITION",
        "SMOOTH SURFACE",
        "CUSTOM INDUSTRIAL PART",
        "PRECISION ENGINEERED",
        "PRODUCTION READY",
      ],
      subheadlines: [
        "Precision CNC machining delivers exacting dimensional accuracy and consistent quality for industrial applications",
        "Clean edges and accurate features arrive ready for assembly without secondary deburring or finishing operations",
        "Every surface, hole, and contour is machined to specification, ensuring seamless integration with mating components",
      ],
      featurePoints: [
        { title: "CNC MACHINED", body: "Multi-axis CNC machining centers execute complex geometries with micron-level repeatability, producing identical parts across production batches with minimal variation", iconHint: "gear" },
        { title: "CLEAN EDGES", body: "Precision cutting tools and optimized feeds produce clean breakout edges without burrs or sharp remnants, eliminating the need for secondary deburring before assembly", iconHint: "spark" },
        { title: "ACCURATE HOLES", body: "CNC-drilled and reamed holes are positioned to exact coordinate specifications with tight true-position tolerances, ensuring proper alignment with mating fasteners and pins", iconHint: "target" },
        { title: "SMOOTH SURFACE", body: "Optimized cutting parameters produce consistent surface finish across all machined faces, meeting specification requirements without additional grinding or polishing operations", iconHint: "spark" },
        { title: "TIGHT TOLERANCES", body: "Critical dimensions are held to tight tolerances throughout the machining process, with in-process inspection verifying accuracy before parts leave the production floor", iconHint: "target" },
        { title: "QUALITY MATERIAL", body: "Industrial-grade raw stock selected for machinability and mechanical properties, ensuring the finished part delivers both dimensional stability and structural integrity", iconHint: "shield" },
      ],
      technicalPoints: [
        { title: "TIGHT TOLERANCES", body: "Computer-controlled machining holds critical dimensions to tight limits, with thermal compensation and tool wear monitoring maintaining accuracy across extended production runs", iconHint: "target" },
        { title: "QUALITY MATERIAL", body: "Certified raw stock with controlled chemistry and grain structure ensures consistent machinability and predictable mechanical properties in the finished component", iconHint: "shield" },
        { title: "ACCURATE FIXTURING", body: "Precision workholding maintains part orientation and location through all machining operations, ensuring feature-to-feature relationships meet drawing requirements", iconHint: "target" },
      ],
      bottomInfo: ["PRECISION MACHINING", "CLEAN FINISH", "READY TO ASSEMBLE", "TIGHT TOLERANCES"],
    },
    general: {
      headlines: [
        "ENGINEERED PERFORMANCE",
        "RELIABLE DESIGN",
        "PROFESSIONAL GRADE",
        "PRECISION CRAFTED",
        "BUILT TO WORK",
        "INDUSTRIAL STRENGTH",
        "CONSISTENT QUALITY",
      ],
      subheadlines: [
        "Designed and built for consistent professional performance in demanding industrial environments",
        "Quality construction and precision manufacturing ensure reliable operation under real-world conditions",
        "Every detail engineered with the professional user in mind, from material selection to surface finish",
      ],
      featurePoints: [
        { title: "DURABLE BUILD", body: "Engineered material selection and robust construction deliver long service life under continuous industrial use, resisting wear and maintaining performance over time", iconHint: "shield" },
        { title: "PRECISE FIT", body: "Accurate dimensional control ensures reliable compatibility with standard mating components, eliminating the need for fitting or modification during assembly", iconHint: "target" },
        { title: "SMOOTH OPERATION", body: "Precision-machined surfaces and optimized contact geometry deliver consistent, predictable performance every time, reducing variability in production processes", iconHint: "wind" },
        { title: "QUALITY FINISH", body: "Professional surface finish and appearance reflect the engineering quality underneath, delivering both functional performance and visual confidence in critical applications", iconHint: "spark" },
        { title: "RELIABLE PERFORMANCE", body: "Consistent manufacturing standards and quality verification ensure every unit performs to the same high standard, eliminating the cost and risk of in-process failures", iconHint: "shield" },
        { title: "PROFESSIONAL GRADE", body: "Industrial-grade materials and construction methods throughout deliver the reliability that professionals depend on for critical applications where failure is not an option", iconHint: "shield" },
      ],
      technicalPoints: [
        { title: "CONTROLLED QUALITY", body: "Statistical process control and in-process inspection maintain consistent dimensional and surface quality across production batches, ensuring every part meets specification", iconHint: "target" },
        { title: "TESTED DESIGN", body: "Engineering validation testing under simulated real-world conditions confirms performance before release, identifying and eliminating potential failure modes early", iconHint: "shield" },
        { title: "PROVEN MATERIAL", body: "Material selection based on application requirements and industry experience ensures the right balance of strength, durability, and machinability for the intended use", iconHint: "shield" },
      ],
      bottomInfo: ["RELIABLE PERFORMANCE", "DURABLE CONSTRUCTION", "PROFESSIONAL GRADE", "CONSISTENT QUALITY"],
    },
  };
  return sets[cat];
}

// ── Archetype config ──────────────────────────────────────────────

interface ArchetypeConfig {
  archetype: PlanArchetype;
  planNameCn: string;
  templateId: string;
  imageType: string;
  visualComplexity: VisualComplexity;
  informationDensity: InformationDensity;
  layoutTypeHint: string;
  visualDesc: string;
  colorDesc: string;
  layoutDesc: string;
}

function getArchetypeConfigs(): ArchetypeConfig[] {
  return [
    {
      archetype: "hero_feature",
      planNameCn: "单品卖点图",
      templateId: "tpl-hero-feature",
      imageType: "ecommerce_hero",
      visualComplexity: "medium",
      informationDensity: "medium",
      layoutTypeHint: "hero_right_product_left_features",
      visualDesc:
        "Dramatic low-angle commercial photography. Strong key light from upper-left creates crisp specular highlights on metallic surfaces with deep sculpted shadows. Warm rim light traces the far edge. Subtle light rays and atmospheric haze behind the product add depth. Shallow depth of field. High-resolution photorealistic material rendering.",
      colorDesc:
        "Dark graphite background (#1a1a2e) with subtle radial gradient. Electric blue (#2563eb) headline block with white text. Amber (#f59e0b) accent borders on feature cards. Metallic silver product tones with cool rim light.",
      layoutDesc:
        "Product commands the RIGHT 55% at a bold 15-degree upward tilt. MASSIVE headline in ALL CAPS spans the UPPER-LEFT quadrant on a bold diagonal color block. THREE vertical feature cards stack along the LEFT edge — each a dark semi-transparent panel with a bright left accent border and an icon circle. The headline block overlaps the product slightly for depth. Background features dramatic radial light beams emanating from behind the product.",
    },
    {
      archetype: "technical_breakdown",
      planNameCn: "技术解析图",
      templateId: "tpl-technical-breakdown",
      imageType: "product_detail",
      visualComplexity: "complex",
      informationDensity: "high",
      layoutTypeHint: "technical_callout_with_insets",
      visualDesc:
        "Clean technical-commercial hybrid photography with clinical precision. Large softbox from upper-left creates smooth gradients. Secondary hard accent light from lower-right adds crisp edge definition revealing surface topography. Subtle light bloom behind the product creates a halo effect. Medium depth of field keeping entire product razor-sharp. Callout connector lines are thin, bright, and precisely aimed at real product features.",
      colorDesc:
        "Dark slate background (#0f172a) with radial gradient to deeper black at edges. Electric blue (#3b82f6) primary accent in headline block, callout lines, circle markers, and bottom info bar. Bright cyan (#06b6d4) in secondary callout accents. Callout cards use semi-transparent dark panels (#1e293b at 90% opacity) with blue left borders. White text for maximum contrast.",
      layoutDesc:
        "Product dominates the CENTER-RIGHT at 65% scale in a clear three-quarter view. MASSIVE headline sits at TOP-LEFT on a bold rectangular color block. THREE annotated callout lines with circle markers point from the LEFT edge to specific product features — each callout has a bold title and brief description on a dark semi-transparent card. BOTTOM edge features a horizontal info bar with three key labels on individual dark cards separated by thin vertical lines. Background has a faint technical grid pattern at 8% opacity, evoking engineering blueprints.",
    },
    {
      archetype: "comparison_story",
      planNameCn: "优势对比图",
      templateId: "tpl-advantage-comparison",
      imageType: "comparison_chart",
      visualComplexity: "complex",
      informationDensity: "high",
      layoutTypeHint: "comparison_two_columns",
      visualDesc:
        "Strict 50/50 vertical split-screen comparison photography on a unified deep dark background (#151515). LEFT side: a generic unbranded ordinary version of the same product category, desaturated to 20-30% saturation, dimmer cool blue-gray lighting (#5A6A7A cast), slightly softer focus, with a large prominent RED X mark beside the product and a 'ORDINARY' label in cool gray. RIGHT side: the actual featured product in FULL COLOR, tack-sharp, bright warm key light (3200K-4000K) from upper-left with warm amber edge highlights (#FFB347) and a subtle glow/halo, appearing slightly larger than the left side. A large GREEN CHECKMARK sits beside the featured product. CENTER: a bold white/silver 'VS' divider on a vertical dividing line, readable at thumbnail size, possibly inside a subtle circular badge. BOTTOM: a full-width horizontal dark feature bar with three evenly-spaced advantage cards. The overall feel is dramatic, decisive, and instantly readable as a comparison.",
      colorDesc:
        "Unified deep dark background (#151515 to #1E1E1E) across the ENTIRE image — both halves share the same background for cohesion. LEFT side: desaturated blue-gray product tones (#5A6A7A), muted cool gray text (#8A9AAF), prominent RED (#DC2626) for the X mark. RIGHT side: full product natural colors, warm amber highlights (#FFB347), bright GREEN (#22C55E) for the checkmark, warm white text. CENTER VS divider: white (#FFFFFF) or silver (#E0E0E0) bold text. BOTTOM feature bar: dark charcoal (#1A1A1A) panels with green left-border accents (#22C55E). The contrast between the dim, cool left and the bright, warm right must be dramatic and immediately visible.",
      layoutDesc:
        "Strict 50/50 vertical split. LEFT half (48%): generic ordinary product at 30-40% of half-frame, desaturated, dim, with RED X mark prominently placed beside it, 'ORDINARY' label above in ALL CAPS cool gray, short negative descriptor below (e.g., 'Chip Welding / Poor Finish'). CENTER (4%): bold 'VS' text centered vertically on a thin dividing line, white/silver, heavy weight, possibly in a subtle translucent circular badge. RIGHT half (48%): actual featured product at 35-45% of half-frame — SLIGHTLY LARGER than left, full color, bright, warm light, with GREEN CHECKMARK beside it, 'OUR PRODUCT' or 'UPGRADED' label above in ALL CAPS warm accent, short positive descriptor below (e.g., 'Smooth Finish / No Chip Welding'). BOTTOM 15-20%: horizontal dark panel spanning full width with THREE feature advantage cards evenly spaced — each card has an icon + bold title (2-4 words, ALL CAPS) + 1-line description, with green left-border accent.",
    },
    {
      archetype: "application_scene",
      planNameCn: "应用场景图",
      templateId: "tpl-usage-scene",
      imageType: "lifestyle_scene",
      visualComplexity: "medium",
      informationDensity: "medium",
      layoutTypeHint: "four_panel_application_grid",
      visualDesc:
        "Authentic environmental photography in a real machining or industrial context. Warm tungsten ambient light from overhead creates a natural atmosphere. A soft key light on the product keeps it hero-sharp while the environment recedes into creamy bokeh. Realistic shadows cast by the product onto the workbench surface. Background elements — CNC machine, aluminum blocks, metal chips — are unbranded and genuinely industrial. The mood is quiet competence and earned expertise.",
      colorDesc:
        "Warm earthy workshop palette dominated by natural wood browns (#8b6914), oxidized steel grays (#6b7280), and warm tungsten amber (#fbbf24) light casts. Product's metallic surfaces catch both warm ambient and cooler fill light. Text zones in clean white with subtle drop shadows. A faint blue (#3b82f6) accent appears in geometric markers. The palette feels honest and unmistakably real.",
      layoutDesc:
        "Product sits naturally in working position on the LEFT 45%, as if paused mid-task on an authentic machining surface. The surrounding environment fills the RIGHT side in soft atmospheric blur. Headline occupies UPPER-LEFT on a semi-transparent dark overlay band. THREE application labels form a clean vertical list along the RIGHT edge, each with a minimal geometric marker. A subtle diagonal light ray crosses from upper-left to lower-right, unifying the scene.",
    },
    {
      archetype: "multi_panel_info",
      planNameCn: "多模块信息图",
      templateId: "tpl-multi-panel",
      imageType: "feature_showcase",
      visualComplexity: "complex",
      informationDensity: "high",
      layoutTypeHint: "large_headline_with_bottom_info_bar",
      visualDesc:
        "Structured commercial photography with the product as a clear anchor point. Even, controlled lighting that reveals all surfaces without dramatic shadows. The composition supports information overlay — text panels, icon blocks, and data cards are integrated into the design rather than placed on top. Clean, organized, and information-rich without feeling cluttered.",
      colorDesc:
        "Deep navy background (#0f172a) with subtle blue panel cards. Silver (#94a3b8) icons and white text on dark cards. Accent blue (#3b82f6) used for borders, highlights, and active elements. Bottom info bar uses a slightly lighter dark panel (#1e293b) with blue top border. The palette communicates precision, organization, and technical credibility.",
      layoutDesc:
        "Headline dominates TOP-LEFT on a large dark panel. Product sits on the RIGHT at 50% scale, well-lit and fully visible. LEFT side features a vertical stack of THREE info cards — each with an icon circle, bold title, and brief description. BOTTOM features a full-width info bar with four evenly-spaced labels separated by thin vertical dividers. The composition is grid-like, organized, and easy to scan.",
    },
    {
      archetype: "premium_showcase",
      planNameCn: "高级质感图",
      templateId: "tpl-premium-showcase",
      imageType: "product_showcase",
      visualComplexity: "medium",
      informationDensity: "low",
      layoutTypeHint: "premium_center_product_minimal_text",
      visualDesc:
        "High-end luxury product photography reminiscent of premium watch campaigns. Controlled large softbox from upper-right creates satin-smooth gradients with a single perfect catchlight. Deep but velvety shadows add dimension without harshness. Subtle warm fill from below brings out rich material tones. Soft reflection on the surface beneath creates weight and permanence. Background dissolves into creamy atmospheric depth. Every surface rendered with tactile, almost touchable quality.",
      colorDesc:
        "Deep matte black background (#050508) transitioning to rich navy (#0f172a) at top. Champagne gold (#c9a96e) accents in panel borders, headline underline, and subtle highlight zones. Warm bronze and cognac tones emerge in the product's metallic surfaces. White and warm cream text for readability and elegance. The palette speaks of exclusivity, heritage, and master craftsmanship.",
      layoutDesc:
        "Product rests confidently at CENTER at 70% scale with generous negative space on all sides. Headline appears in the UPPER THIRD in refined, well-spaced typography — no heavy background block, just subtle text shadow. A single thin horizontal rule sits beneath the headline. A short subheadline floats in the LOWER THIRD. No heavy panels, no aggressive blocks — just the product, clean typography, and breathing room.",
    },
    {
      archetype: "promo_sales",
      planNameCn: "强销售图",
      templateId: "tpl-promo-sales",
      imageType: "promo_sales",
      visualComplexity: "complex",
      informationDensity: "medium",
      layoutTypeHint: "top_headline_bottom_feature_bar",
      visualDesc:
        "High-impact studio photography with theatrical lighting and bold compositional energy. Powerful key light from a low angle creates dramatic upward shadows and aggressive specular highlights. Strong rim lighting from behind and above wraps the product in a luminous edge. Background features subtle atmospheric particles and directional light beams for cinematic depth. Deep contrast with rich shadow detail — a statement visual.",
      colorDesc:
        "Deep obsidian background (#0a0a0f) with rich crimson (#dc2626) and burnt orange (#ea580c) gradient accents in headline block. Bright gold (#fbbf24) rim highlights on the product create powerful warm-cool contrast. Feature bands use semi-transparent dark panels with thick accent strokes. White text for maximum impact. The palette is aggressive, passionate, and impossible to ignore.",
      layoutDesc:
        "Product dominates the LEFT 55% at a commanding low angle, casting a strong directional shadow. Headline explodes across the UPPER CENTER in oversized ALL CAPS on a high-contrast angular shape. THREE feature bands with thick accent strokes stack in the LOWER RIGHT. A dramatic diagonal element slices from bottom-left to top-center creating visual tension. Background has deep gradient with subtle light rays.",
    },
  ];
}

function pickArchetypesForSingle(seed: string): PlanArchetype[] {
  // Deterministic but varied selection
  const all: PlanArchetype[] = ["hero_feature", "technical_breakdown", "comparison_story", "application_scene", "multi_panel_info", "premium_showcase", "promo_sales"];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const shuffled = [...all].sort((a, b) => {
    const ha = ((hash ^ a.charCodeAt(0)) * 2654435761) >>> 0;
    const hb = ((hash ^ b.charCodeAt(0)) * 2654435761) >>> 0;
    return ha - hb;
  });
  return [shuffled[0], shuffled[1], shuffled[2]];
}

function pickArchetypesForSet(): PlanArchetype[] {
  return ["hero_feature", "multi_panel_info", "technical_breakdown", "application_scene", "comparison_story"];
}

// ── Build copyBlocks from archetype + product category ────────────

function buildCopyBlocks(
  archetype: PlanArchetype,
  copySet: CopySet,
  headline: string,
  subtitle: string | undefined
): CopyBlock[] {
  const blocks: CopyBlock[] = [];
  let p = 1;

  blocks.push({ id: `cb-headline`, title: headline, role: "headline", priority: p++ });

  if (subtitle) {
    blocks.push({ id: `cb-subheadline`, title: subtitle, role: "subheadline", priority: p++ });
  }

  if (archetype === "hero_feature" || archetype === "promo_sales") {
    // 3 feature points + core claim
    blocks.push({ id: `cb-claim`, title: "CORE ADVANTAGE", role: "core_claim", priority: p++ });
    copySet.featurePoints.slice(0, 3).forEach((fp, i) => {
      blocks.push({
        id: `cb-fp-${i}`,
        title: fp.title,
        subtitle: fp.body,
        role: "feature_point",
        iconHint: fp.iconHint,
        priority: p++,
      });
    });
  } else if (archetype === "technical_breakdown") {
    // technical points + feature points mixed
    copySet.technicalPoints.slice(0, 2).forEach((tp, i) => {
      blocks.push({
        id: `cb-tp-${i}`,
        title: tp.title,
        subtitle: tp.body,
        role: "technical_point",
        iconHint: tp.iconHint,
        priority: p++,
      });
    });
    copySet.featurePoints.slice(0, 2).forEach((fp, i) => {
      blocks.push({
        id: `cb-fp-${i}`,
        title: fp.title,
        subtitle: fp.body,
        role: "feature_point",
        iconHint: fp.iconHint,
        priority: p++,
      });
    });
  } else if (archetype === "comparison_story") {
    // comparison labels
    blocks.push({ id: `cb-vs-left`, title: "ORDINARY", role: "comparison_label", priority: p++ });
    blocks.push({ id: `cb-vs-right`, title: "OUR PRODUCT", role: "comparison_label", priority: p++ });
    copySet.featurePoints.slice(0, 3).forEach((fp, i) => {
      blocks.push({
        id: `cb-fp-${i}`,
        title: fp.title,
        subtitle: fp.body,
        role: "feature_point",
        iconHint: fp.iconHint,
        priority: p++,
      });
    });
  } else if (archetype === "application_scene") {
    blocks.push({ id: `cb-claim`, title: "PROVEN IN ACTION", role: "core_claim", priority: p++ });
    copySet.featurePoints.slice(0, 3).forEach((fp, i) => {
      blocks.push({
        id: `cb-fp-${i}`,
        title: fp.title,
        subtitle: fp.body,
        role: "application_label",
        iconHint: fp.iconHint,
        priority: p++,
      });
    });
  } else if (archetype === "multi_panel_info") {
    copySet.featurePoints.forEach((fp, i) => {
      blocks.push({
        id: `cb-fp-${i}`,
        title: fp.title,
        subtitle: fp.body,
        role: "feature_point",
        iconHint: fp.iconHint,
        priority: p++,
      });
    });
    copySet.bottomInfo.forEach((bi, i) => {
      blocks.push({ id: `cb-bi-${i}`, title: bi, role: "bottom_info", priority: p++ });
    });
  } else if (archetype === "premium_showcase") {
    // minimal: just core claim + 1-2 features
    blocks.push({ id: `cb-claim`, title: "ENGINEERED EXCELLENCE", role: "core_claim", priority: p++ });
    copySet.featurePoints.slice(0, 2).forEach((fp, i) => {
      blocks.push({
        id: `cb-fp-${i}`,
        title: fp.title,
        subtitle: fp.body,
        role: "feature_point",
        iconHint: fp.iconHint,
        priority: p++,
      });
    });
  }

  // Add bottom_info for archetypes that benefit from it
  if (archetype !== "premium_showcase" && archetype !== "application_scene") {
    copySet.bottomInfo.forEach((bi, i) => {
      if (!blocks.find(b => b.title === bi && b.role === "bottom_info")) {
        blocks.push({ id: `cb-bi-${i}`, title: bi, role: "bottom_info", priority: p++ });
      }
    });
  }

  return blocks;
}

// ── Mock CN fields for translation demo ───────────────────────────

function getMockCnFields(
  archetype: PlanArchetype,
  headline: string,
  subtitle: string | undefined
): {
  headlineCn: string;
  subtitleCn: string;
  sellingPointsCn: string[];
  copyBlocksCn: CopyBlock[];
} {
  const commonFeatureCn = [
    { title: "快速排屑", body: "优化的槽型几何结构可快速清除切屑，防止堆积，保持一致的切削性能", iconHint: "wind" },
    { title: "低热量积聚", body: "先进的刃口几何结构减少摩擦和热应力，实现稳定的干加工", iconHint: "temperature" },
    { title: "高进给效率", body: "工程化切削刃支持激进的进给速率，同时提供卓越的表面光洁度", iconHint: "chart" },
    { title: "锋利切削刃", body: "精密磨削的刃口几何结构在长期使用中保持一致的切削性能", iconHint: "target" },
    { title: "稳定排屑", body: "精心计算的槽距和螺旋角协同工作，快速将切屑从切削区移走", iconHint: "wind" },
    { title: "更好表面光洁度", body: "一致的刃口质量和稳定的切削动力学产生光滑的加工表面", iconHint: "spark" },
  ];

  const commonTechnicalCn = [
    { title: "优化螺旋角", body: "35度螺旋设计平衡轴向和径向切削力，实现平滑切入，减少颤振", iconHint: "gear" },
    { title: "强化芯部设计", body: "加厚的中心芯部在重径向载荷下保持结构稳定性，防止偏转", iconHint: "shield" },
    { title: "精确槽型轮廓", body: "计算机建模的槽型几何结构专为一致的切屑形成和排屑而设计", iconHint: "target" },
    { title: "受控刃口处理", body: "微刃口处理平衡锋利度和耐用性，抵抗微崩刃", iconHint: "gear" },
  ];

  const commonBottomInfoCn = ["稳定切削性能", "延长刀具寿命", "卓越表面光洁度", "干加工就绪"];

  const byArchetype: Record<PlanArchetype, { headlineCn: string; subtitleCn: string; sellingPointsCn: string[]; copyBlocksCn: CopyBlock[] }> = {
    hero_feature: {
      headlineCn: "核心卖点",
      subtitleCn: "优化排屑设计，高效清除切屑，保持稳定的切削性能",
      sellingPointsCn: ["快速排屑技术", "低热量积聚", "高进给效率", "锋利切削刃"],
      copyBlocksCn: [
        { id: "cb-headline-cn", title: "核心卖点", role: "headline", priority: 1 },
        { id: "cb-subheadline-cn", title: subtitle ? "优化排屑设计，高效清除切屑" : "", role: "subheadline", priority: 2 },
        { id: "cb-claim-cn", title: "核心优势", role: "core_claim", priority: 3 },
        ...commonFeatureCn.slice(0, 3).map((fp, i) => ({
          id: `cb-fp-${i}-cn`, title: fp.title, subtitle: fp.body, role: "feature_point" as const, iconHint: fp.iconHint, priority: 4 + i,
        })),
      ],
    },
    technical_breakdown: {
      headlineCn: "技术解析",
      subtitleCn: "精密工程，卓越性能，细节决定品质",
      sellingPointsCn: ["优化螺旋角", "强化芯部设计", "精确槽型轮廓", "受控刃口处理"],
      copyBlocksCn: [
        { id: "cb-headline-cn", title: "技术解析", role: "headline", priority: 1 },
        { id: "cb-subheadline-cn", title: subtitle ? "精密工程，卓越性能" : "", role: "subheadline", priority: 2 },
        ...commonTechnicalCn.slice(0, 2).map((tp, i) => ({
          id: `cb-tp-${i}-cn`, title: tp.title, subtitle: tp.body, role: "technical_point" as const, iconHint: tp.iconHint, priority: 3 + i,
        })),
        ...commonFeatureCn.slice(0, 2).map((fp, i) => ({
          id: `cb-fp-${i}-cn`, title: fp.title, subtitle: fp.body, role: "feature_point" as const, iconHint: fp.iconHint, priority: 5 + i,
        })),
      ],
    },
    comparison_story: {
      headlineCn: "优势对比",
      subtitleCn: "清晰对比，一目了然，选择更明智",
      sellingPointsCn: ["安全可靠锁定", "清洁螺纹", "强力连接", "轻松安装"],
      copyBlocksCn: [
        { id: "cb-headline-cn", title: "优势对比", role: "headline", priority: 1 },
        { id: "cb-subheadline-cn", title: subtitle ? "清晰对比，一目了然" : "", role: "subheadline", priority: 2 },
        { id: "cb-vs-left-cn", title: "普通产品", role: "comparison_label", priority: 3 },
        { id: "cb-vs-right-cn", title: "我们的产品", role: "comparison_label", priority: 4 },
        ...commonFeatureCn.slice(0, 3).map((fp, i) => ({
          id: `cb-fp-${i}-cn`, title: fp.title, subtitle: fp.body, role: "feature_point" as const, iconHint: fp.iconHint, priority: 5 + i,
        })),
      ],
    },
    application_scene: {
      headlineCn: "应用场景",
      subtitleCn: "真实工况，可靠表现，值得信赖",
      sellingPointsCn: ["流畅旋转", "低摩擦", "稳定支撑", "精密配合"],
      copyBlocksCn: [
        { id: "cb-headline-cn", title: "应用场景", role: "headline", priority: 1 },
        { id: "cb-subheadline-cn", title: subtitle ? "真实工况，可靠表现" : "", role: "subheadline", priority: 2 },
        { id: "cb-claim-cn", title: "久经实战验证", role: "core_claim", priority: 3 },
        ...commonFeatureCn.slice(0, 3).map((fp, i) => ({
          id: `cb-fp-${i}-cn`, title: fp.title, subtitle: fp.body, role: "application_label" as const, iconHint: fp.iconHint, priority: 4 + i,
        })),
      ],
    },
    multi_panel_info: {
      headlineCn: "多模块信息",
      subtitleCn: "全面展示，信息丰富，一目了然",
      sellingPointsCn: ["快速排屑", "低热量积聚", "高进给效率", "锋利切削刃", "稳定排屑", "更好表面光洁度"],
      copyBlocksCn: [
        { id: "cb-headline-cn", title: "多模块信息", role: "headline", priority: 1 },
        { id: "cb-subheadline-cn", title: subtitle ? "全面展示，信息丰富" : "", role: "subheadline", priority: 2 },
        ...commonFeatureCn.map((fp, i) => ({
          id: `cb-fp-${i}-cn`, title: fp.title, subtitle: fp.body, role: "feature_point" as const, iconHint: fp.iconHint, priority: 3 + i,
        })),
        ...commonBottomInfoCn.slice(0, 4).map((bi, i) => ({
          id: `cb-bi-${i}-cn`, title: bi, role: "bottom_info" as const, priority: 9 + i,
        })),
      ],
    },
    premium_showcase: {
      headlineCn: "高级质感",
      subtitleCn: "精工细作，品质之选",
      sellingPointsCn: ["精密工程", "卓越品质", "稳定性能"],
      copyBlocksCn: [
        { id: "cb-headline-cn", title: "高级质感", role: "headline", priority: 1 },
        { id: "cb-subheadline-cn", title: subtitle ? "精工细作，品质之选" : "", role: "subheadline", priority: 2 },
        { id: "cb-claim-cn", title: "卓越工程", role: "core_claim", priority: 3 },
        ...commonFeatureCn.slice(0, 2).map((fp, i) => ({
          id: `cb-fp-${i}-cn`, title: fp.title, subtitle: fp.body, role: "feature_point" as const, iconHint: fp.iconHint, priority: 4 + i,
        })),
      ],
    },
    promo_sales: {
      headlineCn: "强销售",
      subtitleCn: "强劲性能，立即体验",
      sellingPointsCn: ["强劲动力", "清洁螺纹", "强力连接", "轻松安装"],
      copyBlocksCn: [
        { id: "cb-headline-cn", title: "强销售", role: "headline", priority: 1 },
        { id: "cb-subheadline-cn", title: subtitle ? "强劲性能，立即体验" : "", role: "subheadline", priority: 2 },
        { id: "cb-claim-cn", title: "核心优势", role: "core_claim", priority: 3 },
        ...commonFeatureCn.slice(0, 3).map((fp, i) => ({
          id: `cb-fp-${i}-cn`, title: fp.title, subtitle: fp.body, role: "feature_point" as const, iconHint: fp.iconHint, priority: 4 + i,
        })),
      ],
    },
    environment_showcase: {
      headlineCn: "环境场景",
      subtitleCn: "工业环境，真实呈现",
      sellingPointsCn: ["坚固耐用", "精密配合", "稳定运行", "优质材料"],
      copyBlocksCn: [
        { id: "cb-headline-cn", title: "环境场景", role: "headline", priority: 1 },
        { id: "cb-subheadline-cn", title: subtitle ? "工业环境，真实呈现" : "", role: "subheadline", priority: 2 },
        { id: "cb-claim-cn", title: "工业级品质", role: "core_claim", priority: 3 },
        ...commonFeatureCn.slice(0, 3).map((fp, i) => ({
          id: `cb-fp-${i}-cn`, title: fp.title, subtitle: fp.body, role: "feature_point" as const, iconHint: fp.iconHint, priority: 4 + i,
        })),
      ],
    },
  };

  const cn = byArchetype[archetype];
  // 过滤掉空的 subheadline
  return {
    ...cn,
    copyBlocksCn: cn.copyBlocksCn.filter((b) => !(b.role === "subheadline" && !b.title)),
  };
}

// ── Common risks ─────────────────────────────────────────────────

function commonRisks(): string[] {
  return [
    "Do not invent specifications, sizes, or material grades not provided by user",
    "Do not include fake logos, prices, or certification marks",
    "Keep all text in English only",
    "Hands, fingers, arms, table, background clutter, and packaging are NOT product parts",
    "Do not add CTA buttons, Buy Now, Shop Now, price badges, or discount badges",
    "Preserve original product structure: holes, slots, edges, threads, contours",
  ];
}

// ── Single plans ─────────────────────────────────────────────────

export function generateSinglePlans(analysis: ProductAnalysis, userGoal: string, forcedArchetype?: PlanArchetype): CreativePlan[] {
  const lower = userGoal.toLowerCase();
  const baseName = analysis.productName;
  const cat = detectCategory(analysis.productType);
  const copySet = copyForCategory(cat);

  const copySource = detectCopySource(userGoal);
  const copyNotes = copySource === "ai_suggested"
    ? ["AI generated selling points based on product type. User can edit before generation."]
    : copySource === "ai_rewritten"
      ? ["User provided Chinese requirements; AI translated intent into English e-commerce copy."]
      : undefined;

  const now = Date.now();
  // Comparison template: all 3 plans must use comparison_story for strict format
  // Other templates: Plan 1 follows template archetype, Plans 2-3 are free to vary for visual diversity
  const archetypes = forcedArchetype
    ? forcedArchetype === "comparison_story"
      ? [forcedArchetype, forcedArchetype, forcedArchetype]
      : [forcedArchetype, ...pickArchetypesForSingle(`${baseName}-${userGoal}`).slice(0, 2)]
    : pickArchetypesForSingle(`${baseName}-${userGoal}`);
  const configs = getArchetypeConfigs();

  const plans: CreativePlan[] = archetypes.map((arch, idx) => {
    const config = configs.find(c => c.archetype === arch)!;

    // Pick headline deterministically
    const headlineIndex = (now + idx * 7) % copySet.headlines.length;
    const headline = copySet.headlines[headlineIndex];
    const subIndex = (now + idx * 3) % copySet.subheadlines.length;
    const subtitle = copySet.subheadlines[subIndex];

    // Build copyBlocks
    const copyBlocks = buildCopyBlocks(arch, copySet, headline, subtitle);

    // Selling points from copyBlocks for compatibility
    const sellingPoints = copyBlocks
      .filter(b => b.role === "feature_point" || b.role === "technical_point")
      .map(b => b.subtitle ? `${b.title} / ${b.subtitle}` : b.title);

    const cnFields = getMockCnFields(arch, headline, subtitle);

    const plan: CreativePlan = {
      id: `plan-${now}-s${idx + 1}`,
      planName: `${config.planNameCn} ${idx + 1}`,
      planArchetype: arch,
      templateId: config.templateId,
      imageType: config.imageType,
      productAnalysis: analysis,
      productName: baseName,
      headline,
      subtitle,
      sellingPoints,
      copyBlocks,
      headlineCn: cnFields.headlineCn,
      subtitleCn: cnFields.subtitleCn,
      sellingPointsCn: cnFields.sellingPointsCn,
      copyBlocksCn: cnFields.copyBlocksCn,
      copySource,
      copyNotes,
      layoutDirection: config.layoutDesc,
      visualDirection: config.visualDesc,
      colorDirection: config.colorDesc,
      visualComplexity: config.visualComplexity,
      informationDensity: config.informationDensity,
      layoutOverlay: buildLayoutOverlay(headline, subtitle, sellingPoints, config.layoutTypeHint, config.imageType, copyBlocks),
      textLanguage: "English",
      riskWarnings: [...analysis.structureRisks, ...commonRisks()],
    };

    plan.planSummaryPrompt = buildPlanSummaryPrompt(plan);
    plan.imageGenerationPrompt = buildImageGenerationPrompt(plan);
    plan.finalPrompt = plan.imageGenerationPrompt;

    return plan;
  });

  return plans;
}

// ── Set plans (5-image detail page set) ───────────────────────────

export function generateSetPlans(analysis: ProductAnalysis, userGoal: string): ImageSetPlan[] {
  const baseName = analysis.productName;
  const cat = detectCategory(analysis.productType);
  const copySet = copyForCategory(cat);

  const copySource = detectCopySource(userGoal);
  const copyNotes = copySource === "ai_suggested"
    ? ["AI generated selling points based on product type. User can edit before generation."]
    : copySource === "ai_rewritten"
      ? ["User provided Chinese requirements; AI translated intent into English e-commerce copy."]
      : undefined;

  const now = Date.now();
  const archetypes = pickArchetypesForSet();
  const configs = getArchetypeConfigs();

  const setRoleNames = [
    { role: "Hero / 主视觉", purpose: "让用户一眼知道产品是什么、核心卖点是什么" },
    { role: "Feature / 核心卖点", purpose: "解释产品为什么好，展示主要优势" },
    { role: "Technical / 结构细节", purpose: "展示产品关键结构：刃口、孔位、涂层、螺纹" },
    { role: "Application / 应用场景", purpose: "展示适用材料、使用环境或应用方向" },
    { role: "Comparison / 购买理由", purpose: "通过对比或规格信息强化购买理由" },
  ];

  const plans: CreativePlan[] = archetypes.map((arch, idx) => {
    const config = configs.find(c => c.archetype === arch)!;

    const headlineIndex = (now + idx * 11) % copySet.headlines.length;
    const headline = copySet.headlines[headlineIndex];
    const subIndex = (now + idx * 5) % copySet.subheadlines.length;
    const subtitle = copySet.subheadlines[subIndex];

    const copyBlocks = buildCopyBlocks(arch, copySet, headline, subtitle);
    const sellingPoints = copyBlocks
      .filter(b => b.role === "feature_point" || b.role === "technical_point")
      .map(b => b.subtitle ? `${b.title} / ${b.subtitle}` : b.title);

    const cnFields = getMockCnFields(arch, headline, subtitle);

    const plan: CreativePlan = {
      id: `plan-${now}-${["h", "f", "d", "sc", "c"][idx]}`,
      planName: setRoleNames[idx].role,
      planArchetype: arch,
      templateId: config.templateId,
      imageType: config.imageType,
      productAnalysis: analysis,
      productName: baseName,
      headline,
      subtitle,
      sellingPoints,
      copyBlocks,
      headlineCn: cnFields.headlineCn,
      subtitleCn: cnFields.subtitleCn,
      sellingPointsCn: cnFields.sellingPointsCn,
      copyBlocksCn: cnFields.copyBlocksCn,
      copySource,
      copyNotes,
      layoutDirection: config.layoutDesc,
      visualDirection: config.visualDesc,
      colorDirection: config.colorDesc,
      visualComplexity: config.visualComplexity,
      informationDensity: config.informationDensity,
      layoutOverlay: buildLayoutOverlay(headline, subtitle, sellingPoints, config.layoutTypeHint, config.imageType, copyBlocks),
      textLanguage: "English",
      riskWarnings: [...analysis.structureRisks, ...commonRisks()],
    };

    plan.planSummaryPrompt = buildPlanSummaryPrompt(plan);
    plan.imageGenerationPrompt = buildImageGenerationPrompt(plan);
    plan.finalPrompt = plan.imageGenerationPrompt;

    return plan;
  });

  const setPlan: ImageSetPlan = {
    id: `set-${now}`,
    setName: "五张详情组图",
    templateId: "tpl-image-set-5",
    productAnalysis: analysis,
    storyline:
      `A cohesive ${baseName.toLowerCase()} product visual suite engineered for maximum ecommerce conversion. ` +
      "The set follows a unified dark-industrial aesthetic family across all five images while deliberately varying composition, lighting intensity, and information density per image role. " +
      "Each image has a distinct archetype and copy personality while maintaining typographic consistency, ensuring the set feels like a single professional campaign rather than five separate images.",
    imageRoles: setRoleNames.map((r, i) => ({ index: i, role: r.role, purpose: r.purpose })),
    overallDirection:
      "Unified dark-industrial visual language: deep graphite or navy backgrounds, electric blue and cobalt accents, strong rim lighting on metallic surfaces, and clean sans-serif typography. " +
      "Hero image leads with maximum impact. Feature image explains with structured information. Technical image reveals with annotated precision. Application image grounds with real context. Comparison image closes with confident differentiation.",
    platform: "E-commerce Detail Page",
    imageCount: 5,
    plans,
    riskWarnings: [
      "All 5 images must maintain consistent product proportions and structure",
      "Do not vary material appearance across images in the same set",
      "Text style and typography must be consistent across the set",
      "Each image must use a different planArchetype and layoutType",
      ...commonRisks(),
    ],
  };

  return [setPlan];
}
