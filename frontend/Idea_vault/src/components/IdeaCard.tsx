import { useState } from 'react';

export function IdeaCard({ idea, onUpdate, onDelete }: any) {
  const [title, setTitle] = useState(idea.title || '');

  // Triggers the PATCH request when the user clicks away from the title input
  const handleTitleBlur = () => {
    if (title !== idea.title) {
      onUpdate(idea.id, { title: title });
    }
  };

  const toggleStatus = () => {
    const newStatus = idea.status === 'noted' ? 'in-progress' : 'noted';
    onUpdate(idea.id, { status: newStatus });
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        placeholder="Add a title later..."
        style={{ fontWeight: 'bold', width: '100%', marginBottom: '10px', border: 'none', outline: 'none', fontSize: '1.2em' }}
      />

      <p style={{ margin: '0 0 15px 0', color: '#333' }}>{idea.raw_notes}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={toggleStatus} style={{ backgroundColor: idea.status === 'in-progress' ? '#d4edda' : '#e2e3e5', color: '#000', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
          Status: {idea.status}
        </button>
        <button onClick={() => onDelete(idea.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
          Delete
        </button>
      </div>
    </div>
  );
}
