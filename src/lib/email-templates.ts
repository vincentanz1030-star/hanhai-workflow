// 邮件模板生成器
export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

// 基础邮件模板
const baseEmailTemplate = (content: string) => `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ai数据云平台</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 8px 8px 0 0;
        margin: -30px -30px 30px -30px;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .content {
        padding: 0;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e0e0e0;
        text-align: center;
        color: #666;
        font-size: 12px;
      }
      .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
      }
      .button:hover {
        background-color: #5568d3;
      }
      .alert {
        padding: 15px;
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        border-radius: 4px;
        margin: 15px 0;
      }
      .success {
        padding: 15px;
        background-color: #d4edda;
        border: 1px solid #28a745;
        border-radius: 4px;
        margin: 15px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Ai数据云平台</h1>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>此邮件由系统自动发送，请勿直接回复</p>
        <p>如有问题，请联系系统管理员</p>
        <p>发送时间：${new Date().toLocaleString('zh-CN')}</p>
      </div>
    </div>
  </body>
  </html>
`;

// 任务分配通知模板
export function getTaskAssignmentTemplate(data: {
  taskName: string;
  projectName: string;
  assigneeName: string;
  dueDate?: string;
  description?: string;
}): EmailTemplate {
  const content = `
    <h2>📋 新任务分配通知</h2>
    <p>您好，<strong>${data.assigneeName}</strong></p>
    <p>您有一个新任务已分配给您：</p>
    
    <div class="success">
      <strong>任务名称：</strong>${data.taskName}<br>
      <strong>所属项目：</strong>${data.projectName}<br>
      ${data.dueDate ? `<strong>截止日期：</strong>${data.dueDate}<br>` : ''}
    </div>
    
    ${data.description ? `<p><strong>任务描述：</strong></p><p>${data.description}</p>` : ''}
    
    <p>请登录系统查看详情并及时处理。</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/tasks" class="button">查看任务</a>
  `;

  return {
    subject: `【任务分配】${data.taskName} - ${data.projectName}`,
    htmlContent: baseEmailTemplate(content),
    textContent: `您有一个新任务：${data.taskName}\n项目：${data.projectName}${data.dueDate ? `\n截止日期：${data.dueDate}` : ''}`,
  };
}

// 任务提醒通知模板
export function getTaskReminderTemplate(data: {
  taskName: string;
  projectName: string;
  assigneeName: string;
  dueDate: string;
  remainingDays: number;
}): EmailTemplate {
  const urgencyClass = data.remainingDays <= 1 ? 'alert' : 'success';
  const urgencyText = data.remainingDays === 0 
    ? '任务今天到期，请立即处理！' 
    : data.remainingDays === 1 
      ? '任务明天到期，请注意！'
      : `任务还有 ${data.remainingDays} 天到期`;

  const content = `
    <h2>⏰ 任务提醒</h2>
    <p>您好，<strong>${data.assigneeName}</strong></p>
    
    <div class="${urgencyClass}">
      <strong>${urgencyText}</strong>
    </div>
    
    <p>您有以下任务即将到期：</p>
    
    <div style="padding: 15px; background-color: #f8f9fa; border-radius: 4px; margin: 15px 0;">
      <strong>任务名称：</strong>${data.taskName}<br>
      <strong>所属项目：</strong>${data.projectName}<br>
      <strong>截止日期：</strong>${data.dueDate}
    </div>
    
    <p>请尽快处理以避免任务延期。</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/tasks" class="button">查看任务</a>
  `;

  return {
    subject: `【任务提醒】${data.taskName} - 即将到期`,
    htmlContent: baseEmailTemplate(content),
    textContent: `任务提醒：${data.taskName}\n项目：${data.projectName}\n截止日期：${data.dueDate}\n剩余天数：${data.remainingDays}`,
  };
}

// 任务逾期通知模板
export function getTaskOverdueTemplate(data: {
  taskName: string;
  projectName: string;
  assigneeName: string;
  dueDate: string;
  overdueDays: number;
}): EmailTemplate {
  const content = `
    <h2>🚨 任务逾期通知</h2>
    <p>您好，<strong>${data.assigneeName}</strong></p>
    
    <div class="alert">
      <strong>⚠️ 您的任务已逾期 ${data.overdueDays} 天</strong>
    </div>
    
    <p>以下任务已超过截止日期：</p>
    
    <div style="padding: 15px; background-color: #fff3f3; border: 1px solid #dc3545; border-radius: 4px; margin: 15px 0;">
      <strong>任务名称：</strong>${data.taskName}<br>
      <strong>所属项目：</strong>${data.projectName}<br>
      <strong>截止日期：</strong>${data.dueDate}<br>
      <strong>逾期天数：</strong>${data.overdueDays} 天
    </div>
    
    <p>请立即处理并更新任务进度。</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/tasks" class="button">查看任务</a>
  `;

  return {
    subject: `【任务逾期】${data.taskName} - 已逾期${data.overdueDays}天`,
    htmlContent: baseEmailTemplate(content),
    textContent: `任务逾期：${data.taskName}\n项目：${data.projectName}\n截止日期：${data.dueDate}\n已逾期：${data.overdueDays}天`,
  };
}

