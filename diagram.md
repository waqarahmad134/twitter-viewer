flowchart LR
User["Public user"] --> NextPublic["Next.js Blog Pages (SSR)"]
NextPublic -->|"fetch"| ExpressPublic["Express /api/blog/*"]
ExpressPublic --> MySQL["MySQL (twitter)"]

Admin["Admin user"] --> NextAdmin["Next.js Admin UI"]
NextAdmin -->|"login + CRUD"| ExpressAdmin["Express /api/admin/*"]
ExpressAdmin --> MySQL
NextPublic --> SEO["Head: title/description/OG/canonical + JSON-LD"]
NextPublic --> Sitemap["/sitemap.xml + /robots.txt"]
