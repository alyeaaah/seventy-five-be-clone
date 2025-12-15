# Cursor AI Setup untuk Code Review

## File Konfigurasi

### 1. `.cursor/cli.json`

File konfigurasi untuk cursor-agent dengan permissions yang diperlukan untuk code review.

**Struktur:**

```json
{
  "permissions": {
    "allow": [
      "Read(**/*)",
      "Shell(gh pr view)",
      "Shell(gh pr diff)",
      "Shell(gh pr review)",
      "Shell(gh api)"
    ],
    "deny": ["Shell(git push)", "Shell(gh pr create)", "Write(**)"]
  }
}
```

**Penjelasan:**

- `permissions.allow`: Array permission yang diizinkan untuk cursor-agent (REQUIRED)

  - `Read(**/*)`: Baca semua file di repository
  - `Shell(gh pr view)`: Gunakan GitHub CLI untuk melihat PR
  - `Shell(gh pr diff)`: Gunakan GitHub CLI untuk melihat diff
  - `Shell(gh pr review)`: Gunakan GitHub CLI untuk membuat review comments
  - `Shell(gh api)`: Gunakan GitHub API

- `permissions.deny`: Array permission yang dilarang untuk cursor-agent (REQUIRED)
  - `Shell(git push)`: Mencegah push ke repository
  - `Shell(gh pr create)`: Mencegah membuat PR baru
  - `Write(**)`: Mencegah write operations

**Catatan Penting:**

- Key `rules` **TIDAK didukung** oleh cursor-agent CLI schema dan akan menyebabkan error
- File `.cursorrules` akan otomatis digunakan jika ada di root repository, tidak perlu konfigurasi tambahan

### 2. `.cursorrules`

File berisi guidelines dan best practices untuk code review. Lihat file ini untuk detail lengkap.

### 3. `.github/workflows/cursor-code-review.yml`

GitHub Actions workflow untuk menjalankan automated code review.

## Troubleshooting

### Error: "Required permissions.allow" atau "Required permissions.deny"

**Penyebab:** File `.cursor/cli.json` tidak ada atau `permissions.allow`/`permissions.deny` tidak terdefinisi.

**Solusi:**

1. Pastikan file `.cursor/cli.json` ada di root repository
2. Pastikan `permissions.allow` adalah array (REQUIRED)
3. Pastikan `permissions.deny` adalah array (REQUIRED)
4. Validasi JSON dengan: `cat .cursor/cli.json | python3 -m json.tool`

### Error: "Unrecognized key(s): 'rules'"

**Penyebab:** Key `rules` tidak didukung oleh cursor-agent CLI schema.

**Solusi:**

1. Hapus key `rules` dari `.cursor/cli.json`
2. File `.cursorrules` akan otomatis digunakan jika ada di root repository
3. Tidak perlu konfigurasi tambahan untuk menggunakan `.cursorrules`

### Error: "ConnectError: [resource_exhausted] Error"

**Penyebab:** API rate limit tercapai, model quota habis, atau model sedang overloaded.

**Solusi:**

1. **Retry Logic**: Workflow sudah include retry dengan exponential backoff (3 attempts)
2. **Fallback Model**: Workflow akan otomatis switch ke fallback model jika primary model gagal
3. **Check API Key**: Pastikan `CURSOR_API_KEY` valid dan memiliki quota yang cukup
4. **Wait and Retry**: Jika error terjadi, tunggu beberapa menit dan trigger workflow lagi
5. **Use Different Model**: Ganti model di workflow dengan model yang kurang populer:
   - `sonnet-4.5` (recommended fallback)
   - `opus-4.1` (alternative)
   - `auto` (let Cursor choose)

**Workflow sudah include:**

- ✅ Automatic retry (3 attempts dengan exponential backoff)
- ✅ Fallback model switching
- ✅ Better error messages

### Error: "Invalid project config"

**Penyebab:** Format JSON tidak valid atau struktur tidak sesuai.

**Solusi:**

1. Validasi JSON syntax
2. Pastikan semua field required ada (`permissions.allow` dan `permissions.deny`)
3. Pastikan tidak ada key yang tidak didukung (seperti `rules`)
4. Check dokumentasi cursor-agent untuk format yang benar

### Error: "Cannot use this model: [model-name]"

**Penyebab:** Model yang digunakan tidak tersedia atau tidak valid.

**Solusi:**

1. Ganti model di workflow file dengan salah satu model yang tersedia:

   - `gpt-5.2` (recommended - latest and best for code review)
   - `gpt-5.1` (alternative)
   - `sonnet-4.5` (Claude Sonnet - good for code review)
   - `opus-4.5` (Claude Opus - high quality)
   - `auto` (let Cursor choose automatically)
   - `composer-1` (Claude Composer)
   - `gemini-3-pro` (Google Gemini)
   - `gpt-5.1-codex` (specialized for code)
   - `gpt-5.1-codex-max` (best code understanding)

2. **Available models list:**

   ```
   composer-1, auto, sonnet-4.5, sonnet-4.5-thinking, opus-4.5,
   opus-4.5-thinking, gemini-3-pro, gpt-5.2, gpt-5.1, gpt-5.2-high,
   gpt-5.1-high, gpt-5.1-codex, gpt-5.1-codex-high, gpt-5.1-codex-max,
   gpt-5.1-codex-max-high, opus-4.1, grok
   ```

3. Pastikan CURSOR_API_KEY valid dan memiliki akses ke model tersebut
4. Check model availability dengan menjalankan: `cursor-agent --list-models` (if available)

## Setup GitHub Secrets

Pastikan secret berikut sudah di-set di GitHub repository:

1. **CURSOR_API_KEY**: API key dari Cursor untuk akses cursor-agent
   - Dapatkan dari: https://cursor.com/settings/api
   - Set di: Repository Settings → Secrets and variables → Actions

## Testing Workflow

Untuk test workflow:

1. Buat pull request
2. Workflow akan otomatis trigger pada:

   - PR opened
   - PR synchronized (new commits)
   - PR reopened
   - PR ready for review

3. Check Actions tab untuk melihat hasil review

## Manual Testing

Untuk test cursor-agent secara manual:

```bash
# Install cursor CLI
curl https://cursor.com/install -fsS | bash

# Set environment variables
export CURSOR_API_KEY="your-api-key"
export GH_TOKEN="your-github-token"

# Run cursor-agent
cursor-agent --force --model "gpt-5.2" --output-format=text --print "Review this code"
```

## Best Practices

1. **Keep `.cursor/cli.json` minimal**: Hanya include permissions yang benar-benar diperlukan
2. **Update `.cursorrules`**: Sesuaikan dengan project requirements
3. **Monitor workflow runs**: Check Actions tab untuk melihat apakah review berjalan dengan baik
4. **Review comments**: Cursor AI akan memberikan comments yang actionable dan specific

## References

- [Cursor Agent Documentation](https://docs.cursor.com/en/cli)
- [Cursor Code Review Cookbook](https://docs.cursor.com/en/cli/cookbook/code-review)
- `.cursorrules` - Project-specific code review rules
- `CODE_REVIEW_GUIDE.md` - Guide lengkap untuk code review
