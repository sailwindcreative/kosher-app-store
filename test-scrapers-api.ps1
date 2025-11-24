# Test the scrapers via API
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TESTING APK SCRAPERS" -ForegroundColor Green  
Write-Host "========================================`n" -ForegroundColor Cyan

# Wait for backend
Write-Host "Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test with existing WhatsApp app
$appId = "260fcf4d-9761-47f1-80b6-4b1d32cd081a"

Write-Host "`nTesting scrapers for WhatsApp (com.whatsapp)..." -ForegroundColor Cyan
Write-Host "This may take 20-30 seconds...`n" -ForegroundColor Yellow

try {
    $result = Invoke-RestMethod `
        -Uri "http://localhost:3000/api/admin/apps/$appId/test-fetch" `
        -Method POST `
        -Body "{}" `
        -ContentType "application/json" `
        -TimeoutSec 60
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  RESULTS" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    foreach ($r in $result.results) {
        $statusColor = if ($r.status -eq 'success') { 'Green' } 
                      elseif ($r.status -eq 'info') { 'Yellow' } 
                      else { 'Red' }
        
        Write-Host "$($r.source_name):" -ForegroundColor White
        Write-Host "  Status: $($r.status)" -ForegroundColor $statusColor
        
        if ($r.message) {
            Write-Host "  Message: $($r.message)" -ForegroundColor White
        }
        
        if ($r.error) {
            Write-Host "  Error: $($r.error)" -ForegroundColor Red
        }
        
        if ($r.url) {
            $urlPreview = if ($r.url.Length -gt 60) { $r.url.Substring(0, 60) + "..." } else { $r.url }
            Write-Host "  URL: $urlPreview" -ForegroundColor Cyan
        } else {
            Write-Host "  URL: Not found" -ForegroundColor Red
        }
        
        Write-Host ""
    }
    
    Write-Host "========================================`n" -ForegroundColor Cyan
    
} catch {
    Write-Host "`nERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "`nNOTE: Check the backend console for detailed logs" -ForegroundColor Yellow
Write-Host "Look for messages like:" -ForegroundColor Cyan
Write-Host "  - 'APKMirror: Searching for com.whatsapp...'" -ForegroundColor White
Write-Host "  - 'APKPure: Getting download URL...'" -ForegroundColor White
Write-Host ""

