<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> Este projeto está conectado ao [Lovable](https://lovable.dev). Evite reescrever
> o histórico publicado do Git — force pushing, ou fazer rebase/amend/squash de commits
> que já foram enviados — pois isso regrava o histórico no Lovable e o
> usuário provavelmente perderá o histórico do projeto.
>
> Commits enviados para a branch conectada sincronizam de volta com o Lovable e aparecem
> no editor, portanto mantenha a branch sempre funcionando.
<!-- LOVABLE:END -->

- Mantenha a interpretação de entrada de datas no utilitário de data seguro para o navegador e persista datas no formato ISO; isso torna o preenchimento no formato brasileiro independente do idioma do navegador.
- Monte o componente de notificações Sonner Toaster uma única vez na rota raiz (__root); as mutações só informam sucesso após confirmação do banco de dados.
- Pré-empacote o Sonner e as dependências de dialog/slot no passo inicial de otimização do Vite; descobertas tardias podem misturar versões de módulos React em uma prévia já aberta.
- O modo claro substitui os mesmos tokens de cor em `:root.light` / `.theme-light`; os componentes usam apenas tokens para que ambos os temas e o relatório impresso funcionem perfeitamente.
- As fotos dos comprovantes ficam em um bucket privado em uma pasta por usuário e são abertas apenas por links assinados de curta duração.

