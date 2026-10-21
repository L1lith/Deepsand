---
title: Utilisation du terminal DeepCode
description: >-
  Comment utiliser le DeepCode CLI dans Deepsand, ses principales commandes slash et raccourcis
  clavier.
---

# Utilisation du terminal DeepCode

Deepsand exécute le [DeepCode CLI](https://github.com/lessweb/deepcode-cli) dans le bac à sable. L'onglet **Terminal** est une session DeepCode en direct : saisissez une requête en langage normal ou utilisez l'une des commandes slash de DeepCode pour contrôler la session.

Vous n'installez pas DeepCode sur votre propre ordinateur. Deepsand démarre le CLI dans le conteneur du projet, où il peut voir `/workspace` et les répertoires que vous avez partagés.

Apprenez-en davantage sur le [Page d'accueil du projet DeepCode](https://deepcode.vegamo.cn/) ou sur le [Dépôt DeepCode](https://github.com/lessweb/deepcode-cli).

## Démarrer une séance

1. Sélectionnez un projet dans la barre latérale.
2. Appuyez sur **Courir**.
3. Attendez que le bac à sable démarre. Si l'image est manquante, Deepsand la construit en premier et affiche la sortie de construction dans **Activité**.
4. Le terminal DeepCode apparaît lorsque le CLI est prêt.

L'arrêt du bac à sable met fin au conteneur. Le redémarrage du projet reprend la conversation DeepCode précédente lorsqu'elle existe.

## Demandez à DeepCode de faire quelque chose

Tapez une demande normale et appuyez sur **Entrer**. Par exemple:

```text
Find the failing test in this project and explain what is wrong.
```

DeepCode peut lire et modifier des fichiers dans l'espace de travail, exécuter des commandes et utiliser les outils sélectionnés pour le projet. Vous gardez le contrôle : lorsqu'il a besoin de quelque chose en dehors de l'espace de travail, Deepsand met le bac à sable en pause et vous le demande en premier.

## Principales commandes de barre oblique

Les commandes Slash commencent par `/`. Taper `/` seul ouvre le menu de commande.

| Commande | Ce qu'il fait |
| --- | --- |
| `/new` | Démarrer une nouvelle conversation |
| `/resume` | Choisissez une conversation précédente pour continuer |
| `/fork` | Forkez la conversation en cours |
| `/continue` | Continuez la conversation active ou choisissez-en une pour la reprendre |
| `/model` | Changer de modèle, de mode de pensée et d'effort de raisonnement |
| `/raw` | Basculer le mode d'affichage : Défilement Normal, Lite ou Raw |
| `/init` | Créez un fichier `AGENTS.md` avec les instructions du projet |
| `/skills` | Répertoriez les compétences disponibles pour DeepCode |
| `/mcp` | Afficher l'état du serveur MCP et les outils disponibles |
| `/undo` | Restaurer le code, la conversation ou les deux à un point antérieur |
| `/exit` | Quitter DeepCode |

Un projet peut déjà avoir un `AGENTS.md` ; vérifiez avant d'utiliser `/init` afin de ne pas remplacer les instructions déjà présentes.

## Raccourcis clavier

| Clé | Actions |
| --- | --- |
| `Enter` | Envoyer l'invite |
| `Shift+Enter` | Insérer une nouvelle ligne |
| `Ctrl+J` | Insérer une nouvelle ligne |
| `Esc` | Interrompre le tour du modèle en cours |
| `Ctrl+V` | Collez une image lorsque le modèle sélectionné prend en charge les images |
| `Ctrl+D` deux fois | Quitter DeepCode |

Après avoir interrompu un tour avec `Esc`, vous pouvez saisir une autre requête. Le bac à sable n'est pas redémarré.

## Sessions, modèles et annulation

- `/new` recommence avec une conversation claire. Les fichiers du projet ne sont pas supprimés.
- `/resume` et `/continue` ramènent une conversation antérieure.
- `/model` modifie le modèle, le mode de réflexion et l'effort de raisonnement pour la session. L'en-tête du projet comporte également un sélecteur de modèle et un curseur de réflexion ; **Équilibré** est la butée centrale et le réglage recommandé pour la plupart des travaux.
- `/undo` restaure le code, la conversation ou les deux à un point antérieur. C'est le moyen le plus rapide de revenir sur un changement que vous ne souhaitiez pas.

L'historique des conversations se trouve dans le volume d'état Deepsand du projet, et non dans votre référentiel.

## Autorisations et bac à sable

Le terminal se trouve à l'intérieur du conteneur, il voit donc le projet sur `/workspace` et les répertoires que vous avez explicitement partagés, et rien d'autre sur votre ordinateur.

Lorsque DeepCode demande un autre répertoire, une destination réseau, un outil ou une autre ressource, Deepsand gèle le bac à sable et affiche une boîte de dialogue d'autorisation.

- **Accorder l'accès** applique la demande et reprend la session.
- **Refuser** le refuse et dit à DeepCode que la décision est définitive.
- L'approbation d'un répertoire recrée le conteneur avec le nouveau montage.

Lisez [Comment fonctionne le bac à sable](./security) avant de partager un répertoire contenant des fichiers sensibles.

## Si le terminal ne démarre pas

- **Il manque l'image :** Deepsand le construit en premier. Regardez **Activité** pour connaître la progression de la construction.
- **Docker Desktop ne fonctionne pas ou est bloqué :** démarrez-le et attendez que le moteur ait fini de démarrer. Si Docker Desktop est en cours d'exécution mais que son moteur ne répond pas, redémarrez Docker Desktop. Utilisez le contrôle **Redémarrez Docker Desktop…** intégré à l'application lorsque Deepsand l'affiche. Sinon, sur Windows, cliquez avec le bouton droit sur la baleine Docker dans la zone de notification et choisissez **Redémarrage** ; sur macOS, utilisez l'icône de la barre de menu Docker ; sur Linux, ouvrez le menu **Dépanner** de Docker Desktop. Le redémarrage de Docker Desktop met fin à chaque conteneur de la machine. Voir [la FAQ Docker](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).
- **La clé API est manquante ou rejetée :** ouvrez **Paramètres** et enregistrez une clé valide.
- **DeepCode est sorti :** appuyez à nouveau sur **Courir**. La session précédente peut être reprise avec `/resume`.

## Pages connexes

- [Commencer](./getting-started)
- [Obtenez une clé DeepSeek API](./deepseek-api)
- [Comment fonctionne le bac à sable](./security)
- [Page d'accueil du projet DeepCode](https://deepcode.vegamo.cn/)
