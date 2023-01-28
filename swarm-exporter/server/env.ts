export const SvPort = Number(Deno.env.get('PORT')) || 3000

export const ApiEndpoint = Deno.env.get('API_ENDPOINT') || ''
export const ApiToken = Deno.env.get('API_TOKEN') || ''
