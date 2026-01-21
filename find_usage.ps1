
$files = Get-ChildItem -Path "app", "components", "hooks", "lib" -Recurse -Include "*.tsx", "*.ts"

foreach ($file in $files) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    
    if ($content -match "supabase[\.\,\)\s]") {
        if ($content -notmatch "import .*supabase.*") {
            if ($content -notmatch "const supabase =") {
                Write-Output "MISSING_IMPORT: $($file.FullName)"
            }
        }
    }
}
