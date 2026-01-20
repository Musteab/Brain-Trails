"""Utilities for processing note content."""
import re
from typing import Any, Dict, List, Optional


def extract_plaintext(content: Dict[str, Any]) -> str:
    """
    Extract plain text from TipTap JSON document for search indexing.
    
    TipTap stores content as a tree of nodes with type and content fields.
    """
    if not content:
        return ""
    
    texts: List[str] = []
    _walk_nodes(content, texts)
    return " ".join(texts).strip()


def _walk_nodes(node: Any, texts: List[str]) -> None:
    """Recursively walk TipTap node tree and extract text."""
    if not isinstance(node, dict):
        return
    
    # Text nodes have direct text content
    if node.get("type") == "text":
        text = node.get("text", "")
        if text:
            texts.append(text)
        return
    
    # Process child content
    content = node.get("content", [])
    if isinstance(content, list):
        for child in content:
            _walk_nodes(child, texts)


def extract_blocks_by_ids(content: Dict[str, Any], block_ids: List[str]) -> str:
    """
    Extract text only from specific block IDs (for selection-based quiz generation).
    
    TipTap blocks can have attrs.id for identification.
    """
    if not content or not block_ids:
        return extract_plaintext(content)
    
    block_id_set = set(block_ids)
    texts: List[str] = []
    _walk_selected_nodes(content, block_id_set, texts)
    return " ".join(texts).strip()


def _walk_selected_nodes(node: Any, block_ids: set, texts: List[str]) -> None:
    """Walk nodes and extract text only from selected blocks."""
    if not isinstance(node, dict):
        return
    
    # Check if this node is selected
    attrs = node.get("attrs", {})
    node_id = attrs.get("id") if isinstance(attrs, dict) else None
    
    if node_id and node_id in block_ids:
        # Extract all text from this block
        block_texts: List[str] = []
        _walk_nodes(node, block_texts)
        texts.extend(block_texts)
        return
    
    # If not selected, check children
    content = node.get("content", [])
    if isinstance(content, list):
        for child in content:
            _walk_selected_nodes(child, block_ids, texts)


def note_to_prompt_text(content: Dict[str, Any], max_chars: int = 8000) -> str:
    """
    Convert note content to clean text suitable for AI prompt.
    
    - Removes excessive whitespace
    - Caps at max_chars to prevent token overflow
    - Preserves structure hints (headings, lists)
    """
    if not content:
        return ""
    
    lines: List[str] = []
    _format_for_prompt(content, lines, depth=0)
    text = "\n".join(lines)
    
    # Clean up and cap length
    text = re.sub(r'\n{3,}', '\n\n', text)  # Max 2 consecutive newlines
    text = re.sub(r'[ \t]+', ' ', text)  # Collapse horizontal whitespace
    text = text.strip()
    
    if len(text) > max_chars:
        text = text[:max_chars] + "..."
    
    return text


def _format_for_prompt(node: Any, lines: List[str], depth: int) -> None:
    """Format TipTap nodes for prompt consumption with structure hints."""
    if not isinstance(node, dict):
        return
    
    node_type = node.get("type", "")
    attrs = node.get("attrs", {}) or {}
    content = node.get("content", [])
    
    # Handle different node types
    if node_type == "text":
        text = node.get("text", "")
        if text:
            lines.append(text)
        return
    
    if node_type == "heading":
        level = attrs.get("level", 1)
        prefix = "#" * level + " "
        texts = []
        for child in content or []:
            _extract_inline_text(child, texts)
        if texts:
            lines.append(prefix + "".join(texts))
            lines.append("")
        return
    
    if node_type in ("bulletList", "orderedList"):
        for i, item in enumerate(content or []):
            marker = "• " if node_type == "bulletList" else f"{i+1}. "
            item_texts = []
            for child in item.get("content", []):
                _extract_inline_text(child, item_texts)
            if item_texts:
                lines.append(marker + "".join(item_texts))
        lines.append("")
        return
    
    if node_type == "taskList":
        for item in content or []:
            checked = item.get("attrs", {}).get("checked", False)
            marker = "[x] " if checked else "[ ] "
            item_texts = []
            for child in item.get("content", []):
                _extract_inline_text(child, item_texts)
            if item_texts:
                lines.append(marker + "".join(item_texts))
        lines.append("")
        return
    
    if node_type == "codeBlock":
        lang = attrs.get("language", "")
        lines.append(f"```{lang}")
        for child in content or []:
            if child.get("type") == "text":
                lines.append(child.get("text", ""))
        lines.append("```")
        lines.append("")
        return
    
    if node_type == "paragraph":
        texts = []
        for child in content or []:
            _extract_inline_text(child, texts)
        if texts:
            lines.append("".join(texts))
            lines.append("")
        return
    
    # Default: recurse into children
    for child in content or []:
        _format_for_prompt(child, lines, depth + 1)


def _extract_inline_text(node: Any, texts: List[str]) -> None:
    """Extract inline text content from a node."""
    if not isinstance(node, dict):
        return
    
    if node.get("type") == "text":
        texts.append(node.get("text", ""))
        return
    
    for child in node.get("content", []):
        _extract_inline_text(child, texts)
