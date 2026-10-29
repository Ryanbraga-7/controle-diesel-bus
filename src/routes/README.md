# Rotas

O TanStack Start utiliza **roteamento baseado em arquivos**. Cada arquivo `.tsx` neste diretório
define uma rota. **Não** crie `src/pages/`, `src/routes/_app/index.tsx` ou
`app/layout.tsx` — essas são convenções do Next.js / Remix. O único layout raiz
é `src/routes/__root.tsx`.

## Convenções

| Arquivo | URL |
| --- | --- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `users/index.tsx` | `/users` |
| `users/$id.tsx` | `/users/:id` (dinâmico — `$ ` direto, sem chaves) |
| `posts/{-$category}.tsx` | `/posts/:category?` (segmento opcional) |
| `files/$.tsx` | `/files/*` (splat — lido via parâmetro `_splat`, nunca `*`) |
| `_layout.tsx` | rota de layout (renderiza os filhos via `<Outlet />`) |
| `__root.tsx` | casca da aplicação — envolve todas as páginas; preserve o `<Outlet />` |

`routeTree.gen.ts` é gerado automaticamente. Não edite manualmente.

