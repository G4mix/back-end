$inputPath = "./template.html"
$outputPath = "./output.html"

$content = Get-Content $inputPath -Raw -Encoding UTF8

$oneLineContent = $content -replace '\r?\n', '' -replace '\s{2,}', ' '

Add-Type -AssemblyName System.Web

$escapedContent = [System.Web.HttpUtility]::JavaScriptStringEncode($oneLineContent)

$jsonString = '"' + $escapedContent + '"'

[System.IO.File]::WriteAllText($outputPath, $jsonString, [System.Text.Encoding]::UTF8)

Write-Host "Arquivo convertido com sucesso para uma única linha no formato de string JSON!"
