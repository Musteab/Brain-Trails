import React, { useState } from 'react';
import './TagSelector.css';

const TagSelector = ({ tags, allTags, onAdd, onRemove }) => {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input && !tags.includes(input)) {
      onAdd(input);
      setInput('');
    }
  };

  return (
    <div className="tag-selector">
      <div className="tag-list">
        {tags.map(tag => (
          <span key={tag} className="tag-item">
            {tag}
            <button onClick={() => onRemove(tag)} className="tag-remove">×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Add tag..."
        list="all-tags"
        className="tag-input"
      />
      <datalist id="all-tags">
        {allTags.filter(t => !tags.includes(t)).map(tag => (
          <option key={tag} value={tag} />
        ))}
      </datalist>
      <button onClick={handleAdd} className="tag-add">Add</button>
    </div>
  );
};

export default TagSelector; 