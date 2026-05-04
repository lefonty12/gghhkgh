# gghhkgh

## Request Logger

Lightweight script that intercepts and displays all outgoing HTTP requests (`fetch`, `XMLHttpRequest`, `sendBeacon`) in a floating panel at the bottom of the page.

### How to use

**Option 1 — Browser Console**

Open DevTools (F12), paste the contents of `request-logger.js` into the Console tab, and press Enter. The panel appears immediately and starts logging every request the page makes.

**Option 2 — Include in HTML**

```html
<script src="request-logger.js"></script>
```

**Option 3 — Bookmarklet**

Create a bookmark with the following URL (replace `YOUR_HOST` with the path to the script):

```
javascript:void(fetch('https://YOUR_HOST/request-logger.js').then(r=>r.text()).then(eval))
```

### What it shows

| Column | Description |
|--------|-------------|
| # | Sequential request number |
| Method | HTTP method (`GET`, `POST`, etc.) or `BEACON` |
| URL | Request URL |
| Status | HTTP status code (green = 2xx/3xx, red = 4xx/5xx) |
| Time | Round-trip time in milliseconds |

### Controls

- **Clear** — removes all logged entries
- **Collapse / Expand** — toggles the log panel
