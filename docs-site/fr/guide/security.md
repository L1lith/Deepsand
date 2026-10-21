---
title: Comment fonctionne le bac à sable
description: Ce que Deepsand applique, ce que vous décidez et ce que le bac à sable ne peut pas atteindre.
---

# Comment fonctionne le bac à sable

En clair : l'assistant peut travailler dans le projet que vous avez choisi et dans les dossiers que vous approuvez, et nulle part ailleurs sur votre ordinateur.

La promesse de Deepsand est étroite et testable : le bac à sable peut atteindre le répertoire du projet et les répertoires que vous accordez explicitement, et rien d'autre.

## La frontière

Le conteneur n'a aucune vue sur le système de fichiers hôte autre que les montages de liaison choisis par Deepsand. D'autres chemins d'hôte n'existent pas dans l'espace de noms de montage du conteneur, il n'y a donc pas de fichier hôte vers lequel échapper.

Tout le reste décrit ici est une défense en profondeur au-dessus de cette frontière.

## Ce qui est imposé

- Seuls l'espace de travail et les autorisations explicites sont montés à partir de l'hôte.
- Le spool de réponse et le répertoire d'état sont montés en lecture seule.
- Les sockets d’exécution du conteneur sont rejetées par leur nom.
- Le système de fichiers racine du conteneur est en lecture seule, avec des systèmes de fichiers temporaires dimensionnés pour `/tmp` et `/run`.
- Les liens symboliques sont résolus avant qu'un chemin ne soit vérifié, donc un lien ne peut pas masquer une cible interdite.
- Les privilèges sont supprimés avant l'exécution de DeepCode et `no-new-privileges` empêche leur récupération.

## Modes réseau

| Mode | Ce qu'il permet |
| --- | --- |
| Aucun | Uniquement le point de terminaison du modèle via le proxy Deepsand. |
| Autorisé | Le point de terminaison du modèle, le proxy et les hôtes ou adresses sur la liste autorisée. |
| Internet | Accès Internet, avec plages locales et privées bloquées à l'intérieur du conteneur. |
| Complet | Accès Internet sans blocage du réseau local. Utilisez-le uniquement lorsque le bac à sable a réellement besoin de votre réseau local. |

Un nom d'hôte sur liste verte passe par le proxy, qui résout le nom lui-même et refuse un résultat dans l'espace d'adressage privé. Une adresse sur liste verte est autorisée directement par les règles du conteneur, car un client de base de données ou un autre programme non HTTP ne peut pas utiliser le proxy. Un port nommé dans une entrée est également publié sur le bouclage de l'hôte, jamais sur chaque interface.

## Ce que tu décides

Deepsand n’accorde jamais l’accès automatiquement. Une requête vous parvient avec le chemin, l'hôte, l'outil ou la ressource qu'elle demande, et le bac à sable reste en pause jusqu'à ce que vous décidiez.

Une demande concernant quelque chose que le bac à sable possède déjà est refusée avec une explication, car une autorisation automatique serait un consentement que vous n'avez jamais donné. Tout ce qui est ambigu vous parvient.

## Contre quoi il ne protège pas

- Le fournisseur de modèles peut voir le contenu que vous lui envoyez.
- Les fichiers que vous placez dans l'espace de travail sont visibles dans le bac à sable et peuvent être modifiés ou supprimés.
- Un outil ou une instruction de modèle mal formé peut toujours demander un accès. La décision vous appartient.
- Docker lui-même est en dehors de la limite. Gardez Docker Desktop et le système d'exploitation hôte à jour.

## En savoir plus

Le modèle de sécurité complet, y compris les tests qui affirment chaque propriété, se trouve dans [docs/SÉCURITÉ.md](https://github.com/L1lith/Deepsand/blob/master/docs/SECURITY.md).

L'architecture est décrite dans [docs/ARCHITECTURE.md](https://github.com/L1lith/Deepsand/blob/master/docs/ARCHITECTURE.md).
