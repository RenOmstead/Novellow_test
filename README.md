# Novellow (test copy)

This is the **test copy** of [Novellow](https://github.com/RenOmstead/Novellow),
for trying changes before they go to the real site.

- Test site: https://renomstead.github.io/Novellow_test/
- Real site: https://renomstead.github.io/Novellow/

It is identical to Novellow except for:

- `js/config.js`: points at the **test** Supabase project and sets
  `SITE_LABEL = "Test copy"`, which shows a ribbon on every page.
- The link-preview addresses in each page's `<head>`, and `noindex`
  so search engines skip it.

Accounts and books here live in the test database only.
