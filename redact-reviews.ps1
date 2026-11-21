$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$source = 'C:\Users\llm\Downloads\Telegram Desktop\отзывы'
$originals = Join-Path $PSScriptRoot 'media\reviews-original'
$public = Join-Path $PSScriptRoot 'media\reviews'
New-Item -ItemType Directory -Force -Path $originals,$public | Out-Null
Get-ChildItem -LiteralPath $source -File | Copy-Item -Destination $originals -Force

$reviews = @(
    @{ File='photo_2026-11-17_09-24-17.jpg'; Slug='review-01'; Avatar=@(34,103,124,124); Name=@(168,100,430,72) },
    @{ File='photo_2026-11-17_09-24-19.jpg'; Slug='review-02'; Avatar=@(30,77,126,126); Name=@(166,78,390,72) },
    @{ File='photo_2026-11-17_09-24-20.jpg'; Slug='review-03'; Avatar=@(20,103,125,125); Name=@(157,104,350,66) },
    @{ File='photo_2026-11-17_09-24-22.jpg'; Slug='review-04'; Avatar=@(32,91,126,126); Name=@(168,88,350,66) },
    @{ File='photo_2026-11-17_09-24-23 (2).jpg'; Slug='review-05'; Avatar=@(12,94,126,126); Name=@(148,92,480,76) },
    @{ File='photo_2026-11-17_09-24-23.jpg'; Slug='review-06'; Avatar=@(25,94,126,126); Name=@(164,94,345,66) },
    @{ File='photo_2026-11-17_09-24-24.jpg'; Slug='review-07'; Avatar=@(30,96,126,126); Name=@(168,94,370,58) },
    @{ File='photo_2026-11-17_09-24-25.jpg'; Slug='review-08'; Avatar=@(18,99,126,126); Name=@(154,96,220,66) }
)

$mask = [System.Drawing.Color]::FromArgb(255,244,242,235)
foreach ($review in $reviews) {
    $input = Join-Path $source $review.File
    $bitmap = [System.Drawing.Bitmap]::FromFile($input)
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
            $brush = [System.Drawing.SolidBrush]::new($mask)
            try {
                $graphics.FillEllipse($brush, $review.Avatar[0], $review.Avatar[1], $review.Avatar[2], $review.Avatar[3])
                $graphics.FillRectangle($brush, $review.Name[0], $review.Name[1], $review.Name[2], $review.Name[3])
            } finally {
                $brush.Dispose()
            }
        } finally {
            $graphics.Dispose()
        }
        $output = Join-Path $public ($review.Slug + '.png')
        $bitmap.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $bitmap.Dispose()
    }
}

Write-Output "Prepared $($reviews.Count) anonymized review images."
