# Sage Connect (V2D Panel) Scrollbar UI/UX Experimentation

## Overview
This is a focused experimentation for fixing the scrollbar overlap issue **specifically in the V2D (Sage Connect) side panel**, not the entire sidebar.

---

## What Changed

### Files Modified:
1. **SageConnect.js** - Added scroll approach state + control buttons
2. **SageConnect.css** - (No changes yet - will apply final CSS here)

### Files Created:
1. **SageConnect-ScrollExperiments.css** - Contains three scroll approaches

---

## How to Test

### Step 1: Start the App
```powershell
E:\dev\run-frontend.ps1
```

### Step 2: Open the V2D Panel
1. In the sidebar, click on **Zoe AI (V2D Associate)**
2. Click on **Care Voice** to open the module
3. Look for the **round chevron button** on the right edge of the screen
4. Click it to open the **Sage Connect side panel**

### Step 3: Test the Scroll Approaches
At the **bottom of the Sage Connect panel**, you'll see 3 control buttons:

- **Bounded** — Scrollbar takes space (Approach 1)
- **Overlay ⭐** — Modern overlay style (Approach 2 - Recommended)
- **Subtle** — Blends with background (Approach 3)

**Click each button** and scroll through the panel content to see how each approach handles the scrollbar.

---

## The Three Approaches

### Approach 1: Bounded Container
```
┌─ Sage Panel ──────────────────┐
│ Content          [Scrollbar]█ │ ← Takes 8px width
│ Content          [Scrollbar]█ │
│ Workflows...                   │
│                                │
└────────────────────────────────┘
```

**Pros:**
- Scrollbar always visible
- Clear scroll position indicator
- Traditional UX

**Cons:**
- Takes up visual space
- Less modern feel

---

### Approach 2: Overlay Scrollbar (RECOMMENDED) ⭐
```
┌─ Sage Panel ──────────────────┐
│ Content                     ▓  │ ← Appears on hover
│ Content                        │    Semi-transparent
│ Workflows...                ▓  │
│                                │
└────────────────────────────────┘
```

**Pros:**
- Modern, minimalist aesthetic
- No layout shift
- Matches macOS/iOS/Android native style
- Clean and professional
- Zero visual clutter

**Cons:**
- Slightly less discoverable (users might not know it's scrollable)

---

### Approach 3: Subtle Scrollbar
```
┌─ Sage Panel ──────────────────┐
│ Content                     ░  │ ← Always visible
│ Content                     ░  │    But subtle
│ Workflows...                ░  │
│                                │
└────────────────────────────────┘
```

**Pros:**
- Visible but subtle
- Good compromise between visibility and minimalism
- Thinner (6px) than approach 1
- Always available for reference

**Cons:**
- Still visible (takes minimal space)
- Lighter color may be hard to see

---

## Making Your Final Decision

### Choose Approach 1 if:
- You want maximum visibility of scrollbar
- Your users are less tech-savvy
- You prefer traditional web design

### Choose Approach 2 if: ✅ RECOMMENDED
- You want a modern, contemporary look
- You prefer minimalist design
- You want consistency with OS native apps
- Zero visual clutter is important
- The panel is used frequently (users will learn the scrollbar is there)

### Choose Approach 3 if:
- You want the scrollbar always visible
- But prefer it subtle and minimal
- Good middle-ground option

---

## After Deciding

### 1. Choose Your Approach
Test all three and decide which feels best.

### 2. Apply the CSS
Once you decide, copy the final CSS from `SageConnect-ScrollExperiments.css` and apply it to the `.sage-body` in `SageConnect.css`.

For example, if you choose **Approach 2 (Overlay)**:

```css
/* Replace the current .sage-body styling with: */
.sage-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: scroll;
  overflow-x: hidden;
  flex: 1;
  background: radial-gradient(...), var(--sage-surface);
  scrollbar-width: thin;
  scrollbar-color: rgba(108, 76, 220, 0.2) transparent;
}

.sage-body::-webkit-scrollbar {
  width: 8px;
}

.sage-body::-webkit-scrollbar-track {
  background: transparent;
}

.sage-body::-webkit-scrollbar-thumb {
  background: rgba(108, 76, 220, 0.15);
  border-radius: 4px;
}

.sage-body::-webkit-scrollbar-thumb:hover {
  background: rgba(108, 76, 220, 0.3);
}
```

### 3. Remove Experimentation Code

Once you've applied the CSS:

1. Delete `SageConnect-ScrollExperiments.css`
2. Remove the import from `SageConnect.js`:
   ```javascript
   // DELETE THIS LINE:
   import "../../../../Styles/SupportAtHomeModule/CareVoice/SageConnect-ScrollExperiments.css";
   ```
3. Remove the scroll state and control buttons from `SageConnect.js`:
   ```javascript
   // DELETE THIS:
   const [scrollApproach, setScrollApproach] = useState("approach-2");
   
   // And the experiment control buttons from the JSX
   ```
4. Change `className={`sage-body ${scrollApproach}`}` back to `className="sage-body"`

### 4. Test Thoroughly
- Scroll through the panel on desktop
- Test on mobile (if applicable)
- Verify it works with keyboard navigation
- Test with different amounts of content (scrollable and non-scrollable states)

---

## Current Default
The panel is defaulting to **Approach 2 (Overlay)** as it's the recommended modern approach.

---

## Notes

- The control buttons are positioned at the bottom of the scrollable area
- They have a subtle purple tint to indicate they're experimental
- The "⭐" star marks the recommended approach
- All three approaches use CSS-only scrollbar styling (no JavaScript)
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)

---

## Questions to Answer While Testing

1. **Visual Clarity**: Does the scrollbar behavior look clean?
2. **Discoverability**: Can users tell the panel is scrollable?
3. **Usability**: Can you scroll smoothly without UI elements getting in the way?
4. **Aesthetics**: Does it match the modern, professional design system?
5. **Consistency**: Does it feel like the rest of the Curki app?

---

Good luck! 💜
