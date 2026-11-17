# ANJO EYWA · app web (PWA)

App de bem-estar que funciona no navegador e pode ser instalado na tela inicial do celular, como um app. Funciona sem internet depois do primeiro acesso.

## O que tem nesta pasta

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | O app inteiro: telas, práticas, Raio-X, trilhas, check-in, perfil |
| `manifest.webmanifest` | Nome, cores e ícones para instalar na tela inicial |
| `sw.js` | Guarda o app para funcionar offline e abre o app pelos lembretes |
| `icons/` | Ícones do ANJO (192, 512, iPhone e versão adaptável do Android) |

## Como colocar no ar (grátis, cerca de 5 minutos)

1. Acesse **app.netlify.com/drop** e crie uma conta gratuita.
2. Arraste **a pasta `anjo-app` inteira** para a página.
3. Em segundos aparece um endereço, por exemplo `https://nome-aleatorio.netlify.app`. O app já está no ar.
4. Para trocar o nome: em *Site configuration › Change site name*, use algo como `anjo-eywa` (fica `anjo-eywa.netlify.app`).
5. Domínio próprio (opcional): registre, por exemplo, `anjo.eywa.com.br` no Registro.br (cerca de R$ 40 por ano) e conecte em *Domain management* no Netlify.

Também funciona do mesmo jeito na Vercel, no Cloudflare Pages ou no GitHub Pages. O endereço precisa ser **https** para instalar o app e receber lembretes, e todos esses serviços já usam https.

## Como publicar uma atualização

1. Abra `sw.js` e aumente o número da versão: `anjo-v1` vira `anjo-v2`.
2. No Netlify, em *Deploys*, arraste a pasta de novo.
3. Os aparelhos baixam a nova versão na próxima vez que abrirem o app.

## Como instalar no celular

- **iPhone (Safari):** abra o endereço, toque em *Compartilhar* e depois em *Adicionar à Tela de Início*.
- **Android (Chrome):** abra o endereço e toque em *Instalar app*, ou use o menu do navegador e *Instalar app*.

## Onde ficam os dados

Os dados ficam **só no aparelho de cada pessoa**: nada vai para um servidor. Por isso:

- Quem trocar de celular ou limpar os dados do navegador perde o histórico. Antes disso, use *Perfil › Exportar meus dados*, que salva um arquivo `.json`.
- A EYWA não vê números do conjunto de usuários. Isso chega com a versão com contas.

## Limites desta versão (MVP)

- **Lembretes:** chegam com o app aberto ou em segundo plano no navegador. Com o app totalmente fechado, o aviso depende de um servidor de notificações, que vem na versão com contas.
- **Conversa com o ANJO:** segue regras simples. A IA do Claude entra na versão com servidor, porque a chave da API não pode ficar dentro do app.
- **Leitura de postura pela câmera:** ainda não está ligada. O Raio-X pergunta como a pessoa costuma ficar.
- **Passos e calendário:** chegam com a versão para as lojas de apps.

## Próximo passo: versão com contas

O arquivo exportado em *Perfil › Exportar meus dados* usa o formato `ANJO EYWA, formato 1`. A versão com contas (Supabase e API do Claude) poderá importar esse arquivo, e cada pessoa leva o próprio histórico.

O ANJO não é dispositivo médico, não diagnostica nem trata. Em sofrimento intenso: CVV, 188.
