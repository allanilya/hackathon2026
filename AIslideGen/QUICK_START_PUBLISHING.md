# Quick Start: Publishing Slider to Microsoft AppSource

This is a simplified guide to get you started quickly. For detailed information, see [MARKETPLACE_PREPARATION.md](MARKETPLACE_PREPARATION.md).

## Step 1: Choose Your Hosting (Day 1)

Pick one and get your domain ready:

### Option A: Azure (Recommended for Office Add-ins)
```bash
# Install Azure CLI
brew install azure-cli

# Login
az login

# Create resource group
az group create --name slider-app --location eastus

# Deploy as Static Web App
az staticwebapp create \
  --name slider \
  --resource-group slider-app \
  --source . \
  --branch main \
  --app-location "/" \
  --output-location "dist"
```

### Option B: Vercel (Easiest)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option C: Netlify
```bash
# Build your app
npm run build

# Drag and drop 'dist' folder to Netlify dashboard
# Or use Netlify CLI
```

## Step 2: Create Your Icons (Day 1)

```bash
# Install ImageMagick if needed
brew install imagemagick

# Run the icon creation script
./create-icons.sh

# Upload icons to: yourdomain.com/assets/icons/
```

## Step 3: Update Manifest (Day 1)

1. Copy the production template:
```bash
cp manifest.production.xml manifest.xml
```

2. Open `manifest.xml` and replace ALL `[REPLACE_THIS: ...]` placeholders:
   - Your company name
   - Your production domain URLs
   - Icon URLs
   - Support URLs

3. Validate:
```bash
npm run validate
```

## Step 4: Create Legal Pages (Day 2)

### Quick Option: Use a Service
- **Privacy Policy Generator**: https://www.privacypolicies.com/
- **Terms Generator**: https://www.termsandconditionsgenerator.com/

### Manual Option:
1. Customize `PRIVACY_POLICY_TEMPLATE.md`
2. Customize `TERMS_OF_USE_TEMPLATE.md`
3. Convert to HTML
4. Host at:
   - `yourdomain.com/privacy`
   - `yourdomain.com/terms`
   - `yourdomain.com/support`

## Step 5: Take Screenshots (Day 2-3)

You need 3-5 screenshots at **1366x768 pixels**:

1. Set your PowerPoint window to 1366x768
2. Load Slider
3. Take screenshots of:
   - Main interface
   - AI generating slides
   - Finished slides
   - Key features

### Mac Screenshot Tool:
```bash
# Take screenshot of selection
Cmd + Shift + 4
```

### Resize if needed:
```bash
sips -z 768 1366 screenshot.png --out screenshot-resized.png
```

## Step 6: Sign Up for Partner Center (Day 3)

1. Go to: https://partner.microsoft.com/dashboard
2. Sign up with Microsoft account
3. Complete organization profile
4. Enroll in Office Store program (may take 24-48 hours for approval)

## Step 7: Create Your Submission (Day 4-5)

### In Partner Center:

1. **Create new product:**
   - Office Store → "New Product"
   - Select "Office Add-in"
   - Choose "PowerPoint"

2. **Fill basic info:**
   - Name: "Slider"
   - Category: Productivity
   - Language: English

3. **Upload files:**
   - manifest.xml (production version)
   - icon-128.png
   - icon-256.png
   - Screenshots (3-5)

4. **Add descriptions:**
   - **Short:** "AI-powered slide creation for PowerPoint. Generate presentations instantly."
   - **Long:** Describe features, benefits, use cases (see MARKETPLACE_PREPARATION.md)

5. **Add URLs:**
   - Privacy: https://yourdomain.com/privacy
   - Terms: https://yourdomain.com/terms
   - Support: https://yourdomain.com/support

6. **Testing notes:**
```
How to test:
1. Open PowerPoint
2. Click "Slider" in the Home tab
3. Paste text or upload a document
4. Click "Generate Slides"
5. Review the AI-generated slides

No special credentials needed.
All features work without authentication.
```

7. **Submit for certification**

## Step 8: Wait for Approval (3-5 business days)

Microsoft will:
- Run automated checks
- Manually test your add-in
- Review your descriptions
- Verify all URLs work

You'll get one of three responses:
- ✅ **Approved** - Goes live immediately
- ⚠️ **Changes needed** - Fix and resubmit
- ❌ **Rejected** - Major issues, need significant changes

## Common Rejection Reasons (and How to Avoid)

1. **Broken functionality**
   - ✅ Test thoroughly before submission

2. **Dead links**
   - ✅ Verify all URLs work

3. **Misleading descriptions**
   - ✅ Be honest about features

4. **Poor error handling**
   - ✅ Show friendly error messages

5. **Missing legal pages**
   - ✅ Have working privacy policy and terms

## Pricing Strategy

### Free Version (Recommended for Launch)
- Get users and reviews
- Build reputation
- Gather feedback

### Freemium Model
- Basic features free
- Premium features paid
- Example: 10 free slides/month, unlimited with subscription

### Paid Only
- Less initial adoption
- Need strong value proposition
- Better for enterprise/professional tools

## After Approval

### Your add-in will appear at:
`https://appsource.microsoft.com/product/office/[YOUR-PRODUCT-ID]`

### Share it:
- Social media
- Your website
- Email signature
- Blog post
- Product Hunt (maybe!)

### Monitor:
- User reviews (respond to all!)
- Error logs
- Usage analytics
- Support requests

## Quick Checklist

Use [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for the complete version. Here's the minimal:

**Before submitting:**
- [ ] App deployed to production with HTTPS
- [ ] All icons created and uploaded
- [ ] manifest.xml updated with production URLs
- [ ] Privacy policy page live
- [ ] Terms of use page live
- [ ] Support page live
- [ ] 3-5 screenshots ready (1366x768)
- [ ] Tested in PowerPoint (no errors)
- [ ] `npm run validate` passes
- [ ] Partner Center account created

**Submit when all checked!**

## Need Help?

1. **Technical Issues:**
   - Office Add-ins Docs: https://docs.microsoft.com/office/dev/add-ins/
   - Stack Overflow: Tag `office-js`

2. **Submission Issues:**
   - Partner Center Support: https://partner.microsoft.com/support
   - Office Dev Support: https://developer.microsoft.com/office/support

3. **This Project:**
   - Check [MARKETPLACE_PREPARATION.md](MARKETPLACE_PREPARATION.md) for details
   - See [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) for complete list

## Estimated Timeline

- **Total time:** 1-2 weeks
- **Your work:** 3-5 days
- **Microsoft review:** 3-5 business days

**Breakdown:**
- Day 1: Hosting + Icons + Manifest
- Day 2-3: Legal pages + Screenshots
- Day 3-4: Partner Center setup
- Day 4-5: Create submission
- Day 6-10: Microsoft reviews
- Day 11: Launch! 🚀

## Pro Tips

1. **Start with free version** - easier approval, faster adoption
2. **Great screenshots matter** - show your best features
3. **Respond quickly** - if Microsoft asks for changes
4. **Good description** - users need to understand what it does
5. **Have support ready** - users will have questions
6. **Monitor reviews** - respond to feedback promptly

---

**Ready to start?** Begin with Step 1: Choose your hosting provider!

Questions? See the detailed guides:
- [MARKETPLACE_PREPARATION.md](MARKETPLACE_PREPARATION.md) - Complete guide
- [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) - Detailed checklist
