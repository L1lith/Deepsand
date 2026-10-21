---
title: Questions fréquemment posées
description: Réponses courtes sur les projets, les autorisations, les données et les mises à jour.
---

# Questions fréquemment posées

## DeepCode voit-il mon répertoire personnel ?

Non. Le bac à sable voit le répertoire du projet dans `/workspace` et les répertoires que vous accordez explicitement. Le reste du système de fichiers hôte n'est pas monté.

## Que se passe-t-il lorsque j'approuve une demande d'annuaire ?

Deepsand ajoute le répertoire en tant que subvention, recrée le conteneur avec le nouveau montage attaché et reprend la session DeepCode. Un bac à sable en cours d'exécution ne peut pas obtenir de montage lié sans être recréé.

## Où sont stockées mes conversations ?

L'historique des conversations, les sessions, les pièces jointes et les compétences générées vivent dans un volume Docker par projet. Le dossier du projet sur le disque contient uniquement votre code et vos fichiers.

La suppression d'un projet de Deepsand ne supprime pas ce volume. L'effacement des données DeepCode d'un projet supprime le volume mais laisse le dossier du projet intact.

## Où sont stockés les clés et secrets API ?

Les secrets sont chiffrés au repos avec une clé détenue par le magasin de clés du système d'exploitation et sont injectés dans le bac à sable en tant que variables d'environnement uniquement au démarrage. L'interface affiche les noms et les longueurs, jamais les valeurs stockées.

Les informations d'identification peuvent également être héritées de la configuration DeepCode de votre hôte. Ils ne sont pas copiés dans le dossier du projet.

## Chaque projet peut-il utiliser un modèle différent ?

Oui. Un projet peut hériter de la configuration hôte ou remplacer le modèle, l'URL de base et les informations d'identification dans ses propres paramètres. Le sélecteur d'en-tête peut également choisir un modèle pour le projet ; **Reporter à la configuration** signifie que le projet n’en épingle aucun.

## Quel modèle dois-je utiliser pour réduire les coûts ?

Utilisez un modèle flash pour la plupart des tâches. Deepsand est par défaut `deepseek-v4-flash`, qui est le choix le moins cher pour le codage, les explications et les modifications quotidiennes. Réservez le `deepseek-v4-pro` pour les travaux où le Flash est clairement en difficulté ou où vous avez besoin de ses capacités supplémentaires, car le modèle professionnel coûte plus cher à exécuter.

Changez de modèle depuis l'en-tête du projet ou avec `/model` dans le terminal DeepCode. Si vous essayez Deepsand pour la première fois, commencez par Flash et passez au mode Pro uniquement lorsque vous avez une tâche qui en a besoin.

## À quoi sert le curseur de réflexion ?

Le curseur de réflexion se trouve à côté du sélecteur de modèle dans l'en-tête du projet. Il contrôle le degré de raisonnement du modèle avant de répondre.

| Arrêter | Qu'est-ce que cela signifie |
| --- | --- |
| **Désactivé** | Ne réfléchissez pas avant de répondre. Le plus rapide, mais le moins prudent. |
| **Rapide** | Un peu de réflexion, pour des petites retouches bien précisées. |
| **Équilibré** | Réflexion modérée. La butée médiane et la valeur par défaut raisonnable pour un vrai travail. |
| **Profond** | Réfléchissez autant que le modèle le peut. Le plus lent et le plus cher. |
| **Défaut** | S'en remettre à l'hôte `settings.json` ; s'il ne dit rien, DeepCode revient à Balanced. |

Gardez le curseur sur **Équilibré** pour la plupart des tâches. Il s'agit du paramètre intermédiaire et il donne de bons résultats sans avoir à payer pour le raisonnement le plus lent et le plus coûteux à chaque requête. Passez à **Profond** uniquement pour les problèmes véritablement difficiles et utilisez **Désactivé** ou **Rapide** pour de petites modifications prévisibles.

## Deepsand fonctionne-t-il uniquement avec DeepSeek ?

Non. DeepSeek est la valeur par défaut car il s'agit du modèle et du point de terminaison fournis avec Deepsand, mais Deepsand configure le DeepCode CLI avec un nom de modèle, une URL de base et une clé API. Vous pouvez le pointer vers un autre fournisseur qui expose un API que le CLI peut appeler, généralement un point de terminaison compatible OpenAI.

Définissez l'URL et le modèle de base du fournisseur dans **Paramètres**, ou dans les informations d'identification d'un projet, et stockez la clé API de ce fournisseur au même endroit. La politique réseau du bac à sable doit également autoriser le point de terminaison du fournisseur.

## Que faire si Docker Desktop ne fonctionne pas ou ne répond plus ?

Deepsand ne peut pas démarrer un bac à sable sans le moteur Docker. Si Docker Desktop ne fonctionne pas, démarrez-le et attendez que le moteur ait fini de démarrer. Deepsand revérifie lorsque la fenêtre retrouve le focus et la bande d'état propose une nouvelle tentative.

Parfois, le Docker Desktop tourne toujours mais son moteur ne répond plus. Le redémarrage de Deepsand ne résout pas ce problème ; Docker Desktop lui-même doit être redémarré.

- **Utilisez le contrôle intégré à l'application lorsqu'il apparaît.** Si Deepsand détecte Docker Desktop, il affiche **Redémarrez Docker Desktop…** dans la bande d'état ou dans l'avertissement du terminal. Ce contrôle redémarre le moteur Docker, y compris le processus WSL qu'il utilise sur Windows, et attend qu'un conteneur puisse redémarrer.
- **Windows :** cliquez avec le bouton droit sur la baleine Docker dans la zone de notification et choisissez **Redémarrage**. Si cette option est manquante, ouvrez Docker Desktop, sélectionnez **Dépanner**, puis **Redémarrer Docker Desktop**.
- **macOS :** cliquez sur la baleine Docker dans la barre de menu et choisissez **Redémarrage**.
- **Linux :** ouvrez le menu Docker Desktop, sélectionnez **Dépanner**, puis **Redémarrer Docker Desktop**. Si vous utilisez Docker Engine au lieu de Docker Desktop, redémarrez son service, par exemple `sudo systemctl restart docker`.

Le redémarrage de Docker Desktop met fin à tous les conteneurs de la machine, y compris les conteneurs sans rapport avec Deepsand. Deepsand propose le redémarrage mais ne le fait pas automatiquement. Voir [Documentation de dépannage de Docker](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/) pour le menu spécifique à la plateforme.

## Puis-je utiliser Deepsand sans accès à Internet ?

Le modèle a besoin de son point de terminaison. Avec le mode réseau `none`, seul ce point de terminaison est accessible via le proxy Deepsand. Les installations de packages et autres accès au réseau échoueront à moins que vous n'autorisiez les hôtes dont ils ont besoin.

## Comment mettre à jour Deepsand ?

Ouvrez **Paramètres**, puis **Mises à jour** et recherchez une version plus récente. Les versions de version téléchargent les mises à jour signées et redémarrent l'application après en avoir installé une. L'installation d'une mise à jour arrête l'exécution des sandbox.

## Existe-t-il une interface de ligne de commande ?

Oui. `deepsandctl` fournit des commandes sans tête telles que `doctor`, `plan`, `run`, `watch`, `requests` et `network`. L'application de bureau et le CLI partagent le même code de stratégie dans `deepsand-core`.

## Comment signaler un problème de sécurité ?

N'ouvrez pas de problème public pour un problème de sécurité. Contactez les responsables en privé via le canal de rapport de sécurité du référentiel et incluez suffisamment de détails pour reproduire le problème.
