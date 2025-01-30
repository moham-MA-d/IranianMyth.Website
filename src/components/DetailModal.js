import React, { useState, useEffect } from 'react';
import './DetailModal.css';

const DetailModal = ({ id, isOpen, onClose, title, imageUrl, description, isLink, onSave }) => {
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedId, setEditedId] = useState(id);
  const [editedDescription, setEditedDescription] = useState(description);
  const isDevMode = process.env.REACT_APP_ALLOW_EDIT === 'true';

  useEffect(() => {
    setEditedTitle(title);
    setEditedId(id);
    setEditedDescription(description);
  }, [title, description]);

  const handleSave = async () => {
    try {
      const endpoint = isLink ? "editLink" : "editNode";
      const response = await fetch(`http://localhost:5000/roots/${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          editedId: editedId,
          name: editedTitle,
          description: editedDescription
        }),
      });
      let res = await response.json();
      console.log("RES: ", res);
      if (!res.isSuccess) throw new Error(res.message);

      // Notify parent component with the updated data
      if (onSave) {
        onSave({
          id: editedId,
          name: editedTitle,
          description: editedDescription,
          isLink: isLink,
        });
      }

      //onClose(); // Close modal after successful save
      alert(res.message);
    } catch (error) {
      alert(error.message || "An error occurred while saving");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          {isDevMode ? (
            <div>
              <div>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="editable-txt"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={editedId}
                  onChange={(e) => setEditedId(e.target.value)}
                  className="editable-txt"
                />
              </div>
            </div>
          ) : (
            <h2>{title}</h2>
          )}
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {!isLink && (
            <div className="image-container">
              {imageUrl ? (
                <img src={imageUrl} alt={editedTitle} />
              ) : (
                <div className="image-placeholder">No Image Available</div>
              )}
            </div>
          )}
          <div className="description">
            {isDevMode ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="editable-description"
              />
            ) : (
              description || 'No description available'
            )}
          </div>
        </div>
        {isDevMode && (
          <div className="modal-footer">
            <button className="save-button" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailModal;
