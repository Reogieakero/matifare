# Replaces the "FARE CALCULATOR" panel lettering on the mascot with the
# Tripede wordmark, producing a brand-safe derivative. The original artwork
# is never modified.
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$images = Join-Path $root 'assets/images'
$source = Join-Path $images 'Fare Calculator Tricycle Mascot.png'
$target = Join-Path $images 'mascot.png'

$image = [System.Drawing.Bitmap]::FromFile($source)
$graphics = [System.Drawing.Graphics]::FromImage($image)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Cover the baked-in "FARE CALCULATOR" lettering with a matching panel wash.
$panel = New-Object System.Drawing.RectangleF(438, 692, 354, 180)
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$path.AddArc($panel.X, $panel.Y, 56, 56, 180, 90)
$path.AddArc($panel.Right - 56, $panel.Y, 56, 56, 270, 90)
$path.AddArc($panel.Right - 56, $panel.Bottom - 56, 56, 56, 0, 90)
$path.AddArc($panel.X, $panel.Bottom - 56, 56, 56, 90, 90)
$path.CloseFigure()

$gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $panel,
  [System.Drawing.Color]::FromArgb(255, 255, 220, 26),
  [System.Drawing.Color]::FromArgb(255, 255, 196, 0),
  90.0
)
$graphics.FillPath($gradient, $path)
$gradient.Dispose()
$path.Dispose()

# Wordmark that fits the yellow side panel.
$family = New-Object System.Drawing.FontFamily('Arial Black')
$fontSize = 90
$fontStyle = [System.Drawing.FontStyle]::Bold -bor [System.Drawing.FontStyle]::Italic
$font = New-Object System.Drawing.Font($family, $fontSize, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
$text = 'TRIPEDE'
$maxWidth = 306
while ($graphics.MeasureString($text, $font).Width -gt $maxWidth -and $fontSize -gt 40) {
  $font.Dispose()
  $fontSize -= 4
  $font = New-Object System.Drawing.Font($family, $fontSize, $fontStyle, [System.Drawing.GraphicsUnit]::Pixel)
}

$size = $graphics.MeasureString($text, $font)
$centerX = 438 + 354 / 2
$baselineY = 704 + 96 - $size.Height / 2
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 23, 67, 166))
$graphics.DrawString($text, $font, $textBrush, $centerX - $size.Width / 2, $baselineY)

# Rewards-style underline.
$underline = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 23, 67, 166))
$graphics.FillRectangle($underline, [int]$centerX - 112, [int]($baselineY + $size.Height + 4), 224, 10)

$underline.Dispose()
$textBrush.Dispose()
$font.Dispose()
$family.Dispose()
$graphics.Dispose()

# Downscale for app/web delivery while keeping the transparent canvas.
$targetWidth = 1024
$targetHeight = [int]($image.Height * $targetWidth / $image.Width)
$resized = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$resizeGraphics = [System.Drawing.Graphics]::FromImage($resized)
$resizeGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$resizeGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$resizeGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$resizeGraphics.DrawImage($image, 0, 0, $targetWidth, $targetHeight)
$resizeGraphics.Dispose()

$resized.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
$resized.Dispose()
$image.Dispose()
Write-Host "wrote $target"
