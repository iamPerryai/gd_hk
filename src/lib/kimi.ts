const SYSTEM_PROMPT = `你是一个精通港式粤语和外企高频英语混搭（Chinglish）的职场大厂专家。
请根据我后续给出的具体场景，生成一段符合香港/外企真实职场生态的双语对话。

【生成规则】：
1. 语言风格：纯正港式粤语 + 自然夹杂 3-5 个职场高频英文词。每段对话 4-6 句话，内容要饱满、有交锋感。
2. 对话要有真实职场情绪：据理力争、委婉施压、幽默化解、强势输出——不要平淡的陈述句。
3. 英文词用特殊标记包裹，格式：{单词|音标|中文含义}
   例如：{project|[ˈprɒdʒekt]|项目}、{timeline|[ˈtaɪmlaɪn]|时间表}
4. 英文词前后如有空格，保留在标记外面。
5. 每段对话严格包含 3-5 个 {单词|音标|中文含义} 标记，词与词之间至少间隔 5 个中文字。
6. 英文词必须是职场商务词（如 deadline, proposal, budget, timeline, approve, resource, quality, logic, review)，不能是日常词（如 Monday, hello, okay）。
7. hookText 要用口语化的简体中文描述情景背景，像在讲故事一样。

【输出格式】严格 JSON，不要任何多余内容：
{
  "items": [
    {
      "scene": "场景",
      "hookText": "简体中文情景铺垫",
      "text": "粤语对话，英文用{单词|音标|中文含义}标记",
      "explanation": "简体中文情景释义",
      "tags": ["tag1", "tag2"]
    }
  ]
}

scene 只能是：Meeting, Follow up, Approval, Client, Teamwork, OT / Urgent`;

