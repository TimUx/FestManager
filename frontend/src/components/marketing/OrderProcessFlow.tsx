import {
  Box,
  Card,
  CardContent,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { ORDER_PROCESS_STEPS } from '@/content/platformMarketing';

export function OrderProcessFlow() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  if (isDesktop) {
    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
            mb: 4,
            overflowX: 'auto',
            pb: 1,
          }}
        >
          {ORDER_PROCESS_STEPS.map((step, index) => (
            <Box key={step.title} sx={{ display: 'flex', alignItems: 'center', flex: '1 1 0', minWidth: 140 }}>
              <Box
                sx={{
                  flex: 1,
                  textAlign: 'center',
                  px: 1,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  {step.title}
                </Typography>
              </Box>
              {index < ORDER_PROCESS_STEPS.length - 1 && (
                <ArrowForwardIcon color="action" sx={{ flexShrink: 0, mx: 0.5 }} />
              )}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${ORDER_PROCESS_STEPS.length}, 1fr)`,
            gap: 2,
          }}
        >
          {ORDER_PROCESS_STEPS.map((step) => (
            <Card key={step.title} variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box
                component="img"
                src={step.screenshot}
                alt={step.screenshotAlt}
                loading="lazy"
                sx={{
                  width: '100%',
                  display: 'block',
                  borderBottom: 1,
                  borderColor: 'divider',
                  aspectRatio: '4 / 3',
                  objectFit: 'cover',
                  objectPosition: 'top',
                }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {step.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Stepper orientation="vertical" nonLinear>
      {ORDER_PROCESS_STEPS.map((step, index) => (
        <Step key={step.title} active expanded>
          <StepLabel>
            <Typography fontWeight={700}>{step.title}</Typography>
          </StepLabel>
          <StepContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
              {step.description}
            </Typography>
            <Card variant="outlined" sx={{ mb: index < ORDER_PROCESS_STEPS.length - 1 ? 3 : 0 }}>
              <Box
                component="img"
                src={step.screenshot}
                alt={step.screenshotAlt}
                loading="lazy"
                sx={{ width: '100%', display: 'block' }}
              />
            </Card>
          </StepContent>
        </Step>
      ))}
    </Stepper>
  );
}
