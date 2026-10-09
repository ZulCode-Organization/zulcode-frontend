# Playground HTML, CSS e JavaScript

O aplicativo controla o editor; um iframe com sandbox="allow-scripts" executa os arquivos em uma origem opaca. O runtime recebe somente código e identificador de execução. Não envie tokens ou dados de conta.

## Desenvolvimento
Execute npm run dev. O predev gera public/playground-runtime/index.html; nenhum segundo servidor é necessário. Rodar ou Ctrl/Cmd+Enter recria o preview. Encerrar remove o iframe. Os rascunhos ficam no navegador.

## Etapa 1: proteção do trabalho e recursos suportados
Restaurar o exemplo solicita confirmação quando HTML, CSS ou JavaScript foram alterados. Cancelar mantém os arquivos e o preview. O salvamento usa a última edição ao desmontar a página na navegação interna, no evento pagehide e quando a página fica oculta, além do intervalo de 300 ms durante a edição.

Rascunhos inválidos são copiados integralmente para uma chave exclusiva de recuperação no localStorage antes de qualquer substituição. A tela permite baixar o conteúdo original. Se a cópia não puder ser gravada e conferida, o salvamento automático fica pausado para preservar o original. Não existe sincronização com a conta nesta etapa: os rascunhos permanecem neste navegador.

O runtime aceita os três arquivos fixos. Referências HTML a style.css e script.js, incluindo ./ e /, usam o conteúdo dos editores sem solicitar esses arquivos pela rede. JavaScript embutido no HTML é removido com aviso; imports estáticos, dinâmicos e scripts de módulo são rejeitados com diagnóstico. Outros arquivos de script e stylesheet, imagens externas e srcset geram erro. Imagens data:image/ são permitidas. Links para outras páginas perdem o href; recursos bloqueados pela CSP geram aviso no console.

O protocolo compartilhado valida chaves, tipos, identificador da execução, tamanho dos arquivos, tipo de evento e tom de cada mensagem. Não aceita propriedades adicionais. As verificações de janela, origem e sessão continuam no executor e no runtime.

## Produção na Vercel: mesmo projeto e domínio
Publique o frontend no projeto já existente, com Build Command **npm run build**. O prebuild gera public/playground-runtime/index.html e o Next.js publica esse arquivo no mesmo deploy.
O preview usa automaticamente https://app.zulcode.com/playground-runtime/index.html. Não é necessário segundo projeto, servidor ou configuração DNS.
Não configure NEXT_PUBLIC_PLAYGROUND_PREVIEW_URL para este fluxo. Se você tiver definido a variável para outro host anteriormente, remova-a no projeto da Vercel e refaça o deploy. A variável continua disponível como substituição opcional.
O next.config.ts aplica CSP sandbox allow-scripts, frame-ancestors 'self', no-referrer, nosniff e no-store à rota do runtime. A CSP no HTML restringe os recursos e permite o bootstrap pelo hash e o JavaScript do aluno por Blob.
A URL pública contém apenas o bootstrap: os arquivos do aluno são enviados por postMessage ao iframe depois da inicialização, sem tokens ou dados de conta.

## Arquitetura para futuras linguagens
O contrato PlaygroundExecutor em src/lib/playground/executor.ts define run, stop, reset, clearLogs, dispose, subscribe e getSnapshot. A entrada possui linguagem e arquivos; a saída contém estado, logs e preview opcional. Capabilities informa linguagens, preview visual, entrada padrão, verificações de loops e cancelamento rígido.
IframeExecutor implementa esse contrato para JavaScript com HTML/CSS. O hook usePlaygroundExecutor conecta o executor ao React; a página cuida de edição, rascunho e apresentação. BindFrame e onFrameLoad são detalhes específicos do adaptador de iframe.
O executor valida linguagem e arquivos, confere origem opaca, janela de origem, canal e identificador das mensagens e descarta execuções anteriores. Reiniciar limpa o console; stop remove o preview; dispose libera o listener e o timer; o cleanup do hook chama essa operação.
Para adicionar outro runtime, implemente o contrato e conecte o adaptador adequado no hook. Nenhuma outra linguagem foi adicionada nesta etapa. O contrato permite preview nulo para executores de console; a seleção de linguagem e os componentes de saída específicos serão adicionados quando houver um segundo executor real.

## Hospedagem externa opcional
A pasta playground-preview ainda permite publicação independente, caso essa decisão mude no futuro. Na Vercel: diretório raiz playground-preview, Framework Other, build node build.mjs, saída dist. Configure NEXT_PUBLIC_PLAYGROUND_PREVIEW_URL no aplicativo para apontar ao runtime público e refaça o deploy. O frame-ancestors dessa hospedagem precisa permitir a origem do app.
Cloudflare Pages e Netlify podem publicar a mesma saída dist, com o arquivo _headers gerado pelo build. Essas alternativas não são necessárias para a configuração atual.

