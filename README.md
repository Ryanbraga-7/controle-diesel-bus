# Controle Diesel Bus

## Abrir no VS Code

1. Instale o Node.js 22.12 ou mais recente.
2. Extraia o ZIP em uma pasta nova e abra a pasta `controle-diesel-bus` no VS Code.
3. No terminal dessa pasta, execute:

```sh
npm install
npm run dev -- --port 8080
```

4. Abra `http://localhost:8080` e entre com o mesmo e-mail e senha que usa no site.

O pacote entregue inclui `.env.local` apenas com a configuração pública de conexão do projeto. Seus registros continuam no Lovable Cloud; o ZIP não contém cópias dos registros, senhas ou chaves privadas. Não substitua esses dados por configurações de outro projeto se quiser continuar acessando os mesmos abastecimentos.

Se já possui uma versão no computador, use uma pasta nova para evitar misturar arquivos antigos com os atualizados. Não copie `node_modules` da versão antiga.

O login Google e os links enviados por e-mail dependem de o endereço local estar autorizado nas configurações de acesso do Lovable Cloud; esses fluxos não foram verificados fora da prévia. Para começar, use e-mail e senha.

## Melhorias incluídas

- Data em dia/mês/ano, com validação de datas inexistentes e atalho rápido "Hoje".
- Cálculo e visualização de quilometragem percorrida (+km) e consumo (km/L) individuais por abastecimento.
- Assistente inteligente de odômetro: alerta preventivo caso seja digitado um odômetro menor que o anterior e cálculo estimado de km/L em tempo real.
- Prévia com miniatura da foto do cupom antes de salvar e botão para remover/trocar.
- Visualizador modal em tela cheia do cupom fiscal dentro da plataforma (evita bloqueio de popup nos navegadores móveis e desktop).
- Filtro por mês no histórico e busca combinada (ônibus, motorista e posto), com botão para limpar filtros com 1 clique.
- Barra de resumo em tempo real dos registros filtrados (Total R$, Diesel abastecido e Preço Médio/L).
- Exportação completa tanto para Excel (.xlsx) quanto para CSV.
- Paginação do histórico com opções de 15, 30, 50 ou todos os registros.
- Relatório mensal com troca de mês diretamente na página e exportação para Excel.
- Telas de erro e página 404 totalmente localizadas em português (PT-BR).

## Conferir os testes

```sh
npm test
```

## Tecnologia

React, TypeScript, TanStack Start e Tailwind CSS. Este é um projeto completo, não um único arquivo HTML.
