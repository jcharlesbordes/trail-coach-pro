import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, Cloud, Download, Upload, Mountain, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

export default function Home() {
  const [profile, setProfile] = useState({
    name: 'Trail Runner',
    age: null,
    vma: null,
    level: 'intermediate',
    strengths: [],
    weaknesses: [],
    upcomingRaces: [],
    location: '',
    lastMonthVolume: null,
    notes: ''
  });

  const [conversations, setConversations] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [editProfile, setEditProfile] = useState({ ...profile });
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [device, setDevice] = useState('desktop');
  const conversationEndRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  // Detect device
  useEffect(() => {
    setMounted(true);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setDevice(isMobile ? 'mobile' : 'desktop');
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    if (!mounted) return;
    const saved = localStorage.getItem('trailCoachDataV2');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setProfile(data.profile);
        setConversations(data.conversations);
        setEditProfile(data.profile);
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, [mounted]);

  // Save to localStorage
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem('trailCoachDataV2', JSON.stringify({
      profile,
      conversations,
      lastSyncedAt: new Date().toISOString(),
      device
    }));
  }, [profile, conversations, device, mounted]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  const saveProfile = () => {
    setProfile(editProfile);
    setShowProfileEditor(false);
  };

  const deduplicateConversations = (newConvs) => {
    const seen = new Set();
    const deduped = [];

    for (const conv of newConvs) {
      const hash = `${conv.role}:${conv.content.substring(0, 50)}`;
      if (!seen.has(hash)) {
        seen.add(hash);
        deduped.push(conv);
      }
    }

    return deduped;
  };

  const mergeConversations = (local, remote) => {
    const merged = [...local];
    
    for (const remoteMsg of remote) {
      const isDuplicate = local.some(
        localMsg => 
          localMsg.role === remoteMsg.role && 
          localMsg.content === remoteMsg.content
      );
      
      if (!isDuplicate) {
        merged.push(remoteMsg);
      }
    }

    merged.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeA - timeB;
    });

    return deduplicateConversations(merged);
  };

  const syncToGoogleDrive = async () => {
    setSyncStatus('syncing');
    setSyncMessage('Synchronisation avec Google Drive...');

    try {
      const driveData = {
        profile,
        conversations: conversations.map(conv => ({
          ...conv,
          timestamp: conv.timestamp || new Date().toISOString(),
          device: conv.device || device
        })),
        lastUpdated: new Date().toISOString(),
        updatedFrom: device
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Sauvegarde ce fichier JSON dans Google Drive avec le nom "trail-coach-profile.json". Voici les données:

${JSON.stringify(driveData, null, 2)}

Confirme quand c'est fait.`
            }
          ],
          mcp_servers: [
            {
              type: 'url',
              url: 'https://drivemcp.googleapis.com/mcp/v1',
              name: 'google-drive'
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      setSyncStatus('success');
      setSyncMessage('✓ Synchronisé avec Drive');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage(`Erreur: ${error.message}`);
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const loadFromGoogleDrive = async () => {
    setSyncStatus('syncing');
    setSyncMessage('Récupération depuis Google Drive...');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: `Récupère le fichier "trail-coach-profile.json" depuis Google Drive et retourne son contenu en JSON brut.`
            }
          ],
          mcp_servers: [
            {
              type: 'url',
              url: 'https://drivemcp.googleapis.com/mcp/v1',
              name: 'google-drive'
            }
          ]
        })
      });

      const data = await response.json();
      const responseText = data.content[0].text;

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Fichier non trouvé sur Drive');
      }

      const remoteData = JSON.parse(jsonMatch[0]);

      const mergedConvs = mergeConversations(conversations, remoteData.conversations || []);
      setConversations(mergedConvs);

      if (remoteData.profile) {
        setProfile(remoteData.profile);
        setEditProfile(remoteData.profile);
      }

      setSyncStatus('success');
      setSyncMessage(`✓ Fusionné ${mergedConvs.length} conversations`);
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage(`Erreur: ${error.message}`);
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const coachingPrompt = (question) => {
    const profileContext = `
Tu es un Coach Trail Running expert avec 15+ ans d'expérience en coaching d'athlètes trail.

PROFIL DE L'ATHLÈTE:
- Nom: ${profile.name}
- Âge: ${profile.age || 'non spécifié'}
- VMA: ${profile.vma || 'non spécifiée'}
- Niveau: ${profile.level}
- Points forts: ${profile.strengths.join(', ') || 'non spécifiés'}
- Points faibles: ${profile.weaknesses.join(', ') || 'non spécifiés'}
- Courses planifiées: ${profile.upcomingRaces.join(', ') || 'aucune'}
- Volume mois dernier: ${profile.lastMonthVolume || 'non spécifié'}
- Zone géographique: ${profile.location || 'non spécifiée'}
- Notes personnelles: ${profile.notes || 'aucune'}

COMPÉTENCES REQUISES:
1. Physiologie: VO2max, seuil lactique, récupération, adaptation altitude
2. Technique: descentes, escalade, terrain technique, gestion effort montagne
3. Nutrition/Hydratation: ultra, gestion énergie, stratégies course
4. Mental: gestion peur, descentes exposées, fatigue mentale
5. Prévention: blessures trail, overtraining, préparation spécifique

APPROCHE:
- Personnalisée à son profil exact (pas generic)
- Scientifique (appuyer sur physio/données)
- Pragmatique (vie réelle: travail, météo, localisation)
- Progressive (plan 4-8 semaines, pas improvisé)
- Bienveillante (éviter overtraining, burnout)
- Spécifique: recommandations concrètes, séances précises, pas vague

Question de l'athlète: ${question}

Réponds avec:
1. ANALYSE (contexte personnalisé)
2. RECOMMANDATIONS (3-5 actions concrètes)
3. DÉTAILS PRATIQUES (si applicable: séances, timings, intensités)
4. ATTENTION PARTICULIÈRE (risques, points clés)

Sois direct, utile, scientifique mais accessible.`;

    return profileContext;
  };

  const sendQuestion = async () => {
    if (!currentQuestion.trim()) return;

    const userMsg = {
      role: 'user',
      content: currentQuestion,
      timestamp: new Date().toISOString(),
      device: device
    };

    setConversations([...conversations, userMsg]);
    setCurrentQuestion('');
    setLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [
            {
              role: 'user',
              content: coachingPrompt(currentQuestion)
            }
          ]
        })
      });

      const data = await response.json();
      const coachResponse = data.content[0].text;

      const coachMsg = {
        role: 'coach',
        content: coachResponse,
        timestamp: new Date().toISOString(),
        device: device
      };

      setConversations(prev => [...prev, coachMsg]);
    } catch (error) {
      setConversations(prev => [...prev, {
        role: 'coach',
        content: `⚠️ Erreur de connexion. ${error.message}`,
        timestamp: new Date().toISOString(),
        device: device
      }]);
    } finally {
      setLoading(false);
    }
  };

  const downloadLocal = () => {
    const data = {
      profile,
      conversations,
      exportDate: new Date().toISOString(),
      device
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trail-coach-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const deviceBadge = (dev) => {
    if (dev === 'mobile') return '📱';
    if (dev === 'desktop') return '🖥️';
    return '💾';
  };

  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #2d4a57 100%)',
        color: '#fff'
      }}>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #2d4a57 100%)',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mountain size={32} color="#ff8c42" />
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Trail Coach Pro</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#b0b0b0' }}>Multi-device sync • {device === 'mobile' ? '📱 Mobile' : '🖥️ Desktop'}</p>
            </div>
          </div>
          <button
            onClick={() => setShowProfileEditor(!showProfileEditor)}
            style={{
              background: '#ff8c42',
              border: 'none',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <Settings size={16} />
            Profil
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>

        {/* Sync Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Cloud size={20} color="#ff8c42" />
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Synchronisation Google Drive</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#b0b0b0' }}>
                {syncStatus === 'idle' && 'Prêt à synchroniser'}
                {syncStatus === 'syncing' && 'Synchronisation en cours...'}
                {syncStatus === 'success' && syncMessage}
                {syncStatus === 'error' && syncMessage}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={syncToGoogleDrive}
              disabled={syncStatus === 'syncing'}
              style={{
                background: syncStatus === 'syncing' ? '#666' : '#ff8c42',
                border: 'none',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Upload size={14} />
              Upload
            </button>
            <button
              onClick={loadFromGoogleDrive}
              disabled={syncStatus === 'syncing'}
              style={{
                background: syncStatus === 'syncing' ? '#666' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '6px',
                cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              Merge
            </button>
          </div>
        </div>

        {/* Profile Editor */}
        {showProfileEditor && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{ marginTop: 0, color: '#ff8c42' }}>Profil Trail</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', color: '#b0b0b0', display: 'block', marginBottom: '6px' }}>Prénom</label>
                <input
                  type="text"
                  value={editProfile.name}
                  onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#b0b0b0', display: 'block', marginBottom: '6px' }}>Âge</label>
                <input
                  type="number"
                  value={editProfile.age || ''}
                  onChange={(e) => setEditProfile({...editProfile, age: e.target.value ? parseInt(e.target.value) : null})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#b0b0b0', display: 'block', marginBottom: '6px' }}>VMA (km/h)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editProfile.vma || ''}
                  onChange={(e) => setEditProfile({...editProfile, vma: e.target.value ? parseFloat(e.target.value) : null})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', color: '#b0b0b0', display: 'block', marginBottom: '6px' }}>Niveau</label>
                <select
                  value={editProfile.level}
                  onChange={(e) => setEditProfile({...editProfile, level: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                  <option value="ultra">Ultratrail</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#b0b0b0', display: 'block', marginBottom: '6px' }}>Localisation</label>
              <input
                type="text"
                placeholder="Ex: Chamonix, Alpes..."
                value={editProfile.location}
                onChange={(e) => setEditProfile({...editProfile, location: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#b0b0b0', display: 'block', marginBottom: '6px' }}>Points forts (virgule séparés)</label>
              <input
                type="text"
                placeholder="Ex: descentes, endurance..."
                value={editProfile.strengths.join(', ')}
                onChange={(e) => setEditProfile({...editProfile, strengths: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#b0b0b0', display: 'block', marginBottom: '6px' }}>Points faibles (virgule séparés)</label>
              <input
                type="text"
                placeholder="Ex: technique, montées..."
                value={editProfile.weaknesses.join(', ')}
                onChange={(e) => setEditProfile({...editProfile, weaknesses: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#b0b0b0', display: 'block', marginBottom: '6px' }}>Races à venir (virgule séparées)</label>
              <input
                type="text"
                placeholder="Ex: UTMB 2026, Zegama..."
                value={editProfile.upcomingRaces.join(', ')}
                onChange={(e) => setEditProfile({...editProfile, upcomingRaces: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', color: '#b0b0b0', display: 'block', marginBottom: '6px' }}>Notes perso</label>
              <textarea
                placeholder="Ex: travail 50h/semaine, accès montagne weekends..."
                value={editProfile.notes}
                onChange={(e) => setEditProfile({...editProfile, notes: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  minHeight: '80px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={saveProfile}
                style={{
                  background: '#ff8c42',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  flex: 1
                }}
              >
                Sauvegarder
              </button>
              <button
                onClick={() => setShowProfileEditor(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  flex: 1
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Conversations */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          marginBottom: '24px',
          paddingRight: '12px'
        }}>
          {conversations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#b0b0b0',
              paddingTop: '60px'
            }}>
              <Mountain size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
              <p style={{ fontSize: '16px', margin: 0 }}>Salut {profile.name}!</p>
              <p style={{ fontSize: '14px', marginTop: '12px', opacity: 0.7 }}>Pose ta première question au coach.</p>
              <p style={{ fontSize: '12px', marginTop: '20px', opacity: 0.5 }}>💡 Tip: Configure ton profil d'abord pour de meilleurs conseils</p>
            </div>
          ) : (
            conversations.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '16px',
                    borderRadius: '12px',
                    background: msg.role === 'user' ? '#ff8c42' : 'rgba(255,255,255,0.08)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    lineHeight: '1.5',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>
                    <span>{deviceBadge(msg.device)}</span>
                    {msg.role === 'coach' && <strong style={{ color: '#ff8c42' }}>Coach</strong>}
                    {msg.timestamp && <span>{new Date(msg.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>}
                  </div>
                  {msg.content}
                </div>
              </div>
            ))
          )}
          <div ref={conversationEndRef} />
        </div>

        {/* Input */}
        <div style={{
          display: 'flex',
          gap: '12px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: '24px'
        }}>
          <input
            type="text"
            placeholder="Question au coach (analyse course, conseil entraînement, nutrition, technique...)..."
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && sendQuestion()}
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={sendQuestion}
            disabled={loading || !currentQuestion.trim()}
            style={{
              background: loading ? '#666' : '#ff8c42',
              border: 'none',
              color: '#fff',
              padding: '14px 20px',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Send size={18} />
            {loading ? 'En cours...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}
