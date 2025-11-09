# Demo Recording Guide

Complete guide for creating animated GIF demos of the quote workflow using the automated demo recorder.

## Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Recording Process](#recording-process)
4. [Post-Processing](#post-processing)
5. [Manual Recording Alternative](#manual-recording-alternative)
6. [Troubleshooting](#troubleshooting)

## Overview

The Demo Recorder is an automated system that captures screenshots of the complete quote creation workflow, making it easy to create high-quality GIF demos for marketing and documentation.

### Features
- ✨ Automated screenshot capture at each workflow step
- 📸 14 predefined workflow steps covering the entire quote process
- ⏱️ Configurable timing delays for natural flow
- 🎯 Element highlighting for key features
- 📦 Bulk frame download for easy post-processing
- 📋 Detailed instructions for manual recording

## Quick Start

### 1. Access the Demo Recorder

Navigate to: `/demo-recorder`

You must be logged in to access this development tool.

### 2. Prepare Sample Data

Click **"Prepare Sample Data"** to generate:
- Realistic customer records
- Service items across multiple categories
- Sample quotes in various states
- Company settings with branding

### 3. Start Recording

Click **"Start Recording"** to automatically:
- Navigate through all workflow steps
- Capture screenshots at optimal moments
- Highlight important UI elements
- Show AI features in action

### 4. Download Frames

Once complete, click **"Download All Frames"** to get all captured screenshots as PNG files.

## Recording Process

### Workflow Steps (Total: ~60-65 seconds)

1. **Dashboard Overview** (2s)
   - Shows key metrics and quote summary
   - Full page capture

2. **Navigate to Create Quote** (1.5s)
   - Click "New Quote" button
   - Navigate to quote form

3. **Select Customer** (2s)
   - Choose customer from dropdown
   - Display customer information

4. **Generate AI Title** (2.5s)
   - Click AI button for title generation
   - Show AI-powered suggestions

5. **Browse Item Catalog** (2s)
   - View available items
   - Show category filters

6. **Add First Item** (1.5s)
   - Add item to quote
   - Show quantity selection

7. **Add Second Item** (1.5s)
   - Add another item
   - Display running total

8. **Add Custom Item** (2s)
   - Open custom item dialog
   - Fill in custom item details

9. **Generate AI Notes** (2.5s)
   - Use AI to create professional notes
   - Display generated content

10. **Review Quote Totals** (2s)
    - Show subtotal calculation
    - Display tax and total

11. **Open Send Dialog** (2s)
    - Click "Send Quote" button
    - Show email customization options

12. **Customize Email** (2.5s)
    - Edit email content
    - Enable share link option

13. **Quote Sent Confirmation** (2s)
    - Display success message
    - Navigate to quotes list

14. **Final Quote View** (2s)
    - Show complete quote details
    - Display all line items

## Post-Processing

### Converting Frames to GIF

#### Option 1: Using ezgif.com (Easiest)
1. Visit [ezgif.com/maker](https://ezgif.com/maker)
2. Upload all frames in order
3. Set delay to 200ms (5 fps) or adjust as needed
4. Click "Make a GIF"
5. Optimize with the "Optimize" tool
6. Download final GIF

#### Option 2: Using ffmpeg (Professional)

```bash
# Create GIF with high quality palette
ffmpeg -i frame-%03d.png -vf "fps=15,scale=1920:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 output.gif

# Optimize file size
gifsicle -O3 --lossy=80 output.gif -o quote-workflow.gif
```

#### Option 3: Using Photoshop
1. File → Scripts → Load Files into Stack
2. Select all PNG frames
3. Window → Timeline
4. Create Frame Animation
5. Set frame delay to 0.1-0.15 seconds
6. File → Export → Save for Web (Legacy)
7. Set to GIF, optimize for file size

### Adding Enhancements

#### Text Overlays
- Add title: "Quote Creation Workflow"
- Highlight features: "AI-Powered", "1-Click Send"
- Add final CTA: "Create Your First Quote Today"

#### Transitions
- Subtle fade between major sections
- Quick cuts for rapid actions
- Pause on important screens

#### Optimization
- Target file size: < 5MB
- Recommended dimensions: 1920x1080 or 1280x720
- Frame rate: 15-20 fps
- Color palette: Optimize for file size

### Recommended Tools

**Screen Recording**
- OBS Studio (Free, powerful)
- Loom (Easy to use)
- ScreenFlow (Mac, professional)
- ShareX (Windows, feature-rich)

**GIF Creation**
- ezgif.com (Web-based, simple)
- Adobe Photoshop (Professional)
- GIMP (Free alternative)
- ffmpeg (Command-line, flexible)

**Optimization**
- gifsicle (Command-line)
- ImageOptim (Mac)
- FileOptimizer (Windows)

**Video Editing** (for MP4 version)
- DaVinci Resolve (Free, professional)
- iMovie (Mac, simple)
- Adobe Premiere (Professional)
- HandBrake (Compression)

## Manual Recording Alternative

If the automated recorder doesn't work or you need more control:

### Setup
1. Clear browser cache and local storage
2. Generate sample data using the "Prepare Sample Data" button
3. Log in with a test account
4. Set screen resolution to 1920x1080

### Recording
1. Use OBS Studio or similar screen recorder
2. Follow the workflow steps listed above
3. Perform each action naturally with brief pauses
4. Speak or add captions to explain key features
5. Record in 1080p at 30fps

### Editing
1. Import recording into video editor
2. Speed up slow sections (1.5-2x)
3. Add text overlays for key moments
4. Export as MP4 and/or GIF

### Download Instructions
Click **"Download Instructions"** in the Demo Recorder UI to get a detailed step-by-step guide.

## Troubleshooting

### Screenshots Are Blank
- Ensure you've prepared sample data first
- Wait for pages to fully load before capturing
- Check browser console for errors

### Navigation Not Working
- Clear browser cache
- Ensure you're logged in
- Check that routes are correctly configured

### Recording Stops Midway
- Check browser console for errors
- Ensure sufficient memory is available
- Try recording in smaller batches

### File Size Too Large
- Reduce dimensions (try 1280x720)
- Lower frame rate to 10-15 fps
- Use more aggressive compression
- Remove unnecessary frames

### Colors Look Washed Out
- Use palette optimization in ffmpeg
- Adjust color depth in GIF settings
- Consider using MP4 instead of GIF

## Tips for Best Results

### Visual Quality
- Use consistent lighting/theme throughout
- Show cursor movements for interactivity
- Highlight clicked elements briefly
- Maintain steady pace between actions

### Content
- Focus on the happy path
- Show AI features prominently
- Include diverse data (different services, prices)
- End with a strong call-to-action

### File Optimization
- Crop to relevant area only
- Remove duplicate/similar frames
- Use dithering wisely
- Test on target platform before finalizing

## Output Locations

### Recommended File Paths
- Production demo: `public/demo/quote-workflow.gif`
- Mobile version: `public/demo/quote-workflow-mobile.gif`
- MP4 version: `public/demo/quote-workflow.mp4`
- Poster image: `public/demo/quote-workflow-poster.png`

### Using the Demo

#### In Landing Page
```tsx
<video autoPlay loop muted playsInline>
  <source src="/demo/quote-workflow.mp4" type="video/mp4" />
  <img src="/demo/quote-workflow.gif" alt="Quote workflow demo" />
</video>
```

#### In README
```markdown
![Quote Workflow Demo](public/demo/quote-workflow.gif)
```

#### In Documentation
```html
<img src="demo/quote-workflow.gif" 
     alt="Complete quote creation workflow" 
     width="100%" 
     loading="lazy" />
```

## Support

For issues or questions about the demo recorder:
1. Check browser console for errors
2. Review this guide thoroughly
3. Try the manual recording alternative
4. Contact development team

---

**Last Updated:** 2025-01-09
**Version:** 1.0.0
