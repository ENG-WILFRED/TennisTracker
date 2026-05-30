# Coach Recruitment Email Template

This template is used for coach-to-player recruitment requests sent when a coach presses `Recruit Player` on a player profile.

## Template name

`coach_recruit_request`

## Purpose

This email is a trust-first invitation, not a hire order. It should help the player understand:

- why the coach is reaching out
- what the coach offers
- the coach profile snapshot and credibility
- the intent behind the recruitment request

## Data fields

- `playerName`
- `coachName`
- `coachEmail`
- `coachRole`
- `coachOrganization`
- `expertise`
- `coachingLevel`
- `yearsOfExperience`
- `contact`
- `introMessage`
- `reason`
- `offerMode`
- `sessionFormat`
- `paymentType`
- `weeklySessions`
- `personalAnalysis`
- `platformName`

## Subject

`${coachName} wants to recruit you for ${reason}`

## Example email body

Hi ${playerName},

I’m ${coachName}${coachOrganization ? ` from ${coachOrganization}` : ''}, and I coach ${expertise || 'players'} at the ${coachingLevel || 'club'} level. I’d love to support your growth because ${reason.toLowerCase()}.

Why I’m reaching out:

${introMessage}

What I’m offering:

- Delivery: ${offerMode}
- Format: ${sessionFormat}
- Pricing: ${paymentType}
- Expected weekly sessions: ${weeklySessions}

What I’ve noticed:

${personalAnalysis || 'I wanted to connect now because I believe you are ready for a more focused coaching pathway.'}

If you’d like, I can share a coaching plan and a short trial session proposal before you decide.

Best,
${coachName}
${coachRole}
${coachOrganization || 'Independent Coach'}
${contact ? `Email: ${contact}` : `Email: ${coachEmail}`}

---

> This is a coaching invitation. The player can accept or decline, and a formal coaching relationship only begins after mutual agreement.
