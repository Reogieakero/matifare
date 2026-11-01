# Generates Tripede app icons from the tricycle mascot.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/generate-brand-assets.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$images = Join-Path $root 'assets/images'
$mascotPath = Join-Path $images 'mascot.png'
New-Item -ItemType Directory -Force -Path $images | Out-Null

if (-not (Test-Path $mascotPath)) {
  throw "Missing mascot asset at $mascotPath. Add the transparent tricycle mascot first."
}

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Canvas([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  return @($bmp, $g)
}

function Fill-IconBackground($g, [float]$size) {
  $rect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(255, 234, 242, 255),
    55.0
  )
  $g.FillRectangle($brush, $rect)
  $brush.Dispose()
}

function Draw-Mascot($g, $mascot, [float]$x, [float]$y, [float]$w, [float]$h) {
  $g.DrawImage($mascot, $x, $y, $w, $h)
}

function Draw-RouteGlyph($g, [float]$scale, [float]$offsetX, [float]$offsetY) {
  $color = [System.Drawing.Color]::White
  $pen = New-Object System.Drawing.Pen($color, (58 * $scale))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddBezier(
    ($offsetX + 336 * $scale), ($offsetY + 690 * $scale),
    ($offsetX + 336 * $scale), ($offsetY + 468 * $scale),
    ($offsetX + 696 * $scale), ($offsetY + 528 * $scale),
    ($offsetX + 696 * $scale), ($offsetY + 330 * $scale)
  )
  $g.DrawPath($pen, $path)
  $path.Dispose()

  $dotBrush = New-Object System.Drawing.SolidBrush($color)
  $startDot = 104 * $scale
  $endDot = 132 * $scale
  $g.FillEllipse($dotBrush, ($offsetX + 336 * $scale - $startDot / 2), ($offsetY + 690 * $scale - $startDot / 2), $startDot, $startDot)
  $g.FillEllipse($dotBrush, ($offsetX + 696 * $scale - $endDot / 2), ($offsetY + 330 * $scale - $endDot / 2), $endDot, $endDot)

  $pen.Dispose()
  $dotBrush.Dispose()
}

function Save-Png($bmp, [string]$name) {
  $path = Join-Path $images $name
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "wrote $path"
}

$mascot = [System.Drawing.Image]::FromFile($mascotPath)

# --- Full app icon: white background + mascot ---
$size = 1024
$c = New-Canvas $size
$bmp = $c[0]; $g = $c[1]
Fill-IconBackground $g $size
$haloBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 37, 99, 235))
$g.FillEllipse($haloBrush, 92, 142, 840, 840)
$haloBrush.Dispose()
$iconW = 970
$iconH = [int]($iconW * $mascot.Height / $mascot.Width)
Draw-Mascot $g $mascot ([int](($size - $iconW) / 2)) ([int](($size - $iconH) / 2)) $iconW $iconH
Save-Png $bmp 'icon.png'
$g.Dispose(); $bmp.Dispose()

# --- Splash / in-app mark: rounded white tile + mascot ---
$size = 1024
$c = New-Canvas $size
$bmp = $c[0]; $g = $c[1]
$inset = 24
$radius = 232
$path = New-RoundedRectPath $inset $inset ($size - 2 * $inset) ($size - 2 * $inset) $radius
$g.SetClip($path)
Fill-IconBackground $g $size
$g.ResetClip()
$markW = 900
$markH = [int]($markW * $mascot.Height / $mascot.Width)
Draw-Mascot $g $mascot ([int](($size - $markW) / 2)) ([int](($size - $markH) / 2)) $markW $markH
Save-Png $bmp 'brand-mark.png'
$g.Dispose(); $bmp.Dispose()

# --- Android adaptive background ---
$size = 1024
$c = New-Canvas $size
$bmp = $c[0]; $g = $c[1]
Fill-IconBackground $g $size
Save-Png $bmp 'android-icon-background.png'
$g.Dispose(); $bmp.Dispose()

# --- Android adaptive foreground: mascot inside the 66% safe zone ---
$size = 1024
$c = New-Canvas $size
$bmp = $c[0]; $g = $c[1]
$fgW = 690
$fgH = [int]($fgW * $mascot.Height / $mascot.Width)
Draw-Mascot $g $mascot ([int](($size - $fgW) / 2)) ([int](($size - $fgH) / 2)) $fgW $fgH
Save-Png $bmp 'android-icon-foreground.png'
$g.Dispose(); $bmp.Dispose()

# --- Android themed monochrome: clean route glyph ---
$size = 1024
$c = New-Canvas $size
$bmp = $c[0]; $g = $c[1]
Draw-RouteGlyph $g 0.62 175 190
Save-Png $bmp 'android-icon-monochrome.png'
$g.Dispose(); $bmp.Dispose()

# --- Web favicon ---
$size = 256
$c = New-Canvas $size
$bmp = $c[0]; $g = $c[1]
$path = New-RoundedRectPath 0 0 $size $size 56
$g.SetClip($path)
Fill-IconBackground $g $size
$g.ResetClip()
$favW = 240
$favH = [int]($favW * $mascot.Height / $mascot.Width)
Draw-Mascot $g $mascot ([int](($size - $favW) / 2)) ([int](($size - $favH) / 2)) $favW $favH
Save-Png $bmp 'favicon.png'
$g.Dispose(); $bmp.Dispose()

$mascot.Dispose()

# --- Native splash mark (same as brand mark) ---
Copy-Item (Join-Path $images 'brand-mark.png') (Join-Path $images 'splash-icon.png') -Force
Write-Host 'Tripede brand assets generated.'
