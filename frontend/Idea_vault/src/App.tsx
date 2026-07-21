import { useState, useEffect } from 'react';
import { IdeaForm } from './components/IdeaForm';
import { IdeaFeed } from './components/IdeaFeed';
import { AuthForm } from './components/AuthForm';
import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/ideas`;

export default function App() {
  const [ideas, setIdeas] = useState<any[]>([]); // This holds our database state in the browser
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  const handleLogin = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIdeas([]);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
  // useEffect runs once when the app first loads (our GET request)
  useEffect(() => {
    if (!token) return;

    fetch(`${API_BASE_URL}/ideas`, { headers: authHeaders })
      .then(res => {
        if (res.status === 401) throw new Error("Unauthorized");
        return res.json()
      })
      .then(data => setIdeas(data))
      .catch(() => handleLogout());
  }, [token]);

  // POST Request
  const addIdea = async (rawNotes: string) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ raw_notes: rawNotes })
    });
    if (!response.ok) return;
    const newIdea = await response.json();
    setIdeas([...ideas, newIdea]); // Add the new idea to our screen immediately
  };

  // PATCH Request
  const updateIdea = async (id: string, updateData: any) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(updateData)
    });
    if (!response.ok) return;
    const updatedIdea = await response.json();
    setIdeas(ideas.map((idea: any) => (idea.id === id ? updatedIdea : idea)));
  };

  // DELETE Request
  const deleteIdea = async (id: string) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    if (!response.ok) return;
    setIdeas(ideas.filter((idea: any) => idea.id !== id));
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Idea Vault</h1>
        {token && (
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
            Log Out
          </button>
        )}
      </div>

      {/* The Router: If no token, show login. If token, show the app. */}
      {!token ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <>
          <IdeaForm onAddIdea={addIdea} />
          <IdeaFeed ideas={ideas} onUpdate={updateIdea} onDelete={deleteIdea} />
        </>
      )}
    </div>
  );
}