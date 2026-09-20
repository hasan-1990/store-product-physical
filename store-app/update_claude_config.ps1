$proj='D:/hasan/79/site/store-app'
$file='C:\Users\hasan\.claude.json'
$json = Get-Content $file -Raw | ConvertFrom-Json
$json.projects.'D:/hasan/79/site/store-app'.enabledMcpjsonServers = @('filesystem','memory','taskmaster-ai','git','task','scope','claude')
$json.projects.'D:/hasan/79/site/store-app'.mcpServers = @{}
$json | ConvertTo-Json -Depth 20 | Set-Content $file -Encoding UTF8
Write-Output 'updated'