import { useState } from 'react';

export function IdeaForm({ onAddIdea }: any) {
  const [rawNotes, setRawNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false)

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!rawNotes.trim()) return;

    onAddIdea(rawNotes, isPublic);
    setRawNotes('');
    setIsPublic(false)
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
      <textarea
        value={rawNotes}
        onChange={(e) => setRawNotes(e.target.value)}
        placeholder="Brain dump a new project idea here..."
        required
        style={{ width: '100%', padding: '10px', borderRadius: '5px' }}
      />
      <label style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
        />
        Make this idea public
      </label>
      <button type="submit" style={{ marginTop: '10px', padding: '10px 20px' }}>
        Save Idea
      </button>
    </form>
  );
}
