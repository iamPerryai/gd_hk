import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "..", ".env.local") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { contents } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// 30 items with hook text and IPA-enhanced keywords
const UPDATES: Record<string, {
  hookText: string;
  mainKeyword: { word: string; meaning: string; example: string; ipa: string; partOfSpeech: string };
}> = {
  // Meeting
  "MEE001": {
    hookText: "老板问进度，你临开会前发现 PPT 还是旧的……",
    mainKeyword: { word: "update", meaning: "更新", example: "Update the deck before the meeting.", ipa: "/ʌpˈdeɪt/", partOfSpeech: "v." },
  },
  "MEE002": {
    hookText: "开会定了 timeline，结果有人又想改……",
    mainKeyword: { word: "agree", meaning: "同意", example: "Everyone agreed on the timeline.", ipa: "/əˈɡriː/", partOfSpeech: "v." },
  },
  "MEE003": {
    hookText: "刚进会议室，完全不知道上次讲了什么……",
    mainKeyword: { word: "summarize", meaning: "总结 / 概述", example: "Can you summarize the key points?", ipa: "/ˈsʌməraɪz/", partOfSpeech: "v." },
  },
  "MEE004": {
    hookText: "方案发出来，大家都不说话……",
    mainKeyword: { word: "proposal", meaning: "提案 / 建议书", example: "I have no comments on this proposal.", ipa: "/prəˈpoʊzl/", partOfSpeech: "n." },
  },
  "MEE005": {
    hookText: "你以为做好就行，结果发现其他 team 完全不知道……",
    mainKeyword: { word: "align", meaning: "对齐 / 协调", example: "You need to align with other teams first.", ipa: "/əˈlaɪn/", partOfSpeech: "v." },
  },
  // Follow up
  "FOL001": {
    hookText: "客户说了什么？三天了没人回复……",
    mainKeyword: { word: "follow up", meaning: "跟进", example: "Please follow up on the client's feedback.", ipa: "/ˈfɑloʊ ʌp/", partOfSpeech: "phr.v." },
  },
  "FOL002": {
    hookText: "deadline 快到了，对方还没动静……",
    mainKeyword: { word: "chase", meaning: "催促 / 追", example: "Can you chase them for the update?", ipa: "/tʃeɪs/", partOfSpeech: "v." },
  },
  "FOL003": {
    hookText: "报告交了三天，legal team 那边石沉大海……",
    mainKeyword: { word: "pending", meaning: "待定 / 等待中", example: "The report is still pending approval.", ipa: "/ˈpendɪŋ/", partOfSpeech: "adj." },
  },
  "FOL004": {
    hookText: "大家都口头说好了，但没有书面确认……",
    mainKeyword: { word: "confirm", meaning: "确认", example: "Please send an email to confirm the schedule.", ipa: "/kənˈfɜːrm/", partOfSpeech: "v." },
  },
  "FOL005": {
    hookText: "发了邮件催，两天了一个回复都没有……",
    mainKeyword: { word: "reply", meaning: "回复", example: "No one replied to my reminder.", ipa: "/rɪˈplaɪ/", partOfSpeech: "v." },
  },
  // Approval
  "APP001": {
    hookText: "方案做好了，但 budget 卡在 manager 那里……",
    mainKeyword: { word: "approve", meaning: "批准", example: "The manager needs to approve the budget first.", ipa: "/əˈpruːv/", partOfSpeech: "v." },
  },
  "APP002": {
    hookText: "合同快签了，法务说要再 check 一遍……",
    mainKeyword: { word: "review", meaning: "审查 / 复核", example: "The contract has been reviewed.", ipa: "/rɪˈvjuː/", partOfSpeech: "v." },
  },
  "APP003": {
    hookText: "提了个申请，三天了系统还是显示待处理……",
    mainKeyword: { word: "request", meaning: "申请 / 请求", example: "Can you check the status of this request?", ipa: "/rɪˈkwest/", partOfSpeech: "n." },
  },
  "APP004": {
    hookText: "你信心满满交上去，director 一个电话推翻全部……",
    mainKeyword: { word: "reconsider", meaning: "重新考虑", example: "The director wants to reconsider the proposal.", ipa: "/ˌriːkənˈsɪdər/", partOfSpeech: "v." },
  },
  "APP005": {
    hookText: "release 前一小时才想起没找 senior 签字……",
    mainKeyword: { word: "release", meaning: "发布 / 上线", example: "Don't release without senior approval.", ipa: "/rɪˈliːs/", partOfSpeech: "v." },
  },
  // Client
  "CLI001": {
    hookText: "提案发了，客户只回了两个字：尽快……",
    mainKeyword: { word: "kick-off", meaning: "启动 / 开始", example: "The client wants to kick off as soon as possible.", ipa: "/ˈkɪk ɔːf/", partOfSpeech: "phr.v." },
  },
  "CLI002": {
    hookText: "报价发过去，客户嫌贵……",
    mainKeyword: { word: "quotation", meaning: "报价单", example: "The client asked us to revise the quotation.", ipa: "/kwoʊˈteɪʃn/", partOfSpeech: "n." },
  },
  "CLI003": {
    hookText: "明天要见客，你的 PPT 还没对过……",
    mainKeyword: { word: "present", meaning: "演示 / 汇报", example: "Rehearse before you present to the client.", ipa: "/prɪˈzent/", partOfSpeech: "v." },
  },
  "CLI004": {
    hookText: "客户嘴上说OK，转头提了十个新需求……",
    mainKeyword: { word: "expectation", meaning: "期望", example: "The client's expectations are very high.", ipa: "/ˌekspekˈteɪʃn/", partOfSpeech: "n." },
  },
  "CLI005": {
    hookText: "试用期快完了，客户说想再看看……",
    mainKeyword: { word: "extend", meaning: "延长", example: "The client wants to extend the trial period.", ipa: "/ɪkˈstend/", partOfSpeech: "v." },
  },
  // Teamwork
  "TEA001": {
    hookText: "同事放假了，留下一堆没人接的 project……",
    mainKeyword: { word: "handover", meaning: "交接", example: "Please handover the ongoing projects before your leave.", ipa: "/ˈhændoʊvər/", partOfSpeech: "n." },
  },
  "TEA002": {
    hookText: "新同事第一天，你讲了一遍流程，他一脸懵……",
    mainKeyword: { word: "briefing", meaning: "简报 / 说明", example: "Brief the new colleague on the process.", ipa: "/ˈbriːfɪŋ/", partOfSpeech: "n." },
  },
  "TEA003": {
    hookText: "同事想帮忙，但其实你已经做完了……",
    mainKeyword: { word: "handle", meaning: "处理 / 负责", example: "I'm handling this, don't worry.", ipa: "/ˈhændl/", partOfSpeech: "v." },
  },
  "TEA004": {
    hookText: "老板丢了个大 project，两日后要交……",
    mainKeyword: { word: "research", meaning: "调研 / 研究", example: "You do the research and I'll do the presentation.", ipa: "/rɪˈsɜːrtʃ/", partOfSpeech: "n." },
  },
  "TEA005": {
    hookText: "开会时大家都点头，散会后私下各种不满……",
    mainKeyword: { word: "concern", meaning: "顾虑 / 担忧", example: "Raise any concerns you may have.", ipa: "/kənˈsɜːrn/", partOfSpeech: "n." },
  },
  // OT / Urgent
  "OTU001": {
    hookText: "下午六点，老板说今日之内要交……",
    mainKeyword: { word: "EOD", meaning: "今日收工前", example: "Please submit by EOD.", ipa: "/ˌiː oʊ ˈdiː/", partOfSpeech: "abbr." },
  },
  "OTU002": {
    hookText: "客户投诉直接上到 management 层面了……",
    mainKeyword: { word: "escalate", meaning: "升级上报", example: "We need to escalate this issue.", ipa: "/ˈeskəleɪt/", partOfSpeech: "v." },
  },
  "OTU003": {
    hookText: "快下班了，有人提了个改需求……",
    mainKeyword: { word: "OT", meaning: "加班", example: "We need to OT tonight for the deadline.", ipa: "/ˌoʊ ˈtiː/", partOfSpeech: "abbr." },
  },
  "OTU004": {
    hookText: "老板说：除了这个，其他都不用做了……",
    mainKeyword: { word: "priority", meaning: "优先级", example: "This task is top priority.", ipa: "/praɪˈɔːrəti/", partOfSpeech: "n." },
  },
  "OTU005": {
    hookText: "周一早上九点，全公司屏幕一起蓝了……",
    mainKeyword: { word: "fix", meaning: "修复 / 解决", example: "The system is down, we need to fix it immediately.", ipa: "/fɪks/", partOfSpeech: "v." },
  },
};

async function main() {
  console.log("Updating hook_text and keywords with IPA...\n");

  for (const [contentNo, data] of Object.entries(UPDATES)) {
    const existing = await db
      .select({ id: contents.id, mainKeyword: contents.mainKeyword })
      .from(contents)
      .where(eq(contents.contentNo, contentNo))
      .limit(1);

    if (!existing[0]) continue;

    const oldKw = existing[0].mainKeyword as Record<string, unknown>;

    const newKw = {
      ...oldKw,
      word: data.mainKeyword.word,
      meaning: data.mainKeyword.meaning,
      example: data.mainKeyword.example,
      ipa: data.mainKeyword.ipa,
      partOfSpeech: data.mainKeyword.partOfSpeech,
    };

    await db
      .update(contents)
      .set({
        hookText: data.hookText,
        mainKeyword: newKw,
      })
      .where(eq(contents.id, existing[0].id));

    console.log(`  ${contentNo}: hook + IPA updated`);
  }

  console.log(`\nDone! Updated ${Object.keys(UPDATES).length} items.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
