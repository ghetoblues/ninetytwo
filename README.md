# NinetyTwo MVP

## Run locally

1) Install dependencies:

```
npm install
```

2) Start server:

```
npm run dev
```

3) Configure `.env`:

```
ADMIN_LOGIN=admin
ADMIN_PASSWORD=admin
DATABASE_URL=postgres://user:pass@localhost:5432/ninetytwo
DATABASE_SSL=false
```

4) Open:
- Home: `http://localhost:3000/`
- Login: `http://localhost:3000/login`
- Admin: `http://localhost:3000/admin`
- Order page: `http://localhost:3000/orders/polako_fc`

## Notes
- Use `DATABASE_SSL=true` on Heroku.
- Change prices in the admin form per order.
