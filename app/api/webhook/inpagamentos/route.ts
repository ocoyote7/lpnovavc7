// Re-exportar handlers do webhook principal
// Isso permite configurar no painel do InPagamentos tanto:
// - https://ofertaseguramercado.com.br/api/webhook
// - https://ofertaseguramercado.com.br/api/webhook/inpagamentos
export { POST, GET, OPTIONS } from "../route"
