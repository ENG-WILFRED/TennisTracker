# Tournament Registration & Payment Redesign

## New Flow
```
1. Player applies for tournament (NO payment required)
   ↓
2. Registration created with status = 'pending'
   ↓
3. Shows in Org Dashboard under "Pending Applications"
   ↓
4. Org Admin reviews and Approves/Rejects
   ↓
5. If Approved: Player gets notification + payment link
   ↓
6. Player completes payment (Stripe/PayPal/M-Pesa)
   ↓
7. Registration status = 'approved'
```

## Changes Required

### 1. Database/Schema Changes
- Ensure `EventRegistration` has proper status values: 'pending' → 'approved' → handle payments separately
- Add payment timestamp tracking
- Possibly add `paymentStatus` field: 'not_required', 'pending', 'paid', 'failed'

### 2. Registration Flow Changes
**File: `src/app/organization/[id]/tournaments/[tournamentId]/page.tsx`**
- Create new "Apply for Tournament" form/modal
- Does NOT include payment selection
- Only collects: player info, skill level, etc.
- Calls `applyForTournament()` with status='pending'

**File: `src/actions/tournaments.ts`**
- Modify `applyForTournament()` to accept `skipPayment: boolean`
- Set status to 'pending' when `skipPayment: true`
- Don't create PaymentRecord until after approval

### 3. Organization Dashboard Updates
**File: `src/components/organization/dashboard-sections/OrganizationTournamentsSection.tsx`**
- Show "Pending Applications" count in tournament card
- Add click-through to view pending applications

**File: `src/app/organization/[id]/tournaments/[tournamentId]/components/TournamentManagementView.tsx`**
- Create "Applications" tab showing pending registrations
- Add "Approve" / "Reject" buttons
- Show pending player details

### 4. Player Dashboard Updates
**File: `src/app/profile/page.tsx` or new `/tournaments/my-applications`**
- Show "My Tournament Applications" with status: pending, approved, rejected
- For approved applications: show "Complete Payment" button
- Link to payment processing

### 5. Payment After Approval
**New File: `src/components/tournament/PaymentModal.tsx`**
- Opens only after org approves
- Allows payment method selection (Stripe/PayPal/M-Pesa)
- Similar to current CheckoutModal but without re-entering tournament details
- Updates registration status to 'approved' after successful payment

### 6. API Endpoint Updates
**File: `src/app/api/tournaments/[id]/registrations/[registrationId]/route.ts`**
- PATCH endpoint to approve/reject
- When approving: send player notification with payment link
- When rejecting: optionally send reason to player

**File: `src/app/api/payments/*/route.ts`** (all payment providers)
- Accept optional `registrationId` parameter
- Verify registration exists and is 'approved' before accepting payment
- On success: update registration status to 'paid'

## Implementation Priority
1. ✅ Create application form (no payment)
2. ✅ Modify `applyForTournament()` action
3. ✅ Update org dashboard to show pending applications
4. ✅ Create approval/rejection interface
5. ✅ Create payment-after-approval flow
6. ✅ Update player dashboard to show my applications
7. ✅ Send notifications on approval
8. ✅ Handle rejected applications

## Files to Create/Modify
### New Files:
- `src/components/tournament/TournamentApplicationForm.tsx` - Initial registration without payment
- `src/components/tournament/PaymentAfterApprovalModal.tsx` - Payment modal for approved players
- `src/components/organization/tournament/PendingApplicationsTab.tsx` - View/approve applications
- `src/app/tournaments/my-applications/page.tsx` - Player view of their applications

### Modified Files:
- `src/actions/tournaments.ts` - Update `applyForTournament()`
- `src/app/organization/[id]/tournaments/[tournamentId]/components/TournamentManagementView.tsx`
- `src/components/organization/dashboard-sections/OrganizationTournamentsSection.tsx`
- `src/app/api/tournaments/[id]/registrations/[registrationId]/route.ts`
- Payment webhook handlers for all providers
