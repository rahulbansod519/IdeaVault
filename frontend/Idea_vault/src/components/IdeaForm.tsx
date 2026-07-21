import { useState } from 'react';

export function IdeaForm({ onAddIdea }: any) {
  const [rawNotes, setRawNotes] = useState('');

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!rawNotes.trim()) return;

    onAddIdea(rawNotes);
    setRawNotes('');
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
      <button type="submit" style={{ marginTop: '10px', padding: '10px 20px' }}>
        Save Idea
      </button>
    </form>
  );
}
