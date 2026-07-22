import { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

export function CommentSection({ ideaId, token }: any) {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let isMounted = true;
        fetch(`${API_BASE_URL}/ideas/${ideaId}/comments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (isMounted && Array.isArray(data)) {
                    setComments(data);
                }
            })
            .catch(console.error);
        return () => { isMounted = false; };
    }, [ideaId, token]);

    const handlePostComment = async (e: any) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/ideas/${ideaId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content: newComment })
            });

            if (response.ok) {
                const data = await response.json();
                setComments(prev => (prev.some(c => c.id === data.id) ? prev : [...prev, data]));
                setNewComment('');
            } else {
                alert("Failed to post comment");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Discussion</h4>

            {comments.length === 0 ? <p style={{ fontSize: '0.9em', color: '#666' }}>No comments yet.</p> : null}

            {comments.map(c => (
                <div key={c.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                    <p style={{ margin: '0', fontSize: '0.95em' }}>{c.content}</p>
                    <small style={{ color: '#888' }}>User: {c.user_id.substring(0, 8)}...</small>
                </div>
            ))}

            <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    style={{ flexGrow: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button type="submit" disabled={isSubmitting} style={{ padding: '8px 15px', backgroundColor: isSubmitting ? '#6c757d' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
            </form>
        </div>
    )

}