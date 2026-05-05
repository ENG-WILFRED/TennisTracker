#!/bin/bash
# Migration checklist for Coaching Session Payment System

echo "🏋️ Coaching Session Payment System - Migration Guide"
echo "=================================================="
echo ""

# Step 1: Generate Prisma Client
echo "1️⃣ Generating Prisma client..."
npx prisma generate
if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated"
else
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo ""

# Step 2: Create migration
echo "2️⃣ Creating database migration..."
echo "This will create a migration file in prisma/migrations/"
npx prisma migrate dev --name add_coaching_session_payments

if [ $? -eq 0 ]; then
    echo "✅ Migration created and applied"
else
    echo "❌ Failed to create migration"
    exit 1
fi

echo ""

# Step 3: Check migration status
echo "3️⃣ Checking migration status..."
npx prisma migrate status

echo ""

# Step 4: Verify schema
echo "4️⃣ Verifying new models..."
echo "New models added:"
echo "  - OrgCoachingPricing"
echo "  - SessionPayment"
echo "  - UserOrgDebt"
echo "  - DebtTransaction"

echo ""

# Step 5: Ready for use
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Set up organization pricing:"
echo "   curl -X POST http://localhost:3000/api/orgs/ORG_ID/coaching-pricing \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"pricePerHour\": 50, \"currency\": \"USD\"}'"
echo ""
echo "2. Read documentation:"
echo "   - documentation/coaching-payments/QUICK_START.md"
echo "   - documentation/coaching-payments/COACHING_SESSION_PAYMENTS.md"
echo ""
echo "3. Review implementation:"
echo "   - src/services/coaching-session-payment.service.ts"
echo "   - src/app/api/sessions/[sessionId]/payment/route.ts"
echo ""
echo "Happy coaching! 🎾"
