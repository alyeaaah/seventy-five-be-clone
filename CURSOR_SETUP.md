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

### Error: "Invalid project config"

**Penyebab:** Format JSON tidak valid atau struktur tidak sesuai.

**Solusi:**

1. Validasi JSON syntax
2. Pastikan semua field required ada (`permissions.allow` dan `permissions.deny`)
3. Pastikan tidak ada key yang tidak didukung (seperti `rules`)
4. Check dokumentasi cursor-agent untuk format yang benar

### Error: "Model not found"

**Penyebab:** Model yang digunakan tidak tersedia atau tidak valid.

**Solusi:**

1. Ganti model di workflow file:
   - `gpt-4-turbo` (recommended)
   - `gpt-4`
   - `gpt-3.5-turbo`
2. Pastikan CURSOR_API_KEY valid dan memiliki akses ke model tersebut

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
cursor-agent --force --model "gpt-4-turbo" --output-format=text --print "Review this code"
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
