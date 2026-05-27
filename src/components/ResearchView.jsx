import React, { useState, useEffect } from 'react';

const NOTE_TYPES = ['Investment Thesis', 'Token Diligence', 'Stock Analysis', 'Market Commentary', 'Risk Note'];
const TYPE_CLASSES = {
  'Investment Thesis': 'note-type-thesis',
  'Token Diligence':   'note-type-diligence',
  'Stock Analysis':    'note-type-analysis',
  'Market Commentary': 'note-type-commentary',
  'Risk Note':         'note-type-commentary',
};

const SAMPLE_NOTES = [
  {
    id: 'sample-1',
    type: 'Investment Thesis',
    title: 'Bittensor (TAO) — AI Infrastructure Layer',
    tags: 'TAO, DeFAI, infrastructure',
    content: 'TAO is building decentralized AI training infrastructure. The validator model creates sustainable yield economics and token lock-up incentives. Key risk: centralization of top validators and market concentration. Target allocation: core DeFAI holding. Monitor: validator count, subnet launches, academic adoption.',
    date: new Date(Date.now() - 86400000 * 2).toLocaleDateString(),
    sample: true,
  },
  {
    id: 'sample-2',
    type: 'Market Commentary',
    title: 'DeFAI sector vs. traditional AI stocks',
    tags: 'NVDA, MSFT, sector comparison',
    content: 'AI token sector correlation with NVDA is increasing. When NVDA sells off, DeFAI tokens often follow with 2-3x amplification. Hedge: long NVDA / short high-beta AI tokens as a pairs trade. Watch AI earnings season for sentiment shifts that bleed into on-chain AI token prices.',
    date: new Date(Date.now() - 86400000 * 5).toLocaleDateString(),
    sample: true,
  },
];

function NoteCard({ note, onClick, onDelete }) {
  return (
    <div className="research-note-card" onClick={onClick}>
      <span className={`note-type-badge ${TYPE_CLASSES[note.type] || 'note-type-commentary'}`}>{note.type}</span>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{note.title}</div>
      <p style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5, marginBottom: 8 }}>
        {note.content.substring(0, 140)}…
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {note.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
            <span key={tag} style={{ fontSize: 10, background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '1px 7px', color: 'var(--txt3)' }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{note.date}</span>
          {!note.sample && (
            <button
              style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 14, padding: '0 4px', lineHeight: 1 }}
              onClick={e => { e.stopPropagation(); onDelete(note.id); }}
              title="Delete note"
            >✕</button>
          )}
        </div>
      </div>
    </div>
  );
}

