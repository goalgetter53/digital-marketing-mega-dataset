Add-Type -AssemblyName System.Drawing

$printerName = "LABEL"

function Print-TestLabel {
    param($PaperName, $WidthInch, $HeightInch)

    $pd = New-Object System.Drawing.Printing.PrintDocument
    $pd.PrinterSettings.PrinterName = $printerName

    $foundSize = $false
    foreach ($ps in $pd.PrinterSettings.PaperSizes) {
        if ($ps.PaperName -eq $PaperName) {
            $pd.DefaultPageSettings.PaperSize = $ps
            $foundSize = $true
            break
        }
    }

    if (-not $foundSize -and $WidthInch -gt 0) {
        $customSize = New-Object System.Drawing.Printing.PaperSize("Custom", $WidthInch, $HeightInch)
        $customSize.RawKind = 0
        $pd.DefaultPageSettings.PaperSize = $customSize
        $PaperName = "Custom ${WidthInch}x${HeightInch}"
    }

    Register-ObjectEvent -InputObject $pd -EventName PrintPage -Action {
        $e = $event.MessageData
        $e.Graphics.PageUnit = [System.Drawing.GraphicsUnit]::Display

        $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 2)
        $e.Graphics.DrawRectangle($pen, 10, 10, $e.PageBounds.Width - 20, $e.PageBounds.Height - 20)

        $font = New-Object System.Drawing.Font("Arial", 10, [System.Drawing.FontStyle]::Bold)
        $sf = New-Object System.Drawing.StringFormat
        $sf.Alignment = [System.Drawing.StringAlignment]::Center
        $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

        $e.Graphics.DrawString($PaperName, $font, [System.Drawing.Brushes]::Black, $e.PageBounds.Width/2, $e.PageBounds.Height/2, $sf)

        $smallFont = New-Object System.Drawing.Font("Arial", 7)
        $e.Graphics.DrawString("TEST LABEL", $smallFont, [System.Drawing.Brushes]::Black, $e.PageBounds.Width/2, $e.PageBounds.Height/2 + 30, $sf)

        $e.HasMorePages = $false
    } -MessageData $null | Out-Null

    $pd.Print()
    Start-Sleep -Seconds 1
}

Print-TestLabel -PaperName "50mm x 30mm"
Write-Host "50x30mm label sent to printer"
