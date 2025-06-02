-- AddColumn
ALTER TABLE PaymentGatewayConfig ADD COLUMN priority INTEGER DEFAULT 0;

-- UpdateData
UPDATE PaymentGatewayConfig SET priority = 0 WHERE priority IS NULL;

-- MakePriorityNotNull
ALTER TABLE PaymentGatewayConfig ALTER COLUMN priority SET NOT NULL;