// ================================================================
// 50 workplace scenarios mapped to our 6 scene types
// ================================================================
const SCENE_SCENARIOS: Record<string, string[]> = {
  "Meeting": [
    "电梯演讲：在电梯偶遇大老板，30秒内快速亮出最近的项目成果和亮点。",
    "打断老板长篇大论：开会时老板思维发散扯远了，员工如何礼貌地把老板拉回主线（Agenda）。",
    "跨部门破冰：第一次和海外或外地分公司同事开视频会，如何说一段职业又轻松的开场白。",
    "组内头脑风暴：开会时大家都不说话，员工如何抛砖引玉活跃气氛。",
    "会议开场主持：作为主持人，如何在一群外籍和高管面前用流利的港式双语宣布会议开始并宣读Agenda。",
    "被提问时拖延时间：答辩会上被高管问到盲区，员工用一句话术优雅拖延时间。",
    "把扯远的话题拉回：几方在会上吵得不可开交，主持人如何强势介入让大家Focus在核心问题上。",
    "优雅打断别人发言：对方正在滔滔不绝阐述错误观点，你如何礼貌介入并掌握话语权。",
    "总结发言陈词：全局会议结束前，高管或主导人用一句话概括接下来的Action Plan。",
    "大方承认数据不全：会上被问到没准备的数据，不慌不忙表示会后补充详细report。",
    "应对突发网络/设备故障：投屏突然挂了或麦克风没声音，演讲者幽默化解尴尬稳住全场。",
    "复盘会上的总结：项目失败了大家坐在一起复盘，如何做到对事不对人的复盘发言。",
  ],
  "Follow up": [
    "申请延期：任务截止日期太紧，员工委婉说明团队在加班，强行交付会妥协质量。",
    "强势催进度：合作部门迟迟不审批方案，员工带上截止日期给对方施压。",
    "优雅甩锅：项目延误，员工强调自己这边已经尽力follow，是因为对方没准时提供资料。",
    "应对客户疯狂改期：客户无视排期频繁改动需求，员工展示时间成本让他们知难而退。",
    "优雅催款：财务反馈客户账期过了还没打款，员工在不破坏关系的前提下礼貌催款。",
    "离职交接扯皮：马上要离职了，交接人各种挑刺不想签字，员工强势应对顺利走人。",
    "面对客户的既要又要：客户提出两个互相矛盾的指标，员工引导客户做优先级排序。",
    "会议记录扯皮：复盘会后对方试图篡改事实，员工发邮件引用原始数据据理力争。",
  ],
  "Approval": [
    "汇报坏消息：项目中途出现重大失误或客户投诉，员工汇报时同时给出解决方案。",
    "升职加薪谈判：年终考核时员工委婉表达今年超额完成KPI，试探升职机会。",
    "委婉指出老板错误：老板在公开方案中算错数据，员工私下温柔纠正。",
    "越级汇报防御：大老板跳过直属上司来派活，员工既接下活儿又不得罪直属上司。",
    "利益对齐：两个部门资源冲突，在双周会上表面微笑实则暗流涌动地争夺利益。",
    "划清权责边界：合作中途出现灰色地带，员工牵头开会清晰划分各方职责。",
    "抢夺项目主导权：两个部门共同做新项目，员工通过展示专业度拿稳项目Owner身份。",
    "为组员争取利益：下属绩效很好但名额有限，Leader找总监为组员争取年终优秀员工。",
  ],
  "Client": [
    "要人要资源：项目盘子扩大，员工向老板哭穷要求增加预算或招实习生。",
    "应付预算砍半：客户突然要求削减项目预算但质量要求不降低，员工说明需要减少交付物。",
    "处理客户无理投诉：客户因自身操作失误咬定是你们的问题，员工用证据拆解责任。",
    "拒绝客户索要折扣：续约谈判时客户强行压价，员工强调服务价值和行业标准。",
    "供应商画大饼防御：供应商在标会上吹嘘技术多牛，员工抛出硬核指标拆穿水分。",
    "紧急索赔：供应商提供的技术接口挂了导致严重损失，员工要求对方高层介入赔偿。",
    "客户答谢与客套：顺利拿下大单或项目成功收尾，对客户进行商务客套维护关系。",
    "挽留想解约的客户：客户因竞品价格更低想跳槽，员工在最后关头给特殊方案力挽狂澜。",
    "路演开场吸睛：面对投资人或大客户进行核心产品路演时的第一句高光台词。",
  ],
  "Teamwork": [
    "拒绝跨部门帮工：其他团队想白嫖你的人力，员工以自己团队本季KPI爆满为由拒绝。",
    "踢走不靠谱的合作方：跨部门合作中发现对方极度不专业，向高层申请换人或收回项目主导权。",
    "安抚愤怒的合作同事：因技术故障导致兄弟部门数据受损，员工代表团队前去灭火道歉。",
    "给下属画大饼：团队连续加班士气低落，Leader在周会上给组员打鸡血画大饼。",
    "优雅分配脏活累活：部门有个没人想碰的边缘项目，Leader话术艺术地派给下属。",
    "指出下属工作摸鱼：发现下属最近交付质量严重下滑，主管约谈时进行敲打。",
    "茶水间八卦社交：同事在茶水间交流行业内幕和跳槽风声，得体搭话而不留把柄。",
    "职场新人请教：刚入职的新人不卑不亢地请教资深老油条系统操作问题。",
    "婉拒同事私下代购：同事让你帮忙带大件免税品，如何优雅拒绝。",
  ],
  "OT / Urgent": [
    "拒绝不合理加班：周五下班前老板突然塞来非紧急任务，员工优雅推到周一处理。",
    "探听老板口风：传闻公司要架构调整，员工在非正式场合试探老板对当前团队策略的看法。",
    "周五摸鱼心态：周五下午四点，同事之间暗示彼此可以放慢节奏准备Happy Hour。",
    "商务社交破冰：在行业峰会酒会上，如何拿着红酒杯去结交陌生大牛或潜在客户。",
  ],
};

export const sceneDescriptions: Record<string, string> = {
  "Meeting": "开会前准备、会议中提醒、会后更新、讨论方案、同步信息。",
  "Follow up": "催进度、跟进任务、提醒同事回复、追项目状态。",
  "Approval": "找 manager 审批、等老板确认、提交方案、修改后再批。",
  "Client": "客户沟通、客户反馈、客户催进度、客户确认需求。",
  "Teamwork": "同事协作、交接 handover、同步资料、帮忙处理任务。",
  "OT / Urgent": "加班、紧急任务、deadline、临时改需求、救火。",
};

// ── Types ──

export interface WordSegment {
  id: string;
  text: string;
  type: "cn" | "en";
  phonetic?: string;
  meaning?: string;
}

export interface GeneratedItem {
  scene: string;
  hookText: string;
  segments: WordSegment[];
  explanation: string;
  tags: string[];
  // Derived fields (computed from segments)
  cantoneseText: string;
  mainKeyword: {
    word: string;
    meaning: string;
    ipa: string;
    partOfSpeech: string;
    example: string;
  };
  supportKeywords: Array<{ word: string; meaning: string }>;
}

interface GenerateContentInput {
  scene: string;
  count?: number;
}

// ── Helpers ──

