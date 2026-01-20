/**
 * SlashCommandMenu - UI component for slash command suggestions
 * 
 * Renders a floating menu when user types /
 * Supports keyboard navigation and mouse selection
 */
import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  alpha,
} from '@mui/material';
import {
  Title as TitleIcon,
  Subject as ParagraphIcon,
  FormatListBulleted,
  FormatListNumbered,
  CheckBox as TaskIcon,
  FormatQuote as QuoteIcon,
  Code as CodeIcon,
  HorizontalRule as DividerIcon,
  TableChart as TableIcon,
  Lightbulb as CalloutIcon,
} from '@mui/icons-material';

// Icon mapping
const ICONS = {
  heading1: TitleIcon,
  heading2: TitleIcon,
  heading3: TitleIcon,
  paragraph: ParagraphIcon,
  bulletList: FormatListBulleted,
  orderedList: FormatListNumbered,
  taskList: TaskIcon,
  blockquote: QuoteIcon,
  codeBlock: CodeIcon,
  horizontalRule: DividerIcon,
  table: TableIcon,
  callout: CalloutIcon,
};

const SlashCommandMenu = forwardRef(function SlashCommandMenu(
  { items, command, clientRect },
  ref
) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = menuRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedItem?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const selectItem = useCallback(
    (index) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    },
    [command, items]
  );

  // Expose keyboard navigation to parent
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      if (event.key === 'Escape') {
        return true;
      }

      return false;
    },
  }));

  if (!items?.length) {
    return null;
  }

  // Calculate position based on clientRect
  const style = {};
  if (clientRect) {
    const rect = clientRect();
    if (rect) {
      style.position = 'fixed';
      style.top = rect.bottom + 8;
      style.left = rect.left;
      style.zIndex = 1300;
    }
  }

  return (
    <Paper
      ref={menuRef}
      elevation={8}
      sx={{
        width: 280,
        maxHeight: 320,
        overflow: 'auto',
        ...style,
      }}
    >
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 2, pt: 1, pb: 0.5, display: 'block' }}
      >
        Blocks
      </Typography>
      <List dense sx={{ py: 0.5 }}>
        {items.map((item, index) => {
          const Icon = ICONS[item.id] || ParagraphIcon;
          const isSelected = index === selectedIndex;

          return (
            <ListItemButton
              key={item.id}
              data-index={index}
              selected={isSelected}
              onClick={() => selectItem(index)}
              sx={{
                py: 0.75,
                px: 2,
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Icon
                  fontSize="small"
                  sx={{
                    color: isSelected ? 'primary.main' : 'text.secondary',
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isSelected ? 600 : 400,
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                  noWrap: true,
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  ml: 1,
                  px: 0.75,
                  py: 0.25,
                  bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06),
                  borderRadius: 0.5,
                  fontFamily: 'monospace',
                  color: 'text.secondary',
                }}
              >
                {item.icon}
              </Typography>
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
});

export default SlashCommandMenu;
