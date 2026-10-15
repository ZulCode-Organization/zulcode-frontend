import anuncios from "./anuncios.json";
import avisos from "./avisos.json";
import comemoracoes from "./comemoracoes.json";
import configuracoes from "./configuracoes.json";
import divisoes from "./divisoes.json";
import notificacoes from "./notificacoes.json";
import widget from "./widget.json";

// Cada área do app tem um arquivo; o nome do arquivo é o prefixo das chaves
// ("configuracoes.titulo").
const mensagens = { anuncios, avisos, comemoracoes, configuracoes, divisoes, notificacoes, widget };
export default mensagens;
