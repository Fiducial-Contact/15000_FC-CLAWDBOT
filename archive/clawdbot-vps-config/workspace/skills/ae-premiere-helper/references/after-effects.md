# After Effects Reference

## Expressions Cheat Sheet

### Wiggle
```javascript
// Basic wiggle: frequency (per sec), amplitude (pixels)
wiggle(2, 50)

// Smooth wiggle
wiggle(1, 30, 2, 0.5)

// Wiggle only X
[wiggle(2, 50)[0], value[1]]
```

### Time Remapping
```javascript
// Loop animation
loopOut("cycle")

// Ping-pong
loopOut("pingpong")

// Hold last frame
if (time > thisComp.duration - framesToTime(1)) {
  thisComp.duration - framesToTime(1);
} else {
  time;
}
```

### Link to Another Layer
```javascript
// Match position
thisComp.layer("Control").transform.position

// With offset
thisComp.layer("Control").transform.position + [100, 0]
```

## Render Settings

### Best Quality Output
- Renderer: Mercury GPU Acceleration (CUDA/Metal)
- Quality: Best
- Resolution: Full
- Motion Blur: Enable if used

### RAM Preview Issues
- Purge: Edit > Purge > All Memory & Disk Cache
- Reduce resolution to 1/2 or 1/4 for preview
- Check Preferences > Memory — leave 4-6GB for other apps

## Common Errors

### "Cached Preview Needs 2 or More Frames"
→ Purge cache + restart AE

### "Could not allocate memory"
→ Reduce comp resolution, close other apps, increase RAM allocation

### Render stuck at X%
→ Check for missing fonts, missing footage, or corrupted layer
