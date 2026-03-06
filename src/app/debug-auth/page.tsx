'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw, Upload, AlertCircle } from 'lucide-react';

export default function DebugAuthPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
  };

  const checkTokenInStorage = () => {
    addLog('=== 检查 Token 存储 ===');
    const token = localStorage.getItem('auth_token');
    
    if (token) {
      addLog(`✅ Token 存在，长度: ${token.length}`);
      addLog(`Token 前 50 字符: ${token.substring(0, 50)}...`);
    } else {
      addLog('❌ Token 不存在！');
      addLog('请先登录系统');
    }
    
    return token;
  };

  const checkCookie = () => {
    addLog('=== 检查 Cookie ===');
    const cookies = document.cookie;
    
    if (cookies.includes('auth_token=')) {
      addLog('✅ Cookie 中有 auth_token');
      const match = cookies.match(/auth_token=([^;]+)/);
      if (match) {
        addLog(`Token 长度: ${match[1].length}`);
      }
    } else {
      addLog('❌ Cookie 中没有 auth_token');
    }
  };

  const testAuthCheckAPI = async () => {
    addLog('=== 测试认证检查 API ===');
    setLoading(true);
    
    try {
      const response = await fetch('/api/diagnostics/auth-check');
      const data = await response.json();
      
      addLog(`API 响应状态: ${response.status}`);
      addLog(`Token 存在: ${data.token?.exists ? '是' : '否'}`);
      addLog(`Token 有效: ${data.token?.valid ? '是' : '否'}`);
      addLog(`Token 来源: ${data.token?.source || '未找到'}`);
      
      if (data.token?.decoded) {
        addLog(`用户邮箱: ${data.token.decoded.email}`);
        addLog(`用户ID: ${data.token.decoded.userId}`);
      }
      
      if (data.hints?.noToken) {
        addLog(`⚠️ ${data.hints.noToken}`);
      }
      if (data.hints?.invalidToken) {
        addLog(`⚠️ ${data.hints.invalidToken}`);
      }
      if (data.hints?.validToken) {
        addLog(`✅ ${data.hints.validToken}`);
      }
      
      setTestResult(data);
    } catch (error) {
      addLog(`❌ API 调用失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testImageUpload = async () => {
    addLog('=== 测试图片上传 ===');
    setLoading(true);
    
    try {
      // 检查 token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        addLog('❌ 无法测试上传：Token 不存在');
        setLoading(false);
        return;
      }
      
      addLog('Token 存在，准备上传...');
      
      // 创建一个测试图片
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 100, 100);
      }
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          addLog('❌ 无法创建测试图片');
          setLoading(false);
          return;
        }
        
        const formData = new FormData();
        formData.append('file', blob, 'test.png');
        formData.append('feedbackId', 'test-feedback-id');
        
        addLog('准备发送请求...');
        addLog('URL: /api/product-center/feedback-images');
        addLog('Authorization header: Bearer ' + token.substring(0, 30) + '...');
        
        const response = await fetch('/api/product-center/feedback-images', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: formData,
        });
        
        addLog(`响应状态: ${response.status}`);
        addLog(`响应头: ${Array.from(response.headers.entries()).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
        
        const data = await response.json();
        addLog(`响应数据: ${JSON.stringify(data)}`);
        
        if (response.ok && data.success) {
          addLog('✅ 图片上传成功！');
        } else {
          addLog('❌ 图片上传失败！');
          addLog(`错误信息: ${data.error}`);
          if (data.details) {
            addLog(`详细信息: ${data.details}`);
          }
        }
        
        setLoading(false);
      }, 'image/png');
    } catch (error) {
      addLog(`❌ 上传测试失败: ${error}`);
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const runAllChecks = async () => {
    clearLogs();
    addLog('开始全面检查...');
    
    checkTokenInStorage();
    checkCookie();
    await testAuthCheckAPI();
    
    addLog('');
    addLog('=== 检查完成 ===');
  };

  useEffect(() => {
    runAllChecks();
  }, []);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">认证调试工具</h1>
          <div className="space-x-2">
            <Button onClick={runAllChecks} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              刷新检查
            </Button>
            <Button onClick={clearLogs} variant="outline">
              清除日志
            </Button>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                测试图片上传
              </CardTitle>
              <CardDescription>测试实际的图片上传功能</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testImageUpload} disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : '开始测试'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                检查 Token 存储
              </CardTitle>
              <CardDescription>检查 localStorage 和 Cookie</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => { checkTokenInStorage(); checkCookie(); }} disabled={loading} className="w-full">
                检查
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 测试结果 */}
        {testResult && (
          <Card>
            <CardHeader>
              <CardTitle>认证检查结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded ${testResult.token?.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="space-y-2">
                  <div>Token 存在: {testResult.token?.exists ? '✅ 是' : '❌ 否'}</div>
                  <div>Token 有效: {testResult.token?.valid ? '✅ 是' : '❌ 否'}</div>
                  <div>Token 来源: {testResult.token?.source || '未找到'}</div>
                  {testResult.token?.decoded && (
                    <div className="mt-2 text-sm font-mono bg-muted p-2 rounded">
                      用户: {testResult.token.decoded.email}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 日志 */}
        <Card>
          <CardHeader>
            <CardTitle>调试日志</CardTitle>
            <CardDescription>详细的调试信息</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={logs.join('\n')}
              readOnly
              className="font-mono text-xs h-96 bg-muted"
            />
          </CardContent>
        </Card>

        {/* 操作说明 */}
        <Card>
          <CardHeader>
            <CardTitle>操作说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>1. 如果 Token 不存在，请<a href="/login" className="text-blue-600 hover:underline">重新登录</a></div>
            <div>2. 登录后，token 会自动保存到 localStorage</div>
            <div>3. 点击"测试图片上传"按钮测试实际的上传功能</div>
            <div>4. 如果测试失败，请查看日志中的错误信息</div>
            <div>5. 将日志信息复制并发送给开发者进行排查</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
