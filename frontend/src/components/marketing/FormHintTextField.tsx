import { Box, IconButton, TextField, Tooltip, Typography, type TextFieldProps } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { ApplicationFieldHint } from '@/content/tenantApplicationHints';
import { minLengthHint } from '@/utils/tenantApplicationValidation';

interface FormHintTextFieldProps extends Omit<TextFieldProps, 'label'> {
  label: string;
  hint: ApplicationFieldHint;
}

export function FormHintTextField({
  label,
  hint,
  helperText,
  error,
  value,
  ...textFieldProps
}: FormHintTextFieldProps) {
  const stringValue = typeof value === 'string' ? value : '';
  const resolvedHelper =
    helperText ??
    (hint.minLength && !error ? minLengthHint(stringValue, hint.minLength) : undefined);

  return (
    <TextField
      {...textFieldProps}
      value={value}
      error={error}
      helperText={resolvedHelper}
      label={
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          {label}
          <Tooltip
            title={
              <Box sx={{ p: 0.5, maxWidth: 320 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
                  {hint.title}
                </Typography>
                {hint.minLength && (
                  <Typography variant="caption" display="block" sx={{ mb: 0.75, opacity: 0.9 }}>
                    Mindestens {hint.minLength} Zeichen erforderlich.
                  </Typography>
                )}
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {hint.example}
                </Typography>
              </Box>
            }
            arrow
            placement="top-start"
            enterTouchDelay={0}
            describeChild
          >
            <IconButton
              component="span"
              size="small"
              aria-label={`Hinweis zu ${label}`}
              onMouseDown={(e) => e.preventDefault()}
              sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      }
    />
  );
}
