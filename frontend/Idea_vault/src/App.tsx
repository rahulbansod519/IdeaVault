import { useState, useEffect } from 'react';
import { IdeaForm } from './components/IdeaForm';
import { IdeaFeed } from './components/IdeaFeed';
import { AuthForm } from './components/AuthForm';
import { API_BASE_URL } from './config';


function getUserIdFromToken(token: string | null) {
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch (error) {
    console.error("Error parsing token", error)
    return null;
  }
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [ideas, setIdeas] = useState([]);
  const [view, setView] = useState('vault'); // 'vault' or 'public'
  const [isLoading, setIsLoading] = useState(false);

  const currentUserId = getUserIdFromToken(token);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setIdeas([]);
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Fetch data whenever the token OR the view changes
  useEffect(() => {
    if (!token) return;

    setIsLoading(true);
    setIdeas([]); // Immediately clear previous view's ideas to avoid stale data flash
    const endpoint = view === 'vault' ? '/ideas' : '/ideas/public';

    fetch(`${API_BASE_URL}${endpoint}`, { headers: authHeaders })
      .then(res => {
        if (res.status === 401) throw new Error("Unauthorized");
        return res.json();
      })
      .then(data => setIdeas(data))
      .catch(() => handleLogout())
      .finally(() => setIsLoading(false));
  }, [token, view]); // <--- Notice `view` is now in the dependency array

  const addIdea = async (rawNotes, isPublic) => {
    const response = await fetch(`${API_BASE_URL}/ideas`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ raw_notes: rawNotes, is_public: isPublic })
    });
    if (response.ok) {
      const newIdea = await response.json();
      // Only append immediately if we are viewing our own vault
      if (view === 'vault' || (view === 'public' && isPublic)) {
        setIdeas([newIdea, ...ideas]);
      }
    }
  };

  const updateIdea = async (id, updateData) => {
    const response = await fetch(`${API_BASE_URL}/ideas/${id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify(updateData)
    });
    if (response.ok) {
      const updatedIdea = await response.json();
      setIdeas(ideas.map(idea => (idea.id === id ? updatedIdea : idea)));
    }
  };

  const deleteIdea = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/ideas/${id}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (response.ok) {
        setIdeas(ideas.filter(idea => idea.id !== id));
      } else {
        alert("Failed to delete idea");
      }
    } catch (error) {
      console.error("Error deleting idea:", error);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Idea Vault</h1>
        {token && (
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Log Out
          </button>
        )}
      </div>

      {!token ? (
        <AuthForm onLogin={handleLogin} />
      ) : (
        <>
          {/* THE NAVIGATION TABS */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => setView('vault')}
              style={{ flexGrow: 1, padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: view === 'vault' ? '#333' : '#eee', color: view === 'vault' ? 'white' : 'black' }}
            >
              My Vault
            </button>
            <button
              onClick={() => setView('public')}
              style={{ flexGrow: 1, padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: view === 'public' ? '#333' : '#eee', color: view === 'public' ? 'white' : 'black' }}
            >
              Public Feed
            </button>
          </div>

          {/* Only show the creator form in the Vault view */}
          {view === 'vault' && <IdeaForm onAddIdea={addIdea} />}

          {/* Render the appropriate ideas */}
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Loading ideas...</p>
          ) : ideas.length === 0 ? (
            <p>{view === 'vault' ? "No ideas yet. Do a brain dump above!" : "The public feed is quiet today."}</p>
          ) : (
            <IdeaFeed
              ideas={ideas}
              onUpdate={updateIdea}
              onDelete={deleteIdea}
              currentUserId={currentUserId} // Pass down identity for security checks
              token={token} // Pass down token for the CommentSection
            />
          )}
        </>
      )}
    </div>
  );
}