'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, MessageCircle, ThumbsUp, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface RatingCommentsProps {
  resourceType: string;
  resourceId: number;
  resourceName: string;
}

interface Rating {
  id: number;
  rating: number;
  review: string;
  created_at: string;
  user_id: number;
  users: {
    id: number;
    name: string;
    brand: string;
  };
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  parent_id: number | null;
  users: {
    id: number;
    name: string;
    brand: string;
  };
  replies?: Comment[];
}

export function ResourceRatingComments({ resourceType, resourceId, resourceName }: RatingCommentsProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [resourceType, resourceId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      // 并行获取评分和评论
      const [ratingsRes, commentsRes] = await Promise.all([
        fetch(`/api/shared/ratings?resource_type=${resourceType}&resource_id=${resourceId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`/api/shared/comments?resource_type=${resourceType}&resource_id=${resourceId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const ratingsData = await ratingsRes.json();
      const commentsData = await commentsRes.json();

      if (ratingsData.success) {
        setRatings(ratingsData.data.ratings);
        setAverageRating(ratingsData.data.average);
        setRatingCount(ratingsData.data.count);
      }

      if (commentsData.success) {
        setComments(commentsData.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (userRating === 0) {
      toast.error('请选择评分');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/shared/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          resource_type: resourceType,
          resource_id: resourceId,
          rating: userRating,
          review: reviewText,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('评分成功');
        setReviewText('');
        fetchData();
      } else {
        toast.error(data.error || '评分失败');
      }
    } catch (error) {
      toast.error('评分失败');
    }
  };

  const submitComment = async (parentId: number | null = null) => {
    const content = parentId ? replyText : commentText;
    if (!content.trim()) {
      toast.error('请输入评论内容');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/shared/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          resource_type: resourceType,
          resource_id: resourceId,
          content,
          parent_id: parentId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('评论成功');
        setCommentText('');
        setReplyText('');
        setReplyTo(null);
        fetchData();
      } else {
        toast.error(data.error || '评论失败');
      }
    } catch (error) {
      toast.error('评论失败');
    }
  };

  const deleteComment = async (commentId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/shared/comments?id=${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        fetchData();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const currentUserId = typeof window !== 'undefined' 
    ? parseInt(localStorage.getItem('user_id') || '0')
    : 0;

  return (
    <div className="space-y-6">
      {/* 评分区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            评分与评价
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 平均评分展示 */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {ratingCount} 条评价
              </div>
            </div>
          </div>

          <Separator />

          {/* 用户评分 */}
          <div>
            <p className="text-sm font-medium mb-2">您的评分</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setUserRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= userRating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground hover:text-yellow-400'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {userRating > 0 ? `${userRating} 分` : '点击评分'}
              </span>
            </div>
          </div>

          {/* 评价文本 */}
          <div>
            <Textarea
              placeholder="分享您对资源的看法..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button onClick={submitRating} disabled={userRating === 0}>
                <Send className="h-4 w-4 mr-2" />
                提交评价
              </Button>
            </div>
          </div>

          {/* 评价列表 */}
          {ratings.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-sm font-medium">全部评价</p>
              {ratings.map((rating) => (
                <div key={rating.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rating.users?.name || '匿名'}</span>
                      <Badge variant="outline" className="text-xs">
                        {rating.users?.brand || ''}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= rating.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {rating.review && (
                    <p className="text-sm text-muted-foreground">{rating.review}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDate(rating.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 评论区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-500" />
            评论讨论
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 发表评论 */}
          <div>
            <Textarea
              placeholder="参与讨论..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button onClick={() => submitComment()}>
                <Send className="h-4 w-4 mr-2" />
                发表评论
              </Button>
            </div>
          </div>

          {/* 评论列表 */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                {/* 主评论 */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.users?.name || '匿名'}</span>
                      <Badge variant="outline" className="text-xs">
                        {comment.users?.brand || ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                      {comment.user_id === currentUserId && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => deleteComment(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-7 text-xs"
                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    回复
                  </Button>
                </div>

                {/* 回复输入框 */}
                {replyTo === comment.id && (
                  <div className="ml-8 p-3 rounded-lg bg-muted/30">
                    <Textarea
                      placeholder={`回复 ${comment.users?.name}...`}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyTo(null)}
                      >
                        取消
                      </Button>
                      <Button size="sm" onClick={() => submitComment(comment.id)}>
                        回复
                      </Button>
                    </div>
                  </div>
                )}

                {/* 回复列表 */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="p-2 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {reply.users?.name || '匿名'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {reply.users?.brand || ''}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(reply.created_at)}
                            </span>
                            {reply.user_id === currentUserId && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5"
                                onClick={() => deleteComment(reply.id)}
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {comments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              暂无评论，快来发表第一条评论吧！
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
