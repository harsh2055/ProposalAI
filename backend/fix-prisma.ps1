Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Fixing Prisma - removing v7, using v5" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nStep 1: Removing node_modules..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "Step 2: Installing with exact Prisma 5.22.0..." -ForegroundColor Yellow
npm install

Write-Host "Step 3: Generating Prisma client (v5)..." -ForegroundColor Yellow
npx prisma@5.22.0 generate

Write-Host "Step 4: Pushing schema to database..." -ForegroundColor Yellow
npx prisma@5.22.0 db push

Write-Host "`n✓ Done! Starting server..." -ForegroundColor Green
npm run dev
