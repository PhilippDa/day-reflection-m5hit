# Deploying Day Reflection to GitHub Pages

The app is built with Vite into static files in `dist/`. A GitHub Actions workflow (`.github/workflows/deploy.yml`) runs the checks, builds, and publishes `dist/` to Pages on every push to `main`. Pushes to `develop` and pull requests only run the checks. If a check fails, nothing is deployed.

## 0. Know what "private" means here

**Your case (Free plan): the repo has to be public.** That is fine as long as it only holds code. Check every commit for personal data.

- GitHub Pages needs a **public repo on the Free plan**. A **private repo** needs a paid plan (Pro, Team or Enterprise).
- Either way, the **published site is reachable by anyone who has the URL**. Standard plans have no login in front of it.
- This is acceptable because the repo contains only code. Your data stays in your iPhone's browser storage and in the JSON files you export. **Never commit an export file.**
- Pick a URL nobody would guess if you want extra obscurity, for example a repo name with a random suffix. That is not real security.

## 1. Prepare the repo

1. Create a GitHub repo, for example `day-reflection-x7k2`. Keep it empty, with no README.
2. In the project folder:
   ```sh
   cd day-reflection
   printf 'node_modules\ndist\nday-reflection-*.json\n.DS_Store\n' > .gitignore
   git init -b main
   git add .
   git commit -m "Initial commit"
   git remote add origin git@github.com:<your-user>/<repo>.git
   git push -u origin main
   ```
3. Check that `.github/workflows/deploy.yml` is committed and that no exported JSON file is staged (`git status`).

## 2. Enable Pages

1. On GitHub, open the repo, then **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**. Do not choose "Deploy from a branch", because the site needs a build.
3. Push to `main`. Open the **Actions** tab and wait for the workflow (`check`, `build`, `deploy`) to turn green.
4. The deploy step prints the URL: `https://<your-user>.github.io/<repo>/`.
5. If the workflow fails, the site stays on the last good version. Fix the failing check and push again.

## 3. Use relative paths

The site lives under `/<repo>/`, not at the domain root. Set `base: './'` in `vite.config.ts`. Reference assets without a leading slash. The manifest `start_url` and `scope` must be `./`, and the service worker must be registered with a relative path.

## 4. Install on the iPhone

1. Open the URL in **Safari**.
2. Tap **Share → Add to Home Screen → Add**.
3. Always open the app from that Home Screen icon from now on.

Installing matters for data safety. WebKit deletes script-writable storage (localStorage, IndexedDB) for sites in Safari that go unused for 7 days. Home Screen web apps are exempt from that rule. Browser storage on iOS can still be lost in other ways, so export backups anyway.

Note: the Home Screen app and Safari have **separate storage**. Data you entered in a Safari tab will not show up in the installed app. Export from one and import into the other if that happens.

## 5. Back up and restore on the iPhone

- **Export:** Settings → Export → share sheet → **Save to Files** (choose iCloud Drive or On My iPhone). Do this weekly. The app shows the date of the last export.
- **Import:** Settings → Import → pick the JSON file from Files.
- Do a test export and import once right after the first deploy, before relying on the app.

## 6. Update the app later

Work on `develop`. Every push there runs the checks and deploys nothing. When a change is ready to go live, merge it into `main`:

```sh
git switch develop
git add -A && git commit -m "Describe the change" && git push
# ready to publish:
git switch main && git merge --ff-only develop && git push && git switch develop
```

After the push to `main`, the workflow checks, builds and redeploys in a few minutes. Run `npm run check` locally first, because the pre-commit hook and CI will reject a failing commit anyway. If the iPhone still shows the old version, fully close the app and reopen it. The service worker's cache name is derived from the build output, so it changes with every release. The installed app shows "Eine neue Version ist verfügbar" with a "Neu laden" button after the next time it is opened.

## 7. Troubleshooting

| Symptom                                  | Likely cause                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| 404 on the URL                           | Pages build still running, wrong branch or folder, or a repo that is private on a Free plan  |
| Blank page, console errors for `/app.js` | Absolute paths instead of relative ones (see section 3)                                      |
| Old version after a push                 | Service worker cache, or the Pages build has not finished                                    |
| Data missing after some days             | Used in a Safari tab and not installed, or storage was cleared. Restore from the last export |
| Import fails                             | The file is not valid JSON for this schema version. The app should show which check failed   |

## Verified sources

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages
- WebKit storage policy: https://webkit.org/blog/14403/updates-to-storage-policy/
- Apple, configuring web apps: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html

## Not verified

- Whether `navigator.storage.persist()` actually grants persistence on iOS Safari. The app will call it, but the export backup is the safeguard.
- Whether `navigator.share({files})` is reliable for JSON on your iOS version. The app falls back to a normal download if sharing fails. Test this early.
- Launching the installed app in airplane mode on a real iPhone. It works in desktop Chrome with the server stopped.
- Any access control for Pages on GitHub Enterprise. Not relevant for a personal account.
