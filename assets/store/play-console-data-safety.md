# Plenty — Play Console Data Safety Declaration

Reference document for filling out the Google Play Console Data Safety section.

## Data Collected

| Category | Collected? | How Used | Notes |
|----------|-----------|----------|-------|
| **Location (approximate)** | Used but NOT collected | Weather-based goal adjustments via Open-Meteo | Ephemeral API call — location not stored on device or transmitted elsewhere |
| **Personal info (name, email, etc.)** | NOT collected | — | No accounts, no sign-up |
| **Health & fitness (drink logs)** | NOT collected | — | All data stored locally only |
| **Financial info** | N/A | — | No payments or financial features |
| **Messages** | N/A | — | No messaging features |
| **Photos / media** | N/A | — | No camera or media features |
| **App activity (page views, taps)** | NOT collected | — | No analytics SDK |
| **App performance / crash logs** | NOT collected | — | No crash reporting SDK |
| **Device IDs** | NOT collected | — | No advertising ID or device ID use |

## Data Shared

Plenty does not share any data with third parties.

## Security Practices

| Question | Answer |
|----------|--------|
| Data encrypted in transit | N/A — no user data is transmitted |
| Data encryption at rest | Device-level encryption (iOS/Android native) |
| Data deletion mechanism | Settings → Reset All Data within the app |
| Independent security review | Not applicable (no data collection) |

## Play Console Checklist

When filling in the Data Safety form in Play Console:

1. **Does your app collect or share any of the required user data types?**
   → Select the data types listed under "Data Collected" above.
   - Check "Approximate location" → Answer: Yes, used but NOT collected
   - For all others: No

2. **For approximate location:**
   - Is this data collected, shared, or both? → **Used but not collected** (ephemeral Open-Meteo API call)
   - Is this data required or optional? → **Optional** (user can skip location permission and use manual city input)
   - Why is this data collected? → **App functionality** (weather-aware reminders)
   - Users can opt out? → **Yes** (revoke location permission in device settings)

3. **Security:**
   - Data encrypted in transit? → N/A (no data transmitted)
   - Data deletion? → Yes, in-app reset feature

4. **Policy:**
   - Provide the URL to the privacy policy

## Policy URL

The privacy policy should be hosted at a stable, public URL. Recommended options:

- **GitHub Pages:** `https://justine7417.github.io/plenty/privacy-policy`
- **GitHub raw URL** (as fallback): `https://raw.githubusercontent.com/justine7417/plenty/main/assets/store/privacy-policy.md`

Set up GitHub Pages:
1. Go to repo Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main`, folder: `/docs`
4. Or use a `gh-pages` branch with the markdown rendered as HTML
