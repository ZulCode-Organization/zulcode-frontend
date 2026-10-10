import comemoracoes from "./comemoracoes.json";
import configuracoes from "./configuracoes.json";
import divisoes from "./divisoes.json";

// Cada área do app tem um arquivo; o nome do arquivo é o prefixo das chaves
// ("configuracoes.titulo").
const mensagens = { comemoracoes, configuracoes, divisoes };
export default mensagens;
