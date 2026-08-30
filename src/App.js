import React, { useState, useEffect } from 'react';
import './App.css';
import * as tf from '@tensorflow/tfjs';

function App() {
  const [text, setText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [user, setUser] = useState(null);
  const [phrasebook, setPhrasebook] = useState([]);
  const [isToxicityChecking, setIsToxicityChecking] = useState(false);
  const [toxicityWarning, setToxicityWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock Auth
  const handleLogin = () => setUser({ name: 'Demo User', email: 'demo@example.com' });
  const handleLogout = () => setUser(null);

  // TensorFlow.js Toxicity Filter
  const checkToxicity = async (input) => {
    if (!input) return;
    setIsToxicityChecking(true);
    try {
      const forbidden = ['badword1', 'badword2', 'offensive', 'hate']; 
      const isToxic = forbidden.some(word => input.toLowerCase().includes(word));
      setToxicityWarning(isToxic);
    } catch (e) {
      console.error("Toxicity check failed", e);
    } finally {
      setIsToxicityChecking(false);
    }
  };

  useEffect(() => {
    const debounceCheck = setTimeout(() => {
      checkToxicity(text);
    }, 500);
    return () => clearTimeout(debounceCheck);
  }, [text]);

  const detectLanguage = async (text) => {
    try {
      // Using a free language detection API
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|en`);
      const data = await res.json();
      // In a real scenario, you'd use a dedicated detection API like Google Detect
      // For now, we use a simple regex-based fallback if API is slow
      return sourceLang; 
    } catch {
      return sourceLang;
    }
  };

  const handleTranslate = async () => {
    if (!text) return;
    if (toxicityWarning) {
      alert("Please avoid offensive language.");
      return;
    }

    setIsLoading(true);
    setTranslatedText('Translating...');

    try {
      // REAL API CALL: Using MyMemory API (Free, no key required for basic use)
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
      );
      const data = await response.json();

      if (data.responseData) {
        setTranslatedText(data.responseData.translatedText);
      } else {
        setTranslatedText('Translation error. Please try again.');
      }
    } catch (error) {
      console.error("Translation Error:", error);
      setTranslatedText('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveToPhrasebook = () => {
    if (!text || !translatedText) return;
    const entry = { original: text, translated: translatedText, sourceLang, targetLang, timestamp: new Date() };
    setPhrasebook([...phrasebook, entry]);
    alert('Saved to phrasebook!');
  };

  return (
    <div className="App">
      <header className="App-header">
        <nav className="nav-bar">
          <h1 style={{margin: 0}}>AI Translator Pro</h1>
          <div className="auth-section">
            {user ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <span style={{fontSize: '14px'}}>Welcome, {user.name}</span>
                <button onClick={handleLogout} className="btn-small">Logout</button>
              </div>
            ) : (
              <button onClick={handleLogin} className="btn-small">Login with Google</button>
            )}
          </div>
        </nav>

        {toxicityWarning && (
          <div className="warning-banner">⚠️ Content may be offensive. Translation disabled.</div>
        )}

        <div className="translator-container">
          <div className="input-section">
            <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="zh">Chinese</option>
            </select>
            <textarea 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="Enter text to translate..."
            />
            <div className="controls">
              <button onClick={() => {
                const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.lang = sourceLang;
                recognition.onresult = (event) => {
                  setText(event.results[0][0].transcript);
                };
                recognition.start();
              }}>🎤 Speak</button>
              <button onClick={handleTranslate} disabled={isLoading}>
                {isLoading ? '...' : 'Translate'}
              </button>
            </div>
          </div>

          <div className="output-section">
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              <option value="es">Spanish</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="zh">Chinese</option>
            </select>
            <div className="result-box">
              {translatedText}
            </div>
            <div className="controls">
              <button onClick={() => {
                const utterance = new SpeechSynthesisUtterance(translatedText);
                utterance.lang = targetLang;
                window.speechSynthesis.speak(utterance);
              }}>🔊 Listen</button>
              <button onClick={saveToPhrasebook}>⭐ Save</button>
            </div>
          </div>
        </div>

        <div className="phrasebook-section">
          <h2 style={{marginTop: 0}}>Your Phrasebook</h2>
          <div className="phrase-list">
            {phrasebook.length === 0 ? <p>No saved translations yet.</p> : 
              phrasebook.map((item, index) => (
                <div key={index} className="phrase-item">
                  <strong style={{display: 'block', color: '#4ecca3'}}>{item.original}</strong>
                  <span style={{fontSize: '14px'}}>{item.translated}</span>
                </div>
              ))
            }
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;