$response = Invoke-RestMethod -Uri "http://localhost:5000/api/tts/generate" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"text":"Testing text to audio generator","voice":"en-US-JennyNeural"}'
$jobId = $response.jobId
Write-Host "Created Job: $jobId"

$status = "pending"
while ($status -ne "completed" -and $status -ne "failed") {
    Start-Sleep -Seconds 2
    $job = Invoke-RestMethod -Uri "http://localhost:5000/api/tts/jobs/$jobId"
    $status = $job.status
    Write-Host "Status: $status"
}

if ($status -eq "completed") {
    Invoke-WebRequest -Uri "http://localhost:5000/api/tts/jobs/$jobId/download" -OutFile "test_audio_result.mp3"
    $fileInfo = Get-Item "test_audio_result.mp3"
    Write-Host "Audio file downloaded successfully. Size: $($fileInfo.Length) bytes"
} else {
    Write-Host "Job failed!"
    $job | ConvertTo-Json
}
