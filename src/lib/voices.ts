export interface Voice {
  id: string;
  name: string;
  description: string;
}

/** 豆包语音合成模型2.0 所有可用音色 */
export const voices: Voice[] = [
  // ── 通用-多情感音色（支持20+种情绪） ──
  { id: "zh_female_cancan_mars_bigtts", name: "灿灿", description: "通用女声，清脆明快" },
  { id: "zh_male_lengkugege_emo_v2_mars_bigtts", name: "冷酷哥哥", description: "情感版，冷峻沉稳" },
  { id: "zh_female_tianxinxiaomei_emo_v2_mars_bigtts", name: "甜心小妹", description: "情感版，甜美可爱" },
  { id: "zh_female_gaolengyujie_emo_v2_mars_bigtts", name: "高冷御姐", description: "情感版，高冷知性" },
  { id: "zh_male_aojiaobazong_emo_v2_mars_bigtts", name: "傲娇霸总", description: "情感版，傲娇霸气" },
  { id: "zh_male_guangzhoudege_emo_mars_bigtts", name: "广州的哥", description: "情感版，地道粤语男声" },
  { id: "zh_male_jingqiangkanye_emo_mars_bigtts", name: "京腔侃爷", description: "情感版，京味十足" },
  { id: "zh_female_linjuayi_emo_v2_mars_bigtts", name: "邻居阿姨", description: "情感版，亲切温暖" },
  { id: "zh_male_yourougongzi_emo_v2_mars_bigtts", name: "温柔公子", description: "情感版，温文尔雅" },
  { id: "zh_male_ruyayichen_emo_v2_mars_bigtts", name: "儒雅一辰", description: "情感版，儒雅知性" },
  { id: "zh_male_junlangnanyou_emo_v2_mars_bigtts", name: "俊朗男友", description: "情感版，阳光俊朗" },
  { id: "zh_male_beijingxiaoye_emo_v2_mars_bigtts", name: "北京小爷", description: "情感版，京味少年" },
  { id: "zh_female_roumeinvyou_emo_v2_mars_bigtts", name: "柔美女友", description: "情感版，温柔体贴" },
  { id: "zh_male_yangguangqingnian_emo_v2_mars_bigtts", name: "阳光青年", description: "情感版，开朗温暖" },
  { id: "zh_female_meilinvyou_emo_v2_mars_bigtts", name: "魅力女友", description: "情感版，迷人魅力" },
  { id: "zh_female_shuangkuaisisi_emo_v2_mars_bigtts", name: "爽快思思", description: "情感版，爽朗利落" },
  { id: "zh_male_shenyeboke_emo_v2_mars_bigtts", name: "深夜播客", description: "情感版，磁性低沉" },

  // ── 通用-普通音色 ──
  { id: "zh_female_yueyunv_mars_bigtts", name: "粤语女声", description: "地道粤语发音" },
  { id: "zh_female_qinqienvsheng_moon_bigtts", name: "亲切女声", description: "温暖亲切" },
  { id: "zh_female_shuangkuaisisi_moon_bigtts", name: "爽快思思", description: "爽朗直率，中英双语" },
  { id: "zh_male_wennuanahu_moon_bigtts", name: "温暖阿虎", description: "温暖男声，中英双语" },
  { id: "zh_male_yangguangqingnian_moon_bigtts", name: "阳光青年", description: "开朗阳光" },
  { id: "zh_female_linjianvhai_moon_bigtts", name: "邻家女孩", description: "亲切自然" },
  { id: "zh_male_yuanboxiaoshu_moon_bigtts", name: "渊博大叔", description: "沉稳深厚" },
  { id: "zh_female_gaolengyujie_moon_bigtts", name: "高冷御姐", description: "高冷知性" },
  { id: "zh_male_aojiaobazong_moon_bigtts", name: "傲娇霸总", description: "霸气傲娇" },
  { id: "zh_female_meilinvyou_moon_bigtts", name: "魅力女友", description: "迷人魅力" },
  { id: "zh_male_shenyeboke_moon_bigtts", name: "深夜播客", description: "磁性低沉" },
  { id: "zh_male_dongfanghaoran_moon_bigtts", name: "东方浩然", description: "正气浩然" },
  { id: "zh_male_xudong_conversation_wvae_bigtts", name: "快乐小东", description: "活泼俏皮" },

  // ── 英语音色 ──
  { id: "en_female_candice_emo_v2_mars_bigtts", name: "Candice", description: "美式英语女声，情感版" },
  { id: "en_female_skye_emo_v2_mars_bigtts", name: "Serena", description: "美式英语女声，情感版" },
  { id: "en_male_glen_emo_v2_mars_bigtts", name: "Glen", description: "美式英语男声，情感版" },
  { id: "en_male_sylus_emo_v2_mars_bigtts", name: "Sylus", description: "美式英语男声，情感版" },
  { id: "en_male_corey_emo_v2_mars_bigtts", name: "Corey", description: "英式英语男声，情感版" },
  { id: "en_female_nadia_tips_emo_v2_mars_bigtts", name: "Nadia", description: "英式英语女声，情感版" },

  // ── 角色扮演音色 ──
  { id: "ICL_zh_female_chunzhenshaonv_e588402fb8ad_tob", name: "纯真少女", description: "天真烂漫" },
  { id: "ICL_zh_male_xiaonaigou_edf58cf28b8b_tob", name: "小奶狗", description: "软萌可爱" },
  { id: "ICL_zh_female_jinglingxiangdao_1beb294a9e3e_tob", name: "精灵向导", description: "神秘灵动" },
  { id: "ICL_zh_male_menyoupingxiaoge_ffed9fc2fee7_tob", name: "闷油瓶小哥", description: "沉默寡言" },
  { id: "ICL_zh_male_anrenqinzhu_cd62e63dcdab_tob", name: "暗刃君主", description: "冷酷邪魅" },
  { id: "ICL_zh_male_badaozongcai_v1_tob", name: "霸道总裁", description: "强势霸气" },
  { id: "ICL_zh_male_bingruogongzi_tob", name: "病弱公子", description: "虚弱温柔" },
  { id: "ICL_zh_female_bingjiao3_tob", name: "病娇女王", description: "偏执魅惑" },
  { id: "ICL_zh_male_shuanglangshaonian_tob", name: "爽朗少年", description: "阳光开朗" },
  { id: "ICL_zh_male_sajiaonanyou_tob", name: "撒娇男友", description: "撒娇黏人" },
  { id: "ICL_zh_male_wenrounanyou_tob", name: "温柔男友", description: "温柔体贴" },
  { id: "ICL_zh_male_tiancaitongzhuo_tob", name: "天才同桌", description: "聪明机智" },
  { id: "ICL_zh_male_bingjiaoshaonian_tob", name: "病娇少年", description: "偏执少年" },
  { id: "ICL_zh_male_bingjiaonanyou_tob", name: "病娇男友", description: "偏执男友" },
  { id: "ICL_zh_male_bingruoshaonian_tob", name: "病弱少年", description: "虚弱少年" },
  { id: "ICL_zh_male_bingjiaogege_tob", name: "病娇哥哥", description: "偏执哥哥" },
  { id: "ICL_zh_female_bingjiaojiejie_tob", name: "病娇姐姐", description: "偏执姐姐" },
  { id: "ICL_zh_male_bingjiaodidi_tob", name: "病娇弟弟", description: "偏执弟弟" },
  { id: "ICL_zh_female_bingruoshaonv_tob", name: "病弱少女", description: "虚弱少女" },

  // ── 视频配音音色 ──
  { id: "zh_male_sunwukong_mars_bigtts", name: "猴哥", description: "孙悟空风格" },
  { id: "zh_male_xionger_mars_bigtts", name: "熊二", description: "憨厚可爱" },
  { id: "zh_female_peiqi_mars_bigtts", name: "佩奇", description: "童趣可爱" },

  // ── 精品长文本合成推荐音色 ──
  { id: "BV701_streaming", name: "擎苍", description: "大气沉稳" },
  { id: "BV123_streaming", name: "阳光青年", description: "温暖阳光" },
  { id: "BV120_streaming", name: "反卷青年", description: "轻松随性" },
  { id: "BV119_streaming", name: "通用赘婿", description: "接地气" },
  { id: "BV115_streaming", name: "古风少御", description: "古风雅韵" },
  { id: "BV107_streaming", name: "霸气青叔", description: "霸气沉稳" },
  { id: "BV100_streaming", name: "质朴青年", description: "淳朴自然" },
  { id: "BV104_streaming", name: "温柔淑女", description: "温柔端庄" },
  { id: "BV004_streaming", name: "开朗青年", description: "开朗活泼" },
  { id: "BV113_streaming", name: "甜宠少御", description: "甜美温柔" },
  { id: "BV102_streaming", name: "儒雅青年", description: "儒雅斯文" },

  // ── O版本端到端实时语音 ──
  { id: "zh_female_vv_jupiter_bigtts", name: "vv", description: "活泼灵动，分享欲强" },
  { id: "zh_female_xiaohe_jupiter_bigtts", name: "小荷", description: "甜美活泼，台湾口音" },
  { id: "zh_male_yunzhou_jupiter_bigtts", name: "云舟", description: "清爽沉稳" },
  { id: "zh_male_xiaotian_jupiter_bigtts", name: "小天", description: "清爽磁性" },
  { id: "en_male_tim_uranus_bigtts", name: "Tim", description: "美式英语男声" },
  { id: "en_female_dacey_uranus_bigtts", name: "Dacey", description: "美式英语女声" },
  { id: "en_female_stokie_uranus_bigtts", name: "Stokie", description: "美式英语女声" },
];

/** 默认音色（粤语女声，适合粤语学习） */
export const DEFAULT_VOICE_ID = "zh_female_yueyunv_mars_bigtts";

/** localStorage key */
export const VOICE_STORAGE_KEY = "hk-office-voice";
