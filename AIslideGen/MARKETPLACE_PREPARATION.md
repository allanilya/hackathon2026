# Slider - Microsoft AppSource Marketplace Preparation Guide

## Overview
This guide will help you publish "Slider" to the Microsoft AppSource marketplace for Office Add-ins.

## Prerequisites
- [ ] Microsoft Partner Center account (required for submission)
- [ ] Valid Microsoft 365 account
- [ ] Production hosting setup (Azure, AWS, or other HTTPS hosting)
- [ ] Domain with SSL certificate
- [ ] Company/individual information for app listing

---

## Phase 1: Manifest Updates (CRITICAL)

### Current Issues in manifest.xml:
1. **Localhost URLs** - Must be replaced with production HTTPS URLs
2. **Provider Name** - Currently "Contoso" (placeholder)
3. **Support URL** - Placeholder URL
4. **App Domains** - Need real domain
5. **Icon URLs** - Must be production URLs
6. **Description** - Should be more detailed

### Required Manifest Changes:

```xml
<!-- Update these fields: -->
<ProviderName>Your Company Name</ProviderName>
<Description DefaultValue="Create professional PowerPoint presentations with AI. Slider uses GPT-4 to analyze your content and generate beautiful slides automatically."/>
<IconUrl DefaultValue="https://yourdomain.com/assets/logo.png"/>
<HighResolutionIconUrl DefaultValue="https://yourdomain.com/assets/logo-high.png"/>
<SupportUrl DefaultValue="https://yourdomain.com/support"/>

<AppDomains>
  <AppDomain>https://yourdomain.com</AppDomain>
  <!-- Add any other domains your app uses -->
</AppDomains>

<SourceLocation DefaultValue="https://yourdomain.com/taskpane.html"/>
```

---

## Phase 2: Icon Requirements

Microsoft AppSource requires multiple icon sizes:

### Required Icons:
- **16x16** - Small icon for Office ribbon
- **32x32** - Medium icon for Office ribbon
- **80x80** - Large icon for Office ribbon
- **128x128** - Store listing icon
- **256x256** - High-resolution store icon (recommended)

### Icon Guidelines:
- PNG format with transparent background
- Simple, recognizable design
- Works well at small sizes
- Consistent branding across all sizes
- No text in the icon (text should be in the name)

### Current Status:
Check if icons exist at: `/Users/Allan/hackathon2026/AIslideGen/assets/`

---

## Phase 3: Production Hosting Setup

### Options:
1. **Azure Static Web Apps** (Recommended for Office Add-ins)
2. **Azure App Service**
3. **AWS S3 + CloudFront**
4. **Vercel/Netlify** (for frontend)

### Requirements:
- HTTPS enabled (required)
- Custom domain (recommended)
- CORS configured correctly
- High availability (99.9%+ uptime)

### Files to Deploy:
```
dist/
  ├── taskpane.html
  ├── taskpane.js
  ├── commands.html
  ├── commands.js
  └── assets/
      └── icons/
```

### Environment Variables to Set:
- OpenAI API key
- Supabase credentials
- Any other API keys

---

## Phase 4: Legal Documents (REQUIRED)

### 1. Privacy Policy
**Must include:**
- What data you collect
- How you use the data
- Third-party services (OpenAI, Supabase)
- Data retention policy
- User rights (GDPR compliance if applicable)
- Contact information

**Hosting:** Must be publicly accessible URL

### 2. Terms of Use
**Must include:**
- Service description
- User obligations
- Intellectual property rights
- Limitation of liability
- Termination conditions

**Hosting:** Must be publicly accessible URL

### 3. Support Information
- Support email address
- Documentation/FAQ page
- Response time expectations

---

## Phase 5: Marketing Materials

### AppSource Listing Requirements:

#### Short Description (80 chars max)
Example: "AI-powered slide creation for PowerPoint. Generate presentations instantly."

#### Long Description (4000 chars max)
Should include:
- What the add-in does
- Key features
- How it helps users
- Use cases
- Requirements

#### Screenshots (Required)
- **Minimum:** 3 screenshots
- **Maximum:** 5 screenshots
- **Size:** 1366 x 768 pixels
- **Format:** PNG
- **Content:** Show key features and workflows

