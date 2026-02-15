# LifeOS Project Instructions

## Database
- **DB**: Turso (libSQL/SQLite) + Prisma ORM
- **Docs**: https://docs.turso.tech/introduction
- DB 관련 작업 시 Turso 문서를 참조하여 구현할 것
- Prisma schema: `prisma/schema.prisma` (provider: sqlite)
- DB 연결: `src/lib/db.ts` (PrismaLibSql 어댑터 사용)
- `prisma db push` 불가 → SQL 직접 생성 후 libsql client로 적용
- 환경변수: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
