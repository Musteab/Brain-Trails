import React from 'react';
import ReactMarkdown from 'react-markdown';
import './NoteEditor.css';

const NoteEditor = ({ value, onChange, placeholder }) => {
  return (
    <div className="note-editor-container">
      <textarea
        className="note-editor-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'Write your note in markdown...'}
        rows={10}
      />
      <div className="note-editor-preview">
        <h4>Live Preview</h4>
        <div className="note-editor-markdown">
          <ReactMarkdown>{value || '*Nothing to preview yet...*'}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor; 