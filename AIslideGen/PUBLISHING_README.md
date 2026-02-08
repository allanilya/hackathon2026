# Publishing Guide Files

This directory contains everything you need to publish Slider to Microsoft AppSource.

## 📁 Files Created

### Main Guides
1. **[QUICK_START_PUBLISHING.md](QUICK_START_PUBLISHING.md)** - Start here! Quick 8-step guide
2. **[MARKETPLACE_PREPARATION.md](MARKETPLACE_PREPARATION.md)** - Comprehensive detailed guide
3. **[SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md)** - Complete checklist with checkboxes

### Templates
4. **[PRIVACY_POLICY_TEMPLATE.md](PRIVACY_POLICY_TEMPLATE.md)** - Customizable privacy policy
5. **[TERMS_OF_USE_TEMPLATE.md](TERMS_OF_USE_TEMPLATE.md)** - Customizable terms of use
6. **[manifest.production.xml](manifest.production.xml)** - Production-ready manifest template

### Scripts
7. **[create-icons.sh](create-icons.sh)** - Automated icon generation script

## 🚀 Where to Start

### First Time? Start Here:
1. Read [QUICK_START_PUBLISHING.md](QUICK_START_PUBLISHING.md)
2. Follow the 8 steps in order
3. Use [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) to track progress

### Want All Details?
1. Read [MARKETPLACE_PREPARATION.md](MARKETPLACE_PREPARATION.md)
2. Review all 8 phases
3. Use [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) to track

## 📋 Quick Action Items

### This Week:
- [ ] Choose hosting provider
- [ ] Register domain name
- [ ] Run `./create-icons.sh`
- [ ] Update manifest.production.xml
- [ ] Deploy to production

### Next Week:
- [ ] Create legal pages
- [ ] Take screenshots
- [ ] Sign up for Partner Center
- [ ] Submit to AppSource

## 🔧 Scripts Usage

### Generate Icons:
```bash
# Requires ImageMagick
brew install imagemagick

# Run script
./create-icons.sh
```

### Validate Manifest:
```bash
npm run validate
```

### Build for Production:
```bash
npm run build
```

## 📞 Support Resources

- **Microsoft Partner Center:** https://partner.microsoft.com/dashboard
- **Office Add-ins Docs:** https://docs.microsoft.com/office/dev/add-ins/
- **Validation Policies:** https://docs.microsoft.com/office/dev/store/validation-policies

## ✅ Pre-Flight Check

Before submitting, ensure:
- [ ] App works in PowerPoint (Windows, Mac, Web)
- [ ] `npm run validate` passes
- [ ] All URLs use HTTPS
- [ ] Privacy policy is live
- [ ] Terms of use is live
- [ ] Icons are uploaded
- [ ] Screenshots are ready

## 🎯 Timeline

**Week 1:** Setup (hosting, icons, manifest, legal)
**Week 2:** Marketing materials, Partner Center, submission
**Week 3:** Microsoft review (3-5 business days)
**Total:** ~2-3 weeks to launch

## 💡 Pro Tips

1. **Test everything twice** before submitting
2. **Use real content** in screenshots (no lorem ipsum)
3. **Respond quickly** to certification feedback
4. **Monitor reviews** after launch
5. **Keep improving** based on user feedback

## 📝 Customization Needed

Before submission, you MUST customize:

### In manifest.production.xml:
- Replace `[REPLACE_THIS: ...]` placeholders
- Your company name
- Your domain URLs

### In legal templates:
- Add your contact information
- Update company details
- Specify your jurisdiction
- Add your support email

### Marketing materials:
- Write compelling descriptions
- Create high-quality screenshots
- Record demo video (optional but recommended)

## 🆘 Common Issues

### "Manifest validation failed"
→ Check all URLs use HTTPS and are accessible

### "Icons not loading"
→ Verify icon URLs return PNG images, not 404

### "Privacy policy required"
→ Must be publicly accessible URL

### "Screenshots wrong size"
→ Must be exactly 1366x768 pixels

## 📊 Success Metrics

After launch, track:
- Downloads/installs
- User ratings/reviews
- Support requests
- Error rates
- Feature usage

## 🔄 Updates

To update your add-in after approval:
1. Increment version in manifest.xml
2. Make your changes
3. Test thoroughly
4. Submit update in Partner Center
5. Wait for re-certification (~1-2 days)

---

**Ready to publish Slider? Start with [QUICK_START_PUBLISHING.md](QUICK_START_PUBLISHING.md)!**
