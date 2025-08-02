## Commands

```sh
bin/yarn clean                # Removes built files from "lib/".
bin/yarn format:check         # Checks formatting.
bin/yarn format               # Fixes formatting (with Prettier).
bin/yarn version --prerelease # (Or similar): Bumps version number.
bin/yarn compile              # Typecheck only.
bin/yarn build                # Generates "lib/main.mjs".
```

## Publishing releases

```
bin/yarn build
git push --follow-tags origin next
bin/yarn publish
```
