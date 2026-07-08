-- Performance-Indizes (H8) – idempotent für bestehende Datenbanken
CREATE INDEX IF NOT EXISTS "FoodItem_eventId_idx" ON "FoodItem"("eventId");
CREATE INDEX IF NOT EXISTS "Event_isActive_idx" ON "Event"("isActive");
