
$files = Get-ChildItem -Path "app", "components", "lib", "hooks", "contexts" -Recurse -Include "*.tsx", "*.ts"

foreach ($file in $files) {
    if ($file.FullName -like "*node_modules*") { continue }
    
    $content = Get-Content $file.FullName -Raw
    
    # Check if 'supabase' is used (as a variable/identifier, not just in string/"import")
    # We look for 'supabase.' or 'supabase)' or 'supabase,' or ' supabase' 
    if ($content -match "supabase[\.\,\)\s]") {
        
        # Check if imported
        if ($content -notmatch "import .*supabase.* from") {
             # Exclude definition files like client.ts where 'export const supabase =' exists
             if ($content -notmatch "const supabase =") {
                 Write-Host "Possible missing import in: $($file.FullName)"
             }
        }
    }
}
