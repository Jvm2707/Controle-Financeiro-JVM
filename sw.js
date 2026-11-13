// Controle Financeiro · service worker
// REGRA 3: ao subir o ?v= no HTML, subir também a VERSAO abaixo (com o mesmo número).
const VERSAO = "18.0";
const CACHE_APP = "cf-app-" + VERSAO;
const CACHE_FONTES = "cf-fontes";
const CACHE_LEMBRETES = "cf-lembretes";

const NUCLEO = [
    "./",
    "./index.html",
    "./Controlefinanceiro.css?v=" + VERSAO,
    "./Controlefinanceiro.js?v=" + VERSAO,
    "./manifest.webmanifest",
    "./assets/logo-jvm.png",
    "./assets/logo-jvm-128.png",
    "./assets/fundo-liquid-escuro.webp",
    "./assets/fundo-liquid-claro.webp",
    "./assets/icones/icone-192.png",
    "./assets/icones/icone-512.png",
    "./assets/icones/apple-touch-icon.png",
    "./assets/bandeiras/visa.png",
    "./assets/bandeiras/mastercard.png",
    "./assets/bandeiras/elo.png",
    "./assets/bandeiras/amex.png",
    "./assets/bandeiras/hipercard.png"
];

self.addEventListener("install", function(evento) {
    evento.waitUntil(
        caches.open(CACHE_APP).then(function(cache) {
            // Um arquivo que faltar não impede a instalação do resto
            return Promise.all(NUCLEO.map(function(url) { return cache.add(url).catch(function() {}); }));
        }).then(function() { return self.skipWaiting(); })
    );
});

self.addEventListener("activate", function(evento) {
    evento.waitUntil(
        caches.keys().then(function(nomes) {
            return Promise.all(nomes.filter(function(n) { return n.startsWith("cf-app-") && n !== CACHE_APP; }).map(function(n) { return caches.delete(n); }));
        }).then(function() { return self.clients.claim(); })
    );
});

self.addEventListener("fetch", function(evento) {
    const pedido = evento.request;
    if (pedido.method !== "GET") return;
    const url = new URL(pedido.url);

    // Fontes do Google: usa a guardada e atualiza em segundo plano
    if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
        evento.respondWith(caches.open(CACHE_FONTES).then(function(cache) {
            return cache.match(pedido).then(function(guardada) {
                const daRede = fetch(pedido).then(function(resposta) {
                    if (resposta.ok || resposta.type === "opaque") cache.put(pedido, resposta.clone());
                    return resposta;
                }).catch(function() { return guardada; });
                return guardada || daRede;
            });
        }));
        return;
    }

    // Cotações, feedback e outras APIs: sempre da internet (nunca dado velho)
    if (url.origin !== self.location.origin) return;

    // Páginas institucionais (Sobre, Contato, Privacidade, Documentação), arquivos .md e .txt:
    // sempre da internet, sem passar pelo cache do app
    const escopo = new URL(self.registration.scope);
    const rota = url.pathname.slice(escopo.pathname.length);
    const ehApp = rota === "" || rota === "index.html";
    if (!ehApp && (pedido.mode === "navigate" || /\.(md|txt|xml)$/.test(rota))) return;

    // App: internet primeiro (pega a versão nova); sem internet, a guardada
    if (pedido.mode === "navigate") {
        evento.respondWith(
            fetch(pedido).then(function(resposta) {
                // Só guarda a página do app quando carregou certo (nunca uma página de erro 404/500)
                if (resposta.ok) {
                    const copia = resposta.clone();
                    caches.open(CACHE_APP).then(function(cache) { cache.put("./index.html", copia); });
                }
                return resposta;
            }).catch(function() {
                return caches.match("./index.html").then(function(r) { return r || caches.match("./"); });
            })
        );
        return;
    }

    // Arquivos do app: os guardados primeiro (o ?v= garante que a versão nova é outro arquivo)
    evento.respondWith(
        caches.match(pedido).then(function(guardado) {
            return guardado || fetch(pedido).then(function(resposta) {
                if (resposta.ok) {
                    const copia = resposta.clone();
                    caches.open(CACHE_APP).then(function(cache) { cache.put(pedido, copia); });
                }
                return resposta;
            });
        })
    );
});

// ---------- Lembretes de vencimento (também com o app fechado) ----------
function hojeLocal() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function maisUmDia(data) {
    const d = new Date(data + "T12:00:00");
    d.setDate(d.getDate() + 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function dataBR(data) { return data.slice(8, 10) + "/" + data.slice(5, 7) + "/" + data.slice(0, 4); }

async function verificarLembretes() {
    const cache = await caches.open(CACHE_LEMBRETES);
    const resposta = await cache.match("lembretes.json");
    if (!resposta) return;
    const dados = await resposta.json();
    if (!dados.ativo || !Array.isArray(dados.itens)) return;
    const hoje = hojeLocal(), amanha = maisUmDia(hoje);
    dados.avisados = dados.avisados || {};
    let mudou = false;
    for (const item of dados.itens) {
        if (dados.avisados[item.id] === hoje) continue;
        let titulo = null, corpo = item.valorTexto;
        if (item.data < hoje) { titulo = item.titulo + " está atrasada"; corpo = item.valorTexto + " · venceu em " + dataBR(item.data); }
        else if (item.data === hoje) titulo = item.titulo + " vence hoje";
        else if (item.data === amanha) titulo = item.titulo + " vence amanhã";
        if (!titulo) continue;
        dados.avisados[item.id] = hoje;
        mudou = true;
        await self.registration.showNotification(titulo, { body: corpo, tag: item.id, icon: "assets/icones/icone-192.png", badge: "assets/icones/icone-192.png" });
    }
    if (mudou) await cache.put("lembretes.json", new Response(JSON.stringify(dados), { headers: { "Content-Type": "application/json" } }));
}

self.addEventListener("periodicsync", function(evento) {
    if (evento.tag === "lembretes-vencimento") evento.waitUntil(verificarLembretes());
});

self.addEventListener("notificationclick", function(evento) {
    evento.notification.close();
    evento.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(janelas) {
            const aberta = janelas.find(function(j) { return j.url.startsWith(self.registration.scope); });
            if (aberta) return aberta.focus();
            return self.clients.openWindow("./");
        })
    );
});
