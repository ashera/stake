# Specs

Feature specifications for Traxn. Each spec captures what a feature does, its data
model and interfaces, and — importantly — the **decisions and rationale** behind
it, so settled questions don't get re-opened.

## Conventions

- One spec per feature, in this folder.
- **File naming:** `kebab-case-title.md` (topic-named, lower-case, hyphenated).
- Copy [`_TEMPLATE.md`](./_TEMPLATE.md) to start a new spec.
- Update the spec **in the same change** as the code it describes; keep its
  `Status` and `Last updated` current.
- Add new specs to the index below.

## Index

| Spec | What it covers |
|---|---|
| [landing-and-applications](./landing-and-applications.md) | Public site: home (featured) + /how-it-works; apply via the express-interest wizard |
| [deals](./deals.md) | First-class deal linking a marketer to a product, created by the express-interest wizard |
| [admin-auth-and-users](./admin-auth-and-users.md) | Login, sessions, and user management (admins + passwordless marketer leads) |
| [deploy-and-migrations](./deploy-and-migrations.md) | Railway deploy via GitHub and migrate-on-deploy |
| [deal-terms](./deal-terms.md) | DB-backed, admin-managed deal terms on the landing page |
| [products](./products.md) | DB-backed, admin-managed product/opportunity cards |
| [reference-data](./reference-data.md) | Managed dropdown options (with descriptions) for product attributes |

## Wider context

The product concept, decision chain, and Frockd pilot live in
[`PROJECT-CONTEXT.md`](../PROJECT-CONTEXT.md).
