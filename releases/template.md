# 🎉 Zawali v{VERSION} - {CATCHY_RELEASE_NAME}

_{OPENING_HUMOR_LINE - Reference Tunisian/Arab culture and being broke/zawali}_ 💰

---

## 📋 INSTRUCTIONS FOR CLAUDE (DELETE THIS SECTION BEFORE PUBLISHING):

### Release Notes Guidelines:

1. **ZAWALI THEME**: "Zawali" = "brokie" in Tunisian. Keep references to:
   - Tunisian culture (dinars, Carthage, Sidi Bou Said, teta, etc.)
   - Arab culture and family references
   - Being broke but building wealth
   - Humor around family financial support

2. **HUMOR RULES**:
   - ✅ DO: Add humor as seasoning to make it engaging
   - ❌ DON'T: Sacrifice clarity for jokes - features must be clearly explained
   - ❌ DON'T: Make fun of users or be offensive
   - ✅ DO: Self-deprecating humor about being broke/building wealth

3. **CONTENT RULES**:
   - Never show actual user financial values (£1,234, etc.)
   - Clearly explain what each feature does
   - Use examples with placeholder amounts or percentages
   - Keep technical details in "Technical Improvements" section

4. **STRUCTURE**: Keep sections as shown below. Fill in each section based on changes.

### Release Process (After writing notes):

```bash
# 1. Save this file as releases/v{VERSION}.md (remove this instruction section)
# 2. Commit the release notes:
git add releases/v{VERSION}.md
git commit -m "Add release notes for v{VERSION}"

# 3. Create the release:
npm version {patch|minor|major}  # Choose appropriate bump
git push origin --tags
git push origin main

# 4. GitHub Actions will automatically build and create the release
```

---

## ✨ Major New Features

### 🎯 **{FEATURE_NAME}**

{CLEAR_DESCRIPTION_OF_WHAT_IT_DOES}

- **{Sub-feature}** - {What it does and why it matters}
- **{Sub-feature}** - {What it does and why it matters}
- **{Sub-feature}** - {What it does and why it matters}

### 📊 **{FEATURE_NAME}** (if applicable)

{DESCRIPTION}

## 🐛 Bug Fixes (if applicable)

- **{Bug Description}** - Fixed the issue where {what was wrong} (no more {humorous description of problem})
- **{Bug Description}** - {What was fixed}

## 🔧 Technical Improvements (if applicable)

The behind-the-scenes improvements that make everything work smoother:

- **{Improvement}** - {Technical description}
- **{Improvement}** - {Technical description}
- **{Performance/Database/UI}** - {What was improved technically}

## 🚀 What This Means for You, Ya Zawali

{EXPLAIN_IN_USER_TERMS_WHAT_THIS_RELEASE_DOES}

Whether you're:

- **{Use case 1}** - {Tunisian cultural reference}
- **{Use case 2}** - {Arab cultural reference}
- **{Use case 3}** - {Family/money reference}

{HOW_THIS_HELPS_THEM}

## 💰 The Bottom Line

{SUMMARY_PARAGRAPH_WITH_HUMOR_AND_CLEAR_BENEFIT}

_"{CLOSING_HUMOROUS_QUOTE_ABOUT_MONEY_OR_PROGRESS}"_ 📈

---

**Installation:** {Does this require fresh download? Data preservation notes?}

**Compatibility:** macOS 10.12+ (Universal Binary - works on both Intel and Apple Silicon Macs)

**Next Steps:** {What should users do after updating?} 🇹🇳✨

---

## VERSION BUMP GUIDE:

- **PATCH (1.0.17 → 1.0.18)**: Bug fixes only
- **MINOR (1.0.17 → 1.1.0)**: New features added (backwards compatible)
- **MAJOR (1.0.17 → 2.0.0)**: Breaking changes that affect existing functionality

## RELEASE EXAMPLES:

- **Patch**: "Fixed calculation errors in budget tracking"
- **Minor**: "Added new investment portfolio page"
- **Major**: "Complete redesign - users must re-setup accounts"