## Limites e verificação
CSP bloqueia fetch, scripts externos, frames, formulários e recursos de rede comuns; imagens data: e CSS inline são permitidos. Scripts e atributos on* presentes no HTML são removidos: coloque JavaScript em script.js. Isso não promete bloquear toda forma de navegação ou tráfego; links externos não são uma funcionalidade suportada.
Sandbox sem allow-same-origin impede o código de acessar DOM, cookies e armazenamento do aplicativo.
O iframe no mesmo domínio depende do sandbox e da CSP para isolamento. Hospedar em outra origem é uma camada adicional opcional.

### Proteção de loops
O parser Acorn instrumenta while, do…while, for, for…in e for…of antes de executar o script. Cada corpo de loop recebe uma chamada ao orçamento. Comentários, strings e números de linha são preservados; corpos sem chaves são envolvidos em um bloco. with é rejeitado, pois interfere na resolução do identificador da verificação.
O orçamento compartilhado é de 1.000.000 de iterações ou aproximadamente 250 ms por tarefa contínua; o relógio é conferido a cada 256 iterações. Ao devolver o controle às tarefas do navegador, o orçamento é reiniciado. Esperar um clique ou timer não consome o orçamento da próxima interação.
Ao atingir o limite, o runtime comunica o erro e a linha ao executor, que invalida a execução e remove o iframe. A exceção permanece ativa mesmo se o código capturar o primeiro erro. O erro é enviado antes de lançar a exceção, para que um catch do aluno não esconda o encerramento do preview. Rodar novamente cria um ambiente novo.
Essa proteção cobre os loops instrumentados e também loops dentro de callbacks. Ela não representa um limite rígido de CPU: chamadas nativas demoradas, recursão sem loops e código criado dinamicamente em novos scripts não passam necessariamente pelas verificações. Não é uma garantia contra código malicioso que tente contornar a instrumentação. Cancelamento manual e timeout de inicialização ainda dependem da resposta do navegador. hardCancellation permanece false; loopChecks é true.
Arquivos têm limite de 100.000 caracteres e o console limita mensagens e tamanho. Cada execução recebe um identificador novo; mensagens de outro iframe ou execução são ignoradas.
O backend não participa da execução. Não execute código do aluno no processo Node do aplicativo.
Valide também em Android WebView antes de liberar a versão móvel.

Para testar: npm run build; node --test playground-preview/stage1.test.mjs playground-preview/loops.test.mjs playground-preview/browser.test.mjs (Chrome instalado ou CHROME_BIN definido).

Para testar a tela real, inicie o frontend local com npm run start -- --port 3097 e execute PLAYGROUND_TEST_URL=http://127.0.0.1:3097 node --test playground-preview/page.test.mjs. Use uma instância local: o teste utiliza uma credencial fictícia em um perfil temporário do Chrome. Ele verifica recuperação de rascunho inválido, cancelar/confirmar restauração e navegar imediatamente após editar. Sem PLAYGROUND_TEST_URL esse teste é explicitamente pulado.

## Arquivos da implementação
- [Página do playground](src/app/playground/page.tsx): editor, rascunho, console e ciclo de execução.
- [Configuração da URL](src/lib/playground-preview.ts): URL e constantes compartilhadas.
- [Protocolo compartilhado](playground-preview/protocol.mjs) e [tipos do aplicativo](src/lib/playground/protocol.ts): validação das mensagens do runtime e do executor.
- [Proteção de rascunhos](src/lib/playground/draft-safety.ts) e [testes da etapa 1](playground-preview/stage1.test.mjs): recuperação, preservação e confirmação de restauração.
- [Teste da tela](playground-preview/page.test.mjs): navegação e edição no frontend de produção local.
- [Runtime](playground-preview/runtime.js): DOM, CSS, JavaScript e mensagens.
- [Instrumentação de loops](playground-preview/instrument-loops.mjs), [orçamento](playground-preview/loop-budget.mjs) e [testes de loops](playground-preview/loops.test.mjs): prevenção de travamento por loops instrumentados.
- [Build estático](playground-preview/build.mjs): CSP, HTML e cabeçalhos para outras hospedagens.
- [Contrato de execução](src/lib/playground/executor.ts), [executor iframe](src/lib/playground/iframe-executor.ts) e [hook React](src/hooks/usePlaygroundExecutor.ts): camada de execução separada.
- [Cabeçalhos no aplicativo](next.config.ts): sandbox e incorporação na mesma origem.
- [Configuração Vercel](playground-preview/vercel.json): publicação externa opcional.
- [Testes Chrome](playground-preview/browser.test.mjs): 23 cenários de integração, incluindo ciclo de vida do executor.
- [Scripts npm](package.json): geração antes do desenvolvimento e build.
- [Gitignore principal](.gitignore) e [Gitignore do preview](playground-preview/.gitignore): arquivos gerados.
- Este documento: configuração e limites.

Verificações realizadas: build Next.js, TypeScript, ESLint e teste de integração Chrome passaram. O servidor Next de produção também confirmou HTTP 200, CSP, nosniff e no-store na rota do runtime. Publicação na Vercel e teste em Android WebView ainda não realizados.

## Documentação consultada
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/deployments/generated-urls
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://docs.netlify.com/manage/domains/domains-fundamentals/understand-domains/

- https://nextjs.org/docs/app/api-reference/config/next-config-js/headers

- https://github.com/acornjs/acorn/tree/master/acorn
- https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
