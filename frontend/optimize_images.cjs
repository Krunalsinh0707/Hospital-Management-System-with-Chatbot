const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Powershell script to safely scale images down to 960px width
const psScript = `
Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -Recurse 'src/assets/healthcare' -Filter '*.jpg'
foreach ($f in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($f.FullName)
        if ($img.Width -gt 960) {
            $ratio = 960.0 / $img.Width
            $newW = 960
            $newH = [int]($img.Height * $ratio)
            $bmp = New-Object System.Drawing.Bitmap($newW, $newH)
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.DrawImage($img, 0, 0, $newW, $newH)
            $img.Dispose()
            $g.Dispose()
            $bmp.Save($f.FullName + '.tmp', [System.Drawing.Imaging.ImageFormat]::Jpeg)
            $bmp.Dispose()
            Remove-Item $f.FullName -Force
            Rename-Item ($f.FullName + '.tmp') $f.Name -Force
            Write-Host ("Optimized: " + $f.Name)
        } else {
            $img.Dispose()
        }
    } catch {
        Write-Host ("Error processing " + $f.Name)
    }
}
`;

fs.writeFileSync(path.join(__dirname, 'opt.ps1'), psScript);
console.log('Running image optimizer script...');
execSync('powershell -ExecutionPolicy Bypass -File opt.ps1', { stdio: 'inherit', cwd: __dirname });
fs.unlinkSync(path.join(__dirname, 'opt.ps1'));
console.log('Optimization complete!');
