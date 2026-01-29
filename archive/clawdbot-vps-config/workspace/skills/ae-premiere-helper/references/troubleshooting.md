# Troubleshooting Flowchart

## Premiere Won't Open / Crashes on Launch

1. Hold Shift while launching → resets workspace
2. Trash preferences:
   - Mac: `~/Library/Preferences/Adobe/Premiere Pro/`
   - Win: `%APPDATA%\Adobe\Premiere Pro\`
3. Clear Media Cache:
   - Preferences > Media Cache > Delete

## Export Fails

### "Error compiling movie"
1. Render timeline first (Enter key)
2. Export in smaller sections to find problem clip
3. Transcode problem clip to ProRes/DNxHR
4. Check for nested sequences with mismatched settings

### Export stuck at 99%
→ Audio issue — check for corrupt audio or missing codec
→ Try export without audio to confirm

## Playback Issues

### Audio/Video Out of Sync
1. Check sequence settings match footage
2. Preferences > Audio Hardware > Buffer Size: 512-1024
3. Right-click clip > Modify > Interpret Footage > check frame rate

### Preview Renders Keep Getting Deleted
→ Preferences > Media Cache > check location has enough space
→ Set cache to dedicated fast drive (SSD preferred)

## After Effects Issues

### "Disk Cache Full"
1. Edit > Preferences > Media & Disk Cache
2. Empty Disk Cache
3. Move cache to larger drive

### Slow Renders
1. Check File > Project Settings > GPU Acceleration enabled
2. Reduce preview resolution
3. Pre-render heavy precomps
4. Check for expressions calculating every frame unnecessarily
