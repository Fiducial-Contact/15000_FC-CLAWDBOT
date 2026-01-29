# Export Presets Quick Reference

## Delivery Formats

### YouTube / Social Media
```
Format: H.264
Preset: YouTube 1080p HD (or custom)
Resolution: Match Source
Frame Rate: Match Source
Bitrate: VBR 2-pass
  - Target: 16 Mbps (1080p) / 45 Mbps (4K)
  - Maximum: 24 Mbps (1080p) / 65 Mbps (4K)
Audio: AAC, 320 kbps, Stereo
```

### Client Delivery (High Quality)
```
Format: QuickTime
Codec: ProRes 422 HQ (Mac) / DNxHR HQ (Windows)
Resolution: Match Source
Audio: Uncompressed or PCM
```

### Archive / Master
```
Format: QuickTime
Codec: ProRes 4444 (if alpha) or ProRes 422 HQ
Resolution: Match Source
Audio: Uncompressed
```

### Web / Small File
```
Format: H.264
Preset: Vimeo 1080p HD
Bitrate: VBR 1-pass, 8-12 Mbps
```

## Common Mistakes

❌ CBR for final delivery (wastes bits on simple frames)
❌ Max render quality for H.264 (causes artifacts)
❌ Mismatched frame rates (causes judder)

✅ Always match source frame rate
✅ VBR 2-pass for best quality/size ratio
✅ Render at sequence resolution, scale in export if needed
