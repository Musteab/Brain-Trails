/**
 * Reusable Settings Components
 */
import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

// Section container
export function SettingSection({ title, description, children }) {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      <Stack spacing={2}>
        {children}
      </Stack>
    </Paper>
  );
}

// Toggle switch with label
export function SettingToggle({ 
  label, 
  description, 
  checked, 
  onChange, 
  disabled = false 
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-child': { borderBottom: 0 },
      }}
    >
      <Box sx={{ pr: 2 }}>
        <Typography variant="body1">{label}</Typography>
        {description && (
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </Box>
  );
}

// Dropdown selector
export function SettingSelect({
  label,
  description,
  value,
  onChange,
  options,
  disabled = false,
}) {
  return (
    <Box sx={{ py: 1 }}>
      <FormControl fullWidth size="small">
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          label={label}
          disabled={disabled}
        >
          {options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

// Text input field
export function SettingInput({
  label,
  description,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  endAdornment,
}) {
  return (
    <Box sx={{ py: 1 }}>
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        fullWidth
        size="small"
        InputProps={{ endAdornment }}
      />
      {description && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {description}
        </Typography>
      )}
    </Box>
  );
}

// Number input with slider
export function SettingSlider({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  marks,
  valueLabelFormat,
  disabled = false,
}) {
  return (
    <Box sx={{ py: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="body1">{label}</Typography>
        <Typography variant="body2" color="primary" fontWeight="medium">
          {valueLabelFormat ? valueLabelFormat(value) : value}
        </Typography>
      </Stack>
      <Slider
        value={value}
        onChange={(_, newValue) => onChange(newValue)}
        min={min}
        max={max}
        step={step}
        marks={marks}
        disabled={disabled}
        valueLabelDisplay="auto"
        valueLabelFormat={valueLabelFormat}
      />
      {description && (
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      )}
    </Box>
  );
}

// Time picker (simple input)
export function SettingTime({
  label,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <Box sx={{ py: 1 }}>
      <TextField
        label={label}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        size="small"
        sx={{ width: 150 }}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
}

// Inline row with label and content
export function SettingRow({ label, children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-child': { borderBottom: 0 },
      }}
    >
      <Typography variant="body1">{label}</Typography>
      {children}
    </Box>
  );
}
