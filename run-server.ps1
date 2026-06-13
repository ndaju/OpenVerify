$envFile = "C:\Users\Bilgisayarım\Desktop\OpenVerify\openverify\.env"
Get-Content $envFile | ForEach-Object {
  if ($_ -match "^(.*?)=(.*)$") {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    Set-Item -Path "env:$name" -Value $value
  }
}
Set-Location "C:\Users\Bilgisayarım\Desktop\OpenVerify\openverify"
pnpm --filter @openverify/server dev
