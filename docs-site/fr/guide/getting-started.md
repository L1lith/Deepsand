---
title: Commencer
description: Installez Deepsand, créez votre premier projet et exécutez son bac à sable.
---

# Commencer

Deepsand vous aide à travailler avec un assistant de codage IA sur un projet réel sans donner à cet assistant l'accès au reste de votre ordinateur. Vous n'avez pas besoin de comprendre Docker ou la ligne de commande pour utiliser le flux de base.

Si vous voulez d’abord avoir une vue d’ensemble, lisez [Qu'est-ce que Deepsand ?](./what-is-deepsand).

## Exigences

- Docker Desktop sur Windows ou macOS, ou Docker Engine sur Linux.
- Un ordinateur Windows, macOS ou Linux. Le [page de téléchargements](../download) détecte le système et répertorie les installateurs correspondants.
- Aucune installation de Node.js ou Rust n'est nécessaire, sauf si vous construisez Deepsand à partir des sources.

Docker Desktop doit être en cours d'exécution avant que Deepsand puisse démarrer un bac à sable. Si le démon démarre toujours, la bande d'état l'indique et propose de vérifier à nouveau. Docker Desktop peut également être en cours d'exécution mais ne pas répondre ; si Deepsand indique que le démon ne répond pas, redémarrez Docker Desktop. Lorsque Deepsand détecte Docker Desktop, il affiche un contrôle **Redémarrez Docker Desktop…**. Voir [que faire si Docker Desktop ne fonctionne pas ou ne répond plus](./faq#what-if-docker-desktop-is-not-running-or-has-stopped-responding).

## Installer

Ouvrez le [Page de téléchargement de Deepsand](../download). Il détecte votre système d'exploitation et répertorie les derniers programmes d'installation Windows, macOS et Linux de la version actuelle de GitHub. Choisissez le package pour votre ordinateur, installez-le, puis démarrez Deepsand.

Si vous développez Deepsand lui-même, le référentiel README contient les commandes source-build et hot-reload.

## Première course

Vous n'avez pas besoin d'installer ou de configurer DeepCode avant d'utiliser Deepsand. Deepsand exécute DeepCode dans le bac à sable et est livré avec des valeurs par défaut raisonnables pour le modèle et le point de terminaison.

La seule chose dont vous avez besoin est une clé modèle API. La section suivante explique comment obtenir une clé DeepSeek, ou vous pouvez utiliser une clé d'un autre fournisseur. Enregistrez-le dans **Paramètres → Touche API**.

Si vous utilisez déjà le DeepCode CLI sur cet ordinateur, Deepsand peut hériter du modèle, de l'URL de base et de la clé de votre configuration DeepCode existante. Un projet peut également remplacer ces informations d'identification dans ses propres paramètres.

## Obtenez une clé API

Deepsand a besoin d'une clé API provenant d'un fournisseur de modèles avant que l'assistant puisse s'exécuter.

- **Si vous n'en avez pas :** suit [Obtenez une clé DeepSeek API](./deepseek-api). Il passe par la création d'un compte, l'ajout de crédit, la création d'une clé et le retour à Deepsand.
- **Si vous en avez déjà un :** ouvrez **Paramètres**, collez-le dans le champ **Clé API** et sélectionnez **Enregistrer la clé**.
- **Si vous souhaitez une clé spécifique au projet :** ouvrez les paramètres de ce projet et saisissez-les ici à la place.

La clé à l'échelle de l'application est conservée dans le magasin de clés de votre système d'exploitation, et non dans le fichier d'état de Deepsand. La fenêtre affiche uniquement les quatre derniers caractères après l'enregistrement.

## Créer un projet

1. Sélectionnez **Nouveau projet** dans la barre latérale.
2. Donnez un nom au projet.
3. Choisissez le répertoire de travail.
4. Créez le projet.

Le répertoire de travail devient `/workspace` dans le bac à sable. Deepsand refuse les chemins tels que la racine du système de fichiers, votre répertoire personnel, les magasins d'informations d'identification et son propre répertoire de données.

## Choisissez un modèle

Utilisez un **modèle flash** pour la plupart des tâches. Deepsand est par défaut `deepseek-v4-flash`, qui est le choix le moins cher pour le codage, les explications et les modifications quotidiennes. Passez à `deepseek-v4-pro` uniquement lorsque Flash a clairement du mal à accomplir une tâche ; le modèle professionnel coûte plus cher à exécuter.

Vous pouvez changer de modèle dans **Paramètres**, depuis l'en-tête du projet, ou avec `/model` dans le terminal DeepCode.

## Choisissez un niveau de réflexion

Le curseur de réflexion se trouve à côté du sélecteur de modèle dans l'en-tête du projet. Il contrôle le degré de raisonnement du modèle avant de répondre.

- **Désactivé:** aucune réflexion. Le plus rapide, mais le moins prudent.
- **Rapide:** un peu de réflexion, pour des petites retouches bien précisées.
- **Équilibré:** réflexion modérée et arrêt intermédiaire. C'est la valeur par défaut raisonnable pour un travail réel.
- Raisonnement maximal **Profond:**. Le plus lent et le plus cher.
- **Défaut:** s'en remet à l'hôte `settings.json` ; s'il ne dit rien, DeepCode revient à Balanced.

Gardez le curseur sur **Équilibré** pour la plupart des tâches. Il donne de bons résultats sans avoir à payer pour le raisonnement le plus lent et le plus coûteux à chaque demande. Utilisez **Profond** uniquement pour les problèmes véritablement difficiles, et **Désactivé** ou **Rapide** pour de petites modifications prévisibles.

## Exécuter un projet

1. Sélectionnez le projet.
2. Appuyez sur **Courir**.
3. Si l'image est manquante, Deepsand la crée d'abord et affiche le résultat de la génération dans l'onglet Activité.
4. Le DeepCode CLI démarre à l'intérieur du conteneur et apparaît dans le terminal.

L'arrêt du bac à sable met fin au conteneur. Le redémarrer reprend la session DeepCode précédente lorsqu'elle existe.

## Utilisation du terminal DeepCode

L'onglet **Terminal** est la session DeepCode CLI en direct. Tapez une demande et appuyez sur **Entrer**, ou utilisez une commande slash pour contrôler la session. `/new` démarre une nouvelle conversation, `/resume` poursuit une conversation antérieure, `/model` modifie le modèle et `/` ouvre le menu de commande.

Lisez [Utilisation du terminal DeepCode](./deepcode-terminal) pour les commandes principales, les raccourcis clavier et les étapes de récupération.

## Répondre aux demandes d'autorisation

Lorsque DeepCode a besoin d'un répertoire, d'une destination réseau, d'un outil ou d'une autre ressource, Deepsand met le bac à sable en pause et affiche la requête.

- **Accorder l'accès** autorise la demande et reprend la session.
- **Pas maintenant** le refuse cette fois-ci ; le modèle peut demander à nouveau plus tard.
- **Ne demande plus** le refuse, et Deepsand refuse alors ce chemin (et tout ce qu'il contient) ou cet hôte (et ses sous-domaines) lui-même, pas seulement en paroles. Chaque blocage est répertorié dans Autorisations, où vous pouvez le lever à nouveau.
- Une autorisation de répertoire recrée le conteneur avec le nouveau montage attaché.

Lisez [Comment fonctionne le bac à sable](./security) avant d’accorder l’accès à un répertoire contenant des fichiers sensibles.

## Où trouver des choses

| Zone | Ce que cela montre |
| --- | --- |
| Borne | La session DeepCode en direct dans le bac à sable. |
| Autorisations | Répertoires partagés, liste blanche du réseau et piste d'audit. |
| Outils | Outils intégrés à l'image du projet, regroupés Capacités, Langues, Gestionnaires de packages, Utilitaires, Rétro-ingénierie. Rien n'est activé par défaut et la modification de la sélection reconstruit l'image. |
| Secrets | Valeurs cryptées injectées en tant que variables d'environnement au démarrage. |
| Activité | Les arguments `docker run` exacts, le journal de construction et les tentatives de sortie bloquées. |

## Prochaines étapes

- [Comment fonctionne le bac à sable](./security)
- [Questions fréquemment posées](./faq)
