import { ChatMessage } from './types';

// Coze API 配置
const COZE_API_URL = process.env.COZE_API_URL || 'https://api.coze.com';
const COZE_BOT_ID = process.env.COZE_BOT_ID || '';
const COZE_BOT_TOKEN = process.env.COZE_BOT_TOKEN || '';

/**
 * 调用 Coze Bot API
 */
async function callCozeBot(messages: ChatMessage[], context?: any): Promise<string> {
  if (!COZE_BOT_ID || !COZE_BOT_TOKEN) {
    console.warn('⚠️ Coze Bot ID 或 Token 未配置');
    return 'AI助手未配置，请联系管理员设置 Bot ID 和 Token。';
  }

  try {
    const response = await fetch(`${COZE_API_URL}/v3/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: COZE_BOT_ID,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Coze API 调用失败:', error);
      throw new Error(`Coze API 调用失败: ${response.status}`);
    }

    const data = await response.json();

    // 提取AI回复
    if (data.messages && data.messages.length > 0) {
      const lastMessage = data.messages[data.messages.length - 1];
      return lastMessage.content;
    }

    return '抱歉，我暂时无法理解你的问题，请稍后再试。';
  } catch (error) {
    console.error('调用 Coze Bot 失败:', error);
    return 'AI助手暂时无法连接，请稍后再试。';
  }
}

/**
 * AI助手 - 分析项目状态
 */
export async function analyzeProject(projectData: any): Promise<string> {
  const prompt = `请分析以下项目状态，提供优化建议：

项目信息：
- 项目名称：${projectData.name}
- 品牌：${projectData.brand}
- 分类：${projectData.category}
- 销售日期：${projectData.salesDate}
- 项目状态：${projectData.status}
- 总进度：${projectData.overallProgress}%

任务数量：${projectData.tasks?.length || 0}
已完成：${projectData.tasks?.filter((t: any) => t.status === 'completed').length || 0}
进行中：${projectData.tasks?.filter((t: any) => t.status === 'in_progress').length || 0}
已延期：${projectData.tasks?.filter((t: any) => t.status === 'delayed').length || 0}

任务详情：
${projectData.tasks?.map((t: any) => `- ${t.taskName}: ${t.progress}% (${t.status}) - 截止日期：${t.estimatedCompletionDate}`).join('\n') || '无任务'}

请提供：
1. 项目整体评估（健康度）
2. 主要风险点
3. 优化建议（3-5条）
4. 优先级排序`;

  const messages: ChatMessage[] = [
    {
      id: '1',
      role: 'system',
      content: '你是瀚海集团的AI助理禾哲OpenClaw，专门帮助用户管理工作流程、推进项目、识别风险、提供优化建议。',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    },
  ];

  return callCozeBot(messages, { projectId: projectData.id });
}

/**
 * AI助手 - 任务催促建议
 */
export async function suggestTaskReminders(taskData: any): Promise<string> {
  const prompt = `任务已经多次被催促，请分析并提供建议：

任务信息：
- 任务名称：${taskData.taskName}
- 所属项目：${taskData.projectName}
- 岗位：${taskData.role}
- 进度：${taskData.progress}%
- 状态：${taskData.status}
- 截止日期：${taskData.estimatedCompletionDate}
- 实际完成日期：${taskData.actualCompletionDate || '未完成'}
- 已催促次数：${taskData.reminderCount}
- 最后催促时间：${taskData.lastReminderAt || '未催促'}

请提供：
1. 任务延期原因分析
2. 风险评估
3. 推荐的处理方式
4. 与责任人沟通的建议`;

  const messages: ChatMessage[] = [
    {
      id: '1',
      role: 'system',
      content: '你是瀚海集团的AI助理禾哲OpenClaw，专门帮助用户协调任务、解决延误问题、提供沟通建议。',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    },
  ];

  return callCozeBot(messages, { taskId: taskData.id });
}

/**
 * AI助手 - 通用问答
 */
export async function chatWithAI(userMessage: string, context?: any): Promise<string> {
  // 构建上下文信息
  let contextInfo = '';
  if (context?.projectId) {
    contextInfo += `\n当前查看的项目：${context.projectName}`;
  }
  if (context?.taskId) {
    contextInfo += `\n当前查看的任务：${context.taskName}`;
  }

  const messages: ChatMessage[] = [
    {
      id: '1',
      role: 'system',
      content: '你是瀚海集团的AI助理禾哲OpenClaw，帮助用户管理工作流程、解答问题、提供项目建议。你的回答要专业、简洁、实用。',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      role: 'user',
      content: userMessage + contextInfo,
      timestamp: new Date().toISOString(),
    },
  ];

  return callCozeBot(messages, context);
}

/**
 * AI助手 - 批量分析多个项目
 */
export async function analyzeMultipleProjects(projects: any[]): Promise<{
  overallStatus: string;
  warnings: string[];
  suggestions: string[];
}> {
  const prompt = `请批量分析以下${projects.length}个项目，识别风险并提供优化建议：

${projects.map((p, i) => `
项目${i + 1}：
- 名称：${p.name}
- 品牌：${p.brand}
- 状态：${p.status}
- 销售日期：${p.salesDate}
- 任务总数：${p.tasks?.length || 0}
- 已延期任务：${p.tasks?.filter((t: any) => t.status === 'delayed').length || 0}
`).join('\n')}

请提供：
1. 整体健康评估
2. 风险项目列表（按严重程度排序）
3. 优先处理建议（3-5条）`;

  const messages: ChatMessage[] = [
    {
      id: '1',
      role: 'system',
      content: '你是瀚海集团的AI助理禾哲OpenClaw，专门帮助用户分析项目组合、识别风险、提供管理建议。',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    },
  ];

  const response = await callCozeBot(messages);
  return {
    overallStatus: 'healthy',
    warnings: [],
    suggestions: [response],
  };
}

/**
 * 检查是否配置了Coze Bot
 */
export function isCozeBotConfigured(): boolean {
  return !!(COZE_BOT_ID && COZE_BOT_TOKEN);
}

/**
 * 获取Coze Bot配置信息
 */
export function getCozeBotConfig(): {
  configured: boolean;
  botId?: string;
  hasToken?: boolean;
} {
  return {
    configured: isCozeBotConfigured(),
    botId: COZE_BOT_ID,
    hasToken: !!COZE_BOT_TOKEN,
  };
}
