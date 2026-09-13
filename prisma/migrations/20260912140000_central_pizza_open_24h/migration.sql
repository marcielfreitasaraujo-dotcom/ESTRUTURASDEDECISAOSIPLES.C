UPDATE "business_hours" AS hours
SET
  "opensAt" = '00:00',
  "closesAt" = '23:59',
  "closed" = false
FROM "tenants" AS tenants
WHERE hours."tenantId" = tenants.id
  AND tenants.slug = 'central-da-pizza';
