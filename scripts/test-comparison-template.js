/**
 * Test script for tpl-advantage-comparison template
 * Verifies the plan API returns proper comparison_story archetype with
 * split-screen structure, VS divider, red X / green check, and bottom feature bar.
 */
const fs = require("fs");
const path = require("path");

const TEST_IMAGE = "/uploads/1779255588150-66fyi0n.webp";
const API_URL = "http://localhost:3002/api/ai-image/v2/plan";

async function testComparisonTemplate() {
  console.log("=== Testing tpl-advantage-comparison template ===\n");

  const body = {
    mode: "single",
    productImageUrl: TEST_IMAGE,
    userGoal: "end mill cutting tool, no chip welding, clean finish, smooth cutting",
    selectedTemplateId: "tpl-advantage-comparison",
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) {
      console.error("ERROR: No data returned");
      console.error(JSON.stringify(json, null, 2));
      process.exit(1);
    }

    const plans = json.data;
    console.log(`Received ${plans.length} plan(s)\n`);

    let passCount = 0;
    const checks = [];

    for (const plan of plans) {
      const name = plan.planName || plan.id;
      console.log(`--- Plan: ${name} ---`);
      console.log(`Archetype: ${plan.planArchetype}`);
      console.log(`Template ID: ${plan.templateId}`);
      console.log(`Layout Type: ${plan.layoutOverlay?.layoutType}`);

      // Check 1: archetype must be comparison_story
      const isComparison = plan.planArchetype === "comparison_story";
      checks.push({ plan: name, check: "archetype=comparison_story", pass: isComparison });

      // Check 2: layoutType must be comparison_two_columns
      const isTwoCol = plan.layoutOverlay?.layoutType === "comparison_two_columns";
      checks.push({ plan: name, check: "layoutType=comparison_two_columns", pass: isTwoCol });

      // Check 3: imageGenerationPrompt must mention VS divider
      const prompt = (plan.imageGenerationPrompt || "").toLowerCase();
      const hasVs = prompt.includes('"vs"') || prompt.includes("vs divider") || prompt.includes("center \"vs\"");
      checks.push({ plan: name, check: "prompt mentions VS divider", pass: hasVs });

      // Check 4: prompt must mention red X
      const hasRedX = prompt.includes("red x") || prompt.includes("red \"x\"") || prompt.includes("red cross");
      checks.push({ plan: name, check: "prompt mentions red X", pass: hasRedX });

      // Check 5: prompt must mention green check
      const hasGreenCheck = prompt.includes("green check") || prompt.includes("green checkmark") || prompt.includes("green tick");
      checks.push({ plan: name, check: "prompt mentions green checkmark", pass: hasGreenCheck });

      // Check 6: prompt must mention bottom feature bar
      const hasBottomBar = prompt.includes("bottom feature bar") || prompt.includes("bottom feature") || prompt.includes("feature bar");
      checks.push({ plan: name, check: "prompt mentions bottom feature bar", pass: hasBottomBar });

      // Check 7: prompt must mention split-screen
      const hasSplit = prompt.includes("split-screen") || prompt.includes("split screen") || prompt.includes("50/50");
      checks.push({ plan: name, check: "prompt mentions split-screen", pass: hasSplit });

      // Check 8: copyBlocks must include comparison_labels
      const cmpLabels = (plan.copyBlocks || []).filter((b) => b.role === "comparison_label");
      checks.push({ plan: name, check: `copyBlocks has ${cmpLabels.length} comparison_label(s)`, pass: cmpLabels.length >= 2 });
      if (cmpLabels.length > 0) {
        console.log(`Comparison labels: ${cmpLabels.map((b) => `"${b.title}"`).join(", ")}`);
      }

      // Check 9: headline sanity
      console.log(`Headline: "${plan.headline}"`);

      // Check 10: visualDirection mentions specific comparison elements
      const vd = (plan.visualDirection || "").toLowerCase();
      console.log(`visualDirection: ${plan.visualDirection?.substring(0, 200)}...`);
      const vdHasSplit = vd.includes("split") || vd.includes("vs") || vd.includes("comparison") || vd.includes("side-by-side") || vd.includes("divider");
      checks.push({ plan: name, check: "visualDirection mentions split/comparison", pass: vdHasSplit });

      // Summary for this plan
      const planChecks = checks.filter((c) => c.plan === name);
      const planPass = planChecks.filter((c) => c.pass).length;
      const planTotal = planChecks.length;
      console.log(`Result: ${planPass}/${planTotal} checks passed\n`);
      if (planPass === planTotal) passCount++;

      // Print prompt snippet for manual inspection
      const snippet = plan.imageGenerationPrompt?.substring(0, 600) || "";
      console.log(`Prompt snippet:\n${snippet}\n...\n`);
    }

    console.log("=== SUMMARY ===");
    for (const c of checks) {
      const status = c.pass ? "PASS" : "FAIL";
      console.log(`[${status}] ${c.plan}: ${c.check}`);
    }
    console.log(`\n${passCount}/${plans.length} plans passed ALL checks`);
    process.exit(passCount === plans.length ? 0 : 1);
  } catch (err) {
    console.error("Request failed:", err.message);
    process.exit(1);
  }
}

testComparisonTemplate();
