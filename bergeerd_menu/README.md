# bergeerd_menu — public website

Serves every branch's menu: `bergeerd.ir/` (default branch) and
`bergeerd.ir/<slug>`. See the root [README](../README.md) for the full picture.

```
src/
  App.tsx          reads the branch from the URL, loads it, renders its theme
  core/            shared, design-independent code
    menu.ts        URL → branch, API loading, offline fallback (useBranchMenu)
    fallback.ts    static copy of the default (Ardabil) branch
    types.ts       Branch, MenuItem, MenuSectionData, ThemeProps
    format.ts      Persian digits, tel:/Instagram links
  components/      Splash (loading) and StatusScreen (not found / error)
  themes/
    index.ts       theme registry (key → lazily loaded design)
    ember/         original dark, motion-heavy design (Ardabil)
    paper/         light printed-menu design (Tehran)
  assets/          brand assets and the fallback menu's photos
```

```bash
cp .env.example .env    # VITE_API_URL=http://localhost:8080/api
npm ci
npm run dev             # http://localhost:3000 and http://localhost:3000/<slug>
npm run typecheck && npm run lint && npm run build
```

`DEPLOYMENT.md` records the original (retired) server setup; current
deployment is `deploy/deploy.sh menu` (root README, "Production").
