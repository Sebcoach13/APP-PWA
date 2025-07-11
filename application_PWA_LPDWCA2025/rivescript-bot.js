// Initialise le bot RiveScript
const bot = new RiveScript();

// Charge le fichier RiveScript (que l’on créera juste après)
bot.loadFile("brain.rive").then(onReady).catch(onError);

// Une fois chargé, trie les règles
function onReady() {
  bot.sortReplies();
  console.log("🤖 Bot chargé et prêt.");
}

// Gestion d'erreur
function onError(err) {
  console.error("Erreur de chargement du bot :", err);
}