#### Demo Video (Highly Recommended)
- **Length:** 60-90 seconds
- **Host:** YouTube or Azure Media Services
- **Content:** Quick demo of main features

#### Feature Highlights
List 3-5 key features:
- AI-powered slide generation
- Support for images and charts
- Multiple content sources (text, DOCX, CSV)
- Smart layout suggestions
- etc.

---

## Phase 6: Technical Requirements

### Microsoft AppSource Validation Checklist:

- [ ] Manifest schema validation passes
- [ ] No errors in Office Add-in Validator
- [ ] All URLs use HTTPS
- [ ] Add-in works in PowerPoint (Windows, Mac, Web)
- [ ] No console errors
- [ ] Proper error handling
- [ ] Loading indicators for async operations
- [ ] Responsive design (works at different pane sizes)
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] No authentication required for core features (or proper OAuth flow)

### Test Command:
```bash
npm run validate
```

### Additional Testing:
```bash
# Test in PowerPoint Desktop
npm run start

# Test build
npm run build

# Verify no errors
npm run lint
```

---

## Phase 7: Partner Center Submission

### Step-by-Step Process:

1. **Create Partner Center Account**
   - Go to: https://partner.microsoft.com/dashboard
   - Sign up for Microsoft Partner Network
   - Enroll in Office Store program

2. **Create New Office Add-in Submission**
   - Dashboard → Office Store → New Product
   - Select "Office Add-in"
   - Choose "PowerPoint" as supported app

3. **Fill Product Identity**
   - Product name: "Slider"
   - Category: Productivity / Presentation
   - Language: English (add more as needed)

4. **Upload Files**
   - Manifest.xml (production version)
   - Icons (all required sizes)
   - Screenshots
   - Test notes for certification team

5. **Provide Information**
   - Description (short and long)
   - Privacy policy URL
   - Terms of use URL
   - Support URL
   - Video URL (if available)

6. **Pricing**
   - Free or Paid
   - If paid: Set pricing and licensing model
   - If freemium: Explain premium features

7. **Availability**
   - Select markets/countries
   - Age ratings
   - Visibility settings

8. **Testing Notes**
   - Test accounts (if authentication required)
   - Special setup instructions
   - Known limitations

9. **Submit for Certification**
   - Review all information
   - Submit
   - Wait for Microsoft review (typically 3-5 business days)

---

## Phase 8: Post-Submission

### Certification Process:
- **Initial Review:** 1-2 days (automated checks)
- **Manual Testing:** 2-3 days
- **Total Time:** Usually 3-5 business days

### Possible Outcomes:
1. **Approved** - Goes live in AppSource
2. **Needs Changes** - You'll get specific feedback
3. **Rejected** - Need to fix issues and resubmit

### Common Rejection Reasons:
- Broken functionality
- Poor user experience
- Missing error handling
- Privacy/security concerns
- Misleading descriptions
- Broken links

---

## Quick Start Checklist

### Immediate Actions Needed:

1. **Choose hosting provider** - Where will you deploy?
2. **Register domain** - What domain will you use?
3. **Create/verify icons** - Do you have proper sized icons?
4. **Write privacy policy** - Required for submission
5. **Write terms of use** - Required for submission
6. **Take screenshots** - Need 3-5 good quality screenshots
7. **Set up Partner Center** - Need to register account

---

## Estimated Timeline

- **Hosting Setup:** 1-2 days
- **Manifest & Assets:** 1 day
- **Legal Documents:** 1-2 days
- **Marketing Materials:** 2-3 days
- **Partner Center Setup:** 1 day
- **Submission Review:** 3-5 business days

**Total:** ~2 weeks from start to approval

---

## Resources

- [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
- [Office Add-ins Documentation](https://docs.microsoft.com/office/dev/add-ins/)
- [AppSource Validation Policies](https://docs.microsoft.com/office/dev/store/validation-policies)
- [Manifest Schema Reference](https://docs.microsoft.com/office/dev/add-ins/develop/add-in-manifests)

---

## Support

If you need help with any of these steps, let me know which area you'd like to focus on first!
