# Server structure

The project uses a small MVC variant that matches Next.js App Router:

- `src/app/api/**/route.ts` — **controllers**. They validate request input, call one service, and return an HTTP response.
- `src/server/modules/<feature>` — **models and use cases**, grouped by business feature. A feature may contain a `*.service.ts` (business flow), `*.repository.ts` (database or external API access), and `*.adapter.ts` or `*.mapper.ts` (data-shape conversion).
- `src/server/core` — cross-feature application concerns such as authentication, ETL orchestration, import validation, and HTTP helpers. It must not contain feature-specific API logic.
- `src/server/database` and `src/server/shared` — infrastructure shared by every feature.

Views stay in `src/components`, grouped by screen/feature. Browser API clients stay in `src/services`; request and UI contracts stay in `src/types`.

## Rules for new code

1. Keep the framework-owned route files where they are; do not duplicate controllers inside a feature.
2. Add a business capability under its feature module, not a new top-level `services`, `helpers`, or `utils` folder.
3. A repository only reads/writes a database or calls an external API. Business decisions belong in a service.
4. Reuse a feature's adapter/mapper for external-to-domain conversion rather than transforming the same data in routes or views.
5. Place a sub-feature inside its owning feature, for example `facebook/content`, instead of creating a second top-level module.