// 任务完成通知模板
export function getTaskCompletedTemplate(data: {
  taskName: string;
  projectName: string;
  assigneeName: string;
  completionDate: string;
  rating?: number;
}): EmailTemplate {
  const content = `
    <h2>✅ 任务完成通知</h2>
    <p>恭喜！您的任务已完成：</p>
    
    <div class="success">
      <strong>任务名称：</strong>${data.taskName}<br>
      <strong>所属项目：</strong>${data.projectName}<br>
      <strong>完成时间：</strong>${data.completionDate}
      ${data.rating ? `<br><strong>评分：</strong>${'⭐'.repeat(data.rating)} (${data.rating}星)` : ''}
    </div>
    
    <p>感谢您的努力工作！</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/tasks" class="button">查看任务</a>
  `;

  return {
    subject: `【任务完成】${data.taskName}`,
    htmlContent: baseEmailTemplate(content),
    textContent: `任务完成：${data.taskName}\n项目：${data.projectName}\n完成时间：${data.completionDate}`,
  };
}

// 协同请求通知模板
export function getCollaborationRequestTemplate(data: {
  taskTitle: string;
  requestingRole: string;
  requestingUserName: string;
  targetRole: string;
  deadline?: string;
  description?: string;
}): EmailTemplate {
  const content = `
    <h2>🤝 协同请求</h2>
    <p>您好，有同事发起了协同请求：</p>
    
    <div style="padding: 15px; background-color: #e7f3ff; border: 1px solid #2196f3; border-radius: 4px; margin: 15px 0;">
      <strong>请求人：</strong>${data.requestingUserName} (${data.requestingRole})<br>
      <strong>请求岗位：</strong>${data.targetRole}<br>
      <strong>协同任务：</strong>${data.taskTitle}
      ${data.deadline ? `<br><strong>截止日期：</strong>${data.deadline}` : ''}
    </div>
    
    ${data.description ? `<p><strong>详细说明：</strong></p><p>${data.description}</p>` : ''}
    
    <p>请登录系统查看详情并确认是否接受此协同请求。</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/collaboration" class="button">查看协同请求</a>
  `;

  return {
    subject: `【协同请求】${data.taskTitle}`,
    htmlContent: baseEmailTemplate(content),
    textContent: `协同请求：${data.taskTitle}\n请求人：${data.requestingUserName}\n请求岗位：${data.targetRole}`,
  };
}

// 周报通知模板
export function getWeeklyReportTemplate(data: {
  userName: string;
  weekStart: string;
  weekEnd: string;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  overdueTasks: number;
}): EmailTemplate {
  const content = `
    <h2>📊 本周工作周报</h2>
    <p>您好，<strong>${data.userName}</strong></p>
    
    <p>以下是您本周的工作情况总结：</p>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
      <div style="padding: 15px; background-color: #d4edda; border-radius: 4px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #28a745;">${data.completedTasks}</div>
        <div>已完成任务</div>
      </div>
      <div style="padding: 15px; background-color: #cce5ff; border-radius: 4px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #007bff;">${data.inProgressTasks}</div>
        <div>进行中任务</div>
      </div>
      <div style="padding: 15px; background-color: #e2e3e5; border-radius: 4px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #6c757d;">${data.pendingTasks}</div>
        <div>待开始任务</div>
      </div>
      ${data.overdueTasks > 0 ? `
      <div style="padding: 15px; background-color: #f8d7da; border-radius: 4px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${data.overdueTasks}</div>
        <div>已逾期任务</div>
      </div>
      ` : ''}
    </div>
    
    <p>统计时间：${data.weekStart} 至 ${data.weekEnd}</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000'}/dashboard" class="button">查看详情</a>
  `;

  return {
    subject: `【周报】工作周报 - ${data.weekStart}`,
    htmlContent: baseEmailTemplate(content),
    textContent: `工作周报\n已完成：${data.completedTasks}\n进行中：${data.inProgressTasks}\n待开始：${data.pendingTasks}${data.overdueTasks > 0 ? `\n已逾期：${data.overdueTasks}` : ''}`,
  };
}
