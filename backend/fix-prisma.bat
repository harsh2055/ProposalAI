@echo off
echo ========================================
echo  Fixing Prisma - removing v7, using v5
echo ========================================

echo Removing node_modules...
rmdir /s /q node_modules

echo Installing with exact Prisma v5.22.0...
npm install

echo Running db:generate with pinned version...
npx prisma@5.22.0 generate

echo Done! Now run: npm run db:push
echo Then run: npm run dev
pause
