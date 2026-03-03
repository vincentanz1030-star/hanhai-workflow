'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lightbulb, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectWarning, AISuggestion } from '@/lib/ai/types';
import { useState } from 'react';

interface AIInsightsProps {
  warnings: ProjectWarning[];
  suggestions: AISuggestion[];
  insights: string[];
  nextSteps: string[];
  overallStatus: 'healthy' | 'attention' | 'critical';
  onDismissWarning?: (warningId: string) => void;
  onActionSuggestion?: (suggestion: AISuggestion) => void;
}

export function AIInsights({
  warnings,
  suggestions,
  insights,
  nextSteps,
  overallStatus,
  onDismissWarning,
  onActionSuggestion,
}: AIInsightsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (warnings.length === 0 && suggestions.length === 0 && insights.length === 0) {
    return null;
  }

  const activeWarnings = warnings.filter(w => !w.dismissed);

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className={`h-5 w-5 ${
              overallStatus === 'healthy' ? 'text-green-500' :
              overallStatus === 'attention' ? 'text-yellow-500' :
              'text-red-500'
            }`} />
            AI 智能洞察
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* 整体状态 */}
          <div className="flex items-center gap-2">
            <Badge variant={
              overallStatus === 'healthy' ? 'default' :
              overallStatus === 'attention' ? 'secondary' :
              'destructive'
            }>
              {overallStatus === 'healthy' ? '状态良好' :
               overallStatus === 'attention' ? '需要关注' :
               '严重预警'}
            </Badge>
          </div>

          {/* 预警信息 */}
          {activeWarnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                预警信息 ({activeWarnings.length})
              </h4>
              <div className="space-y-2">
                {activeWarnings.map((warning) => (
                  <div
                    key={`${warning.type}-${warning.projectId}-${warning.taskId}`}
                    className={`p-3 rounded-lg border ${
                      warning.severity === 'critical' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                      warning.severity === 'error' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800' :
                      'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium mb-1">{warning.message}</p>
                        {warning.suggestion && (
                          <p className="text-xs text-muted-foreground">{warning.suggestion}</p>
                        )}
                      </div>
                      {onDismissWarning && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => onDismissWarning(`${warning.type}-${warning.projectId}-${warning.taskId}`)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI建议 */}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-500" />
                优化建议 ({suggestions.length})
              </h4>
              <div className="space-y-2">
                {suggestions.filter(s => !s.viewed).map((suggestion) => (
                  <div
                    key={`${suggestion.type}-${suggestion.projectId}`}
                    className={`p-3 rounded-lg border ${
                      suggestion.priority === 'high' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                      suggestion.priority === 'medium' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' :
                      'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <p className="text-sm mb-2">{suggestion.message}</p>
                    {suggestion.actionable && onActionSuggestion && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onActionSuggestion(suggestion)}
                        className="text-xs"
                      >
                        {suggestion.actionLabel || '立即处理'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 智能洞察 */}
          {insights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">智能洞察</h4>
              <div className="space-y-1">
                {insights.map((insight, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 下一步行动 */}
          {nextSteps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">建议下一步</h4>
              <div className="space-y-1">
                {nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 font-medium">{index + 1}.</span>
                    <span className="text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
