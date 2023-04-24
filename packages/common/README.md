# common

Common code shared between frontend and backend. This package exports
uncompiled typescript and lets dependents handle compilation.

This is known as the [internal package pattern][turborepo]. We use this pattern
because it minimizes configuration complexity. For our usage, the tradeoff of
compilation performance is well worth it.

[turborepo]: https://turborepo.com/posts/you-might-not-need-typescript-project-references
