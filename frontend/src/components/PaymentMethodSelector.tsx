import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Paper,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import type { PaymentChoiceId, PaymentOption } from '@/types/payment';

function PaymentIcon({ icon, type }: { icon?: string; type: 'cash' | 'online' }) {
  if (type === 'cash') return <PaymentsIcon sx={{ fontSize: 32 }} aria-hidden />;
  if (icon === 'bank') return <AccountBalanceIcon sx={{ fontSize: 32 }} aria-hidden />;
  return <CreditCardIcon sx={{ fontSize: 32 }} aria-hidden />;
}

interface PaymentMethodSelectorProps {
  options: PaymentOption[];
  value: PaymentChoiceId;
  onChange: (value: PaymentChoiceId) => void;
}

export function PaymentMethodSelector({ options, value, onChange }: PaymentMethodSelectorProps) {
  return (
    <Paper sx={{ p: 2, mb: 2 }} data-testid="payment-method-selector">
      <Typography id="payment-method-legend" component="legend" variant="h6" fontWeight={700} gutterBottom>
        Zahlungsart
      </Typography>
      <FormControl component="fieldset" fullWidth aria-labelledby="payment-method-legend">
        <RadioGroup
          value={value}
          onChange={(e) => onChange(e.target.value as PaymentChoiceId)}
          aria-label="Zahlungsart wählen"
        >
          {options.map((option) => (
            <Box
              key={option.id}
              sx={{
                border: 2,
                borderColor: value === option.id ? 'primary.main' : 'divider',
                borderRadius: 2,
                mb: 1.5,
                bgcolor: value === option.id ? 'action.selected' : 'background.paper',
                transition: 'border-color 0.15s',
              }}
            >
              <FormControlLabel
                value={option.id}
                sx={{
                  m: 0,
                  width: '100%',
                  minHeight: 72,
                  px: 2,
                  py: 1.5,
                  alignItems: 'flex-start',
                  '& .MuiRadio-root': { minWidth: 48, minHeight: 48 },
                }}
                control={<Radio size="medium" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 0.5 }}>
                    <PaymentIcon icon={option.icon} type={option.type} />
                    <Box>
                      <Typography variant="body1" fontWeight={700} sx={{ fontSize: '1.1rem' }}>
                        {option.label}
                        {option.recommended && (
                          <Typography component="span" variant="body2" color="primary" sx={{ ml: 1 }}>
                            (empfohlen)
                          </Typography>
                        )}
                      </Typography>
                      {option.description && (
                        <Typography variant="body2" color="text.secondary">
                          {option.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                }
              />
            </Box>
          ))}
        </RadioGroup>
      </FormControl>
    </Paper>
  );
}