function NoteEditor({ note, onSave, onClose }) {
  const [type,    setType]    = useState(note?.type    || 'Investment Thesis');
  const [title,   setTitle]   = useState(note?.title   || '');
  const [tags,    setTags]    = useState(note?.tags    || '');
  const [content, setContent] = useState(note?.content || '');

  function handleSave() {
    if (!title.trim() || !content.trim()) return;
    onSave({ type, title: title.trim(), tags: tags.trim(), content: content.trim() });
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{note ? 'Edit Note' : 'New Research Note'}</h3>
        <button style={{ background: 'none', border: 'none', color: 'var(--txt2)', fontSize: 20, cursor: 'pointer' }} onClick={onClose}>✕</button>
      </div>

      <div className="form-grp">
        <label>Note Type</label>
        <select value={type} onChange={e => setType(e.target.value)}>
          {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="form-grp">
        <label>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. TAO — Validator Economics" />
      </div>

      <div className="form-grp">
        <label>Tags (comma-separated)</label>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. TAO, infrastructure, yield" />
      </div>

      <div className="note-editor">
        <label style={{ fontSize: 11, color: 'var(--txt2)', display: 'block', marginBottom: 5 }}>Research Notes</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Write your thesis, analysis, or commentary here..."
          style={{ height: 200 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>Save Note</button>
        <button
          style={{ flex: 1, padding: '9px 16px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', color: 'var(--txt2)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          onClick={onClose}
        >Cancel</button>
      </div>
    </div>
  );
}

function NoteDetail({ note, onClose, onEdit }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <span className={`note-type-badge ${TYPE_CLASSES[note.type] || 'note-type-commentary'}`}>{note.type}</span>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 8, marginBottom: 4 }}>{note.title}</h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {note.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
              <span key={tag} style={{ fontSize: 11, background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '2px 8px', color: 'var(--txt3)' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!note.sample && <button className="text-btn" onClick={onEdit}>Edit</button>}
          <button style={{ background: 'none', border: 'none', color: 'var(--txt2)', fontSize: 20, cursor: 'pointer' }} onClick={onClose}>✕</button>
        </div>
      </div>

      <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--txt)', minHeight: 100 }}>
        {note.content}
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--txt3)' }}>Saved: {note.date}</span>
        <button
          className="text-btn"
          onClick={() => { navigator.clipboard.writeText(note.content); }}
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
}

export default function ResearchView({ theme, onToast }) {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nalu_research_notes')) || [];
      return [...SAMPLE_NOTES, ...saved];
    } catch { return SAMPLE_NOTES; }
  });
  const [view,       setView]       = useState('list'); // 'list' | 'new' | 'detail' | 'edit'
  const [activeNote, setActiveNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType,  setFilterType]  = useState('All');

  function saveToStorage(updatedNotes) {
    const userNotes = updatedNotes.filter(n => !n.sample);
    localStorage.setItem('nalu_research_notes', JSON.stringify(userNotes));
  }

  function handleSave(data) {
    if (view === 'edit' && activeNote) {
      const updated = notes.map(n =>
        n.id === activeNote.id ? { ...n, ...data, date: new Date().toLocaleDateString() } : n
      );
      setNotes(updated);
      saveToStorage(updated);
      setActiveNote({ ...activeNote, ...data });
      setView('detail');
      onToast?.('Research note updated.', '📝');
    } else {
      const newNote = { id: Date.now().toString(), ...data, date: new Date().toLocaleDateString() };
      const updated = [newNote, ...notes];
      setNotes(updated);
      saveToStorage(updated);
      setView('list');
      onToast?.('Research note saved.', '📝');
    }
  }

  function handleDelete(id) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveToStorage(updated);
    if (activeNote?.id === id) setView('list');
  }

  const filtered = notes.filter(n => {
    const matchType  = filterType === 'All' || n.type === filterType;
    const matchQuery = !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()) || n.tags.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchQuery;
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 22 }}>🧠</span>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>AI Research Memory</h1>
          </div>
          <p style={{ fontSize: 13, color: 'var(--txt2)', maxWidth: 500 }}>
            Personal investment research archive. Investment theses, token diligence, stock analysis, and market commentary — all searchable and private.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--txt3)', background: 'rgba(20,188,189,0.1)', border: '1px solid rgba(20,188,189,0.2)', borderRadius: 8, padding: '4px 10px' }}>
            {notes.filter(n => !n.sample).length} notes saved
          </span>
          {view !== 'new' && (
            <button className="btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setView('new')}>
              + New Note
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      {view === 'new' && (
        <NoteEditor onSave={handleSave} onClose={() => setView('list')} />
      )}
      {view === 'edit' && activeNote && (
        <NoteEditor note={activeNote} onSave={handleSave} onClose={() => setView('detail')} />
      )}
      {view === 'detail' && activeNote && (
        <NoteDetail note={activeNote} onClose={() => setView('list')} onEdit={() => setView('edit')} />
      )}

      {(view === 'list') && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ flex: '1 1 220px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--txt)', fontSize: 13, outline: 'none' }}
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['All', ...NOTE_TYPES].map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                    border: `1px solid ${filterType === t ? 'var(--teal)' : 'var(--border)'}`,
                    background: filterType === t ? 'rgba(20,188,189,0.1)' : 'none',
                    color: filterType === t ? 'var(--teal)' : 'var(--txt3)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Note grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {filtered.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => { setActiveNote(note); setView('detail'); }}
                onDelete={handleDelete}
              />
            ))}
            {!filtered.length && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--txt3)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                <p>No notes match your filter. <button className="text-btn" onClick={() => { setSearchQuery(''); setFilterType('All'); }}>Clear filters</button></p>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {NOTE_TYPES.map(type => {
              const count = notes.filter(n => n.type === type).length;
              if (!count) return null;
              return (
                <div key={type} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer' }} onClick={() => setFilterType(type)}>
                  <span className={`note-type-badge ${TYPE_CLASSES[type]}`} style={{ marginBottom: 4, display: 'block' }}>{type}</span>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>{count}</span>
                  <span style={{ fontSize: 11, color: 'var(--txt3)', marginLeft: 4 }}>note{count !== 1 ? 's' : ''}</span>
                </div>
              );
            })}
          </div>

          {/* Coming soon note */}
          <div style={{ marginTop: 24, background: 'rgba(20,188,189,0.06)', border: '1px solid rgba(20,188,189,0.2)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--teal)' }}>🧠 Phase 3: RAG Research Archive</div>
            <p style={{ fontSize: 12, color: 'var(--txt2)', lineHeight: 1.6 }}>
              In Phase 3, these notes will be indexed in a vector database and connected to NaluAsk's AI engine. You'll be able to query your own research archive ("What did I write about TAO validators?"), get AI-powered synthesis of your notes, and receive alert triggers based on research theses you've written.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
