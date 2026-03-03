import { ChatMessage } from './types';

// Coze API 配置
const COZE_API_URL = process.env.COZE_API_URL || 'https://api.coze.com';
const COZE_BOT_ID = process.env.COZE_BOT_ID || '';
const COZE_BOT_TOKEN = process.env.COZE_BOT_TOKEN || '';

/**
 * 本地规则引擎 - 当 Coze API 不可用时使用
 */
function getLocalResponse(message: string, context?: any): string {
  const lowerMessage = message.toLowerCase();

  // 问候语
  if (lowerMessage.includes('你好') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
    return '你好！我是禾哲OpenClaw，瀚海集团的AI助理。我可以帮助你：\n\n• 分析项目状态，识别风险\n• 提供优化建议\n• 回答工作流程相关问题\n• 协助任务管理\n\n请问有什么可以帮助你的？';
  }

  // 自我介绍
  if (lowerMessage.includes('你是谁') || lowerMessage.includes('自我介绍')) {
    return '我是禾哲OpenClaw，瀚海集团工作流程管理系统的AI助理。我专门负责：\n\n1. **项目分析**：监控项目进度，识别延期风险\n2. **智能预警**：在任务超期或即将到期时提醒\n3. **优化建议**：基于项目状态提供改进建议\n4. **流程咨询**：解答工作流程相关问题\n\n当前我已连接到系统数据库，可以分析所有品牌（禾哲、包包、AI和、宝登源）的项目数据。';
  }

  // 功能说明
  if (lowerMessage.includes('功能') || lowerMessage.includes('能做什么')) {
    return '我的主要功能包括：\n\n**📊 数据分析**\n• 项目进度跟踪\n• 任务完成率分析\n• 延期风险评估\n\n**⚠️ 智能预警**\n• 任务超期提醒\n• 即将到期预警（3天内）\n• 资源冲突预警\n• 频繁催促预警\n\n**💡 优化建议**\n• 优先级排序\n• 资源调配建议\n• 流程改进建议\n\n**💬 智能问答**\n• 工作流程咨询\n• 项目状态查询\n• 任务管理指导';
  }

  // 项目分析
  if (lowerMessage.includes('项目') || lowerMessage.includes('分析')) {
    if (context?.projectId) {
      return `关于项目"${context.projectName}"的分析：\n\n我正在监控该项目的以下指标：\n• 任务完成进度\n• 是否有超期或即将到期的任务\n• 各岗位任务负荷\n• 项目整体风险\n\n请告诉我你想了解项目的哪个方面？`;
    }
    return '我可以帮你分析项目状态。请告诉我：\n\n1. 你想分析哪个项目？\n2. 你关心什么指标？（进度、延期风险、资源使用等）\n\n或者你可以在数据看板中选中一个项目，我会自动分析该项目。';
  }

  // 默认回复
  return '我理解你的问题。作为瀚海集团的AI助理，我可以帮助你分析项目状态、识别风险、提供优化建议。\n\n你可以问我：\n• "你好" - 获取功能介绍\n• "你是谁" - 了解我的能力\n• "项目分析" - 分析项目状态\n• "帮我查看风险" - 查看项目预警\n\n请告诉我你需要什么帮助？';
}

/**
 * 调用 Coze Bot API
 */
async function callCozeBot(messages: ChatMessage[], context?: any): Promise<string> {
  if (!COZE_BOT_ID || !COZE_BOT_TOKEN) {
    console.warn('⚠️ Coze Bot ID 或 Token 未配置，使用本地规则引擎');
    return getLocalResponse(messages[messages.length - 1]?.content || '', context);
  }

  try {
    // 使用 Coze Bot 的正确 API 端点
    const response = await fetch(`${COZE_API_URL}/v3/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COZE_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bot_id: COZE_BOT_ID,
        user: 'system-user',
        query: messages[messages.length - 1]?.content || '',
        stream: false,
      }),
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    console.log(`Coze API 请求: ${COZE_API_URL}/v3/chat`);
    console.log('Bot ID:', COZE_BOT_ID);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Coze API 调用失败:', response.status, errorText);

      // 如果 API 不可用，使用本地规则引擎
      console.warn('Coze API 不可用，使用本地规则引擎');
      return getLocalResponse(messages[messages.length - 1]?.content || '', context);
    }

    const data = await response.json();

    // 打印完整的返回数据，用于调试
    console.log('Coze API 返回数据:', JSON.stringify(data, null, 2));

    // 提取AI回复 - Coze Bot 可能返回的格式
    if (data.data && data.data.answer) {
      return data.data.answer;
    }

    if (data.data && data.data.content) {
      return data.data.content;
    }

    if (data.messages && data.messages.length > 0) {
      // 找到 assistant 角色的消息
      const assistantMessage = data.messages.find((msg: any) => msg.role === 'assistant');
      if (assistantMessage && assistantMessage.content) {
        return assistantMessage.content;
      }
      // 或者返回最后一条消息
      return data.messages[data.messages.length - 1].content;
    }

    console.warn('Coze API 返回数据格式异常，使用本地规则引擎');
    return getLocalResponse(messages[messages.length - 1]?.content || '', context);
  } catch (error) {
    console.error('调用 Coze Bot 失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('错误详情:', errorMessage);

    // API 调用失败，使用本地规则引擎
    console.warn('Coze API 调用失败，使用本地规则引擎');
    return getLocalResponse(messages[messages.length - 1]?.content || '', context);
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
