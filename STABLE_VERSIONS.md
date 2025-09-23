# Stable Versions Reference

This document tracks stable, tested versions of the Tourism UI Kit components.

## 🎯 Current Stable Version: v1.0-stable

**Commit**: `a884684` (September 23, 2025)  
**Tag**: `v1.0-stable`  
**Branch**: `stable-working`

### What's Stable:
- ✅ Quote Request Form (reorganized structure)
- ✅ Quote Results Page (reorganized structure)  
- ✅ Multi-tenant client configuration system
- ✅ Build system with legacy compatibility
- ✅ CDN distribution confirmed working

### Verified CDN Links:

**Quote Request Form:**
```html
<script>window.CFG = { /* your config */ };</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a884684/dist/quote-request-form.min.css">
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a884684/dist/quote-request-form.min.js"></script>
```

**Quote Results Page:**
```html
<div id="quote-calc"></div>
<script>window.CFG = { /* your config */ };</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a884684/dist/quote-results-page.min.css">
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@a884684/dist/quote-results-page-enhanced.min.js"></script>
```

**Legacy (Backward Compatibility):**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@620af04/dist/booking.min.css">
<script src="https://cdn.jsdelivr.net/gh/krishnalewin-hash/tourism-ui-kit@620af04/dist/booking.min.js"></script>
```

## 🔄 How to Revert to Stable

### Option 1: Use Git Tag
```bash
git checkout v1.0-stable
```

### Option 2: Use Stable Branch
```bash
git checkout stable-working
```

### Option 3: Reset to Stable Commit
```bash
git reset --hard a884684
```

### Option 4: Use CDN with Stable Commit
Just use `@a884684` in your CDN URLs instead of `@main`

## 📝 Development Workflow

1. **Continue development on `main` branch**
2. **Test thoroughly before creating new stable versions**
3. **When ready, create new tag**: `git tag -a v1.1-stable -m "Description"`
4. **Update this document with new stable version**
5. **Always keep `stable-working` branch as fallback**

## 🚨 Emergency Rollback

If something breaks in production:

1. **Immediate fix**: Change CDN URLs to use `@a884684`
2. **Local development**: `git checkout stable-working`
3. **Repository reset**: `git reset --hard a884684`

---

**Last Updated**: September 23, 2025  
**Next Review**: When significant changes are made