# Slider - AppSource Submission Checklist

Use this checklist to track your progress toward marketplace submission.

## Pre-Submission Phase

### [ ] 1. Hosting & Infrastructure
- [ ] Choose hosting provider (Azure, AWS, etc.)
- [ ] Register domain name
- [ ] Set up SSL certificate (HTTPS required)
- [ ] Deploy application to production
- [ ] Configure environment variables
- [ ] Test production deployment
- [ ] Verify CORS settings
- [ ] Set up monitoring/logging

**Production URLs needed:**
```
Base URL: https://___________________
Taskpane: https://___________________/taskpane.html
Commands: https://___________________/commands.html
Icons:    https://___________________/assets/icons/
Support:  https://___________________/support
Privacy:  https://___________________/privacy
Terms:    https://___________________/terms
```

---

### [ ] 2. Icons & Branding

- [ ] Run `./create-icons.sh` to generate all icon sizes
- [ ] Review icons at small sizes (16x16, 32x32)
- [ ] Upload icons to production hosting
- [ ] Verify icon URLs are accessible
- [ ] Test icons load correctly in PowerPoint

**Icon checklist:**
- [ ] icon-16.png (16x16)
- [ ] icon-32.png (32x32)
- [ ] icon-80.png (80x80)
- [ ] icon-128.png (128x128) - for store listing
- [ ] icon-256.png (256x256) - for store listing

---

### [ ] 3. Manifest Configuration

- [ ] Copy `manifest.production.xml` to `manifest.xml`
- [ ] Replace all `[REPLACE_THIS: ...]` placeholders
- [ ] Update ProviderName with your company name
- [ ] Set all URLs to production HTTPS URLs
- [ ] Update descriptions and labels
- [ ] Verify version number (1.0.0.0 for first release)
- [ ] Run validation: `npm run validate`
- [ ] Test manifest loads in PowerPoint

**Key fields to update:**
- [ ] ProviderName
- [ ] IconUrl & HighResolutionIconUrl
- [ ] SupportUrl
- [ ] AppDomains
- [ ] SourceLocation
- [ ] All bt:Image URLs
- [ ] All bt:Url URLs

---

### [ ] 4. Legal Documents

#### Privacy Policy
- [ ] Customize PRIVACY_POLICY_TEMPLATE.md
- [ ] Add your contact information
- [ ] Update data practices to match your implementation
- [ ] Specify data retention policies
- [ ] Add your jurisdiction information
- [ ] Convert to HTML/host on website
- [ ] Test URL is publicly accessible
- [ ] Add link to manifest

**Privacy Policy URL:** https://___________________

#### Terms of Use
- [ ] Customize TERMS_OF_USE_TEMPLATE.md
- [ ] Add your company information
- [ ] Specify your jurisdiction
- [ ] Define pricing (if applicable)
- [ ] Add acceptable use policies
- [ ] Convert to HTML/host on website
- [ ] Test URL is publicly accessible
- [ ] Add link to manifest

**Terms of Use URL:** https://___________________

#### Support Page
- [ ] Create support/help page
- [ ] Add FAQ section
- [ ] Provide contact information
- [ ] Include troubleshooting guide
- [ ] Host on website
- [ ] Test URL is accessible

**Support URL:** https://___________________

---

### [ ] 5. Marketing Materials

#### App Description

**Short Description (80 chars max):**
```
_________________________________________________________________________
```

**Long Description (4000 chars max):**
```
Include:
- What the add-in does
- Key features (3-5 bullet points)
- Use cases
- Requirements
- How it helps users
```

- [ ] Write compelling short description
- [ ] Write detailed long description
- [ ] Proofread for typos and clarity
- [ ] Ensure descriptions match actual features

#### Screenshots
- [ ] Capture 3-5 high-quality screenshots (1366x768 PNG)
  - [ ] Screenshot 1: Main interface
  - [ ] Screenshot 2: AI generation in action
  - [ ] Screenshot 3: Results/output
  - [ ] Screenshot 4: Additional feature (optional)
  - [ ] Screenshot 5: Additional feature (optional)
- [ ] Add captions/annotations if helpful
- [ ] Ensure screenshots show the add-in working
- [ ] No placeholder or dummy content

#### Video Demo (Highly Recommended)
- [ ] Record 60-90 second demo video
- [ ] Upload to YouTube or Azure Media Services
- [ ] Show key features and workflow
- [ ] Add professional intro/outro (optional)
- [ ] Test video URL

**Video URL:** https://___________________

#### Feature List
List your key features (3-5):
1. ________________________________
2. ________________________________
3. ________________________________
4. ________________________________
5. ________________________________

---

### [ ] 6. Technical Validation

#### Functionality Testing
- [ ] Test in PowerPoint Desktop (Windows)
- [ ] Test in PowerPoint Desktop (Mac)
- [ ] Test in PowerPoint Online
- [ ] Test all features work correctly
- [ ] Test with various file types (DOCX, CSV, images)
- [ ] Test error handling
- [ ] Test with slow network
- [ ] Test with no network
- [ ] Verify no console errors

#### Manifest Validation
```bash
npm run validate
```
- [ ] No validation errors
- [ ] All URLs use HTTPS
- [ ] All URLs are accessible
- [ ] Icon URLs return images
- [ ] No 404 errors

#### Build & Deployment
```bash
npm run build
npm run lint
```
- [ ] Build completes without errors
- [ ] No linting errors
- [ ] Production bundle is optimized
- [ ] All dependencies are properly bundled

#### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] ARIA labels where appropriate

#### Performance
- [ ] Add-in loads in < 3 seconds
- [ ] No memory leaks
- [ ] Smooth animations/transitions
- [ ] Responsive at different pane sizes

---

### [ ] 7. Partner Center Setup

- [ ] Create Microsoft Partner Center account
  - URL: https://partner.microsoft.com/dashboard
- [ ] Complete organization profile
- [ ] Verify tax information (if applicable)
- [ ] Verify payout information (if paid add-in)
- [ ] Agree to Office Store terms

**Partner Center Account:** _________________@___________

---

## Submission Phase

### [ ] 8. Create Submission in Partner Center

- [ ] Log into Partner Center
- [ ] Navigate to Office Store → New Product
- [ ] Select "Office Add-in"
- [ ] Choose "PowerPoint" as supported app

---

### [ ] 9. Fill Out Product Details

#### Product Identity
- [ ] Product name: "Slider"
- [ ] Category: Productivity / Presentation
- [ ] Supported languages: English (+ others if applicable)

#### Availability
- [ ] Select target markets/countries
- [ ] Set age rating
- [ ] Choose visibility (public/private)

#### Pricing
- [ ] Free / Freemium / Paid
- [ ] If paid: Set pricing per market
- [ ] If freemium: List premium features

#### Properties
- [ ] Select category
- [ ] Add keywords for search
- [ ] Choose supported platforms

---

### [ ] 10. Upload Files & Assets

- [ ] Upload manifest.xml (production version)
- [ ] Upload icon-128.png
- [ ] Upload icon-256.png
- [ ] Upload screenshots (3-5)
- [ ] Add screenshot captions

---

### [ ] 11. Store Listing Details

- [ ] Short description (from marketing materials)
- [ ] Long description (from marketing materials)
- [ ] Feature highlights (3-5 key features)
- [ ] Privacy policy URL
- [ ] Terms of use URL
- [ ] Support URL
- [ ] Video URL (if available)
- [ ] Keywords for search

---

### [ ] 12. Testing Notes for Microsoft

Provide information to help certification team test your add-in:

```
Testing Instructions:
- Basic functionality: [Describe how to test main features]
- Sample content: [Provide sample content if needed]
- Known limitations: [List any known issues]
- Special requirements: [e.g., API keys, accounts]

Test Accounts (if authentication required):
- Email: __________________
- Password: __________________

Additional Notes:
[Any other info that helps testers]
```

- [ ] Write clear testing instructions
- [ ] Provide test credentials (if needed)
- [ ] Note any special setup
- [ ] List known limitations

---

### [ ] 13. Final Review

- [ ] Review all information for accuracy
- [ ] Check all URLs work
- [ ] Verify all images display correctly
- [ ] Proofread all text
- [ ] Ensure consistency across all materials
- [ ] Double-check pricing (if applicable)

---

### [ ] 14. Submit for Certification

- [ ] Click "Submit for Certification"
- [ ] Receive confirmation email
- [ ] Note submission ID: __________________
- [ ] Expected review time: 3-5 business days

---

## Post-Submission Phase

### [ ] 15. Monitor Certification Status

- [ ] Check Partner Center dashboard daily
- [ ] Respond promptly to any certification queries
- [ ] Address any issues raised by reviewers

**Submission Date:** __________________
**Status:** __________________

### Possible Outcomes:
- **Approved** → Goes live in AppSource
- **Changes Needed** → Fix issues and resubmit
- **Rejected** → Address problems and resubmit

---

### [ ] 16. If Changes Requested

- [ ] Read feedback carefully
- [ ] Make required changes
- [ ] Update version number in manifest
- [ ] Re-test thoroughly
- [ ] Update submission in Partner Center
- [ ] Resubmit for certification

---

### [ ] 17. Once Approved

- [ ] Verify add-in appears in AppSource
- [ ] Test installation from AppSource
- [ ] Share AppSource link
- [ ] Announce launch (social media, blog, etc.)
- [ ] Monitor reviews and ratings
- [ ] Plan for updates and improvements

**AppSource URL:** https://appsource.microsoft.com/___________________

---

## Ongoing Maintenance

### [ ] Version Updates
- [ ] Set up process for bug fixes
- [ ] Plan feature roadmap
- [ ] Increment version numbers for updates
- [ ] Test updates before resubmission

### [ ] User Support
- [ ] Monitor support requests
- [ ] Respond to user feedback
- [ ] Track common issues
- [ ] Update documentation

### [ ] Analytics & Monitoring
- [ ] Track usage metrics
- [ ] Monitor error rates
- [ ] Analyze user behavior
- [ ] Plan improvements

---

## Quick Reference

### Important Links
- Partner Center: https://partner.microsoft.com/dashboard
- Office Add-ins Docs: https://docs.microsoft.com/office/dev/add-ins/
- Validation Policies: https://docs.microsoft.com/office/dev/store/validation-policies
- Support: https://developer.microsoft.com/office

### Key Commands
```bash
# Validate manifest
npm run validate

# Build for production
npm run build

# Run linter
npm run lint

# Test locally
npm run start
```

### Support Contacts
- Microsoft Partner Support: https://partner.microsoft.com/support
- Office Dev Support: https://developer.microsoft.com/office/support

---

**Estimated Timeline:** 2-3 weeks from start to approval
**Current Status:** [ ] Not Started / [ ] In Progress / [ ] Submitted / [ ] Approved

**Notes:**
```
Add any project-specific notes here
```
