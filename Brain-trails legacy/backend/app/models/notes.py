"""Notes models for Notion-like note-taking feature."""
from datetime import datetime, timezone

from ..extensions import db


class NoteFolder(db.Model):
    """Hierarchical folders for organizing notes."""
    
    __tablename__ = "note_folders"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(128), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey("note_folders.id", ondelete="CASCADE"), nullable=True, index=True)
    color = db.Column(db.String(7), default="#5f8d4e")  # Hex color for folder icon
    icon = db.Column(db.String(32), default="folder")  # Icon name
    position = db.Column(db.Integer, default=0)  # For ordering
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    
    # Self-referential relationship for hierarchy
    children = db.relationship(
        "NoteFolder",
        backref=db.backref("parent", remote_side=[id]),
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    
    # Relationship to notes
    notes = db.relationship("Note", back_populates="folder", lazy="selectin")
    
    # Relationship to user
    user = db.relationship("User", backref=db.backref("note_folders", cascade="all, delete-orphan", lazy="dynamic"))
    
    __table_args__ = (
        db.UniqueConstraint("user_id", "parent_id", "name", name="uq_user_folder_name"),
    )
    
    def to_dict(self, include_children: bool = False, include_notes: bool = False) -> dict:
        """Convert folder to dictionary for API response."""
        data = {
            "id": self.id,
            "name": self.name,
            "parent_id": self.parent_id,
            "color": self.color,
            "icon": self.icon,
            "position": self.position,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_children:
            data["children"] = [child.to_dict(include_children=True) for child in self.children]
        if include_notes:
            data["notes"] = [note.to_list_dict() for note in self.notes]
        return data
    
    def get_path(self) -> list:
        """Get the folder path from root to this folder."""
        path = []
        current = self
        while current:
            path.insert(0, {"id": current.id, "name": current.name})
            current = current.parent
        return path


class Note(db.Model):
    """A user's note with rich JSON content."""

    __tablename__ = "notes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = db.Column(db.Integer, db.ForeignKey("note_folders.id", ondelete="SET NULL"), nullable=True, index=True)
    title = db.Column(db.String(255), nullable=False, default="Untitled")
    content = db.Column(db.JSON, nullable=False, default=dict)  # TipTap JSON doc
    plaintext_cache = db.Column(db.Text, nullable=False, default="")  # For search
    version = db.Column(db.Integer, nullable=False, default=1)  # Optimistic concurrency
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = db.relationship("User", backref=db.backref("notes", cascade="all, delete-orphan", lazy="dynamic"))
    folder = db.relationship("NoteFolder", back_populates="notes")
    tags = db.relationship("NoteTag", secondary="note_tag_links", back_populates="notes", lazy="selectin")
    # quiz_links is defined via backref in QuizSourceLink

    def to_dict(self, include_content: bool = False) -> dict:
        """Convert note to dictionary for API response."""
        data = {
            "id": self.id,
            "title": self.title,
            "folder_id": self.folder_id,
            "version": self.version,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "tags": [tag.to_dict() for tag in self.tags],
        }
        if self.folder:
            data["folder"] = {"id": self.folder.id, "name": self.folder.name}
        if include_content:
            data["content"] = self.content
            data["plaintext_cache"] = self.plaintext_cache
        return data

    def to_list_dict(self) -> dict:
        """Minimal dict for list views."""
        return {
            "id": self.id,
            "title": self.title,
            "folder_id": self.folder_id,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "tags": [{"id": t.id, "name": t.name, "color": t.color} for t in self.tags],
        }


class NoteTag(db.Model):
    """Tags for organizing notes."""

    __tablename__ = "note_tags"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(64), nullable=False)
    color = db.Column(db.String(7), default="#5f8d4e")  # Hex color

    # Relationships
    user = db.relationship("User", backref=db.backref("note_tags", cascade="all, delete-orphan", lazy="dynamic"))
    notes = db.relationship("Note", secondary="note_tag_links", back_populates="tags", lazy="selectin")

    __table_args__ = (db.UniqueConstraint("user_id", "name", name="uq_user_tag_name"),)

    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "color": self.color}


class NoteTagLink(db.Model):
    """Many-to-many link between notes and tags."""

    __tablename__ = "note_tag_links"

    note_id = db.Column(db.Integer, db.ForeignKey("notes.id", ondelete="CASCADE"), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey("note_tags.id", ondelete="CASCADE"), primary_key=True)


class QuizSourceLink(db.Model):
    """Links a quiz to its source (e.g., a note)."""

    __tablename__ = "quiz_source_links"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey("quiz.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = db.Column(db.String(32), nullable=False, default="note")  # 'note', 'deck', etc.
    source_id = db.Column(db.Integer, nullable=False, index=True)
    source_meta = db.Column(db.JSON, default=dict)  # e.g., selection ranges, prompt params
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    quiz = db.relationship("Quiz", backref=db.backref("source_links", cascade="all, delete-orphan", lazy="dynamic"))

    def get_note(self):
        """Get the linked note if source_type is 'note'."""
        if self.source_type == "note":
            return Note.query.get(self.source_id)
        return None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "quiz_id": self.quiz_id,
            "source_type": self.source_type,
            "source_id": self.source_id,
            "source_meta": self.source_meta,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
