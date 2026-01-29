# Premiere Pro Reference

## Keyboard Shortcuts (Essential)

| Action         | Mac          | Windows      |
| -------------- | ------------ | ------------ |
| Ripple Delete  | Shift+Delete | Shift+Delete |
| Add Edit       | Cmd+K        | Ctrl+K       |
| Match Frame    | F            | F            |
| Speed/Duration | Cmd+R        | Ctrl+R       |
| Nest           | Cmd+G        | Ctrl+G       |

## Proxy Workflow

### Create Proxies
1. Select clips in Project panel
2. Right-click > Proxy > Create Proxies
3. Choose preset: `ProRes 422 Proxy` (Mac) or `DNxHR LB` (Windows)
4. Toggle: Button in Program monitor or Cmd+\\ (Ctrl+\\)

### When to Use
- 4K+ footage on slower machines
- Heavy effects/color grading
- Remote editing (smaller files)

## Timeline Performance

### Playback Stuttering
1. Lower playback resolution: 1/2 or 1/4
2. Render In to Out: Enter key or Sequence > Render In to Out
3. Check GPU: Preferences > Media > Enable GPU Acceleration

### Dropped Frames Warning
→ Close unnecessary panels
→ Disable FX temporarily (fx badge click)
→ Use proxies

## Audio Sync Issues

### Auto-Sync
1. Select video + audio clips
2. Right-click > Synchronize
3. Choose: Audio (analyzes waveforms)

### Manual Nudge
- Shift+, or Shift+. moves clip 5 frames left/right
