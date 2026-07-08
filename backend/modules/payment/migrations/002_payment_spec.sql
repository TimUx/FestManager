-- Payment module migration 002: spec 6.1 data model
ALTER TABLE payment_sessions RENAME TO payments;

ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS payment_transactions_session_id_fkey;

ALTER TABLE payment_transactions RENAME COLUMN session_id TO payment_id;

ALTER TABLE payment_transactions ADD CONSTRAINT payment_transactions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(40);

UPDATE payments SET payment_status = CASE
  WHEN status = 'pending' THEN 'PAYMENT_PENDING'
  WHEN status = 'completed' THEN 'PAYMENT_PAID'
  WHEN status = 'failed' THEN 'PAYMENT_FAILED'
  WHEN status = 'cancelled' THEN 'PAYMENT_CANCELLED'
  WHEN status = 'refunded' THEN 'PAYMENT_REFUNDED'
  ELSE 'CREATED'
END WHERE payment_status IS NULL;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_reference VARCHAR(255);

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider VARCHAR(50);

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider_reference VARCHAR(255);

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS checkout_reference VARCHAR(255);

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  external_event_id VARCHAR(255),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_external ON payment_events(external_event_id) WHERE external_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON payment_events(payment_id);

CREATE TABLE IF NOT EXISTS payment_audit (
  id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  provider_id VARCHAR(50),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_payment ON payment_audit(payment_id);

CREATE TABLE IF NOT EXISTS payment_provider_config (
  provider_id VARCHAR(50) PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config_valid BOOLEAN NOT NULL DEFAULT false,
  api_reachable BOOLEAN,
  webhook_valid BOOLEAN,
  sandbox_reachable BOOLEAN,
  last_checked_at TIMESTAMPTZ,
  details JSONB DEFAULT '{}'
);
