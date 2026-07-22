import { useState } from 'react';
import { CommentSection } from './CommentSection';

export function IdeaCard({ idea, onUpdate, onDelete, currentUserId, token }: any) {
  const [title, setTitle] = useState(idea.title || '');
  const [showComments, setShowComments] = useState(false);

  // Security Check: Does the logged-in user own this idea?
  const isOwner = idea.user_id === currentUserId;

  const handleTitleBlur = () => {
    if (isOwner && title !== idea.title) onUpdate(idea.id, { title: title });
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          readOnly={!isOwner} // Prevent typing if they don't own it
          placeholder={isOwner ? "Add a title later..." : "Untitled Idea"}
          style={{ fontWeight: 'bold', width: '70%', border: 'none', outline: 'none', fontSize: '1.2em', background: 'transparent' }}
        />
        <span style={{ fontSize: '0.8em', padding: '4px 8px', borderRadius: '12px', backgroundColor: idea.is_public ? '#e2e3e5' : '#fff3cd' }}>
          {idea.is_public ? '🌍 Public' : '🔒 Private'}
        </span>
      </div>

      <p style={{ margin: '0 0 15px 0', color: '#333' }}>{idea.raw_notes}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Only show discussion if the idea is public (or you can allow it on private ones too) */}
        {idea.is_public && (
          <button onClick={() => setShowComments(!showComments)} style={{ background: 'none', border: '1px solid #007bff', color: '#007bff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
            {showComments ? 'Hide Discussion' : 'View Discussion'}
          </button>
        )}

        {/* Only render modify controls if the user owns the data */}
        {isOwner && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => onUpdate(idea.id, { status: idea.status === 'noted' ? 'in-progress' : 'noted' })} style={{ backgroundColor: idea.status === 'in-progress' ? '#d4edda' : '#e2e3e5', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {idea.status}
            </button>
            <button onClick={() => onDelete(idea.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
          </div>
        )}
      </div>

      {/* Conditionally render the comment component */}
      {showComments && <CommentSection ideaId={idea.id} token={token} />}
    </div>
  );
}
