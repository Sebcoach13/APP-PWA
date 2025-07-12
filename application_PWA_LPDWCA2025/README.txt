# Chat App PWA - Documentation de la Synchronisation

Ce README décrit en détail la fonctionnalité de synchronisation des messages implémentée en complément du document d'équipe.

## 1. Contexte

Dans un environnement hors-ligne, les messages envoyés sont stockés localement avec un indicateur `sent: false`. Lors du retour en ligne, ces messages sont automatiquement synchronisés (basculés en `sent: true`) via une fonction de synchronisation.

## 2. Fonctionnement de la synchronisation

### 2.1. Stockage des messages

* Chaque message est sauvegardé dans `localStorage` sous forme d'objet `{ text, sender, timestamp, sent }`.
* Par défaut, `sent` vaut `false` pour un message utilisateur.

### 2.2. Envoi et déclenchement de la sync

* Lors de l'appel de `sendMessage()` :

  1. Le message est affiché et stocké localement (`sent: false`).
  2. La fonction `syncMessagesWithServer()` est appelée immédiatement.

* `syncMessagesWithServer()` :

  1. Vérifie si `navigator.onLine` est `true` (sinon, quitte la fonction).
  2. Charge tous les messages depuis `localStorage` et filtre ceux avec `sent === false`.
  3. Simule un appel réseau (fetch vers `/api/sync`).
  4. En cas de succès, marque tous les messages en `sent: true` et les sauvegarde à nouveau.
  5. Affiche un `console.log('Synchronisation terminée')`.

### 2.3. Triggers supplémentaires

* Événement `window.addEventListener('online', syncMessagesWithServer)` : dès le retour en ligne, lance la synchronisation.
* `setInterval(syncMessagesWithServer, 5000)` : relance tous les 5 secondes pour combler les cas où l’utilisateur reste en ligne après plusieurs messages hors-ligne.

## 3. Test de la synchronisation

1. **Passer en mode Offline** (DevTools > Network > Offline).
2. Envoyer un message : dans la console, vérifier :

   ```js
   JSON.parse(localStorage.getItem('messages'))
   ```

   → le message doit avoir `sent: false`.
3. **Repasser en mode Online** :

   * Observer le log `Synchronisation terminée`.
   * Relancer la même commande de console : tous les messages doivent maintenant afficher `sent: true`.

## 4. Intégration

Ces modifications viennent compléter le document d'équipe en ajoutant une gestion de la synchronisation hors-ligne/online pour assurer que tous les messages utilisateurs soient bien pris en compte dès qu’une connexion réseau est disponible.

---

*par Claudia Ceccaldi*
