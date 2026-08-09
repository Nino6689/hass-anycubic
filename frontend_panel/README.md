# Frontend panel source

The **built** panel is published separately as
[`anycubic-cloud-frontend`](https://pypi.org/project/anycubic-cloud-frontend/) and is
pulled in through `manifest.json`, because Home Assistant core does not accept
frontend assets bundled inside an integration. This directory keeps the source
so the bundle can be rebuilt.

## Rebuilding

```bash
npm ci
npm run build && npm run build_card
```

Then copy `dist/` into the `anycubic-cloud-frontend` package, **bump both the
content hash in `constants.py` and the package version**, and publish. The
entrypoint filename embeds the hash, so skipping that leaves browsers serving a
stale panel.
