const form = document.querySelector('#jobForm');
const scoreNode = document.querySelector('#score');
const decisionNode = document.querySelector('#decision');
const tagsNode = document.querySelector('#tags');
const insightsNode = document.querySelector('#insights');
const greetingNode = document.querySelector('#greeting');
const copyButton = document.querySelector('#copyGreeting');

const skillKeywords = [
  'AI', '大模型', 'Prompt', '数据分析', '用户增长', 'SaaS', '教育', '产品', '项目推进',
  '竞品', '需求分析', '用户调研', '前端', '后端', 'React', 'Vue', 'Python', 'Java', 'AIGC'
];

function splitTerms(text) {
  return text
    .toLowerCase()
    .replace(/[，。；、/|()（）:：\n]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function findKeywordHits(text, highlights) {
  const source = `${text} ${highlights}`.toLowerCase();
  return skillKeywords.filter((keyword) => source.includes(keyword.toLowerCase()));
}

function calculateScore({ targetRole, targetCity, targetIndustry, resumeHighlights, jobDescription }) {
  const jd = jobDescription.toLowerCase();
  const resumeTerms = splitTerms(`${targetRole} ${targetIndustry} ${resumeHighlights}`);
  const uniqueTerms = [...new Set(resumeTerms)].filter((term) => term.length > 1);
  const hitTerms = uniqueTerms.filter((term) => jd.includes(term));
  const keywordHits = findKeywordHits(jobDescription, resumeHighlights);
  const cityBonus = targetCity && splitTerms(targetCity).some((city) => jd.includes(city)) ? 8 : 0;
  const roleBonus = splitTerms(targetRole).some((term) => jd.includes(term)) ? 18 : 0;
  const score = Math.min(98, Math.round(35 + roleBonus + cityBonus + hitTerms.length * 4 + keywordHits.length * 3));
  return { score, hitTerms, keywordHits: [...new Set(keywordHits)] };
}

function buildInsights(jobDescription, keywordHits) {
  const responsibilityWords = ['负责', '推进', '规划', '分析', '优化', '研究'];
  const requirementWords = ['要求', '熟悉', '经验', '优先', '能力'];
  const sentences = jobDescription.split(/[。；\n]/).map((item) => item.trim()).filter(Boolean);
  const responsibilities = sentences.filter((sentence) => responsibilityWords.some((word) => sentence.includes(word))).slice(0, 3);
  const requirements = sentences.filter((sentence) => requirementWords.some((word) => sentence.includes(word))).slice(0, 3);

  return [
    ...responsibilities.map((item) => `岗位职责：${item}`),
    ...requirements.map((item) => `能力要求：${item}`),
    `关键词命中：${keywordHits.length ? keywordHits.join('、') : '暂未识别到明显关键词'}`
  ];
}

function buildGreeting(values, score, keywordHits) {
  const topKeywords = keywordHits.slice(0, 5).join('、') || values.targetRole;
  return `您好，我正在重点关注「${values.targetRole}」方向，看到贵司岗位 JD 中提到 ${topKeywords}，与我的经历非常匹配。\n\n我过往的核心亮点是：${values.resumeHighlights}\n\n基于 JD 和我的简历亮点，当前匹配度约为 ${score}%。我希望进一步了解团队在该岗位上的业务目标与近期项目，如果合适，也期待投递简历并参与面试沟通。谢谢！`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  const { score, keywordHits } = calculateScore(values);
  const insights = buildInsights(values.jobDescription, keywordHits);

  scoreNode.textContent = `${score}%`;
  decisionNode.textContent = score >= 75 ? '强烈建议投递：岗位方向、技能关键词和简历亮点高度相关。' : score >= 60 ? '可以投递：建议补充更贴合 JD 的项目亮点后发送。' : '谨慎投递：当前 JD 与目标岗位或简历关键词重合度偏低。';
  decisionNode.style.color = score >= 75 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--muted)';
  tagsNode.innerHTML = keywordHits.map((tag) => `<span>${tag}</span>`).join('') || '<span>暂无关键词</span>';
  insightsNode.innerHTML = insights.map((item) => `<li>${item}</li>`).join('');
  greetingNode.value = buildGreeting(values, score, keywordHits);
});

copyButton.addEventListener('click', async () => {
  if (!greetingNode.value) return;
  await navigator.clipboard.writeText(greetingNode.value);
  copyButton.textContent = '已复制';
  setTimeout(() => { copyButton.textContent = '复制文案'; }, 1600);
});

form.dispatchEvent(new Event('submit'));
