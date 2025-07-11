import { useState } from 'react';
import { useGetComments } from '../api/use-get-comments';
import { useCreateComment } from '../api/use-create-comment';
import type { Comment } from '../types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { formatDistanceToNow } from 'date-fns';

interface TaskCommentsProps {
  taskId: string;
  currentUserId: string;
  currentUserName?: string;
}

export const TaskComments = ({ taskId, currentUserId, currentUserName }: TaskCommentsProps) => {
  const [value, setValue] = useState('');
  const { data: comments = [], isLoading } = useGetComments({ taskId });
  const { mutate: addComment, isPending } = useCreateComment();

  const handleAdd = () => {
    if (!value.trim()) return;
    addComment({
      taskId,
      content: value,
      authorId: currentUserId,
      username: currentUserName || currentUserId,
    }, {
      onSuccess: () => setValue(''),
    });
  };

  return (
    <div className="rounded-lg border p-4 mt-4 bg-muted/40">
      <p className="text-lg font-semibold mb-4">Comments</p>
      {isLoading ? (
        <div>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="italic text-muted-foreground mb-4">No comments yet.</div>
      ) : (
        <ul className="mb-6 space-y-4">
          {comments.map((comment: Comment) => (
            <li key={comment.$id} className="flex items-start gap-3">
              <MemberAvatar name={comment.username || comment.authorId} className="w-10 h-10" />
              <div className="flex-1 bg-white dark:bg-zinc-900 rounded-lg shadow-sm px-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-primary">{comment.username || comment.authorId}</span>
                  <span className="text-xs text-muted-foreground" title={new Date(comment.createdAt).toLocaleString()}>
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="text-sm whitespace-pre-line break-words">{comment.content}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm">
        <Textarea
          placeholder="Add a comment..."
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={3}
          disabled={isPending}
        />
        <Button onClick={handleAdd} disabled={isPending || !value.trim()} size="sm" className="ml-auto w-fit">
          {isPending ? 'Adding...' : 'Add Comment'}
        </Button>
      </div>
    </div>
  );
}; 
