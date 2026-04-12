# Curation Backend — Local Setup

## CURATION_DEPLOY_KEY

Shared secret used by the Python seed pipeline to authenticate to Convex admin ingest endpoints (`POST /admin/curation/routes`, `POST /admin/curation/enrichments`).

### Purpose

The `CURATION_DEPLOY_KEY` environment variable is used to authenticate requests from the Python seed pipeline to the Convex backend's admin endpoints. This shared secret ensures that only authorized pipeline runs can populate the curation database with routes and enrichments.

### Generation

Generate a 32-byte (64 hex character) random key:

```bash
openssl rand -hex 32
```

**Security Note**: Never commit the plaintext key value to version control. Never log the value. Never paste it into task files, commit messages, or PR descriptions.

### Installation

1. **Set in Convex deployment**:
   ```bash
   npx convex env set CURATION_DEPLOY_KEY <generated-value>
   ```

   If you get a "No CONVEX_DEPLOYMENT set" error, first configure your Convex deployment:
   ```bash
   npx convex dev
   ```
   Follow the interactive prompts to select or create your Convex project.

2. **Verify the key was set**:
   ```bash
   npx convex env list | grep CURATION_DEPLOY_KEY
   ```

3. **Mirror to local environment**:
   Append the key to your repo-root `.env.local` file (gitignored):
   ```bash
   echo "CURATION_DEPLOY_KEY=<generated-value>" >> .env.local
   ```

   The Python pipeline reads this variable from the environment when running locally.

### Verification Checklist

After installation, verify all of the following:

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Convex env var set | `npx convex env list \| grep CURATION_DEPLOY_KEY` | Exit 0, key appears in list |
| Local mirror present | `grep -E '^CURATION_DEPLOY_KEY=[0-9a-f]{64,}$' .env.local` | Exit 0, line present with 64+ hex chars |
| Gitignore protection | `grep -E '\.env\.local' .gitignore` | Exit 0, .env.local is excluded |
| No plaintext committed | `git grep -nE '[0-9a-f]{64}'` | No matches (key never in git history) |

### Rotation Procedure

To rotate the deploy key (e.g., after a suspected leak or on a security schedule):

1. **Generate a new key**:
   ```bash
   openssl rand -hex 32
   ```

2. **Update Convex deployment**:
   ```bash
   npx convex env set CURATION_DEPLOY_KEY <new-value>
   ```

3. **Update local environment**:
   Edit `.env.local` and replace the old `CURATION_DEPLOY_KEY` value with the new one.

4. **Redeploy pipeline workers**:
   Restart any Python pipeline workers or services that use the old key.

5. **Verify**:
   Run the verification checklist above to confirm the new key is active.

6. **Invalidate old key**:
   After confirming the new key works, the old key is automatically invalidated (Convex will reject requests signed with the previous value).

### Security Best Practices

- **Never commit** the plaintext key value to any tracked file
- **Never log** the key value in terminal output, logs, or monitoring systems
- **Never paste** the key into task files, commit messages, PR descriptions, or chat
- **Rotate immediately** if you suspect the key has been compromised
- **Use different keys** for development, staging, and production deployments
- **Restrict access** to `.env.local` file permissions (chmod 600)

### Troubleshooting

#### "No CONVEX_DEPLOYMENT set" error

This means you haven't configured your Convex deployment yet. Run:
```bash
npx convex dev
```

Follow the interactive prompts to select your Convex project and deployment (dev or prod).

#### Key not appearing in `npx convex env list`

1. Ensure you ran `npx convex env set` with the correct syntax
2. Check you're setting the key on the right deployment (add `--prod` flag for production)
3. Verify you're authenticated to the correct Convex team

#### Python pipeline can't read the key

1. Confirm `.env.local` exists in the repo root
2. Verify the file contains `CURATION_DEPLOY_KEY=<value>` (no spaces around `=`)
3. Check that your Python environment loads `.env.local` (e.g., using `python-dotenv`)
4. Ensure the key value matches what's set in Convex (copy-paste carefully)

### Variable Name Note

The canonical variable name is `CURATION_DEPLOY_KEY`. Some documentation may refer to this as `CURATION_INGEST_KEY`, but `CURATION_DEPLOY_KEY` is the standardized name used across:
- Convex environment variables
- Python pipeline configuration
- HTTP handler authentication (`convex/http.ts`)
- This setup documentation

### Related Documentation

- **CONVEX-003**: Admin ingest endpoints that use this key for authentication
- **CONVEX-008**: This task — provisioning and documenting the deploy key
- **Python pipeline**: Seed pipeline scripts that authenticate using this key
- **Convex CLI**: `npx convex env --help` for environment variable management