/** Parse inline markup: "前面{word|phonetic|meaning}后面" → WordSegment[] */
function parseMarkup(text: string): WordSegment[] {
  const segments: WordSegment[] = [];
  // Match {anything} — then split by | inside
  const regex = /\{([^}]+)\}/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let id = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      const cnText = text.substring(lastIdx, match.index);
      if (cnText) {
        segments.push({ id: `w${++id}`, text: cnText, type: "cn" });
      }
    }
    // Split by | to get word|phonetic|meaning
    const parts = match[1].split("|").map((s) => s.trim());
    segments.push({
      id: `w${++id}`,
      text: parts[0] || "",
      type: "en",
      phonetic: parts[1] || "",
      meaning: parts.slice(2).join("|") || "", // handle extra | in meaning
    });
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    segments.push({ id: `w${++id}`, text: text.substring(lastIdx), type: "cn" });
  }

  return segments;
}

/** Strip brackets from phonetic string like "[ˈprɒdʒekt]" → "/ˈprɒdʒekt/" */
function cleanIpa(raw: string): string {
  if (!raw) return "";
  let s = raw.trim();
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  if (!s.startsWith("/")) s = "/" + s;
  if (!s.endsWith("/")) s = s + "/";
  return s;
}

/** Derive flat text, main keyword, and support keywords from segments */
function deriveFromSegments(segments: WordSegment[]) {
  const cantoneseText = segments.map((s) => s.text).join("");
  const enSegments = segments.filter((s) => s.type === "en");

  const mainKw = enSegments[0]
    ? {
        word: enSegments[0].text,
        meaning: enSegments[0].meaning || "",
        ipa: cleanIpa(enSegments[0].phonetic || ""),
        partOfSpeech: "",
        example: "",
      }
    : { word: "", meaning: "", ipa: "", partOfSpeech: "", example: "" };

  const supportKws = enSegments.slice(1).map((s) => ({
    word: s.text,
    meaning: s.meaning || "",
  }));

  return { cantoneseText, mainKeyword: mainKw, supportKeywords: supportKws };
}

// ── Build prompts ──

function buildUserPrompt(scene: string, count: number): string {
  const scenarios = SCENE_SCENARIOS[scene] || [];
  const selected = scenarios.slice(0, Math.min(count, scenarios.length));

  if (selected.length === 0) {
    return `请为「${scene}」场景生成 ${count} 条港式职场中英夹杂对话。英文用{单词|音标|中文含义}标记。`;
  }

  const scenarioList = selected
    .map((s, i) => `${i + 1}. ${s}`)
    .join("\n");

  return `请为以下「${scene}」场景各生成 1 条港式职场中英夹杂对话（共 ${selected.length} 条）：

${scenarioList}

每条对话 4-6 句话，包含 3-5 个 {单词|音标|中文含义} 标记。语气要有交锋感，英文词不要重复。`;
}

// Regex for smart/Chinese quotes — match individual chars and replace
const DQ = /[“”＂]/g;  // " " ＂
const SQ = /[‘’＇]/g;  // ' ' ＇

// ── Main API ──

export async function generateContent(
  input: GenerateContentInput,
): Promise<GeneratedItem[]> {
  const { scene, count = 5 } = input;

  const apiKey = process.env.KIMI_API_KEY!;
  const baseUrl = process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1";
  const model = process.env.KIMI_MODEL || "moonshot-v1-8k";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(scene, count) },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Kimi API error: ${response.status} ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Kimi API returned empty response");
  }

  // Strip markdown code fences
  let cleaned = content
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  // Replace smart/Chinese quotes with straight quotes
  cleaned = cleaned.replace(DQ, '"').replace(SQ, "'");

  // Fix common JSON issues from LLM output
  cleaned = cleaned
    .replace(/,(\s*[}\]])/g, "$1") // trailing commas
    .replace(/([{,]\s*)([\w-]+)(\s*:)/g, '$1"$2"$3'); // unquoted keys

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e: any) {
    const pos = parseInt(e.message?.match(/position (\d+)/)?.[1] || "0");
    const ctx = cleaned.substring(Math.max(0, pos - 100), pos + 100);
    console.error(`\nFailed to parse JSON at position ${pos}:`);
    console.error("... " + ctx + " ...");
    console.error("First 800 chars:");
    console.error(cleaned.substring(0, 800));
    throw e;
  }

  // Normalize: API might return { items: [...] } or an array
  const rawItems: any[] = parsed.items || (Array.isArray(parsed) ? parsed : [parsed]);

  // Transform to GeneratedItem format
  return rawItems.map((item: any) => {
    // Parse inline markup from item.text, or fall back to item.segments
    const segments: WordSegment[] = item.text
      ? parseMarkup(item.text)
      : (item.segments || []);
    const derived = deriveFromSegments(segments);
    return {
      scene: item.scene || scene,
      hookText: item.hookText || "",
      segments,
      explanation: item.explanation || "",
      tags: item.tags || [],
      cantoneseText: derived.cantoneseText,
      mainKeyword: derived.mainKeyword,
      supportKeywords: derived.supportKeywords,
    };
  });
}
