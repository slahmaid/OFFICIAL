# Compresses LCP hero / home JPEGs in place (backs up originals as *.orig.jpeg).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

function Save-JpegScaled {
    param(
        [string]$SourcePath,
        [int]$MaxWidth,
        [int]$Quality = 82,
        [string]$DestPath = $SourcePath
    )
    $img = [System.Drawing.Image]::FromFile($SourcePath)
    try {
        $scale = 1.0
        if ($img.Width -gt $MaxWidth) { $scale = $MaxWidth / [double]$img.Width }
        $w = [int][Math]::Max(1, [Math]::Round($img.Width * $scale))
        $h = [int][Math]::Max(1, [Math]::Round($img.Height * $scale))
        $bmp = New-Object System.Drawing.Bitmap $w, $h
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        try {
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.DrawImage($img, 0, 0, $w, $h)
        } finally { $g.Dispose() }
        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $enc = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $enc.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $Quality
        $bmp.Save($DestPath, $codec, $enc)
    } finally {
        $img.Dispose()
    }
}

function Optimize-Hero {
    param([string]$Path, [int]$DesktopMax = 1200, [int]$MobileMax = 768)
    if (-not (Test-Path $Path)) { return }
    $dir = Split-Path $Path -Parent
    $name = [System.IO.Path]::GetFileNameWithoutExtension($Path)
    $ext = [System.IO.Path]::GetExtension($Path)
    $backup = Join-Path $dir ($name + '.orig' + $ext)
    if (-not (Test-Path $backup)) { Copy-Item $Path $backup -Force }
    Save-JpegScaled -SourcePath $backup -MaxWidth $DesktopMax -Quality 82 -DestPath $Path
    $mobilePath = Join-Path $dir ($name + '-mobile' + $ext)
    if ($name -notmatch '-mobile$') {
        Save-JpegScaled -SourcePath $backup -MaxWidth $MobileMax -Quality 80 -DestPath $mobilePath
    }
}

$root = $PSScriptRoot
@(
    (Join-Path $root 'moka\images\Moka-hero.jpeg'),
    (Join-Path $root 'moka-pro-max\images\Hero.jpeg'),
    (Join-Path $root 'moka-pro-max\images\Hero-mobile.jpeg'),
    (Join-Path $root 'saqr\images\Saqr.jpeg'),
    (Join-Path $root 'images\Home-Moka.jpeg'),
    (Join-Path $root 'images\Home-Moka-Pro-Max.jpeg')
) | ForEach-Object {
    if (Test-Path $_) {
        if ($_ -match 'Hero-mobile|Home-') {
            Optimize-Hero -Path $_ -DesktopMax 768 -MobileMax 768
        } else {
            Optimize-Hero -Path $_
        }
        Write-Host "Optimized $_"
    }
}
